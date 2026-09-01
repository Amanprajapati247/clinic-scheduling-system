import { z } from 'zod';
import { Role } from '../config/constants';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum([Role.FRONT_DESK, Role.PROVIDER]).default(Role.FRONT_DESK),
  specialty: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
