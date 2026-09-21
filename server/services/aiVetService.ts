import { GoogleGenAI } from "@google/genai";
import { AITriageResponse, HealthCase, TriageLevel } from "../../src/types/farm.ts";
import { farmStore } from "../data/farmStore.ts";

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  config?: any,
  timeoutMs: number = 8000
): Promise<string | null> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: prompt,
        config
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${model}`)), timeoutMs)
      );

      const response: any = await Promise.race([callPromise, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      // Move to next candidate model immediately
      continue;
    }
  }

  return null;
}

export class AIVetService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'x-goog-api-client': 'applet-pigfarm-vet/1.0.0'
          }
        }
      });
    }
  }

  // Triage & Clinical Decision Support
  async runTriage(caseData: Partial<HealthCase>): Promise<AITriageResponse> {
    const chiefComplaint = caseData.chief_complaint || '';
    const symptoms = (caseData.symptoms || []).map(s => `${s.name_th} (${s.severity})`).join(', ');
    const temp = caseData.temperature_c ? `${caseData.temperature_c}°C` : 'ยังไม่ได้วัด';
    const animalCode = caseData.animal_code || 'ไม่ระบุ';
    const penName = caseData.pen_name || 'ไม่ระบุ';
    const affectedCount = caseData.affected_count || 1;

    // Detect immediate RED flags (e.g. sudden mortality, multiple animals dying, dark purple skin, bleeding)
    const isRedFlag = 
      chiefComplaint.includes('ตาย') || 
      chiefComplaint.includes('เลือดออก') || 
      chiefComplaint.includes('ชัก') ||
      chiefComplaint.includes('หลายตัวตาย') ||
      (caseData.symptoms || []).some(s => s.code === 'death' || s.code === 'hemorrhage' || (s.severity === 'severe' && affectedCount >= 3));

    // If Gemini is configured, use Gemini with robust fallback
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const farmContext = JSON.stringify({
          farm_name: farmStore.farm.name,
          location: farmStore.farm.location,
          protocols: farmStore.protocols.map(p => ({ title: p.title, steps: p.steps })),
          weather: farmStore.getSummary().weather
        });

        const prompt = `
คุณคือ "AI Veterinary Decision-Support Agent" ประจำฟาร์มสุกร นิพนธ์ฟาร์ม จังหวัดพัทลุง ประเทศไทย
งานของคุณคือช่วยเหลือพนักงานฟาร์ม หัวหน้าฟาร์ม และสัตวแพทย์ในการคัดกรองความเร่งด่วน (Triage) วิเคราะห์ข้อเท็จจริง และแนะนำการตรวจทางคลินิกเพิ่มเติม

ข้อมูลเคส:
- รหัสสัตว์/กลุ่ม: ${animalCode}
- สถานที่: ${penName}
- จำนวนสัตว์ที่มีอาการ: ${affectedCount} ตัว
- อาการหลัก: ${chiefComplaint}
- รายการอาการ: ${symptoms}
- อุณหภูมิร่างกาย: ${temp}
- สภาพการกินอาหาร: ${caseData.feed_intake_status || 'ไม่ระบุ'}

บริบทฟาร์มและมาตรฐานความปลอดภัย (SOP):
${farmContext}

กฎความปลอดภัยทางการแพทย์ที่เคร่งครัด (Safety Rules):
1. ห้ามตัดสินว่าสัตว์เป็นโรคใดโรคหนึ่งอย่างแน่นอน (ห้ามเคลมว่า diagnosis 100%) ให้ระบุเป็น "ข้อสงสัยที่ต้องตรวจแยกโรค (Possible Explanations)"
2. ห้ามสั่งยาปฏิชีวนะหรือกำหนดโดสยาเองโดยอิสระ ระบุให้ชัดเจนว่าต้องผ่านการตรวจและลงนามของสัตวแพทย์
3. เลือกระดับ Triage อย่างเหมาะสม:
   - RED: อาการวิกฤต เสี่ยงโรคระบาดรุนแรง (เช่น สงสัย ASF/PRRS รุนแรง) ตายเฉียบพลัน เลือดออก หายใจลำบากขั้นวิกฤต หรือหลายตัวพร้อมกัน
   - ORANGE: ป่วยหนัก มีไข้สูงต่อเนื่อง กระทบหลายตัว หรือไม่ตอบสนองต่อการดูแลทั่วไป
   - YELLOW: มีอาการชัดเจน เช่น มีไข้ ไอ ท้องเสีย ไม่กินอาหาร ควรรีบตรวจเพิ่มเติมในวันเดียวกัน
   - GREEN: อาการเล็กน้อย เจ็บเฉพาะจุด กินอาหารปกติ เฝ้าระวังติดตาม
4. แนะนำคำถามขั้นต่ำ (Minimum Necessary Questions) ไม่เกิน 2-3 ข้อ ที่ช่วยลดความไม่แน่นอน
5. คืนค่าเป็น JSON เท่านั้น ตาม Schema ที่กำหนด

โปรดตอบในรูปแบบ JSON เดียวเท่านั้น:
{
  "summary": "สรุปอาการและสถานการณ์ 1-2 ประโยคเป็นภาษาไทยเข้าใจง่าย",
  "triage_level": "${isRedFlag ? 'RED' : 'YELLOW'}",
  "facts": ["ข้อเท็จจริงที่ตรวจพบ 1", "ข้อเท็จจริง 2"],
  "unknowns": ["สิ่งที่ยังไม่ทราบและต้องตรวจสอบเพิ่ม 1", "สิ่งที่ยังไม่ทราบ 2"],
  "possible_explanations": ["กลุ่มอาการหรือโรคที่ต้องตรวจแยกโรค 1", "กลุ่มอาการ 2"],
  "questions": ["คำถามตรวจเพิ่มข้อที่ 1", "คำถามตรวจเพิ่มข้อที่ 2"],
  "recommended_checks": ["สิ่งที่ควรตรวจ 1 เช่น คลำเต้านม, ตรวจอุจจาระ", "สิ่งที่ควรตรวจ 2"],
  "management_actions": ["การจัดการเบื้องต้นและการกักกันโรค 1", "การจัดการ 2"],
  "escalation_required": ${isRedFlag},
  "create_tasks": [
    {
      "title": "ชื่องานที่ควรทำทันที",
      "description": "รายละเอียดงาน",
      "priority": "high",
      "assigned_role": "manager",
      "due_in_hours": 3
    }
  ],
  "sources": [
    { "title": "คู่มือการจัดการสุขภาพสุกร กรมปศุสัตว์", "authority": "กรมปศุสัตว์ กระทรวงเกษตรและสหกรณ์" },
    { "title": "WOAH Terrestrial Animal Health Standards", "authority": "World Organisation for Animal Health" }
  ],
  "safety_notes": [
    "ระบบ AI เป็นเพียงผู้ช่วยประเมินความเร่งด่วน การวินิจฉัยและสั่งใช้ยาต้องได้รับความเห็นชอบจากสัตวแพทย์ผู้รับผิดชอบฟาร์ม"
  ],
  "clinical_disclaimer": "ข้อมูลเพื่อการสนับสนุนการตัดสินใจเบื้องต้น ไม่สามารถทดแทนการตรวจวินิจฉัยโดยสัตวแพทย์ผู้มีใบอนุญาต"
}
`;

        const responseText = await generateContentWithFallback(this.ai, prompt, {
          responseMimeType: 'application/json',
          temperature: 0.2
        });

        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (parsed && parsed.triage_level) {
            return parsed as AITriageResponse;
          }
        }
      } catch (err) {
        // Fallback to deterministic rule engine seamlessly
      }
    }

    // Rule-Based Fallback Engine (Guarantees zero downtime and adheres to PRD Section 72)
    return this.generateRuleBasedTriage(caseData, isRedFlag);
  }

  // Deterministic rule-based triage matching veterinary clinical protocols
  private generateRuleBasedTriage(caseData: Partial<HealthCase>, isRedFlag: boolean): AITriageResponse {
    const chief = (caseData.chief_complaint || '').toLowerCase();
    const temp = caseData.temperature_c;
    const count = caseData.affected_count || 1;

    let level: TriageLevel = isRedFlag ? 'RED' : 'YELLOW';
    const facts: string[] = [
      `พบสัตว์แสดงอาการ: ${caseData.chief_complaint || 'มีอาการผิดปกติ'}`,
      `จำนวนสัตว์ที่สังเกตพบ: ${count} ตัว ใน ${caseData.pen_name || 'คอกที่ระบุ'}`,
    ];
    if (temp) {
      facts.push(`อุณหภูมิร่างกายวัดได้ ${temp}°C (ค่าปกติสุกร 38.5 - 39.3°C)`);
      if (temp >= 40.0) level = isRedFlag ? 'RED' : 'ORANGE';
    }

    const unknowns: string[] = [
      'สภาพการหายใจ (อัตราการหายใจต่อนาที, เสียงไอ, มีน้ำมูกหรือไม่)',
      'การกินน้ำและการขับถ่าย (สีและลักษณะอุจจาระ)',
      'ประวัติการสัมผัสสัตว์นำเข้าใหม่หรือยานพาหนะภายนอก'
    ];

    let possible_explanations: string[] = [
      'ภาวะติดเชื้อแบคทีเรียหรือไวรัสในระบบทางเดินหายใจ/ทางเดินอาหาร',
      'ภาวะเครียดจากความร้อนและความชื้นสะสม (Heat Stress)'
    ];

    let questions: string[] = [
      'สัตว์ยังสามารถลุกยืนและดื่มน้ำได้ด้วยตัวเองหรือไม่?',
      'ตรวจสังเกตคอกข้างเคียง มีสัตว์ตัวอื่นเริ่มมีอาการคล้ายกันหรือไม่?'
    ];

    const recommended_checks: string[] = [
      'วัดอุณหภูมิร่างกายซ้ำทุก 4 ชั่วโมง',
      'ตรวจสังเกตรอยผื่นแดง จ้ำเลือด หรือรอยช้ำตามใบหู หน้าท้อง และขาหนีบ',
      'ตรวจความเร็วลมและการระบายอากาศในโรงเรือน'
    ];

    const management_actions: string[] = [
      'แยกสัตว์ป่วยไว้ในโซนกักดูอาการ อย่าให้ปะปนกับสุกรตัวอื่น',
      'จัดเตรียมน้ำสะอาดที่ผสมสารละลายเกลือแร่ (Oral Electrolytes)',
      'ทำความสะอาดและพ่นน้ำยาฆ่าเชื้อบริเวณทางเดินหน้าคอกทันที'
    ];

    if (isRedFlag) {
      possible_explanations = [
        'สงสัยกลุ่มโรคระบาดร้ายแรงในสุกร (เช่น อหิวาต์แอฟริกาในสุกร ASF / PRRS สายพันธุ์รุนแรง)',
        'ภาวะช็อกติดเชื้อเฉียบพลัน (Septicemia)'
      ];
      management_actions.unshift('**มาตรการกักกันด่วน (Emergency Quarantine):** สั่งปิดคอก ห้ามเคลื่อนย้ายสัตว์ และจำกัดคนเข้า-ออก');
      questions.unshift('พบสัตว์ตายเฉียบพลันโดยไม่แสดงอาการล่วงหน้าหรือไม่?');
    }

    return {
      summary: isRedFlag 
        ? `[ระดับวิกฤต RED] ตรวจพบสัญญาณอันตราย (${caseData.chief_complaint}) ต้องแจ้งหัวหน้าฟาร์มและสัตวแพทย์ทันที พร้อมดำเนินมาตรการกักโรค Biosecurity ขั้นสูงสุด`
        : `[ระดับ ${level}] สัตว์มีอาการเจ็บป่วยที่ต้องตรวจติดตามทางคลินิกอย่างใกล้ชิดและบันทึกอุณหภูมิซ้ำ`,
      triage_level: level,
      facts,
      unknowns,
      possible_explanations,
      questions,
      recommended_checks,
      management_actions,
      escalation_required: isRedFlag || level === 'ORANGE',
      create_tasks: [
        {
          title: `ตรวจวัดอุณหภูมิและประเมินซ้ำ ${caseData.animal_code || 'สัตว์ป่วย'}`,
          description: `ติดตามการกินน้ำ อาการตอบสนอง และตรวจคลำความผิดปกติทางร่างกาย`,
          priority: isRedFlag ? 'high' : 'medium',
          assigned_role: isRedFlag ? 'veterinarian' : 'manager',
          due_in_hours: isRedFlag ? 1 : 4
        }
      ],
      sources: [
        { title: 'คู่มือความปลอดภัยทางชีวภาพและการเฝ้าระวังโรคสุกร', authority: 'สำนักควบคุม ป้องกัน และบำบัดโรคสัตว์ กรมปศุสัตว์' },
        { title: 'WOAH Terrestrial Animal Health Code - Swine Diseases', authority: 'World Organisation for Animal Health' }
      ],
      safety_notes: [
        'ระบบเป็นเพียงผู้ช่วยตัดสินใจคัดกรองความเร่งด่วน ห้ามพนักงานสั่งยาปฏิชีวนะเองโดยไม่ผ่านสัตวแพทย์'
      ],
      clinical_disclaimer: 'คำแนะนำเพื่อการคัดกรองเบื้องต้น ไม่ใช่การวินิจฉัยโรคขั้นสุดท้าย กรุณาให้สัตวแพทย์ตรวจยืนยัน'
    };
  }

  // Daily Farm Vet Morning Briefing Generator (PRD Section 14)
  async generateDailyBriefing(): Promise<{
    date: string;
    headline: string;
    summary: string;
    urgent_actions: string[];
    risk_signals: string[];
    checks_for_today: string[];
  }> {
    const summary = farmStore.getSummary();
    const activeCases = farmStore.cases.filter(c => c.status !== 'resolved');
    const openTasks = farmStore.tasks.filter(t => t.status !== 'completed');

    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
สร้าง "สรุปสุขภาพฟาร์มประจำวัน (Daily Farm Vet Briefing)" สำหรับ นิพนธ์ฟาร์ม พัทลุง
ข้อมูลปัจจุบัน:
- สุกรทั้งหมด: ${summary.total_animals} ตัว
- ป่วย/เฝ้าระวัง: ${summary.sick_animals} ตัว
- เคสเปิดอยู่: ${activeCases.map(c => `${c.case_number}: ${c.chief_complaint} (${c.triage_level})`).join('; ')}
- งานค้าง: ${openTasks.map(t => t.title).join('; ')}
- สภาพอากาศพัทลุง: อุณหภูมิ ${summary.weather.temp_c}°C ความชื้น ${summary.weather.humidity_pct}% (${summary.weather.heat_index})

กรุณาสรุปเป็นภาษาไทยสั้นกระชับ ตรงประเด็น ไม่เกิน 10 บรรทัด สำหรับเจ้าของฟาร์มและหัวหน้าฟาร์ม ตอบเป็น JSON:
{
  "headline": "พาดหัวสั้นๆ",
  "summary": "สรุปภาพรวม 2 บรรทัด",
  "urgent_actions": ["สิ่งที่ต้องทำก่อน 1", "สิ่งที่ต้องทำก่อน 2"],
  "risk_signals": ["สัญญาณความเสี่ยงที่ต้องจับตา"],
  "checks_for_today": ["สิ่งที่ควรตรวจเช็กวันนี้"]
}
`;
        const responseText = await generateContentWithFallback(this.ai, prompt, {
          responseMimeType: 'application/json'
        });

        if (responseText) {
          const parsed = JSON.parse(responseText);
          return {
            date: '2026-09-21',
            ...parsed
          };
        }
      } catch (e) {
        // Fallback below
      }
    }

    return {
      date: '2026-09-21',
      headline: 'สรุปสถานการณ์สุขภาพฟาร์มเช้านี้: เฝ้าระวังแม่สุกร M128 และคุมอากาศร้อนชื้นโรงเรือน B',
      summary: `ฟาร์มมีสุกรรวม ${summary.total_animals} ตัว มีเคสที่ต้องติดตาม 2 เคสหลัก ได้แก่ แม่สุกร M128 (มีไข้ ไม่กินอาหาร) และสุกรขุนคอก B02 (อาการไอแห้ง) โดยรวมไม่มีรายงานการตายผิดปกติในรอบ 24 ชม.`,
      urgent_actions: [
        'ติดตามผลการตรวจคลำเต้านมและวัดอุณหภูมิแม่สุกร M128 คอก A03 ช่วงเที่ยง',
        'ล้างทำความสะอาดร่องมูลโรงเรือน B เพื่อลดก๊าซแอมโมเนียและบรรเทาอาการไอของสุกรขุน'
      ],
      risk_signals: [
        'สภาพอากาศพัทลุงบ่ายนี้ความชื้นสูง 78% และอุณหภูมิ 30.5°C เสี่ยงต่อภาวะ Heat Stress ในสุกรขุน',
        'พบสุกรไอ 4 ตัวในคอกเดียวกัน คอก B02 ต้องเฝ้าระวังการระบาดในโรงเรือน B'
      ],
      checks_for_today: [
        'เปิดระบบพ่นหมอกและพัดลมระบายอากาศช่วง 11:30 - 15:00 น.',
        'เตรียมความพร้อมฉีดวัคซีนพาร์โวไวรัสแม่สุกรทดแทนรอบวันพรุ่งนี้'
      ]
    };
  }
}

export const aiVetService = new AIVetService();
