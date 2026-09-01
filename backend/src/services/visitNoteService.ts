import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler';
import { TimelineService } from './timelineService';
import { TimelineActionType } from '../config/constants';

export class VisitNoteService {
  /**
   * Create visit note for an appointment
   */
  static async createNote(
    appointmentId: string,
    content: string,
    author: { userId: string; providerId?: string }
  ) {
    if (!author.providerId) {
      throw new AppError('Only clinical providers can author visit notes', 403);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        supportingProviders: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Verify provider is either scheduling provider or supporting provider
    const isPrimary = appointment.schedulingProviderId === author.providerId;
    const isSupporting = appointment.supportingProviders.some(
      (sp) => sp.providerId === author.providerId
    );

    if (!isPrimary && !isSupporting) {
      throw new AppError('Forbidden: You must be part of the care team to add visit notes', 403);
    }

    const note = await prisma.visitNote.create({
      data: {
        appointmentId,
        providerId: author.providerId,
        content: content.trim(),
      },
      include: {
        provider: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    // Log to immutable timeline
    await TimelineService.logEvent({
      appointmentId,
      userId: author.userId,
      actionType: TimelineActionType.VISIT_NOTE_CREATED,
      newValue: `Visit note added: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
    });

    return note;
  }

  /**
   * Update visit note (strictly editable ONLY by the original author provider)
   */
  static async updateNote(
    noteId: string,
    content: string,
    actor: { userId: string; providerId?: string }
  ) {
    const note = await prisma.visitNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError('Visit note not found', 404);
    }

    // Rule: Editable ONLY by author provider
    if (!actor.providerId || note.providerId !== actor.providerId) {
      throw new AppError('Forbidden: Visit notes can only be edited by their original author provider', 403);
    }

    const updatedNote = await prisma.visitNote.update({
      where: { id: noteId },
      data: {
        content: content.trim(),
      },
      include: {
        provider: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return updatedNote;
  }

  /**
   * List notes for an appointment chronologically
   */
  static async getNotesForAppointment(appointmentId: string) {
    return prisma.visitNote.findMany({
      where: { appointmentId },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Chronological display
    });
  }
}
