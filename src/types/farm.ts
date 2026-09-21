// Swine Farm Health Management & AI Veterinary Decision Support Types
// Defined according to PRD.md Section 18 & 22

export type UserRole = 'owner' | 'manager' | 'staff' | 'veterinarian';

export interface User {
  id: string;
  farm_id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Farm {
  id: string;
  name: string;
  farm_code: string;
  location: string;
  province: string;
  owner_name: string;
  status: 'active' | 'quarantine';
  total_heads: number;
}

export interface Barn {
  id: string;
  farm_id: string;
  name: string;
  type: 'breeding_sow' | 'finishing' | 'nursery';
  capacity: number;
  current_count: number;
  temperature: number; // Celsius
  humidity: number; // %
  status: 'normal' | 'warning' | 'alert';
}

export interface Pen {
  id: string;
  barn_id: string;
  name: string;
  capacity: number;
  current_count: number;
  status: 'normal' | 'sick_isolated' | 'attention';
}

export interface Animal {
  id: string;
  farm_id: string;
  animal_code: string;
  species: 'pig';
  type: 'sow' | 'gilt' | 'boar' | 'finisher' | 'piglet';
  sex: 'female' | 'male' | 'castrated';
  breed: string; // e.g. Landrace x Large White, Duroc
  birth_date: string;
  age_months: number;
  weight_kg: number;
  parity?: number; // Sow parity (รอบท้อง)
  farrowing_date?: string; // วันคลอดล่าสุด
  barn_id: string;
  barn_name: string;
  pen_id: string;
  pen_name: string;
  status: 'healthy' | 'monitoring' | 'sick' | 'isolated' | 'treated';
  qr_code?: string;
  health_notes?: string;
  timeline?: AnimalTimelineEvent[];
}

export interface AnimalTimelineEvent {
  id: string;
  date: string;
  type: 'birth' | 'move' | 'vaccination' | 'breeding' | 'farrowing' | 'health_case' | 'treatment' | 'followup';
  title: string;
  description: string;
  performed_by: string;
  severity?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

export type TriageLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface SymptomRecord {
  code: string;
  name_th: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: string;
  notes?: string;
}

export interface AITriageResponse {
  summary: string;
  triage_level: TriageLevel;
  facts: string[];
  unknowns: string[];
  possible_explanations: string[];
  questions: string[];
  recommended_checks: string[];
  management_actions: string[];
  escalation_required: boolean;
  create_tasks: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    assigned_role: UserRole;
    due_in_hours: number;
  }[];
  sources: {
    title: string;
    authority: string;
    url?: string;
  }[];
  safety_notes: string[];
  clinical_disclaimer: string;
}

export interface HealthCase {
  id: string;
  farm_id: string;
  case_number: string;
  animal_id?: string;
  animal_code?: string;
  barn_id: string;
  barn_name: string;
  pen_id: string;
  pen_name: string;
  affected_count: number;
  reported_by: string;
  reported_by_role: UserRole;
  reported_at: string;
  chief_complaint: string;
  symptoms: SymptomRecord[];
  temperature_c?: number;
  respiratory_rate?: number;
  feed_intake_status: 'normal' | 'reduced_slight' | 'reduced_heavy' | 'none';
  photos?: string[];
  triage_level: TriageLevel;
  status: 'open' | 'triage_completed' | 'in_progress' | 'vet_review' | 'resolved';
  ai_triage?: AITriageResponse;
  interview_history?: {
    question: string;
    answer: string;
    timestamp: string;
  }[];
  vet_review?: {
    reviewed_by: string;
    reviewed_at: string;
    status: 'approved' | 'modified' | 'rejected';
    clinical_notes: string;
    confirmed_diagnosis?: string;
  };
}

export interface FarmTask {
  id: string;
  farm_id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'clinical_check' | 'isolation' | 'medication' | 'vaccine' | 'biosecurity' | 'environment';
  case_id?: string;
  animal_code?: string;
  pen_name?: string;
  assigned_to_name: string;
  assigned_to_role: UserRole;
  due_at: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  completed_by?: string;
}

export interface TreatmentRecord {
  id: string;
  case_id: string;
  animal_code: string;
  pen_name: string;
  treatment_name: string;
  route: 'ฉีดเข้ากล้ามเนื้อ (IM)' | 'ผสมน้ำดื่ม' | 'ผสมอาหาร' | 'ทาภายนอก';
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  withdrawal_meat_days: number; // ระยะหยุดยาก่อนเชือด
  prescribed_by: string; // ต้องลงชื่อสัตวแพทย์
  administered_by: string;
  followup_date: string;
  status: 'active' | 'completed' | 'discontinued';
  followups?: {
    date: string;
    progression: 'improving' | 'stable' | 'deteriorating';
    notes: string;
    recorded_by: string;
  }[];
}

export interface OutbreakAlert {
  barn_id: string;
  barn_name: string;
  pens: string[];
  symptom_cluster: string;
  cases_count: number;
  level: 'warning' | 'critical';
  recommendations: string[];
}

export interface VaccinationRecord {
  id: string;
  animal_id?: string;
  pen_name: string;
  target_group: string; // e.g. แม่พันธุ์, สุกรอนุบาล 3 สัปดาห์
  vaccine_name: string; // e.g. อหิวาต์สุกร (CSF), มายโคพลาสมา, PRRS, พาร์โวไวรัส
  due_date: string;
  administered_date?: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface MortalityEvent {
  id: string;
  date: string;
  animal_code?: string;
  barn_name: string;
  pen_name: string;
  count: number;
  suspected_cause: string;
  reported_by: string;
  necropsy_done: boolean;
}

export interface BiosecurityLog {
  id: string;
  date: string;
  type: 'vehicle_disinfection' | 'visitor_quarantine' | 'perimeter_check' | 'feed_delivery_sterilization' | 'pest_control';
  location: string;
  status: 'passed' | 'warning' | 'breach';
  notes: string;
  checked_by: string;
}

export interface FarmProtocol {
  id: string;
  title: string;
  code: string;
  category: 'respiratory' | 'digestive' | 'biosecurity' | 'farrowing' | 'quarantine';
  effective_date: string;
  version: string;
  approved_by_vet: string;
  summary: string;
  steps: string[];
  reference_source: string;
}
