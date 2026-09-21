import { z } from 'zod';

export const UserRoleSchema = z.enum(['owner', 'manager', 'staff', 'veterinarian']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  farm_id: z.string().uuid(),
  name: z.string().min(1),
  role: UserRoleSchema,
  phone: z.string().min(8),
  email: z.string().email(),
  license_number: z.string().optional(),
  avatar: z.string().optional(),
});

export const FarmSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  farm_code: z.string().min(1),
  location: z.string(),
  province: z.string(),
  district: z.string().optional(),
  owner_name: z.string(),
  phone: z.string().optional(),
  capacity_total: z.number().int().positive(),
  status: z.enum(['active', 'quarantine', 'suspended']),
  total_heads: z.number().int().nonnegative(),
});

export const BarnSchema = z.object({
  id: z.string().uuid(),
  farm_id: z.string().uuid(),
  barn_code: z.string(),
  name: z.string().min(1),
  type: z.enum(['breeding_sow', 'finishing', 'nursery', 'quarantine', 'boar_stud']),
  capacity: z.number().int().positive(),
  current_count: z.number().int().nonnegative(),
  temperature: z.number(),
  humidity: z.number(),
  status: z.enum(['normal', 'warning', 'alert']),
});

export const PenSchema = z.object({
  id: z.string().uuid(),
  barn_id: z.string().uuid(),
  pen_code: z.string(),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  current_count: z.number().int().nonnegative(),
  status: z.enum(['normal', 'sick_isolated', 'attention', 'empty']),
});

export const AnimalSchema = z.object({
  id: z.string().uuid(),
  farm_id: z.string().uuid(),
  animal_code: z.string().min(1),
  species: z.literal('pig'),
  type: z.enum(['sow', 'gilt', 'boar', 'finisher', 'piglet']),
  sex: z.enum(['female', 'male', 'castrated']),
  breed: z.string(),
  birth_date: z.string(),
  age_months: z.number().nonnegative(),
  weight_kg: z.number().positive(),
  parity: z.number().int().nonnegative().optional(),
  farrowing_date: z.string().optional(),
  barn_id: z.string().uuid(),
  barn_name: z.string(),
  pen_id: z.string().uuid(),
  pen_name: z.string(),
  status: z.enum(['healthy', 'monitoring', 'sick', 'isolated', 'treated', 'culled', 'deceased']),
  health_notes: z.string().optional(),
});
