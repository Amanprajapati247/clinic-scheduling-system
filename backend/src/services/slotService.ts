import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler';
import { calculateEndTime, timeToMinutes } from '../utils/dateUtils';
import { Role } from '../config/constants';

export interface CreateSlotDto {
  providerId: string;
  date: string;
  startTime: string;
  duration: number;
}

export interface UpdateSlotDto {
  date?: string;
  startTime?: string;
  duration?: number;
}

export interface GetSlotsFilter {
  providerId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  isBooked?: boolean;
  isArchived?: boolean;
}

export class SlotService {
  /**
   * Create a single availability slot with collision validation
   */
  static async createSlot(dto: CreateSlotDto, actor: { role: string; providerId?: string }) {
    // Provider RBAC check: Provider can only create slots for themselves
    if (actor.role === Role.PROVIDER && actor.providerId !== dto.providerId) {
      throw new AppError('Providers are not permitted to create availability slots for other providers', 403);
    }

    const endTime = calculateEndTime(dto.startTime, dto.duration);

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: dto.providerId },
    });
    if (!provider) {
      throw new AppError('Provider not found', 404);
    }

    // Check overlap collision with existing non-archived slots for same provider on same date
    const existingSlots = await prisma.appointmentSlot.findMany({
      where: {
        providerId: dto.providerId,
        date: dto.date,
        isArchived: false,
      },
    });

    const newStartMins = timeToMinutes(dto.startTime);
    const newEndMins = timeToMinutes(endTime);

    const hasCollision = existingSlots.some((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      return newStartMins < slotEnd && newEndMins > slotStart;
    });

    if (hasCollision) {
      throw new AppError('Slot overlaps with an existing active schedule slot for this provider', 409);
    }

    return prisma.appointmentSlot.create({
      data: {
        providerId: dto.providerId,
        date: dto.date,
        startTime: dto.startTime,
        endTime,
        duration: dto.duration,
        isBooked: false,
        isArchived: false,
      },
      include: {
        provider: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
  }

  /**
   * Update slot details (only allowed if slot is unbooked and not archived)
   */
  static async updateSlot(
    slotId: string,
    dto: UpdateSlotDto,
    actor: { role: string; providerId?: string }
  ) {
    const slot = await prisma.appointmentSlot.findUnique({
      where: { id: slotId },
      include: { appointment: true },
    });

    if (!slot) {
      throw new AppError('Appointment slot not found', 404);
    }

    // RBAC: Provider can only edit their own slots
    if (actor.role === Role.PROVIDER && actor.providerId !== slot.providerId) {
      throw new AppError('Forbidden: Cannot modify slots belonging to other providers', 403);
    }

    // Rule: Slots can be edited only while unbooked
    if (slot.isBooked || slot.appointment) {
      throw new AppError('Booked slots cannot be modified. They are linked to an active appointment.', 400);
    }

    if (slot.isArchived) {
      throw new AppError('Archived slots cannot be modified directly. Please restore the slot first.', 400);
    }

    const newDate = dto.date || slot.date;
    const newStartTime = dto.startTime || slot.startTime;
    const newDuration = dto.duration || slot.duration;
    const newEndTime = calculateEndTime(newStartTime, newDuration);

    // Check collision if date/time changed
    if (dto.date || dto.startTime || dto.duration) {
      const otherSlots = await prisma.appointmentSlot.findMany({
        where: {
          id: { not: slotId },
          providerId: slot.providerId,
          date: newDate,
          isArchived: false,
        },
      });

      const startMins = timeToMinutes(newStartTime);
      const endMins = timeToMinutes(newEndTime);

      const collision = otherSlots.some((s) => {
        const sStart = timeToMinutes(s.startTime);
        const sEnd = timeToMinutes(s.endTime);
        return startMins < sEnd && endMins > sStart;
      });

      if (collision) {
        throw new AppError('Updated time overlaps with another active slot for this provider', 409);
      }
    }

    return prisma.appointmentSlot.update({
      where: { id: slotId },
      data: {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        duration: newDuration,
      },
      include: {
        provider: {
          include: { user: { select: { name: true } } },
        },
      },
    });
  }

  /**
   * Archive a slot (soft archive preserving appointment history)
   */
  static async archiveSlot(slotId: string, actor: { role: string; providerId?: string }) {
    const slot = await prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AppError('Appointment slot not found', 404);
    }

    if (actor.role === Role.PROVIDER && actor.providerId !== slot.providerId) {
      throw new AppError('Forbidden: Cannot archive slots belonging to other providers', 403);
    }

    return prisma.appointmentSlot.update({
      where: { id: slotId },
      data: { isArchived: true },
    });
  }

  /**
   * Restore an archived slot
   */
  static async restoreSlot(slotId: string, actor: { role: string; providerId?: string }) {
    const slot = await prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AppError('Appointment slot not found', 404);
    }

    if (actor.role === Role.PROVIDER && actor.providerId !== slot.providerId) {
      throw new AppError('Forbidden: Cannot restore slots belonging to other providers', 403);
    }

    return prisma.appointmentSlot.update({
      where: { id: slotId },
      data: { isArchived: false },
    });
  }

  /**
   * List slots with flexible filtering
   */
  static async getSlots(filter: GetSlotsFilter) {
    const where: any = {};

    if (filter.providerId) {
      where.providerId = filter.providerId;
    }

    if (filter.date) {
      where.date = filter.date;
    } else if (filter.startDate && filter.endDate) {
      where.date = {
        gte: filter.startDate,
        lte: filter.endDate,
      };
    } else if (filter.startDate) {
      where.date = { gte: filter.startDate };
    }

    if (typeof filter.isBooked === 'boolean') {
      where.isBooked = filter.isBooked;
    }

    if (typeof filter.isArchived === 'boolean') {
      where.isArchived = filter.isArchived;
    }

    return prisma.appointmentSlot.findMany({
      where,
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        appointment: {
          select: {
            id: true,
            patientName: true,
            status: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }
}
