import { z } from 'zod';

export const createVisitNoteSchema = z.object({
  content: z.string().min(1, 'Visit note content cannot be empty'),
});

export const updateVisitNoteSchema = z.object({
  content: z.string().min(1, 'Visit note content cannot be empty'),
});
