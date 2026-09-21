// ====================================================================
// Production-Grade Relational In-Engine Database & Supabase Adapter
// System: Niphon Farm AI Veterinary Management System
// Compliance: PRD.md Section 17-19, 43, 72, 75, 84-86
// ====================================================================

import {
  Animal,
  Barn,
  Pen,
  HealthCase,
  FarmTask,
  TreatmentRecord,
  FarmProtocol,
  User,
  AITriageResponse,
} from '../../../src/types/farm';

export interface AIAuditRecord {
  id: string;
  farm_id: string;
  case_id?: string;
  agent_name: string;
  model_name: string;
  prompt_version: string;
  input_payload: any;
  context_used: any;
  raw_output: any;
  validated_output: any;
  safety_check_passed: boolean;
  safety_notes: string[];
  latency_ms: number;
  token_usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  created_at: string;
}

export class RelationalFarmDatabase {
  private static instance: RelationalFarmDatabase;

  public farmId = 'f0000000-0000-0000-0000-000000000001';
  public farmInfo = {
    id: 'f0000000-0000-0000-0000-000000000001',
    farm_code: 'NIPHON-PL-01',
    name: 'นิพนธ์ฟาร์ม Demo (Niphon Farm)',
    province: 'พัทลุง',
    district: 'ควนขนุน',
    location: '128 หมู่ 4 ต.ดอนทราย อ.ควนขนุน จ.พัทลุง 93110',
    owner_name: 'คุณนิพนธ์ รักฟาร์ม',
    phone: '081-987-6543',
    capacity_total: 1500,
    status: 'active' as const,
    total_heads: 1093,
  };

  public users: Map<string, User> = new Map();
  public barns: Map<string, Barn> = new Map();
  public pens: Map<string, Pen> = new Map();
  public animals: Map<string, Animal> = new Map();
  public cases: Map<string, HealthCase> = new Map();
  public tasks: Map<string, FarmTask> = new Map();
  public treatments: Map<string, TreatmentRecord> = new Map();
  public protocols: Map<string, FarmProtocol> = new Map();
  public auditEvents: AIAuditRecord[] = [];

  private constructor() {
    this.seedDatabase();
  }

  public static getInstance(): RelationalFarmDatabase {
    if (!RelationalFarmDatabase.instance) {
      RelationalFarmDatabase.instance = new RelationalFarmDatabase();
    }
    return RelationalFarmDatabase.instance;
  }

  // ------------------------------------------------------------------
  // Seed Database (PRD Section 84-86: 50 Animals, 15 Cases, 10+ Tasks)
  // ------------------------------------------------------------------
  private seedDatabase() {
    // 1. Users (PRD Section 85)
    const seedUsers: User[] = [
      {
        id: 'u0000000-0000-0000-0000-000000000001',
        farm_id: this.farmId,
        email: 'owner@demo.local',
        name: 'คุณนิพนธ์ รักฟาร์ม (เจ้าของฟาร์ม)',
        role: 'owner',
        phone: '081-987-6543',
      },
      {
        id: 'u0000000-0000-0000-0000-000000000002',
        farm_id: this.farmId,
        email: 'manager@demo.local',
        name: 'นายวิทยา สุขใส (ผู้จัดการฟาร์ม)',
        role: 'manager',
        phone: '089-123-4567',
      },
      {
        id: 'u0000000-0000-0000-0000-000000000003',
        farm_id: this.farmId,
        email: 'staff@demo.local',
        name: 'นางสาวกานดา มีสุข (พนักงานสัตวบาล)',
        role: 'staff',
        phone: '084-555-7890',
      },
      {
        id: 'u0000000-0000-0000-0000-000000000004',
        farm_id: this.farmId,
        email: 'vet@demo.local',
        name: 'น.สพ. ดร. ปริญญา ภักดี (สัตวแพทย์คุมฟาร์ม)',
        role: 'veterinarian',
        phone: '086-444-1122',
      },
    ];
    seedUsers.forEach((u) => this.users.set(u.id, u));

    // 2. Barns (PRD Section 84: โรงเรือน A, B, C)
    const seedBarns: Barn[] = [
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        farm_id: this.farmId,
        name: 'โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)',
        type: 'breeding_sow',
        capacity: 150,
        current_count: 138,
        temperature: 27.8,
        humidity: 72.0,
        status: 'normal',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        farm_id: this.farmId,
        name: 'โรงเรือน B (สุกรขุน Evap)',
        type: 'finishing',
        capacity: 600,
        current_count: 570,
        temperature: 29.2,
        humidity: 75.0,
        status: 'warning',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        farm_id: this.farmId,
        name: 'โรงเรือน C (สุกรอนุบาล)',
        type: 'nursery',
        capacity: 400,
        current_count: 385,
        temperature: 30.5,
        humidity: 68.0,
        status: 'normal',
      },
    ];
    seedBarns.forEach((b) => this.barns.set(b.id, b));

    // 3. Pens (PRD Section 84: A01-A10, B01-B10, C01-C10)
    const barnAId = 'b0000000-0000-0000-0000-000000000001';
    const barnBId = 'b0000000-0000-0000-0000-000000000002';
    const barnCId = 'b0000000-0000-0000-0000-000000000003';

    const seedPens: Pen[] = [];
    for (let i = 1; i <= 10; i++) {
      const pad = i.toString().padStart(2, '0');
      seedPens.push({
        id: `p0000000-0000-0000-0000-000000000a${pad}`,
        barn_id: barnAId,
        name: `คอก A${pad}`,
        capacity: i <= 5 ? 1 : 15,
        current_count: i <= 5 ? 1 : 14,
        status: i === 3 ? 'sick_isolated' : 'normal',
      });
      seedPens.push({
        id: `p0000000-0000-0000-0000-000000000b${pad}`,
        barn_id: barnBId,
        name: `คอก B${pad}`,
        capacity: 60,
        current_count: i === 2 ? 58 : 57,
        status: i === 2 || i === 5 ? 'attention' : 'normal',
      });
      seedPens.push({
        id: `p0000000-0000-0000-0000-000000000c${pad}`,
        barn_id: barnCId,
        name: `คอก C${pad}`,
        capacity: 40,
        current_count: i === 3 ? 36 : 39,
        status: i === 3 ? 'sick_isolated' : 'normal',
      });
    }
    seedPens.forEach((p) => this.pens.set(p.id, p));

    // 4. Animals (PRD Section 84: Exactly 50 robust animal records)
    const seedAnimals: Animal[] = [];

    // 25 Breeding Sows / Gilts in Barn A
    for (let i = 1; i <= 25; i++) {
      const codeNum = 100 + i;
      const penIndex = (i % 10) + 1;
      const penPad = penIndex.toString().padStart(2, '0');
      const penId = `p0000000-0000-0000-0000-000000000a${penPad}`;
      const parity = (i % 6) + 1;
      const isM128 = codeNum === 128;
      const isM112 = codeNum === 112;

      seedAnimals.push({
        id: `anim-a-${codeNum}`,
        farm_id: this.farmId,
        animal_code: `แม่สุกร M${codeNum}`,
        species: 'pig',
        type: i > 22 ? 'gilt' : 'sow',
        sex: 'female',
        breed: i % 2 === 0 ? 'สองสาย (Landrace x Large White)' : 'Landrace แท้',
        birth_date: `2023-0${(i % 9) + 1}-15`,
        age_months: 20 + (i % 18),
        weight_kg: 190 + (i % 30),
        parity,
        farrowing_date: i <= 10 ? `2026-08-${(i * 2).toString().padStart(2, '0')}` : undefined,
        barn_id: barnAId,
        barn_name: 'โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)',
        pen_id: penId,
        pen_name: `คอก A${penPad}`,
        status: isM128 ? 'sick' : isM112 ? 'monitoring' : 'healthy',
        health_notes: isM128 ? 'มีไข้ ซึม ไม่กินอาหารหลังคลอด' : undefined,
        timeline: [
          {
            id: `evt-${codeNum}-1`,
            date: '2024-01-10',
            type: 'vaccination',
            title: 'ฉีดวัคซีน FMD + CSF ประจำปี',
            description: 'ให้วัคซีนป้องกันโรคปากและเท้าเปื่อย และอหิวาต์สุกรเข็มกระตุ้น',
            performed_by: 'น.สพ. ดร. ปริญญา ภักดี',
          },
          {
            id: `evt-${codeNum}-2`,
            date: '2026-08-10',
            type: 'farrowing',
            title: `คลอดลูกสุกรครอกที่ ${parity}`,
            description: 'คลอดลูกมีชีวิต 12 ตัว แข็งแรง น้ำหนักเฉลี่ย 1.45 กก.',
            performed_by: 'นางสาวกานดา มีสุข',
          },
        ],
      });
    }

    // 15 Finishers in Barn B
    for (let i = 1; i <= 15; i++) {
      const codeNum = 200 + i;
      const penIndex = (i % 10) + 1;
      const penPad = penIndex.toString().padStart(2, '0');
      const penId = `p0000000-0000-0000-0000-000000000b${penPad}`;
      const isSick = codeNum === 204 || codeNum === 209;

      seedAnimals.push({
        id: `anim-b-${codeNum}`,
        farm_id: this.farmId,
        animal_code: `สุกรขุน F${codeNum}`,
        species: 'pig',
        type: 'finisher',
        sex: i % 2 === 0 ? 'castrated' : 'female',
        breed: 'สามสาย (Duroc x Landrace-Large White)',
        birth_date: '2026-04-12',
        age_months: 5,
        weight_kg: 82 + (i % 20),
        barn_id: barnBId,
        barn_name: 'โรงเรือน B (สุกรขุน Evap)',
        pen_id: penId,
        pen_name: `คอก B${penPad}`,
        status: isSick ? 'sick' : 'healthy',
        health_notes: codeNum === 204 ? 'ไอแห้ง หายใจช่องท้องกระเพื่อม' : undefined,
        timeline: [
          {
            id: `evt-${codeNum}-1`,
            date: '2026-05-02',
            type: 'vaccination',
            title: 'ฉีดวัคซีน Mycoplasma + PCV2',
            description: 'ป้องกันโรคปอดอักเสบและเซอร์โคไวรัสในสุกรขุน',
            performed_by: 'นายวิทยา สุขใส',
          },
          {
            id: `evt-${codeNum}-2`,
            date: '2026-07-15',
            type: 'move',
            title: 'ย้ายเข้าโรงเรือนขุน B',
            description: 'ย้ายจากโรงเรือนอนุบาล C น้ำหนักเข้า 32 กก.',
            performed_by: 'นางสาวกานดา มีสุข',
          },
        ],
      });
    }

    // 10 Nursery Piglets in Barn C
    for (let i = 1; i <= 10; i++) {
      const codeNum = 300 + i;
      const penIndex = (i % 10) + 1;
      const penPad = penIndex.toString().padStart(2, '0');
      const penId = `p0000000-0000-0000-0000-000000000c${penPad}`;
      const isSick = codeNum === 305;

      seedAnimals.push({
        id: `anim-c-${codeNum}`,
        farm_id: this.farmId,
        animal_code: `สุกรอนุบาล N${codeNum}`,
        species: 'pig',
        type: 'piglet',
        sex: i % 2 === 0 ? 'castrated' : 'female',
        breed: 'สองสายหย่านม',
        birth_date: '2026-07-28',
        age_months: 2,
        weight_kg: 18 + (i % 6),
        barn_id: barnCId,
        barn_name: 'โรงเรือน C (สุกรอนุบาล)',
        pen_id: penId,
        pen_name: `คอก C${penPad}`,
        status: isSick ? 'isolated' : 'healthy',
        health_notes: codeNum === 305 ? 'ถ่ายเหลว ขาดน้ำ ย้ายเข้าคอกกักดูอาการ' : undefined,
        timeline: [
          {
            id: `evt-${codeNum}-1`,
            date: '2026-08-20',
            type: 'move',
            title: 'หย่านม ย้ายเข้าคอกอนุบาล C',
            description: 'หย่านมที่อายุ 24 วัน เริ่มฝึกอาหารเม็ดอนุบาลเบอร์ 1',
            performed_by: 'นางสาวกานดา มีสุข',
          },
        ],
      });
    }

    seedAnimals.forEach((a) => this.animals.set(a.id, a));

    // 5. Health Cases (PRD Section 84: Exactly 15 cases covering diverse statuses)
    const seedCases: HealthCase[] = [
      {
        id: 'c0000000-0000-0000-0000-000000000101',
        farm_id: this.farmId,
        case_number: 'CASE-2026-0101',
        animal_id: 'anim-a-128',
        animal_code: 'แม่สุกร M128',
        barn_id: barnAId,
        barn_name: 'โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)',
        pen_id: 'p0000000-0000-0000-0000-000000000a03',
        pen_name: 'คอก A03',
        affected_count: 1,
        reported_by: 'นางสาวกานดา มีสุข',
        reported_by_role: 'staff',
        reported_at: '2026-09-21T07:15:00.000Z',
        chief_complaint: 'แม่สุกรนอนซึม ไม่ยอมลุกมากินอาหารเช้า วัดไข้ได้ 40.2°C เต้านมคัดบวม',
        symptoms: [
          { code: 'off_feed', name_th: 'ไม่กินอาหาร (Off feed)', severity: 'severe', onset: 'เมื่อเช้านี้' },
          { code: 'fever', name_th: 'มีไข้สูง 40.2°C', severity: 'severe', onset: 'เมื่อเช้านี้' },
          { code: 'mastitis', name_th: 'เต้านมบวมแข็ง ร้อน (Mastitis)', severity: 'moderate', onset: '1 วัน' },
        ],
        temperature_c: 40.2,
        respiratory_rate: 34,
        feed_intake_status: 'none',
        triage_level: 'ORANGE',
        status: 'vet_review',
        ai_triage: {
          summary: 'สงสัยกลุ่มอาการเต้านมอักเสบ มดลูกอักเสบ และไม่มีน้ำนม (MMA Syndrome) ในแม่สุกรหลังคลอดเฉียบพลัน',
          triage_level: 'ORANGE',
          facts: [
            'แม่สุกร M128 เพิ่งคลอดลูกครอกที่ 4 วันที่ 10 ส.ค.',
            'มีไข้สูง 40.2°C และไม่กินอาหารอย่างสิ้นเชิง',
            'ตรวจพบเต้านมคัดตึงและร้อน',
          ],
          unknowns: ['ยังไม่ทราบว่ามีสิ่งคัดหลั่งผิดปกติออกจากช่องคลอดหรือไม่', 'ลูกสุกรยังดูดนมได้หรือไม่'],
          possible_explanations: ['MMA Syndrome (Mastitis-Metritis-Agalactia)', 'การติดเชื้อแบคทีเรียเฉียบพลันหลังคลอด'],
          questions: [
            'ตรวจดูบริเวณอวัยวะเพศว่ามีหนองหรือเมือกกลิ่นเหม็นไหลออกมาหรือไม่?',
            'ลูกสุกรในครอกมีอาการท้องเสียหรือร้องกวนเพราะหิวนมหรือไม่?',
          ],
          recommended_checks: [
            'คลำตรวจเต้านมทุกคู่ว่าบวมแข็งกี่เต้า',
            'วัดอุณหภูมิซ้ำในอีก 4 ชั่วโมง',
            'แยกดูแลลูกสุกรให้ได้กินนมเสริมชั่วคราว',
          ],
          management_actions: ['แจ้งสัตวแพทย์ตรวจยืนยันเพื่อสั่งแผนการรักษา', 'เตรียมน้ำสะอาดและดูแลไม่ให้แม่สุกรเครียดจากความร้อน'],
          escalation_required: true,
          create_tasks: [
            {
              title: 'ตรวจเช็กลูกสุกรครอก M128 และเสริมนมชง',
              description: 'เนื่องจากแม่สุกรน้ำนมลด ต้องป้องกันลูกสุกรขาดน้ำตาลในเลือด',
              priority: 'high',
              assigned_role: 'staff',
              due_in_hours: 2,
            },
          ],
          sources: [
            { title: 'SOP การจัดการแม่สุกรคลอดและภาวะ MMA', authority: 'นิพนธ์ฟาร์ม / ม.สงขลานครินทร์' },
            { title: 'คู่มือการควบคุมโรคในสุกรพ่อแม่พันธุ์', authority: 'กรมปศุสัตว์' },
          ],
          safety_notes: ['AI ไม่มีอำนาจสั่งยาต้านจุลชีพหรือกำหนดขนาดยา การรักษาต้องอยู่ในการดูแลของสัตวแพทย์คุมฟาร์มเท่านั้น'],
          clinical_disclaimer: 'ผลการวิเคราะห์นี้เป็นระบบสนับสนุนการตัดสินใจทางสัตวแพทย์ ไม่ใช่การวินิจฉัยโรคขั้นสุดท้าย',
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000102',
        farm_id: this.farmId,
        case_number: 'CASE-2026-0102',
        animal_id: 'anim-b-204',
        animal_code: 'สุกรขุน F204',
        barn_id: barnBId,
        barn_name: 'โรงเรือน B (สุกรขุน Evap)',
        pen_id: 'p0000000-0000-0000-0000-000000000b02',
        pen_name: 'คอก B02',
        affected_count: 4,
        reported_by: 'นายวิทยา สุขใส',
        reported_by_role: 'manager',
        reported_at: '2026-09-20T14:30:00.000Z',
        chief_complaint: 'สุกรขุน 4 ตัวในคอก B02 มีอาการไอแห้ง หายใจถี่ หอบช่วงท้องกระเพื่อม กินอาหารลดลง 30%',
        symptoms: [
          { code: 'coughing', name_th: 'ไอแห้งเป็นชุด', severity: 'moderate', onset: '2 วัน' },
          { code: 'dyspnea', name_th: 'หายใจหอบถี่ (Dyspnea)', severity: 'moderate', onset: '1 วัน' },
          { code: 'reduced_feed', name_th: 'กินอาหารลดลง', severity: 'mild', onset: '1 วัน' },
        ],
        temperature_c: 39.6,
        respiratory_rate: 52,
        feed_intake_status: 'reduced_slight',
        triage_level: 'YELLOW',
        status: 'in_progress',
        ai_triage: {
          summary: 'สงสัยกลุ่มโรคระบบทางเดินหายใจในสุกรขุน (PRDC - Porcine Respiratory Disease Complex)',
          triage_level: 'YELLOW',
          facts: ['สุกรขุนอายุ 5 เดือน น้ำหนัก ~85 กก. แสดงอาการทางเดินหายใจ 4 ตัวในคอกเดียวกัน'],
          unknowns: ['ยังไม่ทราบว่าคอกข้างเคียงเริ่มมีเสียงไอหรือไม่'],
          possible_explanations: ['Mycoplasma hyopneumoniae ร่วมกับสภาพอากาศแปรปรวน', 'โรคหวัดสุกร (Swine Influenza)'],
          questions: ['คอก B01 และ B03 มีเสียงไอร่วมด้วยหรือไม่?', 'ระบบพัดลมและแผ่นรังผึ้ง Evap ทำงานสมบูรณ์หรือไม่?'],
          recommended_checks: ['ตรวจวัดอัตราการหายใจรายตัว', 'เช็กอุณหภูมิและความชื้นสัมพัทธ์ในโรงเรือน B'],
          management_actions: ['เสริมวิตามินซีในน้ำดื่ม', 'ลดฝุ่นและตรวจสอบการระบายอากาศ'],
          escalation_required: false,
          create_tasks: [
            {
              title: 'ตรวจการทำงานระบบ Evap และวัดอุณหภูมิโรงเรือน B',
              description: 'เช็กความเร็วลมและระดับแอมโมเนียในอากาศคอก B02',
              priority: 'medium',
              assigned_role: 'staff',
              due_in_hours: 4,
            },
          ],
          sources: [{ title: 'PRDC Management in Tropical Climates', authority: 'WOAH / กรมปศุสัตว์' }],
          safety_notes: ['ห้ามนำยาปฏิชีวนะมาผสมน้ำโดยไม่ได้รับใบสั่งยาจากสัตวแพทย์ผู้ควบคุมฟาร์ม'],
          clinical_disclaimer: 'ผลการประเมินเบื้องต้นเพื่อการเฝ้าระวังทางสัตวบาล',
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000103',
        farm_id: this.farmId,
        case_number: 'CASE-2026-0103',
        animal_id: 'anim-c-305',
        animal_code: 'สุกรอนุบาล N305',
        barn_id: barnCId,
        barn_name: 'โรงเรือน C (สุกรอนุบาล)',
        pen_id: 'p0000000-0000-0000-0000-000000000c03',
        pen_name: 'คอก C03',
        affected_count: 3,
        reported_by: 'นางสาวกานดา มีสุข',
        reported_by_role: 'staff',
        reported_at: '2026-09-19T09:00:00.000Z',
        chief_complaint: 'ลูกสุกรอนุบาลหย่านมใหม่ 3 ตัว ถ่ายเหลวเป็นน้ำสีเหลือง ก้นเปียก ตาโหล มีภาวะขาดน้ำ',
        symptoms: [
          { code: 'diarrhea', name_th: 'ท้องเสียถ่ายเหลวสีเหลือง', severity: 'severe', onset: '1 วัน' },
          { code: 'dehydration', name_th: 'ภาวะขาดน้ำ ตาโหล', severity: 'moderate', onset: '1 วัน' },
        ],
        temperature_c: 39.2,
        feed_intake_status: 'reduced_heavy',
        triage_level: 'ORANGE',
        status: 'in_progress',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000104',
        farm_id: this.farmId,
        case_number: 'CASE-2026-0104',
        animal_id: 'anim-a-112',
        animal_code: 'แม่สุกร M112',
        barn_id: barnAId,
        barn_name: 'โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)',
        pen_id: 'p0000000-0000-0000-0000-000000000a01',
        pen_name: 'คอก A01',
        affected_count: 1,
        reported_by: 'นางสาวกานดา มีสุข',
        reported_by_role: 'staff',
        reported_at: '2026-09-18T16:20:00.000Z',
        chief_complaint: 'แม่สุกรขาหลังขวากะเผลก ลุกยืนลำบาก ตรวจฝ่าเท้าพบรอยแตกเล็กน้อย กินอาหารได้ปกติ',
        symptoms: [{ code: 'lameness', name_th: 'ขาเจ็บ กะเผลก (Lameness)', severity: 'moderate', onset: '2 วัน' }],
        temperature_c: 38.6,
        feed_intake_status: 'normal',
        triage_level: 'GREEN',
        status: 'resolved',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000105',
        farm_id: this.farmId,
        case_number: 'CASE-2026-0105',
        animal_id: 'anim-b-209',
        animal_code: 'สุกรขุน F209',
        barn_id: barnBId,
        barn_name: 'โรงเรือน B (สุกรขุน Evap)',
        pen_id: 'p0000000-0000-0000-0000-000000000b05',
        pen_name: 'คอก B05',
        affected_count: 2,
        reported_by: 'นายวิทยา สุขใส',
        reported_by_role: 'manager',
        reported_at: '2026-09-17T11:00:00.000Z',
        chief_complaint: 'สุกรขุนมีไข้ต่ำ ซึมเล็กน้อย แยกตัวจากฝูง',
        symptoms: [{ code: 'mild_fever', name_th: 'มีไข้ต่ำ 39.5°C', severity: 'mild', onset: '1 วัน' }],
        temperature_c: 39.5,
        feed_intake_status: 'reduced_slight',
        triage_level: 'YELLOW',
        status: 'resolved',
      },
    ];

    // Add remaining 10 cases to reach 15 cases (PRD Section 84)
    for (let i = 6; i <= 15; i++) {
      const pad = i.toString().padStart(2, '0');
      const isUrgent = i === 12;
      seedCases.push({
        id: `c0000000-0000-0000-0000-0000000001${pad}`,
        farm_id: this.farmId,
        case_number: `CASE-2026-01${pad}`,
        animal_id: i % 2 === 0 ? `anim-b-${200 + i}` : `anim-a-${100 + i}`,
        animal_code: i % 2 === 0 ? `สุกรขุน F${200 + i}` : `แม่สุกร M${100 + i}`,
        barn_id: i % 2 === 0 ? barnBId : barnAId,
        barn_name: i % 2 === 0 ? 'โรงเรือน B (สุกรขุน Evap)' : 'โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)',
        pen_id: `p0000000-0000-0000-0000-000000000${i % 2 === 0 ? 'b' : 'a'}${pad}`,
        pen_name: `คอก ${i % 2 === 0 ? 'B' : 'A'}${pad}`,
        affected_count: 1,
        reported_by: 'นางสาวกานดา มีสุข',
        reported_by_role: 'staff',
        reported_at: `2026-09-${15 - (i % 5)}T08:30:00.000Z`,
        chief_complaint: isUrgent
          ? 'สุกรขุนมีจุดเลือดออกตามใบหูและผิวหนัง ซึมมาก ไข้ 41.0°C เฝ้าระวังด่วน'
          : `ติดตามอาการประจำวันสุกร ตรวจเช็กสุขภาพและทางเดินอาหาร`,
        symptoms: isUrgent
          ? [
              { code: 'cyanosis', name_th: 'ผิวหนังและใบหูม่วงคล้ำ', severity: 'severe', onset: 'วันนี้' },
              { code: 'high_fever', name_th: 'ไข้สูงเฉียบพลัน 41.0°C', severity: 'severe', onset: 'วันนี้' },
            ]
          : [{ code: 'routine_check', name_th: 'ติดตามอาการหลังหย่านม', severity: 'mild', onset: '3 วัน' }],
        temperature_c: isUrgent ? 41.0 : 38.8,
        feed_intake_status: isUrgent ? 'none' : 'normal',
        triage_level: isUrgent ? 'RED' : i % 3 === 0 ? 'YELLOW' : 'GREEN',
        status: isUrgent ? 'vet_review' : 'resolved',
      });
    }

    seedCases.forEach((c) => this.cases.set(c.id, c));

    // 6. Farm Tasks (PRD Section 84: 12 tasks)
    const seedTasks: FarmTask[] = [
      {
        id: 't0000000-0000-0000-0000-000000000001',
        farm_id: this.farmId,
        title: 'ตรวจเต้านมและวัดไข้ซ้ำ แม่สุกร M128',
        description: 'วัดอุณหภูมิร่างกาย บันทึกปริมาณน้ำนม และสังเกตการกินอาหารตอนบ่าย',
        priority: 'high',
        category: 'clinical_check',
        case_id: 'c0000000-0000-0000-0000-000000000101',
        animal_code: 'แม่สุกร M128',
        pen_name: 'คอก A03',
        assigned_to_name: 'นางสาวกานดา มีสุข',
        assigned_to_role: 'staff',
        due_at: '2026-09-21T14:00:00.000Z',
        status: 'pending',
      },
      {
        id: 't0000000-0000-0000-0000-000000000002',
        farm_id: this.farmId,
        title: 'สัตวแพทย์ลงตรวจรับรองเคส M128 และ B02',
        description: 'ตรวจยืนยันอาการ MMA และประเมินอาการไอ PRDC ในโรงเรือน B',
        priority: 'high',
        category: 'clinical_check',
        assigned_to_name: 'น.สพ. ดร. ปริญญา ภักดี',
        assigned_to_role: 'veterinarian',
        due_at: '2026-09-21T16:00:00.000Z',
        status: 'pending',
      },
      {
        id: 't0000000-0000-0000-0000-000000000003',
        farm_id: this.farmId,
        title: 'เสริมเกลือแร่และสารละลายน้ำตาลในคอกอนุบาล C03',
        description: 'ลูกสุกรท้องเสีย 3 ตัว ต้องได้รับ ORS ป้องกันภาวะช็อกจากการขาดน้ำ',
        priority: 'high',
        category: 'medication',
        assigned_to_name: 'นางสาวกานดา มีสุข',
        assigned_to_role: 'staff',
        due_at: '2026-09-21T11:00:00.000Z',
        status: 'in_progress',
      },
      {
        id: 't0000000-0000-0000-0000-000000000004',
        farm_id: this.farmId,
        title: 'ตรวจสอบระบบพัดลมและแผ่น Evap โรงเรือน B',
        description: 'วัดแรงดันลม ตรวจเช็กหัวจ่ายน้ำและคราบตะกรันบนแผ่นทำความเย็น',
        priority: 'medium',
        category: 'environment',
        assigned_to_name: 'นายวิทยา สุขใส',
        assigned_to_role: 'manager',
        due_at: '2026-09-21T17:00:00.000Z',
        status: 'pending',
      },
      {
        id: 't0000000-0000-0000-0000-000000000005',
        farm_id: this.farmId,
        title: 'พ่นหมอกฆ่าเชื้อรอบทางเดินหน้าโรงเรือน A และ B',
        description: 'มาตรการความปลอดภัยทางชีวภาพ (Biosecurity Routine)',
        priority: 'medium',
        category: 'biosecurity',
        assigned_to_name: 'นายวิทยา สุขใส',
        assigned_to_role: 'manager',
        due_at: '2026-09-21T18:00:00.000Z',
        status: 'completed',
        completed_at: '2026-09-21T09:30:00.000Z',
        completed_by: 'นายวิทยา สุขใส',
      },
    ];

    // Add 6 more tasks to reach 11 tasks
    for (let i = 6; i <= 11; i++) {
      seedTasks.push({
        id: `t0000000-0000-0000-0000-0000000000${i.toString().padStart(2, '0')}`,
        farm_id: this.farmId,
        title: `ตรวจติดตามสุขภาพสุกรกลุ่มที่ ${i} ประจำสัปดาห์`,
        description: 'ชั่งน้ำหนักสุ่มตัวอย่างและบันทึกปริมาณการกินอาหาร FCR',
        priority: 'low',
        category: 'clinical_check',
        assigned_to_name: 'นางสาวกานดา มีสุข',
        assigned_to_role: 'staff',
        due_at: `2026-09-${22 + (i % 3)}T10:00:00.000Z`,
        status: 'pending',
      });
    }

    seedTasks.forEach((t) => this.tasks.set(t.id, t));

    // 7. Protocols & SOPs (PRD Section 16)
    const seedProtocols: FarmProtocol[] = [
      {
        id: 'proto-01',
        title: 'SOP การเฝ้าระวังและการรายงานโรคสุกรไข้สูงเฉียบพลัน (ASF/CSF Alert)',
        code: 'SOP-BIO-001',
        category: 'biosecurity',
        effective_date: '2026-01-01',
        version: '2.1',
        approved_by_vet: 'น.สพ. ดร. ปริญญา ภักดี',
        summary: 'แนวทางปฏิบัติตามมาตรฐาน WOAH และกรมปศุสัตว์ เมื่อพบสุกรตายเฉียบพลันหรือไข้สูงเกิน 40.5°C',
        steps: [
          '1. กักบริเวณคอกที่พบสัตว์ป่วยทันที ห้ามเคลื่อนย้ายสุกรออกจากโรงเรือนเด็ดขาด',
          '2. พนักงานห้ามเดินข้ามไปยังโรงเรือนอื่น และเปลี่ยนรองเท้าบูตในอ่างน้ำยาฆ่าเชื้อทันที',
          '3. แจ้งสัตวแพทย์ผู้ควบคุมฟาร์มและผู้จัดการฟาร์มภายใน 15 นาที',
          '4. ห้ามผ่าซากชันสูตรเองโดยไม่ได้รับอนุญาตจากสัตวแพทย์เพื่อป้องกันเชื้อฟุ้งกระจาย',
          '5. เตรียมรายงานและประสานงานปศุสัตว์อำเภอตามระเบียบกฎหมายโรคระบาดสัตว์',
        ],
        reference_source: 'WOAH Terrestrial Manual / กรมปศุสัตว์ กระทรวงเกษตรและสหกรณ์',
      },
      {
        id: 'proto-02',
        title: 'SOP การจัดการแม่สุกรระยะอุ้มท้อง คลอด และกลุ่มอาการเต้านมอักเสบ (MMA)',
        code: 'SOP-REP-002',
        category: 'farrowing',
        effective_date: '2026-02-15',
        version: '1.4',
        approved_by_vet: 'น.สพ. ดร. ปริญญา ภักดี',
        summary: 'ขั้นตอนการดูแลแม่พันธุ์หลังคลอด 72 ชั่วโมงแรก การตรวจเต้านม และการป้องกันลูกสุกรขาดน้ำตาล',
        steps: [
          '1. วัดอุณหภูมิแม่สุกรทุกเช้า-เย็นหลังคลอดเป็นเวลา 3 วัน (ปกติ 38.5 - 39.5°C)',
          '2. คลำเต้านมทุกเต้าเพื่อตรวจหาความร้อน บวม หรือไตแข็ง',
          '3. สังเกตสิ่งคัดหลั่งจากช่องคลอด หากมีกลิ่นเหม็นหรือสีขุ่นให้รายงานสัตวแพทย์ทันที',
          '4. หากแม่สุกรไม่ยอมให้ลูกดูดนม ให้แยกกกไฟและเสริมนมชงอุ่นแก่ลูกสุกรทุก 2-3 ชั่วโมง',
        ],
        reference_source: 'คู่มือการจัดการฟาร์มสุกรพันธุ์ มหาวิทยาลัยเกษตรศาสตร์',
      },
      {
        id: 'proto-03',
        title: 'SOP การจัดการกลุ่มโรคระบบทางเดินหายใจในสุกรขุน (PRDC Guidelines)',
        code: 'SOP-RESP-003',
        category: 'respiratory',
        effective_date: '2026-03-01',
        version: '1.2',
        approved_by_vet: 'น.สพ. ดร. ปริญญา ภักดี',
        summary: 'แนวทางการจัดการสภาพแวดล้อม การควบคุมฝุ่นและก๊าซแอมโมเนียในโรงเรือน Evap',
        steps: [
          '1. ตรวจสอบความเร็วลมที่พัดผ่านตัวสุกร (1.5 - 2.0 เมตร/วินาที)',
          '2. ตรวจสอบความชื้นสัมพัทธ์ให้อยู่ในช่วง 65 - 75%',
          '3. ล้างสิ่งสกปรกบนแผ่นรังผึ้ง Evap เพื่อให้อากาศถ่ายเทสะดวก',
          '4. รายงานสัตวแพทย์หากอัตราการไอเกิน 5% ของฝูงเพื่อประเมินการเก็บตัวอย่างชันสูตร',
        ],
        reference_source: 'Swine Respiratory Health Protocol (DLD Thailand)',
      },
    ];
    seedProtocols.forEach((p) => this.protocols.set(p.id, p));

    // 8. Treatments & Drug Records (PRD Section 12-13, 23-25)
    const seedTreatments: TreatmentRecord[] = [
      {
        id: 'treat-01',
        case_id: 'c0000000-0000-0000-0000-000000000101',
        animal_code: 'แม่สุกร M128',
        pen_name: 'คอก A03',
        treatment_name: 'ยาต้านการอักเสบชนิดไม่ใช่สเตียรอยด์ (NSAID: Flunixin Meglumine)',
        route: 'ฉีดเข้ากล้ามเนื้อ (IM)',
        dosage: '2.2 mg/kg (4.5 ml/100kg)',
        frequency: 'วันละ 1 ครั้ง ติดต่อกัน 2 วัน',
        start_date: '2026-09-21',
        end_date: '2026-09-22',
        withdrawal_meat_days: 14,
        prescribed_by: 'น.สพ. ดร. ปริญญา ภักดี (ว.สพ. 12940)',
        administered_by: 'นางสาวกานดา มีสุข',
        followup_date: '2026-09-22',
        status: 'active',
        followups: [
          {
            date: '2026-09-21T08:30:00.000Z',
            progression: 'stable',
            notes: 'ฉีดเข็มแรกเรียบร้อย แม่สุกรเริ่มนอนพักผ่อน ไม่มีอาการแพ้ยา',
            recorded_by: 'นางสาวกานดา มีสุข',
          },
        ],
      },
    ];
    seedTreatments.forEach((t) => this.treatments.set(t.id, t));

    console.log(
      `✅ RelationalFarmDatabase initialized: ${this.animals.size} animals, ${this.cases.size} cases, ${this.tasks.size} tasks, ${this.barns.size} barns, ${this.pens.size} pens.`
    );
  }

  // ------------------------------------------------------------------
  // Query & Mutation API
  // ------------------------------------------------------------------

  public getSummary() {
    const animalsArr = Array.from(this.animals.values());
    const casesArr = Array.from(this.cases.values());
    const tasksArr = Array.from(this.tasks.values());

    const activeCases = casesArr.filter((c) => c.status !== 'resolved');
    const urgentTriage = activeCases.filter((c) => c.triage_level === 'RED' || c.triage_level === 'ORANGE');
    const sickAnimals = animalsArr.filter((a) => a.status === 'sick' || a.status === 'isolated');
    const pendingTasks = tasksArr.filter((t) => t.status !== 'completed');

    return {
      farm_info: this.farmInfo,
      total_animals: animalsArr.length,
      sick_animals: sickAnimals.length,
      active_cases: activeCases.length,
      urgent_cases: urgentTriage.length,
      pending_tasks: pendingTasks.length,
      recent_cases: casesArr.slice(0, 5),
      barns: Array.from(this.barns.values()),
    };
  }

  public getAnimals(filter?: { barn_id?: string; pen_id?: string; status?: string; search?: string }) {
    let result = Array.from(this.animals.values());

    if (filter?.barn_id) {
      result = result.filter((a) => a.barn_id === filter.barn_id);
    }
    if (filter?.pen_id) {
      result = result.filter((a) => a.pen_id === filter.pen_id);
    }
    if (filter?.status && filter.status !== 'all') {
      result = result.filter((a) => a.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (a) => a.animal_code.toLowerCase().includes(q) || a.pen_name.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getAnimalById(id: string): Animal | undefined {
    return this.animals.get(id);
  }

  public getBarnsAndPens() {
    const barnsArr = Array.from(this.barns.values());
    const pensArr = Array.from(this.pens.values());

    return barnsArr.map((barn) => ({
      ...barn,
      pens: pensArr.filter((p) => p.barn_id === barn.id),
    }));
  }

  public getCases(filter?: { triage_level?: string; status?: string }) {
    let result = Array.from(this.cases.values());

    if (filter?.triage_level && filter.triage_level !== 'all') {
      result = result.filter((c) => c.triage_level === filter.triage_level);
    }
    if (filter?.status && filter.status !== 'all') {
      result = result.filter((c) => c.status === filter.status);
    }

    return result;
  }

  public getCaseById(id: string): HealthCase | undefined {
    return this.cases.get(id);
  }

  public createCase(input: {
    animal_id?: string;
    animal_code?: string;
    barn_id: string;
    pen_id: string;
    affected_count: number;
    reported_by: string;
    reported_by_role?: any;
    chief_complaint: string;
    symptoms: any[];
    temperature_c?: number;
    respiratory_rate?: number;
    feed_intake_status: any;
    photos?: string[];
  }): HealthCase {
    const barn = this.barns.get(input.barn_id);
    const pen = this.pens.get(input.pen_id);

    if (!barn) {
      throw new Error(`Invalid barn_id: ${input.barn_id}`);
    }
    if (!pen) {
      throw new Error(`Invalid pen_id: ${input.pen_id}`);
    }

    let animal = input.animal_id ? this.animals.get(input.animal_id) : undefined;
    if (!animal && input.animal_code) {
      animal = Array.from(this.animals.values()).find((a) => a.animal_code === input.animal_code);
    }

    const caseCount = this.cases.size + 1;
    const caseId = `c0000000-0000-0000-0000-000000000${caseCount.toString().padStart(3, '0')}`;
    const caseNumber = `CASE-2026-${(100 + caseCount).toString()}`;

    // PRD Section 72: Separate record creation from AI
    const newCase: HealthCase = {
      id: caseId,
      farm_id: this.farmId,
      case_number: caseNumber,
      animal_id: animal?.id,
      animal_code: animal?.animal_code || input.animal_code,
      barn_id: barn.id,
      barn_name: barn.name,
      pen_id: pen.id,
      pen_name: pen.name,
      affected_count: input.affected_count || 1,
      reported_by: input.reported_by,
      reported_by_role: input.reported_by_role || 'staff',
      reported_at: new Date().toISOString(),
      chief_complaint: input.chief_complaint,
      symptoms: input.symptoms || [],
      temperature_c: input.temperature_c,
      respiratory_rate: input.respiratory_rate,
      feed_intake_status: input.feed_intake_status || 'normal',
      photos: input.photos || [],
      triage_level: 'YELLOW',
      status: 'open',
    };

    // Update animal status to sick/monitoring
    if (animal) {
      animal.status = 'sick';
      this.animals.set(animal.id, animal);
    }

    this.cases.set(caseId, newCase);
    return newCase;
  }

  public updateCaseTriage(caseId: string, triage: AITriageResponse): HealthCase {
    const healthCase = this.cases.get(caseId);
    if (!healthCase) {
      throw new Error(`Case not found: ${caseId}`);
    }

    healthCase.ai_triage = triage;
    healthCase.triage_level = triage.triage_level;
    healthCase.status = triage.escalation_required ? 'vet_review' : 'triage_completed';

    // Auto create tasks from triage (PRD Section 31)
    if (triage.create_tasks && triage.create_tasks.length > 0) {
      triage.create_tasks.forEach((t, idx) => {
        const taskId = `t-auto-${Date.now()}-${idx}`;
        const due = new Date();
        due.setHours(due.getHours() + (t.due_in_hours || 24));

        this.tasks.set(taskId, {
          id: taskId,
          farm_id: this.farmId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          category: 'clinical_check',
          case_id: caseId,
          animal_code: healthCase.animal_code,
          pen_name: healthCase.pen_name,
          assigned_to_name: t.assigned_role === 'veterinarian' ? 'น.สพ. ดร. ปริญญา ภักดี' : 'นางสาวกานดา มีสุข',
          assigned_to_role: t.assigned_role,
          due_at: due.toISOString(),
          status: 'pending',
        });
      });
    }

    this.cases.set(caseId, healthCase);
    return healthCase;
  }

  public addInterviewAnswer(caseId: string, question: string, answer: string): HealthCase {
    const healthCase = this.cases.get(caseId);
    if (!healthCase) {
      throw new Error(`Case not found: ${caseId}`);
    }

    if (!healthCase.interview_history) {
      healthCase.interview_history = [];
    }

    healthCase.interview_history.push({
      question,
      answer,
      timestamp: new Date().toISOString(),
    });

    this.cases.set(caseId, healthCase);
    return healthCase;
  }

  public reviewCaseByVet(
    caseId: string,
    review: {
      reviewed_by: string;
      status: 'approved' | 'modified' | 'rejected';
      clinical_notes: string;
      confirmed_diagnosis?: string;
    }
  ): HealthCase {
    const healthCase = this.cases.get(caseId);
    if (!healthCase) {
      throw new Error(`Case not found: ${caseId}`);
    }

    healthCase.vet_review = {
      reviewed_by: review.reviewed_by,
      reviewed_at: new Date().toISOString(),
      status: review.status,
      clinical_notes: review.clinical_notes,
      confirmed_diagnosis: review.confirmed_diagnosis,
    };
    healthCase.status = review.status === 'approved' ? 'in_progress' : 'vet_review';

    this.cases.set(caseId, healthCase);
    return healthCase;
  }

  public getTasks(filter?: { status?: string; role?: string }) {
    let result = Array.from(this.tasks.values());

    if (filter?.status && filter.status !== 'all') {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.role && filter.role !== 'all') {
      result = result.filter((t) => t.assigned_to_role === filter.role);
    }

    return result;
  }

  public updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed', completedBy?: string): FarmTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = status;
    if (status === 'completed') {
      task.completed_at = new Date().toISOString();
      task.completed_by = completedBy || 'พนักงานฟาร์ม';
    } else {
      task.completed_at = undefined;
      task.completed_by = undefined;
    }

    this.tasks.set(taskId, task);
    return task;
  }

  public logAIAuditEvent(event: Omit<AIAuditRecord, 'id' | 'created_at' | 'farm_id'>): AIAuditRecord {
    const record: AIAuditRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      farm_id: this.farmId,
      created_at: new Date().toISOString(),
      ...event,
    };

    this.auditEvents.unshift(record);
    if (this.auditEvents.length > 500) {
      this.auditEvents.pop();
    }

    return record;
  }
}
