import { z } from 'zod';

export const createSlotSchema = z.object({
  providerId: z.string().uuid('Valid provider ID required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm (24h)'),
  duration: z.number().int().positive().min(5, 'Duration must be at least 5 minutes'),
});

export const updateSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm (24h)').optional(),
  duration: z.number().int().positive().min(5, 'Duration must be at least 5 minutes').optional(),
});

export const weeklyDayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:mm'),
  slotDuration: z.number().int().positive().min(5).default(30),
});

export const bulkRecurringSlotsSchema = z.object({
  providerId: z.string().uuid('Valid provider ID required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be formatted as YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be formatted as YYYY-MM-DD'),
  schedules: z.array(weeklyDayScheduleSchema).min(1, 'At least one day schedule is required'),
});
