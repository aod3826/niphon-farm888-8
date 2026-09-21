import { GoogleGenAI } from '@google/genai';
import { AITriageResponse, HealthCase, TriageLevel } from '../../src/types/farm';
import { AITriageOutputZodSchema, AITriageOutput } from '../../src/schemas/triageOutputSchema';
import { SafetyGatekeeper } from '../lib/safetyGatekeeper';
import { FarmTools } from '../lib/tools/farmTools';
import { AuditRepository } from '../lib/db/repositories/auditRepository';

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

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
        config,
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${model}`)), timeoutMs)
      );

      const response: any = await Promise.race([callPromise, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export class AIVetService {
  private ai: GoogleGenAI | null = null;
  private auditRepo = new AuditRepository();

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'x-goog-api-client': 'applet-niphon-farm/2.0.0',
          },
        },
      });
    }
  }

  // Triage & Clinical Decision Support (PRD Section 9, 46-48, 72)
  async runTriage(caseData: Partial<HealthCase>): Promise<AITriageResponse> {
    const startTime = Date.now();
    const chiefComplaint = caseData.chief_complaint || '';
    const symptoms = (caseData.symptoms || []).map((s) => `${s.name_th} (${s.severity})`).join(', ');
    const temp = caseData.temperature_c ? `${caseData.temperature_c}°C` : 'ยังไม่ได้วัด';
    const animalCode = caseData.animal_code || 'ไม่ระบุ';
    const penName = caseData.pen_name || 'ไม่ระบุ';
    const affectedCount = caseData.affected_count || 1;

    // Red Flag Alert Check (Sudden mortality, systemic hemorrhage, convulsions)
    const isRedFlag =
      chiefComplaint.includes('ตาย') ||
      chiefComplaint.includes('เลือดออก') ||
      chiefComplaint.includes('ชัก') ||
      chiefComplaint.includes('หลายตัวตาย') ||
      (caseData.symptoms || []).some(
        (s) => s.code === 'death' || s.code === 'hemorrhage' || (s.severity === 'severe' && affectedCount >= 3)
      );

    // 1. Tool Grounding: Retrieve history and protocols
    let animalProfileText = 'ไม่พบประวัติเฉพาะตัว';
    if (caseData.animal_code) {
      const history = await FarmTools.getAnimalHistory(caseData.animal_code);
      if (history.found && history.animal) {
        animalProfileText = JSON.stringify(history.animal);
      }
    }

    const protocols = await FarmTools.searchApprovedProtocols(chiefComplaint || 'สุกร');

    // 2. Call Gemini if available
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
คุณคือ "AI Veterinary Decision-Support Agent" ประจำฟาร์มสุกร นิพนธ์ฟาร์ม จังหวัดพัทลุง ประเทศไทย
งานของคุณคือช่วยเหลือพนักงานฟาร์ม หัวหน้าฟาร์ม และสัตวแพทย์ในการคัดกรองความเร่งด่วน (Triage) วิเคราะห์ข้อเท็จจริง และแนะนำการตรวจทางคลินิกเพิ่มเติม

ข้อมูลเคสทางคลินิก:
- รหัสสัตว์/กลุ่ม: ${animalCode}
- ประวัติสัตว์ที่บันทึกไว้: ${animalProfileText}
- สถานที่: ${penName}
- จำนวนสัตว์ที่มีอาการ: ${affectedCount} ตัว
- อาการหลักที่รายงาน: ${chiefComplaint}
- รายการอาการ: ${symptoms}
- อุณหภูมิร่างกาย: ${temp}
- สภาพการกินอาหาร: ${caseData.feed_intake_status || 'ไม่ระบุ'}

แนวปฏิบัติมาตรฐาน SOP และหลักเกณฑ์ของฟาร์ม (Authoritative Knowledge):
${JSON.stringify(protocols)}

กฎความปลอดภัยทางการสัตวแพทย์ที่เคร่งครัด (Veterinary Safety Rules - PRD Sections 23, 75, 83):
1. **ห้ามตัดสินยืนยันว่าเป็นโรคใดโรคหนึ่ง 100% โดยเด็ดขาด** ให้ระบุเป็น "ข้อสงสัยที่ต้องตรวจแยกโรค (possible_explanations)"
2. **ห้ามสั่งจ่ายยาต้านจุลชีพ/ยาปฏิชีวนะ หรือกำหนดโดสยาเองโดยเด็ดขาด** ต้องระบุให้ชัดเจนว่าต้องได้รับการตรวจวินิจฉัยและสั่งจ่ายโดยสัตวแพทย์ผู้ควบคุมฟาร์มเท่านั้น
3. กำหนดระดับ Triage ให้ถูกต้อง:
   - RED: อาการวิกฤต เสี่ยงโรคระบาดรุนแรง (เช่น สงสัย ASF/CSF/PRRS รุนแรง) ตายเฉียบพลัน เลือดออก หายใจลำบากขั้นวิกฤต หรือหลายตัวพร้อมกัน
   - ORANGE: ป่วยหนัก มีไข้สูง (>40°C) ต่อเนื่อง กระทบหลายตัว หรือไม่ตอบสนองต่อการดูแลทั่วไป
   - YELLOW: มีอาการชัดเจน เช่น มีไข้ ไอ ท้องเสีย ไม่กินอาหาร ควรรีบตรวจเพิ่มเติมในวันเดียวกัน
   - GREEN: อาการเล็กน้อย เจ็บเฉพาะจุด กินอาหารปกติ เฝ้าระวังติดตาม
4. แนะนำคำถามขั้นต่ำ (Minimum Necessary Questions) ไม่เกิน 2-3 ข้อ ที่ช่วยลดความไม่แน่นอน
5. แยกแยะ: facts (ข้อเท็จจริง), unknowns (สิ่งที่ยังไม่ทราบ), possible_explanations (ข้อสันนิษฐาน), recommended_checks (การตรวจที่แนะนำ), management_actions (การจัดการเบื้องต้น)

ตอบในรูปแบบ JSON Schema ที่ถูกต้องเท่านั้น:
{
  "summary": "สรุปสถานการณ์และอาการ 1-2 ประโยคเป็นภาษาไทยกระชับ เข้าใจง่าย",
  "triage_level": "${isRedFlag ? 'RED' : 'YELLOW'}",
  "facts": ["ข้อเท็จจริง 1", "ข้อเท็จจริง 2"],
  "unknowns": ["สิ่งที่ยังไม่ทราบและต้องตรวจเพิ่ม 1", "สิ่งที่ยังไม่ทราบ 2"],
  "possible_explanations": ["ข้อสงสัยทางคลินิก 1", "ข้อสงสัย 2"],
  "questions": ["คำถามตรวจเพิ่มข้อที่ 1", "คำถามตรวจเพิ่มข้อที่ 2"],
  "recommended_checks": ["สิ่งที่ควรตรวจ 1 เช่น วัดอุณหภูมิซ้ำ", "สิ่งที่ควรตรวจ 2"],
  "management_actions": ["การจัดการเบื้องต้นและการกักกันโรค 1", "การจัดการ 2"],
  "escalation_required": ${isRedFlag},
  "create_tasks": [
    {
      "title": "ชื่องานที่ต้องปฏิบัติ",
      "description": "รายละเอียดการทำงาน",
      "priority": "${isRedFlag ? 'high' : 'medium'}",
      "assigned_role": "staff",
      "due_in_hours": 3
    }
  ],
  "sources": [
    { "title": "คู่มือการจัดการสุขภาพสุกรและมาตรฐานความปลอดภัยทางชีวภาพ", "authority": "กรมปศุสัตว์ / WOAH" }
  ],
  "safety_notes": ["คำเตือนความปลอดภัยทางสัตวแพทย์"],
  "clinical_disclaimer": "ระบบสนับสนุนการตัดสินใจเบื้องต้น ไม่สามารถทดแทนการตรวจวินิจฉัยโดยสัตวแพทย์ผู้มีใบอนุญาต"
}
`;

        const responseText = await generateContentWithFallback(this.ai, prompt, {
          responseMimeType: 'application/json',
          temperature: 0.2,
        });

        if (responseText) {
          const parsed = JSON.parse(responseText);
          // Validate using Zod schema
          const validationResult = AITriageOutputZodSchema.safeParse(parsed);
          if (validationResult.success) {
            // Apply Safety Gatekeeper to block any unauthorized drugs/certainty
            const safetyCheck = SafetyGatekeeper.inspectAndSanitize(validationResult.data);

            // Log AI Audit Event (PRD Section 43 & 59)
            await this.auditRepo.logAIAuditEvent({
              case_id: caseData.id,
              agent_name: 'TriageAgent',
              model_name: 'gemini-3.8-flash',
              prompt_version: 'v2.0.0-grounded',
              input_payload: { animalCode, penName, chiefComplaint, temp, affectedCount },
              context_used: { protocolsCount: protocols.length, hasAnimalProfile: history.found },
              raw_output: parsed,
              validated_output: safetyCheck.sanitizedOutput,
              safety_check_passed: safetyCheck.passed,
              safety_notes: safetyCheck.warnings,
              latency_ms: Date.now() - startTime,
            });

            return safetyCheck.sanitizedOutput as AITriageResponse;
          }
        }
      } catch (err) {
        console.warn('AI Triage execution encountered error, falling back to rule engine:', err);
      }
    }

    // 3. Deterministic Fallback Engine (PRD Section 72)
    const ruleBased = this.generateRuleBasedTriage(caseData, isRedFlag);
    const safetyCheck = SafetyGatekeeper.inspectAndSanitize(ruleBased);

    await this.auditRepo.logAIAuditEvent({
      case_id: caseData.id,
      agent_name: 'RuleBasedFallbackTriage',
      model_name: 'deterministic-rules',
      prompt_version: 'v2.0.0-fallback',
      input_payload: { animalCode, penName, chiefComplaint, temp, affectedCount },
      context_used: { fallback: true },
      raw_output: ruleBased,
      validated_output: safetyCheck.sanitizedOutput,
      safety_check_passed: true,
      safety_notes: ['Fallback to rule engine due to offline/unconfigured Gemini API'],
      latency_ms: Date.now() - startTime,
    });

    return safetyCheck.sanitizedOutput as AITriageResponse;
  }

  // Deterministic rule-based triage matching veterinary clinical protocols
  private generateRuleBasedTriage(caseData: Partial<HealthCase>, isRedFlag: boolean): AITriageOutput {
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
      'ประวัติการสัมผัสสัตว์นำเข้าใหม่หรือยานพาหนะภายนอก',
    ];

    let possible_explanations: string[] = [
      'ภาวะติดเชื้อแบคทีเรียหรือไวรัสในระบบทางเดินหายใจ/ทางเดินอาหาร',
      'ภาวะเครียดจากความร้อนและความชื้นสะสม (Heat Stress)',
    ];

    let questions: string[] = [
      'สัตว์ยังสามารถลุกยืนและดื่มน้ำได้ด้วยตัวเองหรือไม่?',
      'ตรวจสังเกตคอกข้างเคียง มีสัตว์ตัวอื่นเริ่มมีอาการคล้ายกันหรือไม่?',
    ];

    const recommended_checks: string[] = [
      'วัดอุณหภูมิร่างกายซ้ำทุก 4 ชั่วโมง',
      'ตรวจสังเกตรอยผื่นแดง จ้ำเลือด หรือรอยช้ำตามใบหู หน้าท้อง และขาหนีบ',
      'ตรวจความเร็วลมและการระบายอากาศในโรงเรือน',
    ];

    const management_actions: string[] = [
      'แยกสัตว์ป่วยไว้ในโซนกักดูอาการ อย่าให้ปะปนกับสุกรตัวอื่น',
      'จัดเตรียมน้ำสะอาดที่ผสมสารละลายเกลือแร่ (Oral Electrolytes)',
      'ทำความสะอาดและพ่นน้ำยาฆ่าเชื้อบริเวณทางเดินหน้าคอกทันที',
    ];

    if (isRedFlag) {
      possible_explanations = [
        'สงสัยกลุ่มโรคระบาดร้ายแรงในสุกร (เช่น อหิวาต์แอฟริกาในสุกร ASF / CSF / PRRS สายพันธุ์รุนแรง)',
        'ภาวะช็อกติดเชื้อเฉียบพลัน (Septicemia)',
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
      questions: questions.slice(0, 3),
      recommended_checks,
      management_actions,
      escalation_required: isRedFlag || level === 'ORANGE',
      create_tasks: [
        {
          title: `ตรวจวัดอุณหภูมิและติดตามอาการ ${caseData.animal_code || caseData.pen_name || 'สุกรป่วย'}`,
          description: 'บันทึกอุณหภูมิร่างกายซ้ำ การกินอาหาร และสังเกตการขับถ่าย',
          priority: isRedFlag ? 'high' : 'medium',
          assigned_role: 'staff',
          due_in_hours: isRedFlag ? 2 : 4,
        },
      ],
      sources: [
        {
          title: 'คู่มือการจัดการสุขภาพสุกร กรมปศุสัตว์',
          authority: 'กรมปศุสัตว์ กระทรวงเกษตรและสหกรณ์',
        },
        {
          title: 'WOAH Terrestrial Animal Health Code',
          authority: 'World Organisation for Animal Health (WOAH)',
        },
      ],
      safety_notes: [
        'ระบบ AI เป็นเพียงผู้ช่วยประเมินความเร่งด่วน การวินิจฉัยและสั่งใช้ยาต้องได้รับความเห็นชอบจากสัตวแพทย์ผู้รับผิดชอบฟาร์ม',
      ],
      clinical_disclaimer:
        'ข้อมูลเพื่อการสนับสนุนการตัดสินใจเบื้องต้น ไม่สามารถทดแทนการตรวจวินิจฉัยโดยสัตวแพทย์ผู้มีใบอนุญาต',
    };
  }

  // Diagnostic Interview Agent (PRD Section 10)
  async continueDiagnosticInterview(
    caseData: HealthCase,
    previousQnA: { question: string; answer: string }[]
  ): Promise<{ next_question?: string; clinical_impression: string; updated_triage?: TriageLevel }> {
    if (previousQnA.length >= 3) {
      return {
        clinical_impression: 'ได้รับข้อมูลครบถ้วนเพียงพอสำหรับการตรวจร่างกายขั้นต่อไปโดยสัตวแพทย์แล้ว',
      };
    }

    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
คุณคือ "Diagnostic Interview Agent" สำหรับฟาร์มสุกร
เคส: ${caseData.case_number} (${caseData.animal_code || caseData.pen_name})
อาการหลัก: ${caseData.chief_complaint}
ประวัติการซักถามที่ผ่านมา:
${JSON.stringify(previousQnA)}

หน้าที่ของคุณคือ ถามคำถามทางคลินิกข้อต่อไปเพียง 1 ข้อ ที่ตรงเป้าหมายที่สุด เพื่อช่วยจำกัดขอบเขตของสาเหตุโรค
ตอบเป็น JSON:
{
  "next_question": "คำถามข้อต่อไปที่เข้าใจง่ายสำหรับคนงานในฟาร์ม",
  "clinical_impression": "ข้อสังเกตเบื้องต้นจากคำตอบที่ได้"
}
`;
        const resText = await generateContentWithFallback(this.ai, prompt, { responseMimeType: 'application/json' });
        if (resText) {
          const parsed = JSON.parse(resText);
          return {
            next_question: parsed.next_question,
            clinical_impression: parsed.clinical_impression || 'กำลังรวบรวมข้อมูลเพิ่มเติม',
          };
        }
      } catch {
        // Fallback below
      }
    }

    // Deterministic interview progression
    const fallbackQuestions = [
      'สัตว์เริ่มแสดงอาการเบื่ออาหารหรือซึมมาเป็นเวลากี่ชั่วโมงแล้ว?',
      'สังเกตเห็นการหายใจมีเสียงหวีด หรือมีน้ำมูกไหลร่วมด้วยหรือไม่?',
      'ในฝูงเดียวกัน มีสุกรตัวอื่นเริ่มแสดงอาการในลักษณะเดียวกันหรือไม่?',
    ];

    const nextQ = fallbackQuestions[previousQnA.length] || undefined;
    return {
      next_question: nextQ,
      clinical_impression: 'อยู่ระหว่างการรวบรวมข้อมูลอาการทางคลินิกเพิ่มเติมก่อนส่งมอบให้สัตวแพทย์',
    };
  }

  // Daily Farm Vet Briefing (PRD Section 14)
  async generateDailyBriefing(summaryData: any): Promise<string> {
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
คุณคือ AI Veterinary Assistant ประจำนิพนธ์ฟาร์ม พัทลุง
กรุณาสรุปรายงานสถานะสุขภาพฟาร์มประจำวัน (Daily Vet Briefing) สำหรับเจ้าของฟาร์มและสัตวแพทย์:
ข้อมูลสถานะฟาร์ม:
- สัตว์ทั้งหมด: ${summaryData.total_animals} ตัว
- ป่วย/เฝ้าระวัง: ${summaryData.sick_animals} ตัว
- เคสเปิดอยู่: ${summaryData.active_cases} เคส (เร่งด่วน: ${summaryData.urgent_cases} เคส)
- งานรอปฏิบัติการ: ${summaryData.pending_tasks} งาน

เขียนสรุปเป็นภาษาไทย 2-3 ย่อหน้า:
1. สรุปภาพรวมความเสี่ยงวันนี้
2. จุดที่ต้องเข้าตรวจเร่งด่วนที่สุด
3. คำแนะนำด้าน Biosecurity และการจัดการสภาพอากาศ
`;
        const resText = await generateContentWithFallback(this.ai, prompt);
        if (resText) return resText;
      } catch {
        // Fallback
      }
    }

    return `รายงานสถานะสุขภาพฟาร์มประจำวัน (นิพนธ์ฟาร์ม): ปัจจุบันมีสัตว์ในระบบ ${summaryData.total_animals} ตัว โดยมีสัตว์แสดงอาการป่วยหรือกักดูอาการ ${summaryData.sick_animals} ตัว และมีเคสที่ต้องตรวจติดตาม ${summaryData.active_cases} เคส (เคสเร่งด่วน ${summaryData.urgent_cases} เคส) ขอให้หัวหน้าฟาร์มเร่งตรวจสอบงานที่มีลำดับความสำคัญสูง โดยเฉพาะการวัดอุณหภูมิซ้ำและการให้อิเล็กโทรไลต์ในคอกอนุบาล พร้อมทั้งรักษามาตรการความปลอดภัยทางชีวภาพ (Biosecurity) พ่นน้ำยาฆ่าเชื้อหน้าโรงเรือนอย่างสม่ำเสมอ`;
  }
}
