import { z } from 'zod';

export const TriageLevelSchema = z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED']);

export const TriageTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  assigned_role: z.enum(['owner', 'manager', 'staff', 'veterinarian']),
  due_in_hours: z.number().positive(),
});

export const TriageSourceSchema = z.object({
  title: z.string().min(1),
  authority: z.string().min(1),
  url: z.string().optional(),
});

export const AITriageOutputZodSchema = z.object({
  summary: z.string().min(5),
  triage_level: TriageLevelSchema,
  facts: z.array(z.string()).min(1),
  unknowns: z.array(z.string()).min(1),
  possible_explanations: z.array(z.string()).min(1),
  questions: z.array(z.string()).max(3),
  recommended_checks: z.array(z.string()).min(1),
  management_actions: z.array(z.string()).min(1),
  escalation_required: z.boolean(),
  create_tasks: z.array(TriageTaskSchema),
  sources: z.array(TriageSourceSchema),
  safety_notes: z.array(z.string()),
  clinical_disclaimer: z.string(),
});

export type AITriageOutput = z.infer<typeof AITriageOutputZodSchema>;
