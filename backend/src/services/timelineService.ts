import { prisma } from '../prisma/client';
import { TimelineActionType } from '../config/constants';

export interface LogTimelineParams {
  appointmentId: string;
  userId: string;
  actionType: TimelineActionType | string;
  oldValue?: string | null;
  newValue?: string | null;
}

export class TimelineService {
  /**
   * Append-only audit logging for appointments.
   * Notice: No update or delete operations exist, guaranteeing immutability.
   */
  static async logEvent(params: LogTimelineParams) {
    return prisma.appointmentTimeline.create({
      data: {
        appointmentId: params.appointmentId,
        userId: params.userId,
        actionType: params.actionType as any,
        oldValue: params.oldValue,
        newValue: params.newValue,
      },
    });
  }

  /**
   * Retrieve full chronological audit timeline for an appointment
   */
  static async getTimelineForAppointment(appointmentId: string) {
    return prisma.appointmentTimeline.findMany({
      where: { appointmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
