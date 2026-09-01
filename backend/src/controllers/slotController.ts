import { Request, Response, NextFunction } from 'express';
import { SlotService } from '../services/slotService';

export class SlotController {
  static async createSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const slot = await SlotService.createSlot(req.body, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });
      res.status(201).json({
        success: true,
        message: 'Availability slot created successfully',
        data: slot,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const slot = await SlotService.updateSlot(id, req.body, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });
      res.status(200).json({
        success: true,
        message: 'Availability slot updated successfully',
        data: slot,
      });
    } catch (error) {
      next(error);
    }
  }

  static async archiveSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const slot = await SlotService.archiveSlot(id, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });
      res.status(200).json({
        success: true,
        message: 'Slot archived successfully',
        data: slot,
      });
    } catch (error) {
      next(error);
    }
  }

  static async restoreSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const slot = await SlotService.restoreSlot(id, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });
      res.status(200).json({
        success: true,
        message: 'Slot restored successfully',
        data: slot,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const isBooked =
        req.query.isBooked === 'true' ? true : req.query.isBooked === 'false' ? false : undefined;
      const isArchived =
        req.query.isArchived === 'true'
          ? true
          : req.query.isArchived === 'false'
          ? false
          : undefined;

      const slots = await SlotService.getSlots({
        providerId: req.query.providerId as string,
        date: req.query.date as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        isBooked,
        isArchived,
      });

      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error) {
      next(error);
    }
  }
}
