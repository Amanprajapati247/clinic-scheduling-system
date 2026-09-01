import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler';
import { calculateEndTime, formatDateToISO, timeToMinutes } from '../utils/dateUtils';
import { generateDailyScheduleCSV } from '../utils/csvExporter';
import { Role } from '../config/constants';

export interface DayScheduleRule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  slotDuration: number; // minutes e.g. 30
}

export interface BulkRecurringSlotsDto {
  providerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  schedules: DayScheduleRule[];
}

export class ScheduleService {
  /**
   * Bulk recurring slot generator with collision avoidance
   */
  static async generateBulkSlots(
    dto: BulkRecurringSlotsDto,
    actor: { role: string; providerId?: string }
  ) {
    if (actor.role === Role.PROVIDER && actor.providerId !== dto.providerId) {
      throw new AppError('Forbidden: Cannot generate availability slots for other providers', 403);
    }

    const provider = await prisma.provider.findUnique({
      where: { id: dto.providerId },
    });
    if (!provider) {
      throw new AppError('Provider not found', 404);
    }

    const start = new Date(`${dto.startDate}T00:00:00`);
    const end = new Date(`${dto.endDate}T23:59:59`);

    if (start.getTime() > end.getTime()) {
      throw new AppError('Start date cannot be after end date', 400);
    }

    // Fetch all existing non-archived slots for provider in range
    const existingSlots = await prisma.appointmentSlot.findMany({
      where: {
        providerId: dto.providerId,
        date: {
          gte: dto.startDate,
          lte: dto.endDate,
        },
        isArchived: false,
      },
    });

    // Group existing slots by date for fast O(1) date lookup
    const existingSlotsByDate = new Map<string, Array<{ startMins: number; endMins: number }>>();
    for (const slot of existingSlots) {
      const list = existingSlotsByDate.get(slot.date) || [];
      list.push({
        startMins: timeToMinutes(slot.startTime),
        endMins: timeToMinutes(slot.endTime),
      });
      existingSlotsByDate.set(slot.date, list);
    }

    let createdCount = 0;
    let skippedCount = 0;
    const slotsToInsert: Array<{
      providerId: string;
      date: string;
      startTime: string;
      endTime: string;
      duration: number;
      isBooked: boolean;
      isArchived: boolean;
    }> = [];

    // Loop through each date in the range
    const current = new Date(start);
    while (current.getTime() <= end.getTime()) {
      const dayOfWeek = current.getDay(); // 0..6
      const dateStr = formatDateToISO(current);

      // Find schedule rules matching this day of week
      const matchingRules = dto.schedules.filter((r) => r.dayOfWeek === dayOfWeek);

      for (const rule of matchingRules) {
        const ruleStartMins = timeToMinutes(rule.startTime);
        const ruleEndMins = timeToMinutes(rule.endTime);
        const duration = rule.slotDuration || 30;

        let slotStart = ruleStartMins;
        while (slotStart + duration <= ruleEndMins) {
          const slotEnd = slotStart + duration;
          const startTimeStr = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
          const endTimeStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;

          const activeOnDate = existingSlotsByDate.get(dateStr) || [];
          const hasCollision = activeOnDate.some(
            (existing) => slotStart < existing.endMins && slotEnd > existing.startMins
          );

          if (hasCollision) {
            skippedCount++;
          } else {
            slotsToInsert.push({
              providerId: dto.providerId,
              date: dateStr,
              startTime: startTimeStr,
              endTime: endTimeStr,
              duration,
              isBooked: false,
              isArchived: false,
            });
            // Update in-memory index for subsequent slots on the same day
            activeOnDate.push({ startMins: slotStart, endMins: slotEnd });
            existingSlotsByDate.set(dateStr, activeOnDate);
            createdCount++;
          }

          slotStart += duration;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    if (slotsToInsert.length > 0) {
      await prisma.appointmentSlot.createMany({
        data: slotsToInsert,
      });
    }

    return {
      createdSlots: createdCount,
      skippedSlots: skippedCount,
      totalSlotsGenerated: createdCount,
    };
  }

  /**
   * Export Daily Schedule to CSV string
   */
  static async exportDailyScheduleCSV(date: string, providerId?: string) {
    const where: any = {
      slot: {
        date,
      },
    };

    if (providerId) {
      where.OR = [
        { schedulingProviderId: providerId },
        { supportingProviders: { some: { providerId } } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        slot: true,
        schedulingProvider: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: {
        slot: { startTime: 'asc' },
      },
    });

    const rows = appointments.map((apt) => ({
      patient: apt.patientName,
      provider: apt.schedulingProvider.user.name,
      status: apt.status,
      startTime: apt.slot.startTime,
      duration: apt.slot.duration,
    }));

    return generateDailyScheduleCSV(rows);
  }
}
