import { prisma } from '../prisma/client';
import { AppointmentStatus, Role } from '../config/constants';
import { formatDateToISO } from '../utils/dateUtils';

export class DashboardService {
  static async getMetrics(actor: { role: string; providerId?: string }) {
    const today = new Date();
    const todayStr = formatDateToISO(today);

    // Current week start (Monday) and end (Sunday)
    const currentDay = today.getDay(); // 0 is Sunday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + distanceToMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = formatDateToISO(weekStart);
    const weekEndStr = formatDateToISO(weekEnd);

    // Base filter if Provider (only see their own appointments or supporting)
    const providerScope: any = {};
    if (actor.role === Role.PROVIDER && actor.providerId) {
      providerScope.OR = [
        { schedulingProviderId: actor.providerId },
        { supportingProviders: { some: { providerId: actor.providerId } } },
      ];
    }

    // 1. Appointments Today
    const appointmentsToday = await prisma.appointment.count({
      where: {
        ...providerScope,
        slot: { date: todayStr },
      },
    });

    // 2. Checked-In Patients Today
    const checkedInToday = await prisma.appointment.count({
      where: {
        ...providerScope,
        status: AppointmentStatus.CheckedIn as any,
        slot: { date: todayStr },
      },
    });

    // 3. No Shows This Week
    const noShowsThisWeek = await prisma.appointment.count({
      where: {
        ...providerScope,
        status: AppointmentStatus.NoShow as any,
        slot: {
          date: {
            gte: weekStartStr,
            lte: weekEndStr,
          },
        },
      },
    });

    // 4. Upcoming Confirmed Appointments (date >= today and status == Confirmed)
    const upcomingConfirmed = await prisma.appointment.count({
      where: {
        ...providerScope,
        status: AppointmentStatus.Confirmed as any,
        slot: {
          date: { gte: todayStr },
        },
      },
    });

    // 5. Appointments By Provider
    const providers = await prisma.provider.findMany({
      include: {
        user: { select: { name: true } },
        scheduledAppointments: {
          select: { id: true, status: true },
        },
      },
    });

    const appointmentsByProvider = providers.map((p) => ({
      providerId: p.id,
      providerName: p.user.name,
      specialty: p.specialty,
      totalAppointments: p.scheduledAppointments.length,
      confirmed: p.scheduledAppointments.filter((a) => a.status === AppointmentStatus.Confirmed).length,
      completed: p.scheduledAppointments.filter((a) => a.status === AppointmentStatus.Completed).length,
      noShow: p.scheduledAppointments.filter((a) => a.status === AppointmentStatus.NoShow).length,
    }));

    // 6. Appointments By Status
    const allAppointments = await prisma.appointment.findMany({
      where: providerScope,
      select: { status: true },
    });

    const statusCounts: Record<string, number> = {
      [AppointmentStatus.Requested]: 0,
      [AppointmentStatus.Confirmed]: 0,
      [AppointmentStatus.CheckedIn]: 0,
      [AppointmentStatus.Completed]: 0,
      [AppointmentStatus.NoShow]: 0,
      [AppointmentStatus.Cancelled]: 0,
    };

    for (const apt of allAppointments) {
      if (statusCounts[apt.status] !== undefined) {
        statusCounts[apt.status]++;
      }
    }

    const appointmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // 7. Weekly No Show Rate (Last 8 Weeks)
    const weeklyNoShowRate: Array<{
      week: string;
      startDate: string;
      endDate: string;
      total: number;
      noShows: number;
      noShowRate: number;
    }> = [];

    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(weekStart);
      wStart.setDate(weekStart.getDate() - i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);

      const wStartStr = formatDateToISO(wStart);
      const wEndStr = formatDateToISO(wEnd);

      const weekAppointments = await prisma.appointment.findMany({
        where: {
          ...providerScope,
          slot: {
            date: {
              gte: wStartStr,
              lte: wEndStr,
            },
          },
        },
        select: { status: true },
      });

      const total = weekAppointments.length;
      const noShows = weekAppointments.filter((a) => a.status === AppointmentStatus.NoShow).length;
      const noShowRate = total > 0 ? Number(((noShows / total) * 100).toFixed(1)) : 0;

      const weekLabel = `W-${i === 0 ? 'Current' : `-${i}w`}`;

      weeklyNoShowRate.push({
        week: weekLabel,
        startDate: wStartStr,
        endDate: wEndStr,
        total,
        noShows,
        noShowRate,
      });
    }

    return {
      metrics: {
        appointmentsToday,
        checkedInToday,
        noShowsThisWeek,
        upcomingConfirmed,
      },
      appointmentsByProvider,
      appointmentsByStatus,
      weeklyNoShowRate,
    };
  }
}
