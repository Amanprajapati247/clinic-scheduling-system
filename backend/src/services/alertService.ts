import { prisma } from '../prisma/client';
import { AppointmentStatus, AlertType, Role } from '../config/constants';
import { parseSlotDateTime } from '../utils/dateUtils';
import { AppError } from '../middleware/errorHandler';

export interface UnconfirmedAlertItem {
  id: string; // appointmentId
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reasonForVisit: string;
  status: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  providerName: string;
  providerSpecialty: string;
  alertType: AlertType;
  alertLevel: 'warning' | 'critical';
  hoursRemaining: number;
  minutesRemaining: number;
  message: string;
}

export class AlertService {
  /**
   * Get all active unconfirmed appointment alerts for Front Desk
   */
  static async getActiveAlerts(now = new Date()): Promise<UnconfirmedAlertItem[]> {
    // 1. Fetch all Requested appointments with their slots, providers, and dismissal records
    const requestedAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.Requested as any,
      },
      include: {
        slot: true,
        schedulingProvider: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        alertDismissals: true,
      },
      orderBy: [
        { slot: { date: 'asc' } },
        { slot: { startTime: 'asc' } },
      ],
    });

    const activeAlerts: UnconfirmedAlertItem[] = [];

    for (const apt of requestedAppointments) {
      const aptStart = parseSlotDateTime(apt.slot.date, apt.slot.startTime);
      const diffMs = aptStart.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      // Alert rule: Within next 24 hours (or imminent/overdue while still Requested)
      if (diffMinutes <= 24 * 60) {
        const isUnder1Hour = diffMinutes <= 60;

        if (isUnder1Hour) {
          // 1-Hour Reappearing Urgent Alert
          // Checked against 'UNCONFIRMED_1H' dismissal.
          // Note: Even if 'UNCONFIRMED_24H' was dismissed, this 1h alert must reappear!
          const dismissed1H = apt.alertDismissals.some(
            (d) => d.alertType === (AlertType.UNCONFIRMED_1H as any)
          );

          if (!dismissed1H) {
            activeAlerts.push({
              id: apt.id,
              patientName: apt.patientName,
              patientEmail: apt.patientEmail,
              patientPhone: apt.patientPhone,
              reasonForVisit: apt.reasonForVisit,
              status: apt.status,
              slotDate: apt.slot.date,
              slotStartTime: apt.slot.startTime,
              slotEndTime: apt.slot.endTime,
              providerName: apt.schedulingProvider.user.name,
              providerSpecialty: apt.schedulingProvider.specialty,
              alertType: AlertType.UNCONFIRMED_1H,
              alertLevel: 'critical',
              hoursRemaining: diffHours,
              minutesRemaining: diffMinutes,
              message: diffMinutes < 0
                ? `Appointment time has arrived (${Math.abs(diffMinutes)}m ago) but status is still Requested!`
                : `Urgent: Unconfirmed appointment starting in ${diffMinutes} minute(s)! Requires immediate confirmation or review.`,
            });
          }
        } else {
          // 24-Hour Warning Alert
          const dismissed24H = apt.alertDismissals.some(
            (d) => d.alertType === (AlertType.UNCONFIRMED_24H as any)
          );

          if (!dismissed24H) {
            activeAlerts.push({
              id: apt.id,
              patientName: apt.patientName,
              patientEmail: apt.patientEmail,
              patientPhone: apt.patientPhone,
              reasonForVisit: apt.reasonForVisit,
              status: apt.status,
              slotDate: apt.slot.date,
              slotStartTime: apt.slot.startTime,
              slotEndTime: apt.slot.endTime,
              providerName: apt.schedulingProvider.user.name,
              providerSpecialty: apt.schedulingProvider.specialty,
              alertType: AlertType.UNCONFIRMED_24H,
              alertLevel: 'warning',
              hoursRemaining: diffHours,
              minutesRemaining: diffMinutes,
              message: `Unconfirmed appointment scheduled within the next ${diffHours} hour(s).`,
            });
          }
        }
      }
    }

    return activeAlerts;
  }

  /**
   * Front Desk dismisses an alert for an appointment
   */
  static async dismissAlert(
    appointmentId: string,
    alertType: AlertType | string,
    actor: { userId: string; role: string }
  ) {
    if (actor.role !== Role.FRONT_DESK) {
      throw new AppError('Only Front Desk staff can manage and dismiss appointment alerts', 403);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Save or upsert dismissal
    return prisma.alertDismissal.create({
      data: {
        appointmentId,
        userId: actor.userId,
        alertType: alertType as any,
      },
    });
  }
}
