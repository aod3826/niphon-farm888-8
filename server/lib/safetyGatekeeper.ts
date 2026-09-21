// ====================================================================
// Deterministic Veterinary Safety Gatekeeper
// Standard: PRD.md Section 23, 75, 83, 86 (Antimicrobial Stewardship & Non-prescription)
// ====================================================================

import { AITriageOutput } from '../../src/schemas/triageOutputSchema';

// List of controlled antimicrobial and prescription agents that AI must NEVER independently prescribe
const CONTROLLED_ANTIMICROBIALS = [
  'penicillin',
  'amoxicillin',
  'ampicillin',
  'oxytetracycline',
  'doxycycline',
  'chlortetracycline',
  'enrofloxacin',
  'marbofloxacin',
  'ciprofloxacin',
  'tilmicosin',
  'tulathromycin',
  'tylosin',
  'tiamulin',
  'ceftiofur',
  'cefquinome',
  'colistin',
  'gentamicin',
  'lincomycin',
  'spectinomycin',
  'sulfa',
  'trimethoprim',
  'เพนนิซิลิน',
  'อะม็อกซีซิลิน',
  'แอมพิซิลิน',
  'ออกซีเตตราไซคลิน',
  'เอนโรฟลอกซาซิน',
  'ทิลมิโคซิน',
  'ไทโลซิน',
  'เซฟติโอฟัวร์',
  'โคลิสติน',
  'เจนตามัยซิน',
  'ลินโคมัยซิน',
];

export interface SafetyCheckResult {
  passed: boolean;
  sanitizedOutput: AITriageOutput;
  warnings: string[];
}

export class SafetyGatekeeper {
  public static inspectAndSanitize(output: AITriageOutput): SafetyCheckResult {
    const warnings: string[] = [];
    let passed = true;

    // 1. Check for unauthorized antimicrobial recommendations
    const checkText = (text: string): boolean => {
      const lower = text.toLowerCase();
      return CONTROLLED_ANTIMICROBIALS.some((drug) => lower.includes(drug));
    };

    // Sanitize management actions
    const cleanActions = output.management_actions.map((action) => {
      if (checkText(action)) {
        passed = false;
        warnings.push(`พบการระบุตัวยาปฏิชีวนะที่ต้องถูกควบคุม: "${action}"`);
        return 'แจ้งสัตวแพทย์ผู้ควบคุมฟาร์มเพื่อตรวจวินิจฉัยและพิจารณาแผนการรักษาด้วยยาปฏิชีวนะตามความจำเป็นทางคลินิก (ห้ามพนักงานบริหารยาเอง)';
      }
      return action;
    });

    // 2. Enforce uncertainty language (PRD Section 46 & 76)
    // If output claims 100% or absolute certainty without vet confirmation, add caution
    const certaintyKeywords = ['ยืนยันว่าเป็นโรค', 'เป็นโรคนี้แน่นอน', '100%'];
    const hasCertaintyClaim = certaintyKeywords.some((kw) => output.summary.includes(kw));
    if (hasCertaintyClaim) {
      warnings.push('AI พยายามระบุการวินิจฉัยโรคแบบยืนยันแน่นอนโดยไม่มีผลทางห้องปฏิบัติการ');
      output.summary = `ข้อสันนิษฐานเบื้องต้น: ${output.summary} (ต้องรอการตรวจยืนยันทางคลินิกโดยสัตวแพทย์)`;
    }

    // 3. Ensure mandatory regulatory disclaimer
    const mandatoryDisclaimer =
      'คำแนะนำนี้เป็นระบบสนับสนุนการตัดสินใจทางสัตวบาล (Clinical Decision Support) ไม่ใช่การสั่งการรักษาหรือการวินิจฉัยโรคขั้นสุดท้าย การสั่งใช้ยาต้านจุลชีพและแผนการรักษาโรคต้องผ่านการตรวจรับรองโดยสัตวแพทย์ผู้มีใบอนุญาตประกอบวิชาชีพการสัตวแพทย์ชั้นหนึ่งเท่านั้น ตามระเบียบกรมปศุสัตว์และมาตรฐาน WOAH';

    // 4. Ensure safety notes array is present
    const safetyNotes = [...output.safety_notes];
    if (warnings.length > 0) {
      safetyNotes.push(...warnings);
    }
    safetyNotes.push('ระบบปฏิบัติตามหลักการจัดการสุขภาพสัตว์และการใช้ยาต้านจุลชีพอย่างสมเหตุผล (Antimicrobial Stewardship)');

    return {
      passed,
      sanitizedOutput: {
        ...output,
        management_actions: cleanActions,
        safety_notes: safetyNotes,
        clinical_disclaimer: mandatoryDisclaimer,
      },
      warnings,
    };
  }
}
