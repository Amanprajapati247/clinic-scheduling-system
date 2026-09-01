import { Request, Response, NextFunction } from 'express';
import { AlertService } from '../services/alertService';

export class AlertController {
  static async getActiveAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await AlertService.getActiveAlerts();
      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async dismissAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId, alertType } = req.body;
      const dismissal = await AlertService.dismissAlert(appointmentId, alertType, {
        userId: req.user!.id,
        role: req.user!.role,
      });

      res.status(200).json({
        success: true,
        message: 'Alert dismissed successfully',
        data: dismissal,
      });
    } catch (error) {
      next(error);
    }
  }
}
