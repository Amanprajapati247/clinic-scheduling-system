import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../services/scheduleService';

export class ScheduleController {
  static async generateBulkSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ScheduleService.generateBulkSlots(req.body, {
        role: req.user!.role,
        providerId: req.user!.providerId,
      });

      res.status(201).json({
        success: true,
        message: `Generated ${result.createdSlots} slots (${result.skippedSlots} skipped due to collisions)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportDailyScheduleCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const providerId = req.query.providerId as string | undefined;

      const csvContent = await ScheduleService.exportDailyScheduleCSV(date, providerId);

      const filename = `daily-schedule-${date}${providerId ? `-${providerId}` : ''}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
