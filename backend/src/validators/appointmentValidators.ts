import { z } from 'zod';
import { AppointmentStatus } from '../config/constants';

export const createAppointmentSchema = z.object({
  slotId: z.string().uuid('Valid slot ID is required'),
  patientName: z.string().min(2, 'Patient name must be at least 2 characters'),
  patientEmail: z.string().email('Valid patient email is required'),
  patientPhone: z.string().min(7, 'Valid patient phone number is required'),
  reasonForVisit: z.string().min(3, 'Reason for visit must be at least 3 characters'),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    AppointmentStatus.Requested,
    AppointmentStatus.Confirmed,
    AppointmentStatus.CheckedIn,
    AppointmentStatus.Completed,
    AppointmentStatus.NoShow,
    AppointmentStatus.Cancelled,
  ]),
  cancellationReason: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(3, 'A cancellation reason of at least 3 characters is required'),
});

export const reassignProviderSchema = z.object({
  newProviderId: z.string().uuid('Valid target provider ID is required'),
  newSlotId: z.string().uuid('Valid target slot ID is required').optional(),
});

export const supportingProviderSchema = z.object({
  providerId: z.string().uuid('Valid provider ID is required'),
});

export const searchAppointmentsSchema = z.object({
  patientName: z.string().optional(),
  providerId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional(),
  sortBy: z.enum(['date', 'time', 'provider', 'status']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
