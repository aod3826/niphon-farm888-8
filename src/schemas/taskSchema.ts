import { z } from 'zod';
import { UserRoleSchema } from './farmSchema';

export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']),
  completed_by: z.string().optional(),
  completed_by_role: UserRoleSchema.optional(),
  notes: z.string().optional(),
});

export const CreateTaskSchema = z.object({
  farm_id: z.string().uuid().optional(),
  title: z.string().min(2),
  description: z.string().min(2),
  priority: TaskPrioritySchema.default('medium'),
  category: z.enum(['clinical_check', 'isolation', 'medication', 'vaccine', 'biosecurity', 'environment']).default('clinical_check'),
  case_id: z.string().optional(),
  animal_code: z.string().optional(),
  pen_name: z.string().optional(),
  assigned_to_name: z.string().min(1),
  assigned_to_role: UserRoleSchema.default('staff'),
  due_in_hours: z.number().positive().default(24),
});
