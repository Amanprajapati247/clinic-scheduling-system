import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointmentService';

export class AppointmentController {
  static async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentService.createAppointment(req.body, {
        userId: req.user!.id,
        role: req.user!.role,
        providerId: req.user!.providerId,
      });

      res.status(201).json({
        success: true,
        message: 'Appointment scheduled successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AppointmentService.searchAppointments(req.query as any, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          totalResults: result.totalResults,
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          limit: result.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const appointment = await AppointmentService.getAppointmentById(id, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, cancellationReason } = req.body;
      const updated = await AppointmentService.updateStatus(
        id,
        status,
        cancellationReason,
        {
          userId: req.user!.id,
          role: req.user!.role,
          providerId: req.user!.providerId,
        }
      );

      res.status(200).json({
        success: true,
        message: `Appointment status updated to '${status}'`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { cancellationReason } = req.body;
      const cancelled = await AppointmentService.cancelAppointment(
        id,
        cancellationReason,
        {
          userId: req.user!.id,
          role: req.user!.role,
          providerId: req.user!.providerId,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: cancelled,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reassignProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { newProviderId, newSlotId } = req.body;
      const updated = await AppointmentService.reassignProvider(
        id,
        newProviderId,
        newSlotId,
        {
          userId: req.user!.id,
          role: req.user!.role,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Appointment successfully reassigned to new provider',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addSupportingProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { providerId } = req.body;
      const record = await AppointmentService.addSupportingProvider(
        id,
        providerId,
        {
          userId: req.user!.id,
          role: req.user!.role,
          providerId: req.user!.providerId,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Supporting provider added to care team',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeSupportingProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const providerId = Array.isArray(req.params.providerId)
        ? req.params.providerId[0]
        : req.params.providerId;
      const result = await AppointmentService.removeSupportingProvider(
        id,
        providerId,
        {
          userId: req.user!.id,
          role: req.user!.role,
        }
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
