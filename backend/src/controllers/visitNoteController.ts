import { Request, Response, NextFunction } from 'express';
import { VisitNoteService } from '../services/visitNoteService';

export class VisitNoteController {
  static async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const appointmentId = Array.isArray(req.params.appointmentId)
        ? req.params.appointmentId[0]
        : req.params.appointmentId;
      const { content } = req.body;

      const note = await VisitNoteService.createNote(appointmentId, content, {
        userId: req.user!.id,
        providerId: req.user!.providerId,
      });

      res.status(201).json({
        success: true,
        message: 'Visit note added successfully',
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const noteId = Array.isArray(req.params.noteId)
        ? req.params.noteId[0]
        : req.params.noteId;
      const { content } = req.body;

      const note = await VisitNoteService.updateNote(noteId, content, {
        userId: req.user!.id,
        providerId: req.user!.providerId,
      });

      res.status(200).json({
        success: true,
        message: 'Visit note updated successfully',
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNotesForAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const appointmentId = Array.isArray(req.params.appointmentId)
        ? req.params.appointmentId[0]
        : req.params.appointmentId;
      const notes = await VisitNoteService.getNotesForAppointment(appointmentId);

      res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      next(error);
    }
  }
}
