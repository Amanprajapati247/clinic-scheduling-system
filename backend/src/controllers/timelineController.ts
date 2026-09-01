import { Request, Response, NextFunction } from 'express';
import { TimelineService } from '../services/timelineService';

export class TimelineController {
  static async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const appointmentId = Array.isArray(req.params.appointmentId)
        ? req.params.appointmentId[0]
        : req.params.appointmentId;
      const timeline = await TimelineService.getTimelineForAppointment(appointmentId);

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }
}
