import { Farm, User, Barn, Pen, Animal, HealthCase, FarmTask, TreatmentRecord, VaccinationRecord, MortalityEvent, BiosecurityLog, FarmProtocol, AITriageResponse } from '../../src/types/farm.ts';

export const INITIAL_FARM: Farm = {
  id: 'farm-01',
  name: 'นิพนธ์ฟาร์ม (พัทลุง)',
  farm_code: 'NP-PTL-08',
  location: 'ตำบลควนมะพร้าว อำเภอเมือง จังหวัดพัทลุง',
  province: 'พัทลุง',
  owner_name: 'สมชาย นิพนธ์',
  status: 'active',
  total_heads: 510,
};

export const INITIAL_USERS: User[] = [
  { id: 'u-owner', farm_id: 'farm-01', name: 'สมชาย นิพนธ์', role: 'owner', phone: '081-456-7890', email: 'owner@demo.local', avatar: '👨‍🌾' },
  { id: 'u-manager', farm_id: 'farm-01', name: 'วิทยา สุขใส', role: 'manager', phone: '089-123-4567', email: 'manager@demo.local', avatar: '👷‍♂️' },
  { id: 'u-staff', farm_id: 'farm-01', name: 'กานดา มีสุข', role: 'staff', phone: '086-789-0123', email: 'staff@demo.local', avatar: '👩‍🌾' },
  { id: 'u-vet', farm_id: 'farm-01', name: 'น.สพ. ดร. ปริญญา ภักดี', role: 'veterinarian', phone: '083-999-8877', email: 'vet@demo.local', avatar: '🩺' },
];

export const INITIAL_BARNS: Barn[] = [
  { id: 'barn-a', farm_id: 'farm-01', name: 'โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)', type: 'breeding_sow', capacity: 100, current_count: 82, temperature: 28.5, humidity: 76, status: 'normal' },
  { id: 'barn-b', farm_id: 'farm-01', name: 'โรงเรือน B (สุกรขุนรุ่น 1)', type: 'finishing', capacity: 300, current_count: 248, temperature: 29.8, humidity: 82, status: 'warning' },
  { id: 'barn-c', farm_id: 'farm-01', name: 'โรงเรือน C (สุกรอนุบาล & หย่านม)', type: 'nursery', capacity: 200, current_count: 180, temperature: 30.2, humidity: 71, status: 'normal' },
];

export const INITIAL_PENS: Pen[] = [
  { id: 'pen-a01', barn_id: 'barn-a', name: 'คอก A01 (แม่พันธุ์คลอด)', capacity: 10, current_count: 8, status: 'normal' },
  { id: 'pen-a02', barn_id: 'barn-a', name: 'คอก A02 (แม่พันธุ์คลอด)', capacity: 10, current_count: 9, status: 'normal' },
  { id: 'pen-a03', barn_id: 'barn-a', name: 'คอก A03 (แม่พันธุ์อุ้มท้อง)', capacity: 12, current_count: 12, status: 'sick_isolated' },
  { id: 'pen-a04', barn_id: 'barn-a', name: 'คอก A04 (แม่พันธุ์อุ้มท้อง)', capacity: 12, current_count: 11, status: 'normal' },
  { id: 'pen-b01', barn_id: 'barn-b', name: 'คอก B01 (สุกรขุน 60 กก.)', capacity: 25, current_count: 25, status: 'normal' },
  { id: 'pen-b02', barn_id: 'barn-b', name: 'คอก B02 (สุกรขุน 75 กก.)', capacity: 25, current_count: 24, status: 'attention' },
  { id: 'pen-b03', barn_id: 'barn-b', name: 'คอก B03 (สุกรขุน 80 กก.)', capacity: 25, current_count: 25, status: 'normal' },
  { id: 'pen-c01', barn_id: 'barn-c', name: 'คอก C01 (อนุบาล 3 สัปดาห์)', capacity: 20, current_count: 19, status: 'attention' },
  { id: 'pen-c02', barn_id: 'barn-c', name: 'คอก C02 (อนุบาล 5 สัปดาห์)', capacity: 20, current_count: 20, status: 'normal' },
];

export const INITIAL_ANIMALS: Animal[] = [
  {
    id: 'anim-128',
    farm_id: 'farm-01',
    animal_code: 'แม่สุกร M128',
    species: 'pig',
    type: 'sow',
    sex: 'female',
    breed: 'Landrace x Large White',
    birth_date: '2024-03-15',
    age_months: 30,
    weight_kg: 215,
    parity: 4,
    farrowing_date: '2026-08-10',
    barn_id: 'barn-a',
    barn_name: 'โรงเรือน A',
    pen_id: 'pen-a03',
    pen_name: 'คอก A03',
    status: 'sick',
    health_notes: 'ซึม ไม่กินอาหารเช้านี้ อุณหภูมิ 40.2°C อยู่ระหว่างกักดูอาการ',
    timeline: [
      { id: 't-1', date: '2024-03-15', type: 'birth', title: 'เกิดที่ฟาร์ม', description: 'สายพันธุ์ Landrace x Large White น้ำหนักแรกคลอด 1.4 กก.', performed_by: 'วิทยา สุขใส' },
      { id: 't-2', date: '2024-05-10', type: 'vaccination', title: 'ฉีดวัคซีน อหิวาต์สุกร (CSF)', description: 'ฉีดเข้ากล้ามเนื้อ 1 โดส', performed_by: 'กานดา มีสุข' },
      { id: 't-3', date: '2025-01-20', type: 'breeding', title: 'ผสมเทียมรอบ 1', description: 'น้ำเชื้อพ่อพันธุ์ Duroc จากศูนย์ขยายพันธุ์', performed_by: 'วิทยา สุขใส' },
      { id: 't-4', date: '2025-05-15', type: 'farrowing', title: 'คลอดลูกครอกที่ 1', description: 'ลูกสุกรเกิดมีชีวิต 12 ตัว แข็งแรงสมบูรณ์', performed_by: 'กานดา มีสุข' },
      { id: 't-5', date: '2026-08-10', type: 'farrowing', title: 'คลอดลูกครอกที่ 4', description: 'ลูกสุกรเกิด 11 ตัว ลูกสุกรแข็งแรงดี', performed_by: 'กานดา มีสุข' },
      { id: 't-6', date: '2026-09-21', type: 'health_case', title: 'แจ้งอาการป่วย #CASE-104', description: 'ไม่กินอาหาร ซึม มีไข้สูง 40.2°C', performed_by: 'กานดา มีสุข', severity: 'YELLOW' },
    ]
  },
  {
    id: 'anim-129',
    farm_id: 'farm-01',
    animal_code: 'แม่สุกร M129',
    species: 'pig',
    type: 'sow',
    sex: 'female',
    breed: 'Large White',
    birth_date: '2024-04-02',
    age_months: 29,
    weight_kg: 220,
    parity: 3,
    barn_id: 'barn-a',
    barn_name: 'โรงเรือน A',
    pen_id: 'pen-a01',
    pen_name: 'คอก A01',
    status: 'healthy',
    health_notes: 'สุขภาพแข็งแรง สมบูรณ์ดี เตรียมผสมเทียมรอบถัดไป',
    timeline: [
      { id: 't-11', date: '2024-04-02', type: 'birth', title: 'เกิดที่ฟาร์ม', description: 'สายพันธุ์ Large White แท้', performed_by: 'วิทยา สุขใส' },
      { id: 't-12', date: '2026-07-15', type: 'vaccination', title: 'ฉีดวัคซีน พาร์โวไวรัส + พิษสุนัขบ้าเทียม', description: 'กระตุ้นภูมิคุ้มกันประจำปี', performed_by: 'น.สพ. ปริญญา ภักดี' }
    ]
  },
  {
    id: 'anim-201',
    farm_id: 'farm-01',
    animal_code: 'สุกรขุน B201',
    species: 'pig',
    type: 'finisher',
    sex: 'castrated',
    breed: 'สามสาย (Duroc x Landrace/LW)',
    birth_date: '2026-05-10',
    age_months: 4,
    weight_kg: 74,
    barn_id: 'barn-b',
    barn_name: 'โรงเรือน B',
    pen_id: 'pen-b02',
    pen_name: 'คอก B02',
    status: 'monitoring',
    health_notes: 'มีอาการไอเป็นบางครั้ง หายใจเร็วเล็กน้อย อุณหภูมิ 39.4°C',
    timeline: [
      { id: 't-21', date: '2026-05-10', type: 'birth', title: 'เกิดจากแม่สุกร M102', description: 'น้ำหนักแรกคลอด 1.35 กก.', performed_by: 'กานดา มีสุข' },
      { id: 't-22', date: '2026-06-05', type: 'move', title: 'ย้ายเข้าโรงเรือน B สุกรขุน', description: 'น้ำหนักเข้าขุน 22 กก.', performed_by: 'วิทยา สุขใส' },
      { id: 't-23', date: '2026-09-20', type: 'health_case', title: 'ตรวจพบอาการไอ', description: 'พนักงานบันทึกพบอาการไอแห้ง 3 ตัวในคอก B02', performed_by: 'กานดา มีสุข', severity: 'YELLOW' }
    ]
  },
  {
    id: 'anim-301',
    farm_id: 'farm-01',
    animal_code: 'ลูกสุกรอนุบาล C301',
    species: 'pig',
    type: 'piglet',
    sex: 'female',
    breed: 'สามสาย',
    birth_date: '2026-08-25',
    age_months: 1,
    weight_kg: 8.5,
    barn_id: 'barn-c',
    barn_name: 'โรงเรือน C',
    pen_id: 'pen-c01',
    pen_name: 'คอก C01',
    status: 'monitoring',
    health_notes: 'ถ่ายเหลวสีเหลือง กินอาหารลดลงเล็กน้อย ไม่มีไข้',
    timeline: [
      { id: 't-31', date: '2026-08-25', type: 'birth', title: 'คลอดที่โรงเรือน A', description: 'น้ำหนัก 1.2 กก.', performed_by: 'กานดา มีสุข' },
      { id: 't-32', date: '2026-09-15', type: 'move', title: 'หย่านม ย้ายเข้าคอก C01', description: 'ปรับสภาพอาหารลูกสุกรระยะแรก', performed_by: 'วิทยา สุขใส' },
      { id: 't-33', date: '2026-09-21', type: 'health_case', title: 'พบอาการถ่ายเหลว', description: 'เริ่มพบอุจจาระเหลวสีเหลือง 2 ตัว', performed_by: 'กานดา มีสุข', severity: 'YELLOW' }
    ]
  },
  {
    id: 'anim-130',
    farm_id: 'farm-01',
    animal_code: 'แม่สุกร M130',
    species: 'pig',
    type: 'sow',
    sex: 'female',
    breed: 'Landrace',
    birth_date: '2024-01-10',
    age_months: 32,
    weight_kg: 228,
    parity: 5,
    barn_id: 'barn-a',
    barn_name: 'โรงเรือน A',
    pen_id: 'pen-a02',
    pen_name: 'คอก A02',
    status: 'healthy',
    health_notes: 'กินอาหารปกติ ไม่มีไข้ อัตราการให้ลูกสม่ำเสมอ',
  },
  {
    id: 'anim-202',
    farm_id: 'farm-01',
    animal_code: 'สุกรขุน B202',
    species: 'pig',
    type: 'finisher',
    sex: 'male',
    breed: 'สามสาย',
    birth_date: '2026-05-12',
    age_months: 4,
    weight_kg: 78,
    barn_id: 'barn-b',
    barn_name: 'โรงเรือน B',
    pen_id: 'pen-b01',
    pen_name: 'คอก B01',
    status: 'healthy',
    health_notes: 'การเจริญเติบโตดี อัตราแลกเนื้อ (FCR) อยู่ในเกณฑ์มาตรฐาน 2.45'
  }
];

export const INITIAL_CASES: HealthCase[] = [
  {
    id: 'case-104',
    farm_id: 'farm-01',
    case_number: '#CASE-104',
    animal_id: 'anim-128',
    animal_code: 'แม่สุกร M128',
    barn_id: 'barn-a',
    barn_name: 'โรงเรือน A',
    pen_id: 'pen-a03',
    pen_name: 'คอก A03',
    affected_count: 1,
    reported_by: 'กานดา มีสุข',
    reported_by_role: 'staff',
    reported_at: '2026-09-21T07:45:00+07:00',
    chief_complaint: 'แม่สุกร 128 ไม่กินอาหาร ซึม มีไข้สูงตั้งแต่เช้า',
    symptoms: [
      { code: 'off_feed', name_th: 'ไม่กินอาหาร', severity: 'severe', onset: '2026-09-21T06:30:00+07:00', notes: 'รางอาหารเหลือเต็ม' },
      { code: 'lethargy', name_th: 'ซึม / นอนนิ่ง', severity: 'moderate', onset: '2026-09-21T06:30:00+07:00', notes: 'ไม่ลุกเมื่อเรียก' },
      { code: 'fever', name_th: 'ไข้ / ตัวร้อน', severity: 'severe', onset: '2026-09-21T07:00:00+07:00', notes: 'วัดปรอทได้ 40.2 องศา' },
    ],
    temperature_c: 40.2,
    respiratory_rate: 34,
    feed_intake_status: 'none',
    triage_level: 'YELLOW',
    status: 'triage_completed',
    ai_triage: {
      summary: 'แม่สุกร M128 มีอาการไข้สูงเฉียบพลัน (40.2°C) ซึม และปฏิเสธอาหารเช้านี้ ควรรีบตรวจทางคลินิกเพื่อแยกโรคเต้านมอักเสบ-มดลูกอักเสบหลังคลอด (MMA) หรือการติดเชื้อในกระแสเลือด',
      triage_level: 'YELLOW',
      facts: [
        'แม่สุกร M128 อยู่คอก A03 เพิ่งคลอดลูกได้ 40 วัน',
        'อุณหภูมิร่างกาย 40.2°C (เกณฑ์ปกติสุกรผู้ใหญ่ 38.5-39.3°C ถือว่ามีไข้ชัดเจน)',
        'ไม่กินอาหารเช้าเลย และมีอาการซึมนอนนิ่ง'
      ],
      unknowns: [
        'สภาพเต้านม (แข็ง ร้อน บวม แดง หรือมีน้ำนมไหลผิดปกติหรือไม่)',
        'มีสิ่งคัดหลั่งหรือหนองไหลจากช่องคลอดหรือไม่',
        'สภาพการหายใจ (มีไอ หายใจท้องกระเพื่อม หรือมีน้ำมูกหรือไม่)',
        'อุจจาระและปัสสาวะมีลักษณะเป็นอย่างไร'
      ],
      possible_explanations: [
        'กลุ่มอาการเต้านมอักเสบ-มดลูกอักเสบ (Metritis-Mastitis Complex) ในแม่สุกร',
        'การติดเชื้อทางเดินหายใจเฉียบพลัน (Swine Influenza / Actinobacillus)',
        'ภาวะเครียดจากความร้อนสะสม (Heat Stress) ผสมการอักเสบเฉพาะที่'
      ],
      questions: [
        'ตรวจคลำเต้านมทั้งสองข้าง มีก้อนแข็ง ร้อน หรือแม่สุกรแสดงอาการเจ็บปวดหรือไม่?',
        'มีมูกหรือหนองไหลจากอวัยวะเพศหรือไม่?',
        'แม่สุกรยังลุกกินน้ำได้เองหรือไม่?'
      ],
      recommended_checks: [
        'ตรวจคลำเต้านมทุกเต้าและตรวจตรวจภายในช่องคลอดเบื้องต้น',
        'บันทึกปริมาณน้ำดื่มที่กินใน 4 ชั่วโมงนี้',
        'ตรวจเช็กแม่สุกรคอกข้างเคียง (A02, A04) ว่ามีไข้หรืออาการซึมด้วยหรือไม่'
      ],
      management_actions: [
        'แยกดูอาการเฉพาะตัวในคอก A03 อย่าให้โดนความร้อนจากแดดหรือแอมโมเนียสะสม',
        'เช็ดตัวลดไข้ด้วยน้ำสะอาดบริเวณใบหูและโคนขาหนีบ',
        'เปิดพัดลมระบายอากาศในคอกให้ถ่ายเทสะดวก'
      ],
      escalation_required: false,
      create_tasks: [
        {
          title: 'ตรวจคลำเต้านมและช่องคลอดแม่สุกร M128',
          description: 'คลำหาก้อนแข็ง ความร้อน หรือสิ่งคัดหลั่ง และวัดอุณหภูมิซ้ำเวลา 12:00 น.',
          priority: 'high',
          assigned_role: 'manager',
          due_in_hours: 4
        }
      ],
      sources: [
        { title: 'คู่มือการจัดการสุขภาพและโรคในแม่สุกร', authority: 'สำนักเทคโนโลยีชีวภัณฑ์สัตว์ กรมปศุสัตว์' },
        { title: 'Swine Health & SOW MMA Syndrome Management Guidelines', authority: 'WOAH Terrestrial Manual' }
      ],
      safety_notes: [
        'ระบบเป็นเพียงผู้ช่วยตัดสินใจคัดกรองความเร่งด่วน การสั่งใช้ยาปฏิชีวนะหรือยาลดไข้ต้องได้รับคำสั่งและอนุมัติจากสัตวแพทย์ผู้รับผิดชอบฟาร์ม'
      ],
      clinical_disclaimer: 'คำแนะนำนี้ไม่ใช่การวินิจฉัยโรคขั้นสุดท้าย กรุณาให้สัตวแพทย์หรือผู้รับผิดชอบตรวจยืนยันก่อนให้ยา'
    },
    interview_history: [
      {
        question: 'ตรวจคลำเต้านมทั้งสองข้าง มีก้อนแข็ง ร้อน หรือแม่สุกรแสดงอาการเจ็บปวดหรือไม่?',
        answer: 'เต้านมคู่ที่ 4-5 คลำดูค่อนข้างแข็งและอุ่นกว่าปกติเล็กน้อย',
        timestamp: '2026-09-21T08:05:00+07:00'
      }
    ]
  },
  {
    id: 'case-103',
    farm_id: 'farm-01',
    case_number: '#CASE-103',
    barn_id: 'barn-b',
    barn_name: 'โรงเรือน B',
    pen_id: 'pen-b02',
    pen_name: 'คอก B02',
    affected_count: 4,
    reported_by: 'วิทยา สุขใส',
    reported_by_role: 'manager',
    reported_at: '2026-09-20T14:30:00+07:00',
    chief_complaint: 'สุกรขุน 4 ตัวในคอก B02 มีอาการไอแห้งติดต่อกัน หายใจเร็วกว่าปกติ',
    symptoms: [
      { code: 'coughing', name_th: 'ไอแห้ง / หายใจมีเสียง', severity: 'moderate', onset: '2026-09-20T10:00:00+07:00' },
      { code: 'rapid_breathing', name_th: 'หายใจเร็ว / หายใจท้องกระเพื่อม', severity: 'mild', onset: '2026-09-20T12:00:00+07:00' },
    ],
    temperature_c: 39.5,
    feed_intake_status: 'reduced_slight',
    triage_level: 'YELLOW',
    status: 'in_progress',
    ai_triage: {
      summary: 'พบกลุ่มอาการทางเดินหายใจ (ไอแห้ง) ในสุกรขุนหลายตัวคอก B02 สอดคล้องกับการติดเชื้อทางเดินหายใจเบื้องต้น หรือการระคายเคืองจากก๊าซแอมโมเนียและความชื้นสะสม',
      triage_level: 'YELLOW',
      facts: ['มีสุกรไอ 4 ตัวในคอกเดียวกัน คอก B02', 'อุณหภูมิเฉลี่ย 39.4 - 39.6°C', 'กินอาหารลดลงเล็กน้อย'],
      unknowns: ['มีสุกรในคอกข้างเคียงเริ่มไอด้วยหรือไม่', 'ระดับแอมโมเนียและการระบายอากาศที่ปลายโรงเรือน'],
      possible_explanations: ['การระคายเคืองทางเดินหายใจจากสิ่งแวดล้อม', 'โรคติดเชื้อมายโคพลาสมา (Enzootic Pneumonia)', 'หวัดสุกรระยะเริ่มต้น (Swine Flu)'],
      questions: ['สุกรไอเฉพาะตอนลุกวิ่งตอนเช้า หรือไอต่อเนื่องตลอดวัน?'],
      recommended_checks: ['วัดความเร็วลมและระดับแอมโมเนียในคอก B02', 'นับจำนวนครั้งที่ไอในเวลา 10 นาที'],
      management_actions: ['ล้างทำความสะอาดร่องมูลเพื่อลดก๊าซแอมโมเนีย', 'ปรับเปิดม่านระบายอากาศรับลม'],
      escalation_required: false,
      create_tasks: [
        { title: 'ทำความสะอาดร่องระบายมูลและตรวจระบบม่านโรงเรือน B', description: 'ลดความเข้มข้นแอมโมเนียเพื่อบรรเทาอาการไอ', priority: 'medium', assigned_role: 'staff', due_in_hours: 6 }
      ],
      sources: [{ title: 'แนวทางการจัดการโรคทางเดินหายใจในสุกรขุน (PRDC)', authority: 'กรมปศุสัตว์' }],
      safety_notes: ['หากมีสุกรนอนคว่ำ อ้าปากหายใจ หรือตายเฉียบพลัน ต้องยกระดับเป็น RED ทันที'],
      clinical_disclaimer: 'ไม่ใช่การสั่งยา โปรดสังเกตอาการร่วมกับสัตวแพทย์'
    }
  },
  {
    id: 'case-102',
    farm_id: 'farm-01',
    case_number: '#CASE-102',
    barn_id: 'barn-c',
    barn_name: 'โรงเรือน C',
    pen_id: 'pen-c01',
    pen_name: 'คอก C01',
    affected_count: 2,
    reported_by: 'กานดา มีสุข',
    reported_by_role: 'staff',
    reported_at: '2026-09-19T11:00:00+07:00',
    chief_complaint: 'ลูกสุกรอนุบาล 2 ตัว มีอาการถ่ายเหลวสีเหลือง หลังหย่านมได้ 4 วัน',
    symptoms: [
      { code: 'diarrhea', name_th: 'ท้องเสีย / ถ่ายเหลว', severity: 'moderate', onset: '2026-09-19T08:00:00+07:00' },
      { code: 'lethargy', name_th: 'ซึมเล็กน้อย', severity: 'mild', onset: '2026-09-19T09:00:00+07:00' }
    ],
    temperature_c: 39.1,
    feed_intake_status: 'reduced_slight',
    triage_level: 'YELLOW',
    status: 'resolved',
    vet_review: {
      reviewed_by: 'น.สพ. ดร. ปริญญา ภักดี',
      reviewed_at: '2026-09-19T16:00:00+07:00',
      status: 'approved',
      clinical_notes: 'ท้องเสียหลังหย่านมจากความเครียดการเปลี่ยนอาหาร (Post-weaning E.coli diarrhea) สั่งเสริมเกลือแร่และโปรไบโอติกในน้ำดื่ม',
      confirmed_diagnosis: 'Post-Weaning Diarrhea (Nutritional stress)'
    }
  },
  {
    id: 'case-101',
    farm_id: 'farm-01',
    case_number: '#CASE-101',
    barn_id: 'barn-b',
    barn_name: 'โรงเรือน B',
    pen_id: 'pen-b03',
    pen_name: 'คอก B03',
    affected_count: 1,
    reported_by: 'วิทยา สุขใส',
    reported_by_role: 'manager',
    reported_at: '2026-09-18T15:20:00+07:00',
    chief_complaint: 'สุกรขุนขาหลังซ้ายกะเผลก ลุกช้า ไม่พบบาดแผลเปิด',
    symptoms: [
      { code: 'lameness', name_th: 'เดินกะเผลก / เจ็บขา', severity: 'moderate', onset: '2026-09-18T14:00:00+07:00' }
    ],
    feed_intake_status: 'normal',
    triage_level: 'GREEN',
    status: 'resolved',
    vet_review: {
      reviewed_by: 'น.สพ. ดร. ปริญญา ภักดี',
      reviewed_at: '2026-09-19T09:00:00+07:00',
      status: 'approved',
      clinical_notes: 'ข้อเท้าแพลงจากการลื่นพื้นคอนกรีต ให้พักในคอกเดี่ยว 3 วัน ฟื้นตัวเป็นปกติแล้ว'
    }
  }
];

export const INITIAL_TASKS: FarmTask[] = [
  {
    id: 'task-01',
    farm_id: 'farm-01',
    title: 'ตรวจคลำเต้านมและวัดอุณหภูมิแม่สุกร M128',
    description: 'คลำหาก้อนแข็ง ความร้อน หรือสิ่งคัดหลั่งที่คอก A03 และบันทึกอุณหภูมิซ้ำ',
    priority: 'high',
    category: 'clinical_check',
    case_id: 'case-104',
    animal_code: 'แม่สุกร M128',
    pen_name: 'คอก A03',
    assigned_to_name: 'วิทยา สุขใส',
    assigned_to_role: 'manager',
    due_at: '2026-09-21T12:00:00+07:00',
    status: 'pending'
  },
  {
    id: 'task-02',
    farm_id: 'farm-01',
    title: 'ล้างทำความสะอาดร่องมูลและปรับม่านระบายอากาศ โรงเรือน B',
    description: 'ลดระดับก๊าซแอมโมเนียเพื่อบรรเทาอาการไอของสุกรขุนคอก B02',
    priority: 'medium',
    category: 'environment',
    case_id: 'case-103',
    pen_name: 'คอก B02',
    assigned_to_name: 'กานดา มีสุข',
    assigned_to_role: 'staff',
    due_at: '2026-09-21T14:00:00+07:00',
    status: 'in_progress'
  },
  {
    id: 'task-03',
    farm_id: 'farm-01',
    title: 'ตรวจเช็กจุดพ่นหมอกระบายความร้อน โรงเรือน B และ C',
    description: 'ช่วงบ่ายอากาศร้อนชื้น ป้องกันภาวะ Heat Stress ในสุกร',
    priority: 'medium',
    category: 'environment',
    assigned_to_name: 'วิทยา สุขใส',
    assigned_to_role: 'manager',
    due_at: '2026-09-21T13:30:00+07:00',
    status: 'pending'
  },
  {
    id: 'task-04',
    farm_id: 'farm-01',
    title: 'ฉีดวัคซีนป้องกันโรคพาร์โวไวรัสและพิษสุนัขบ้าเทียม แม่พันธุ์รุ่น A',
    description: 'วัคซีนตามรอบโปรแกรมสัตวแพทย์ จำนวน 12 ตัว คอก A04',
    priority: 'high',
    category: 'vaccine',
    assigned_to_name: 'น.สพ. ดร. ปริญญา ภักดี',
    assigned_to_role: 'veterinarian',
    due_at: '2026-09-22T09:00:00+07:00',
    status: 'pending'
  },
  {
    id: 'task-05',
    farm_id: 'farm-01',
    title: 'พ่นยาฆ่าเชื้อรถส่งอาหารสัตว์ที่ซุ้มพ่นยาทางเข้าฟาร์ม',
    description: 'ปฏิบัติตามมาตรฐานระบบความปลอดภัยทางชีวภาพ (Biosecurity) เข้มงวด 100%',
    priority: 'high',
    category: 'biosecurity',
    assigned_to_name: 'กานดา มีสุข',
    assigned_to_role: 'staff',
    due_at: '2026-09-21T10:00:00+07:00',
    status: 'completed',
    completed_at: '2026-09-21T09:45:00+07:00',
    completed_by: 'กานดา มีสุข'
  }
];

export const INITIAL_TREATMENTS: TreatmentRecord[] = [
  {
    id: 'treat-01',
    case_id: 'case-102',
    animal_code: 'ลูกสุกร C301 (คอก C01)',
    pen_name: 'คอก C01',
    treatment_name: 'ผงเกลือแร่ Oral Rehydration + โพรไบโอติก',
    route: 'ผสมน้ำดื่ม',
    dosage: '1 ซองต่อน้ำ 20 ลิตร',
    frequency: 'ให้ดื่มตลอด 24 ชั่วโมง ติดต่อกัน 3 วัน',
    start_date: '2026-09-19',
    end_date: '2026-09-22',
    withdrawal_meat_days: 0,
    prescribed_by: 'น.สพ. ดร. ปริญญา ภักดี (ว.สพ. 12940)',
    administered_by: 'กานดา มีสุข',
    followup_date: '2026-09-22',
    status: 'active'
  }
];

export const INITIAL_VACCINATIONS: VaccinationRecord[] = [
  { id: 'v-1', pen_name: 'คอก A04 (แม่พันธุ์)', target_group: 'แม่สุกรทดแทน', vaccine_name: 'วัคซีนพาร์โวไวรัส + เลปโตสไปโรซิส', due_date: '2026-09-22', status: 'pending' },
  { id: 'v-2', pen_name: 'คอก C01 (อนุบาล)', target_group: 'ลูกสุกร 21 วัน', vaccine_name: 'วัคซีนป้องกันโรคเซอร์โคไวรัส (PCV2) + มายโคพลาสมา', due_date: '2026-09-23', status: 'pending' },
  { id: 'v-3', pen_name: 'คอก B01 (สุกรขุน)', target_group: 'สุกรขุน 60 วัน', vaccine_name: 'วัคซีนอหิวาต์สุกร (Classical Swine Fever)', due_date: '2026-09-15', administered_date: '2026-09-15', status: 'completed' },
];

export const INITIAL_MORTALITY: MortalityEvent[] = [
  { id: 'm-1', date: '2026-09-17', barn_name: 'โรงเรือน C', pen_name: 'คอก C03', count: 1, suspected_cause: 'ลูกสุกรแคระแกร็น ปฏิเสธการกินนม', reported_by: 'กานดา มีสุข', necropsy_done: false },
  { id: 'm-2', date: '2026-09-08', barn_name: 'โรงเรือน B', pen_name: 'คอก B04', count: 1, suspected_cause: 'ภาวะหัวใจล้มเหลวเฉียบพลันจากความร้อน (Heat Stroke)', reported_by: 'วิทยา สุขใส', necropsy_done: true },
];

export const INITIAL_BIOSECURITY: BiosecurityLog[] = [
  { id: 'bio-1', date: '2026-09-21 09:45', type: 'vehicle_disinfection', location: 'ซุ้มพ่นยาประตูหน้าฟาร์ม', status: 'passed', notes: 'รถบรรทุกหัวอาหาร CPF พ่นน้ำยา Glutaraldehyde ครบ 15 นาทีก่อนเข้าลานขนถ่าย', checked_by: 'กานดา มีสุข' },
  { id: 'bio-2', date: '2026-09-20 16:00', type: 'perimeter_check', location: 'แนวรั้วทิศตะวันออก ติดสวนยางพารา', status: 'passed', notes: 'แนวรั้วกั้นสัตว์ภายนอกสมบูรณ์ ไม่พบร่องรอยสัตว์เลื้อยคลานหรือสุนัขจรจัด', checked_by: 'วิทยา สุขใส' },
  { id: 'bio-3', date: '2026-09-19 08:30', type: 'visitor_quarantine', location: 'ห้องเปลี่ยนรองเท้าบูทและจุ่มเท้า', status: 'warning', notes: 'น้ำยาฆ่าเชื้อในอ่างจุ่มเท้าเริ่มเจือจาง ได้ถ่ายและผสมน้ำยาใหม่ทันที', checked_by: 'วิทยา สุขใส' },
];

export const INITIAL_PROTOCOLS: FarmProtocol[] = [
  {
    id: 'prot-01',
    code: 'SOP-BIO-001',
    title: 'มาตรการป้องกันและเฝ้าระวังโรคอหิวาต์แอฟริกาในสุกร (ASF Defense)',
    category: 'biosecurity',
    effective_date: '2026-01-01',
    version: '3.2 (Approved)',
    approved_by_vet: 'น.สพ. ดร. ปริญญา ภักดี',
    summary: 'ข้อกำหนดความปลอดภัยทางชีวภาพขั้นสูงสุด ห้ามนำเนื้อหมูแปรรูปเข้าฟาร์ม พ่นยาฆ่าเชื้อยานพาหนะทุกคัน และกักตัวบุคคลภายนอก',
    steps: [
      '1. ยานพาหนะทุกคันต้องหยุดพ่นยาฆ่าเชื้อนานอย่างน้อย 15 นาที',
      '2. พนักงานทุกคนต้องเปลี่ยนเสื้อผ้า อาบน้ำ และเปลี่ยนรองเท้าบูทของฟาร์มก่อนเข้าโรงเรือน',
      '3. ห้ามนำเศษอาหารหรือผลิตภัณฑ์จากเนื้อสุกรภายนอกเข้าสู่ฟาร์มโดยเด็ดขาด',
      '4. สังเกตสุกรทุกวัน หากพบมีไข้สูง ผิวหนังแดงคล้ำ เลือดออกทางจมูกหรือทวาร หรือตายกะทันหัน ให้แจ้งสัตวแพทย์และกักกันทันที'
    ],
    reference_source: 'WOAH Terrestrial Animal Health Code Chapter 15.1 & กรมปศุสัตว์'
  },
  {
    id: 'prot-02',
    code: 'SOP-CLIN-002',
    title: 'แนวทางปฏิบัติเมื่อพบแม่สุกรไม่กินอาหารและมีไข้ (Sow Anorexia Protocol)',
    category: 'farrowing',
    effective_date: '2026-03-15',
    version: '2.0 (Approved)',
    approved_by_vet: 'น.สพ. ดร. ปริญญา ภักดี',
    summary: 'ขั้นตอนการคัดกรองเบื้องต้นสำหรับพนักงานฟาร์มเมื่อพบแม่สุกรซึมและปฏิเสธอาหาร',
    steps: [
      '1. วัดอุณหภูมิทางทวารหนักทันที หากเกิน 39.5°C ให้บันทึกลงระบบว่ามีไข้',
      '2. ตรวจคลำเต้านมทุกคู่ ตรวจดูรอยช้ำ ก้อนแข็ง หรือความร้อน',
      '3. ตรวจช่องคลอดว่ามีน้ำคาวปลาสีผิดปกติหรือกลิ่นเหม็นหรือไม่',
      '4. บันทึกเคสลงในระบบ AI สัตวแพทย์ประจำฟาร์มทันที ห้ามฉีดยาปฏิชีวนะเองโดยไม่ได้รับคำสั่ง'
    ],
    reference_source: 'นิพนธ์ฟาร์ม Clinical Guidelines 2026'
  },
  {
    id: 'prot-03',
    code: 'SOP-ENV-003',
    title: 'การจัดการความเครียดจากความร้อนในสภาพภูมิอากาศภาคใต้ (Heat Stress Management)',
    category: 'respiratory',
    effective_date: '2026-04-01',
    version: '1.5 (Approved)',
    approved_by_vet: 'น.สพ. ดร. ปริญญา ภักดี',
    summary: 'การควบคุมอุณหภูมิและความชื้นในจังหวัดพัทลุงที่มีฝนชุกและแดดจัดสลับกัน',
    steps: [
      '1. เมื่ออุณหภูมิในโรงเรือนเกิน 30°C ให้เปิดระบบพ่นหมอกหลังคาและพัดลมระบายอากาศ',
      '2. ตรวจระดับน้ำดื่มในจุกให้น้ำ ต้องมีอัตราการไหลไม่ต่ำกว่า 1.5-2.0 ลิตรต่อนาที',
      '3. เสริมวิตามินซีและสารอิเล็กโทรไลต์ในน้ำดื่มช่วงเวลา 11:00 - 15:00 น.'
    ],
    reference_source: 'สำนักงานปศุสัตว์จังหวัดพัทลุง & FAO Pig Husbandry in Tropics'
  }
];

// In-memory runtime state
class FarmStore {
  farm: Farm = INITIAL_FARM;
  users: User[] = [...INITIAL_USERS];
  barns: Barn[] = [...INITIAL_BARNS];
  pens: Pen[] = [...INITIAL_PENS];
  animals: Animal[] = [...INITIAL_ANIMALS];
  cases: HealthCase[] = [...INITIAL_CASES];
  tasks: FarmTask[] = [...INITIAL_TASKS];
  treatments: TreatmentRecord[] = [...INITIAL_TREATMENTS];
  vaccinations: VaccinationRecord[] = [...INITIAL_VACCINATIONS];
  mortality: MortalityEvent[] = [...INITIAL_MORTALITY];
  biosecurity: BiosecurityLog[] = [...INITIAL_BIOSECURITY];
  protocols: FarmProtocol[] = [...INITIAL_PROTOCOLS];

  // Helper getters
  getSummary() {
    const sickCount = this.animals.filter(a => a.status === 'sick' || a.status === 'isolated').length;
    const monitoringCount = this.animals.filter(a => a.status === 'monitoring').length;
    const urgentCasesCount = this.cases.filter(c => c.triage_level === 'RED' && c.status !== 'resolved').length;
    const openCasesCount = this.cases.filter(c => c.status !== 'resolved').length;
    const pendingTasksCount = this.tasks.filter(t => t.status !== 'completed').length;
    const todayMortalityCount = this.mortality.filter(m => m.date.startsWith('2026-09-21')).reduce((sum, m) => sum + m.count, 0);

    return {
      farm: this.farm,
      total_animals: this.farm.total_heads,
      sick_animals: sickCount,
      monitoring_animals: monitoringCount,
      urgent_cases: urgentCasesCount,
      open_cases: openCasesCount,
      pending_tasks: pendingTasksCount,
      today_mortality: todayMortalityCount,
      health_trend: 'Attention Needed (โรงเรือน A มีเคสเฝ้าระวัง 1 รายการ)',
      health_score_pct: 88,
      weather: {
        location: 'พัทลุง',
        temp_c: 30.5,
        humidity_pct: 78,
        condition: 'มีเมฆเป็นส่วนมาก อากาศร้อนชื้น ลมตะวันออกเฉียงใต้',
        heat_index: 'Warning (เฝ้าระวัง Heat Stress)'
      }
    };
  }

  createCase(data: Partial<HealthCase>): HealthCase {
    const caseNum = `#CASE-${105 + this.cases.length - 4}`;
    const newCase: HealthCase = {
      id: `case-${Date.now()}`,
      farm_id: this.farm.id,
      case_number: caseNum,
      animal_id: data.animal_id,
      animal_code: data.animal_code || 'ไม่ระบุเบอร์',
      barn_id: data.barn_id || 'barn-a',
      barn_name: data.barn_name || 'โรงเรือน A',
      pen_id: data.pen_id || 'pen-a01',
      pen_name: data.pen_name || 'คอก A01',
      affected_count: data.affected_count || 1,
      reported_by: data.reported_by || 'กานดา มีสุข',
      reported_by_role: data.reported_by_role || 'staff',
      reported_at: new Date().toISOString(),
      chief_complaint: data.chief_complaint || 'พบสัตว์แสดงอาการผิดปกติ',
      symptoms: data.symptoms || [],
      temperature_c: data.temperature_c,
      respiratory_rate: data.respiratory_rate,
      feed_intake_status: data.feed_intake_status || 'reduced_slight',
      photos: data.photos || [],
      triage_level: data.triage_level || 'YELLOW',
      status: 'open',
      ai_triage: data.ai_triage
    };

    this.cases.unshift(newCase);

    // Update animal status if matched
    if (data.animal_id) {
      const anim = this.animals.find(a => a.id === data.animal_id);
      if (anim) {
        anim.status = newCase.triage_level === 'RED' ? 'isolated' : 'sick';
        if (!anim.timeline) anim.timeline = [];
        anim.timeline.push({
          id: `t-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'health_case',
          title: `แจ้งอาการป่วย ${newCase.case_number}`,
          description: newCase.chief_complaint,
          performed_by: newCase.reported_by,
          severity: newCase.triage_level
        });
      }
    }

    return newCase;
  }

  updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed', completedBy?: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'completed') {
        task.completed_at = new Date().toISOString();
        task.completed_by = completedBy || 'ผู้ใช้ปัจจุบัน';
      }
    }
    return task;
  }
}

export const farmStore = new FarmStore();
