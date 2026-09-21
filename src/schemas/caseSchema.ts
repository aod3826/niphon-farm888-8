import { z } from 'zod';
import { TriageLevelSchema } from './triageOutputSchema';
import { UserRoleSchema } from './farmSchema';

export const SymptomInputSchema = z.object({
  code: z.string().min(1),
  name_th: z.string().min(1),
  severity: z.enum(['mild', 'moderate', 'severe']).default('moderate'),
  onset: z.string().default('วันนี้'),
  notes: z.string().optional(),
});

export const CreateHealthCaseSchema = z.object({
  farm_id: z.string().uuid().optional(),
  animal_id: z.string().optional(),
  animal_code: z.string().optional(),
  barn_id: z.string().min(1),
  pen_id: z.string().min(1),
  affected_count: z.number().int().positive().default(1),
  reported_by: z.string().min(1),
  reported_by_role: UserRoleSchema.default('staff'),
  chief_complaint: z.string().min(2, 'กรุณาระบุอาการที่สังเกตพบ'),
  symptoms: z.array(SymptomInputSchema).default([]),
  temperature_c: z.number().min(30).max(45).optional(),
  respiratory_rate: z.number().min(5).max(150).optional(),
  feed_intake_status: z.enum(['normal', 'reduced_slight', 'reduced_heavy', 'none']).default('normal'),
  photos: z.array(z.string()).default([]),
});

export const VetReviewSchema = z.object({
  case_id: z.string().min(1),
  reviewed_by: z.string().min(1),
  reviewer_role: z.literal('veterinarian'),
  status: z.enum(['approved', 'modified', 'rejected']),
  clinical_notes: z.string().min(3, 'กรุณากรอกบันทึกการตรวจรักษาทางคลินิก'),
  confirmed_diagnosis: z.string().optional(),
  suggested_treatment: z.string().optional(),
});

export const DiagnosticInterviewAnswerSchema = z.object({
  case_id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1, 'กรุณาระบุคำตอบ'),
  answered_by: z.string().min(1),
});

export const CreateHealthCaseZodSchema = CreateHealthCaseSchema;
export const VeterinaryReviewZodSchema = VetReviewSchema;

