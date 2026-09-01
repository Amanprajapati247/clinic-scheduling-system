import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AppointmentStatus, TimelineActionType, Role } from '../config/constants';
import { validateStatusTransition } from '../utils/stateMachine';
import { TimelineService } from './timelineService';

export interface CreateAppointmentDto {
  slotId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reasonForVisit: string;
}

export interface SearchAppointmentsParams {
  patientName?: string;
  providerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'time' | 'provider' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class AppointmentService {
  /**
   * Create a new appointment booking
   */
  static async createAppointment(
    dto: CreateAppointmentDto,
    actor: { userId: string; role: string; providerId?: string }
  ) {
    const slot = await prisma.appointmentSlot.findUnique({
      where: { id: dto.slotId },
      include: { appointment: true, provider: true },
    });

    if (!slot) {
      throw new AppError('Appointment slot not found', 404);
    }

    if (slot.isArchived) {
      throw new AppError('Cannot book an archived slot', 400);
    }

    if (slot.isBooked || slot.appointment) {
      throw new AppError('This slot is already booked for another appointment', 409);
    }

    // Create appointment and update slot in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      // Mark slot as booked
      await tx.appointmentSlot.update({
        where: { id: dto.slotId },
        data: { isBooked: true },
      });

      // Create appointment
      const newApt = await tx.appointment.create({
        data: {
          slotId: dto.slotId,
          schedulingProviderId: slot.providerId,
          patientName: dto.patientName.trim(),
          patientEmail: dto.patientEmail.toLowerCase().trim(),
          patientPhone: dto.patientPhone.trim(),
          reasonForVisit: dto.reasonForVisit.trim(),
          status: AppointmentStatus.Requested,
        },
        include: {
          slot: true,
          schedulingProvider: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      });

      // Append immutable timeline record
      await tx.appointmentTimeline.create({
        data: {
          appointmentId: newApt.id,
          userId: actor.userId,
          actionType: TimelineActionType.APPOINTMENT_CREATED,
          newValue: `Appointment requested for ${newApt.patientName} with Dr. ${slot.provider.id} on ${slot.date} at ${slot.startTime}`,
        },
      });

      return newApt;
    });

    return appointment;
  }

  /**
   * Search appointments with server-side pagination, sorting, filtering, and role scoping
   */
  static async searchAppointments(
    params: SearchAppointmentsParams,
    actor: { role: string; providerId?: string }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC: Providers view only appointments where they are primary scheduling or supporting
    if (actor.role === Role.PROVIDER && actor.providerId) {
      where.OR = [
        { schedulingProviderId: actor.providerId },
        { supportingProviders: { some: { providerId: actor.providerId } } },
      ];
    } else if (params.providerId) {
      // Front Desk filtering by specific provider
      where.OR = [
        { schedulingProviderId: params.providerId },
        { supportingProviders: { some: { providerId: params.providerId } } },
      ];
    }

    if (params.patientName && params.patientName.trim() !== '') {
      where.patientName = {
        contains: params.patientName.trim(),
      };
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.startDate || params.endDate) {
      where.slot = { ...(where.slot || {}) };
      if (params.startDate && params.endDate) {
        where.slot.date = {
          gte: params.startDate,
          lte: params.endDate,
        };
      } else if (params.startDate) {
        where.slot.date = { gte: params.startDate };
      } else if (params.endDate) {
        where.slot.date = { lte: params.endDate };
      }
    }

    // Build orderBy
    const orderDirection = params.sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = [{ slot: { date: 'asc' } }, { slot: { startTime: 'asc' } }];

    if (params.sortBy === 'date') {
      orderBy = [{ slot: { date: orderDirection } }, { slot: { startTime: 'asc' } }];
    } else if (params.sortBy === 'time') {
      orderBy = [{ slot: { startTime: orderDirection } }];
    } else if (params.sortBy === 'status') {
      orderBy = [{ status: orderDirection }];
    } else if (params.sortBy === 'provider') {
      orderBy = [{ schedulingProvider: { user: { name: orderDirection } } }];
    }

    const [totalResults, data] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          slot: true,
          schedulingProvider: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          supportingProviders: {
            include: {
              provider: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          _count: {
            select: {
              visitNotes: true,
              timeline: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalResults / limit) || 1;

    return {
      totalResults,
      currentPage: page,
      totalPages,
      limit,
      data,
    };
  }

  /**
   * Get single appointment with full relations
   */
  static async getAppointmentById(
    appointmentId: string,
    actor: { role: string; providerId?: string }
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        slot: true,
        schedulingProvider: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        supportingProviders: {
          include: {
            provider: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            assignedBy: {
              select: { id: true, name: true },
            },
          },
        },
        visitNotes: {
          include: {
            provider: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        timeline: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // RBAC: If provider, verify they are scheduling or supporting provider
    if (actor.role === Role.PROVIDER && actor.providerId) {
      const isPrimary = appointment.schedulingProviderId === actor.providerId;
      const isSupporting = appointment.supportingProviders.some(
        (sp) => sp.providerId === actor.providerId
      );
      if (!isPrimary && !isSupporting) {
        throw new AppError('Forbidden: You can only view appointments where you are the scheduling or supporting provider', 403);
      }
    }

    return appointment;
  }

  /**
   * Update appointment status with strict state machine validation
   */
  static async updateStatus(
    appointmentId: string,
    targetStatus: string,
    cancellationReason: string | undefined,
    actor: { userId: string; role: string; providerId?: string }
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        slot: true,
        supportingProviders: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Front Desk can confirm/cancel. Providers can check-in / complete their appointments.
    if (actor.role === Role.PROVIDER && actor.providerId) {
      const isPrimary = appointment.schedulingProviderId === actor.providerId;
      const isSupporting = appointment.supportingProviders.some(
        (sp) => sp.providerId === actor.providerId
      );
      if (!isPrimary && !isSupporting) {
        throw new AppError('Forbidden: Access denied to update this appointment status', 403);
      }
    }

    // Run Finite State Machine validation
    const validation = validateStatusTransition({
      currentStatus: appointment.status,
      targetStatus,
      slotDate: appointment.slot.date,
      slotStartTime: appointment.slot.startTime,
      cancellationReason,
    });

    if (!validation.isValid) {
      throw new AppError(validation.errorMessage || 'Invalid status transition', 400);
    }

    const now = new Date();
    const updateData: any = {
      status: targetStatus,
    };

    if (targetStatus === AppointmentStatus.CheckedIn) {
      updateData.checkedInAt = now;
    } else if (targetStatus === AppointmentStatus.Completed) {
      updateData.completedAt = now;
    } else if (targetStatus === AppointmentStatus.Cancelled) {
      updateData.cancelledAt = now;
      updateData.cancelledById = actor.userId;
      updateData.cancellationReason = cancellationReason?.trim();
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        slot: true,
        schedulingProvider: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    // Log status change to timeline
    await TimelineService.logEvent({
      appointmentId,
      userId: actor.userId,
      actionType:
        targetStatus === AppointmentStatus.Cancelled
          ? TimelineActionType.CANCELLATION
          : TimelineActionType.STATUS_CHANGE,
      oldValue: appointment.status,
      newValue: targetStatus === AppointmentStatus.Cancelled
        ? `Cancelled (Reason: ${cancellationReason?.trim()})`
        : targetStatus,
    });

    return updated;
  }

  /**
   * Cancel appointment convenience wrapper
   */
  static async cancelAppointment(
    appointmentId: string,
    cancellationReason: string,
    actor: { userId: string; role: string; providerId?: string }
  ) {
    return this.updateStatus(appointmentId, AppointmentStatus.Cancelled, cancellationReason, actor);
  }

  /**
   * Reassign appointment to another provider (Front Desk only)
   */
  static async reassignProvider(
    appointmentId: string,
    newProviderId: string,
    newSlotId: string | undefined,
    actor: { userId: string; role: string }
  ) {
    if (actor.role !== Role.FRONT_DESK) {
      throw new AppError('Forbidden: Only Front Desk staff can reassign appointments between providers', 403);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        slot: true,
        schedulingProvider: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (
      appointment.status === AppointmentStatus.Completed ||
      appointment.status === AppointmentStatus.Cancelled ||
      appointment.status === AppointmentStatus.NoShow
    ) {
      throw new AppError(`Cannot reassign an appointment in terminal status '${appointment.status}'`, 400);
    }

    const targetProvider = await prisma.provider.findUnique({
      where: { id: newProviderId },
      include: { user: { select: { name: true } } },
    });

    if (!targetProvider) {
      throw new AppError('Target provider not found', 404);
    }

    let finalSlotId = appointment.slotId;

    if (newSlotId && newSlotId !== appointment.slotId) {
      const targetSlot = await prisma.appointmentSlot.findUnique({
        where: { id: newSlotId },
        include: { appointment: true },
      });

      if (!targetSlot) {
        throw new AppError('Target slot not found', 404);
      }

      if (targetSlot.providerId !== newProviderId) {
        throw new AppError('Target slot does not belong to the newly assigned provider', 400);
      }

      if (targetSlot.isBooked || targetSlot.appointment) {
        throw new AppError('Target slot is already booked', 409);
      }

      finalSlotId = targetSlot.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If slot changed, release old slot and claim new slot
      if (finalSlotId !== appointment.slotId) {
        await tx.appointmentSlot.update({
          where: { id: appointment.slotId },
          data: { isBooked: false },
        });

        await tx.appointmentSlot.update({
          where: { id: finalSlotId },
          data: { isBooked: true },
        });
      }

      const apt = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          schedulingProviderId: newProviderId,
          slotId: finalSlotId,
        },
        include: {
          slot: true,
          schedulingProvider: {
            include: { user: { select: { name: true } } },
          },
        },
      });

      // Log reassignment to timeline
      await tx.appointmentTimeline.create({
        data: {
          appointmentId,
          userId: actor.userId,
          actionType: TimelineActionType.APPOINTMENT_REASSIGNED,
          oldValue: `Dr. ${appointment.schedulingProvider.user.name}`,
          newValue: `Dr. ${targetProvider.user.name}`,
        },
      });

      return apt;
    });

    return updated;
  }

  /**
   * Add supporting provider to care team
   */
  static async addSupportingProvider(
    appointmentId: string,
    providerId: string,
    actor: { userId: string; role: string; providerId?: string }
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        supportingProviders: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.schedulingProviderId === providerId) {
      throw new AppError('This provider is already the primary scheduling provider', 400);
    }

    const alreadySupporting = appointment.supportingProviders.some(
      (sp) => sp.providerId === providerId
    );
    if (alreadySupporting) {
      throw new AppError('Provider is already a supporting provider on this care team', 409);
    }

    const supportingProvider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: { select: { name: true } } },
    });

    if (!supportingProvider) {
      throw new AppError('Supporting provider not found', 404);
    }

    const record = await prisma.supportingProvider.create({
      data: {
        appointmentId,
        providerId,
        assignedById: actor.userId,
      },
      include: {
        provider: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    // Log to timeline
    await TimelineService.logEvent({
      appointmentId,
      userId: actor.userId,
      actionType: TimelineActionType.SUPPORTING_PROVIDER_ADDED,
      newValue: `Dr. ${supportingProvider.user.name} (${supportingProvider.specialty})`,
    });

    return record;
  }

  /**
   * Remove supporting provider from care team
   */
  static async removeSupportingProvider(
    appointmentId: string,
    providerId: string,
    actor: { userId: string; role: string }
  ) {
    const existing = await prisma.supportingProvider.findUnique({
      where: {
        appointmentId_providerId: {
          appointmentId,
          providerId,
        },
      },
      include: {
        provider: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!existing) {
      throw new AppError('Provider is not a supporting provider on this appointment', 404);
    }

    await prisma.supportingProvider.delete({
      where: {
        appointmentId_providerId: {
          appointmentId,
          providerId,
        },
      },
    });

    // Log to timeline
    await TimelineService.logEvent({
      appointmentId,
      userId: actor.userId,
      actionType: TimelineActionType.SUPPORTING_PROVIDER_REMOVED,
      oldValue: `Dr. ${existing.provider.user.name}`,
    });

    return { success: true, message: 'Supporting provider removed from care team' };
  }
}
