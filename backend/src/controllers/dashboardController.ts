import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';

export class DashboardController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getMetrics({
        role: req.user!.role,
        providerId: req.user!.providerId,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
