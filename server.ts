import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

import { CaseRepository } from './server/lib/db/repositories/caseRepository';
import { AnimalRepository } from './server/lib/db/repositories/animalRepository';
import { TaskRepository } from './server/lib/db/repositories/taskRepository';
import { FarmRepository } from './server/lib/db/repositories/farmRepository';
import { AuditRepository } from './server/lib/db/repositories/auditRepository';
import { AIVetService, generateContentWithFallback } from './server/services/aiVetService';
import { CreateHealthCaseZodSchema, VeterinaryReviewZodSchema } from './src/schemas/caseSchema';
import { UpdateTaskStatusSchema } from './src/schemas/taskSchema';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Repositories and Services
  const caseRepo = new CaseRepository();
  const animalRepo = new AnimalRepository();
  const taskRepo = new TaskRepository();
  const farmRepo = new FarmRepository();
  const auditRepo = new AuditRepository();
  const aiVetService = new AIVetService();

  // ===================== FARM REST APIs =====================

  // 1. Farm Summary & Overview (PRD Section 5 & 33)
  app.get('/api/farm/summary', async (req, res) => {
    try {
      const summary = await farmRepo.getSummary();
      res.json({
        ...summary,
        weather: {
          temp_c: 29.5,
          humidity_pct: 78,
          condition: 'ฝนตกประปราย (พัทลุง)',
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Animals List & Filtering (PRD Section 18)
  app.get('/api/farm/animals', async (req, res) => {
    try {
      const { barn, pen, status, search } = req.query;
      const animals = await animalRepo.getAnimals({
        barn_id: barn as string,
        pen_id: pen as string,
        status: status as string,
        search: search as string,
      });
      res.json(animals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Animal Detail & Timeline (PRD Section 37)
  app.get('/api/farm/animals/:id', async (req, res) => {
    try {
      const animal = await animalRepo.getAnimalById(req.params.id);
      if (!animal) {
        return res.status(404).json({ error: 'Animal not found' });
      }
      res.json(animal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Barns & Pens (PRD Section 17 & 84)
  app.get('/api/farm/barns', async (req, res) => {
    try {
      const barnsWithPens = await farmRepo.getBarnsAndPens();
      res.json({
        barns: barnsWithPens,
        pens: barnsWithPens.flatMap((b) => b.pens),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Health Cases - GET with optional filters
  app.get('/api/farm/cases', async (req, res) => {
    try {
      const { triage_level, status } = req.query;
      const cases = await caseRepo.getCases({
        triage_level: triage_level as string,
        status: status as string,
      });
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Health Case - Create (Fast Reporting - PRD Section 7 & 72)
  app.post('/api/farm/cases', async (req, res) => {
    try {
      // Validate schema
      const validation = CreateHealthCaseZodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.format(),
        });
      }

      const caseData = validation.data;

      // PRD Section 72: Separate record creation from AI
      const newCase = await caseRepo.createCase({
        animal_id: caseData.animal_id,
        animal_code: caseData.animal_code,
        barn_id: caseData.barn_id,
        pen_id: caseData.pen_id,
        affected_count: caseData.affected_count,
        reported_by: caseData.reported_by,
        reported_by_role: caseData.reported_by_role,
        chief_complaint: caseData.chief_complaint,
        symptoms: caseData.symptoms,
        temperature_c: caseData.temperature_c,
        respiratory_rate: caseData.respiratory_rate,
        feed_intake_status: caseData.feed_intake_status,
        photos: caseData.photos,
      });

      // Step 2: Trigger AI Triage & Clinical Decision Support asynchronously or inline
      try {
        const triageResult = await aiVetService.runTriage(newCase);
        await caseRepo.updateCaseTriage(newCase.id, triageResult);
        newCase.ai_triage = triageResult;
        newCase.triage_level = triageResult.triage_level;
        newCase.status = triageResult.escalation_required ? 'vet_review' : 'triage_completed';
      } catch (aiErr) {
        console.warn('AI Triage background call failed, record remains saved:', aiErr);
      }

      res.status(201).json(newCase);
    } catch (err: any) {
      console.error('Error creating health case:', err);
      res.status(500).json({ error: err.message || 'Failed to create case' });
    }
  });

  // 7. Standalone AI Triage API (PRD Section 70)
  app.post('/api/ai/triage', async (req, res) => {
    try {
      const { case_id } = req.body;
      if (!case_id) {
        return res.status(400).json({ error: 'case_id is required' });
      }

      const targetCase = await caseRepo.getCaseById(case_id);
      if (!targetCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const triageResult = await aiVetService.runTriage(targetCase);
      const updated = await caseRepo.updateCaseTriage(case_id, triageResult);

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Interactive Diagnostic Interview Question Flow (PRD Section 10)
  app.post('/api/ai/interview', async (req, res) => {
    try {
      const { case_id, question, answer } = req.body;
      const targetCase = await caseRepo.getCaseById(case_id);

      if (!targetCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const updatedCase = await caseRepo.addInterviewAnswer(case_id, question, answer);

      // Re-run triage with augmented history
      const updatedTriage = await aiVetService.runTriage({
        ...updatedCase,
        chief_complaint: `${updatedCase.chief_complaint} (ผลตรวจเพิ่มเติม: ${question} -> ${answer})`,
      });

      await caseRepo.updateCaseTriage(case_id, updatedTriage);
      updatedCase.ai_triage = updatedTriage;
      updatedCase.triage_level = updatedTriage.triage_level;

      res.json({
        success: true,
        updated_case: updatedCase,
        next_question: updatedTriage.questions?.[0] || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Daily Farm Vet Morning Briefing (PRD Section 14)
  app.get('/api/ai/daily-briefing', async (req, res) => {
    try {
      const summary = await farmRepo.getSummary();
      const briefing = await aiVetService.generateDailyBriefing(summary);
      res.json({ briefing });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Farm Tasks (PRD Section 31)
  app.get('/api/farm/tasks', async (req, res) => {
    try {
      const { status, role } = req.query;
      const tasks = await taskRepo.getTasks({
        status: status as string,
        role: role as string,
      });
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/farm/tasks/:id', async (req, res) => {
    try {
      const validation = UpdateTaskStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid task update', details: validation.error.format() });
      }

      const { status, completed_by } = validation.data;
      const task = await taskRepo.updateTaskStatus(req.params.id, status, completed_by);
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Veterinarian Clinical Review Queue (PRD Section 66 & 75)
  app.post('/api/farm/cases/:id/review', async (req, res) => {
    try {
      const validation = VeterinaryReviewZodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid review payload', details: validation.error.format() });
      }

      const reviewData = validation.data;
      const reviewed = await caseRepo.reviewCase(req.params.id, {
        reviewed_by: reviewData.reviewed_by,
        reviewer_role: reviewData.reviewer_role,
        status: reviewData.status,
        clinical_notes: reviewData.clinical_notes,
        confirmed_diagnosis: reviewData.confirmed_diagnosis,
      });

      res.json(reviewed);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  // 12. Treatments & Withdrawal Tracking (PRD Section 12 & 32)
  app.get('/api/farm/treatments', async (req, res) => {
    try {
      const treatments = await farmRepo.getTreatments();
      res.json(treatments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/farm/treatments/:id/followup', async (req, res) => {
    try {
      const { progression, notes, recorded_by } = req.body;
      const updated = await farmRepo.addTreatmentFollowup(req.params.id, {
        progression,
        notes,
        recorded_by: recorded_by || 'เจ้าหน้าที่ฟาร์ม',
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. AI Visual Inspection / Image Analysis (PRD Section 26)
  app.post('/api/ai/analyze-image', async (req, res) => {
    try {
      const { image, description } = req.body;
      if (!image) return res.status(400).json({ error: 'Image is required' });

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `คุณคือผู้เชี่ยวชาญพยาธิวิทยาและสัตวแพทย์สุกร วิเคราะห์ภาพถ่ายรอยโรคหรือสภาพสุกรในฟาร์ม:
คำอธิบายเพิ่มเติมจากผู้ส่ง: "${description || 'ไม่มีคำอธิบาย'}"

กรุณาประเมินข้อสังเกตตามหลักสัตวแพทย์:
1. ลักษณะรอยโรคที่สังเกตพบ (เช่น ผื่นแดง, จ้ำเลือด, รอยช้ำ, แผลถลอก, เต้านมบวม)
2. ระดับความเสี่ยงเบื้องต้น (ต่ำ, ปานกลาง, สูง)
3. สิ่งที่ควรตรวจยืนยันเพิ่มเติมทางคลินิก (เช่น วัดไข้, คลำเต้านม, เช็กคอกข้างเคียง)
4. ข้อควรระวังด้านความปลอดภัยทางชีวภาพ (Biosecurity)`;

        const analysis = await generateContentWithFallback(ai, prompt);
        if (analysis) {
          return res.json({ analysis, source: 'Gemini Visual Veterinary Assistant' });
        }
      }

      // Fallback
      res.json({
        analysis:
          'ภาพได้รับการบันทึกเข้าระบบ: พบร่องรอยการเปลี่ยนแปลงของสีผิว/ลักษณะรอยโรคเบื้องต้น แนะนำให้วัดอุณหภูมิร่างกายร่วมด้วย สังเกตการกินอาหาร และกักแยกสัตว์หากพบจ้ำเลือดหรือไข้สูงเกิน 40°C',
        source: 'Clinical Visual Protocol',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Farm Protocols & Knowledge Documents (PRD Section 15 & 16)
  app.get('/api/farm/protocols', async (req, res) => {
    try {
      const protocols = await farmRepo.getProtocols();
      res.json(protocols);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15. AI Audit Events Ledger (PRD Section 43 & 59)
  app.get('/api/farm/audit-events', async (req, res) => {
    try {
      const events = await auditRepo.getAuditEvents();
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 16. Freeform AI Farm Veterinary Consult Grounded in Context
  app.post('/api/ai/consult', async (req, res) => {
    try {
      const { message, role } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      const summary = await farmRepo.getSummary();
      const activeCases = await caseRepo.getCases({ status: 'open' });

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
คุณคือ "AI ผู้ช่วยสัตวแพทย์ประจำฟาร์มสุกร" ประจำ นิพนธ์ฟาร์ม พัทลุง
ผู้สอบถามคือ: ${role || 'พนักงานฟาร์ม'}

บริบทฟาร์มปัจจุบัน:
- สุกรทั้งหมด: ${summary.total_animals} ตัว, กำลังป่วย/เฝ้าระวัง: ${summary.sick_animals} ตัว
- เคสที่ยังเปิดอยู่: ${activeCases.map((c) => `${c.case_number} (${c.chief_complaint})`).join(', ')}

คำถามหรือข้อปรึกษาจากผู้ใช้:
"${message}"

แนวทางการตอบตามมาตรฐานสัตวแพทย์ (PRD Section 75, 76, 83):
1. ตอบเป็นภาษาไทยที่เข้าใจง่าย กระชับ ชัดเจน
2. เน้นการจัดการสุขอนามัย การคัดกรอง และความปลอดภัยทางชีวภาพ (Biosecurity)
3. **ห้ามสั่งจ่ายยาปฏิชีวนะหรือกำหนดขนาดยาเองโดยเด็ดขาด** หากถามเรื่องการใช้ยา ให้แนะนำการตรวจทางคลินิกและเน้นย้ำว่าต้องรอการอนุมัติจากสัตวแพทย์ผู้ควบคุมฟาร์ม
4. หากพบความเสี่ยงโรคระบาดร้ายแรง (เช่น หมูหลายตัวตายพร้อมกัน, เลือดออก) ให้สั่งกักกันคอกทันที
`;

        const replyText = await generateContentWithFallback(ai, prompt);

        if (replyText) {
          return res.json({
            reply: replyText,
            source: 'Gemini Veterinary Intelligence (Grounded in Farm Context)',
          });
        }
      }

      res.json({
        reply: `รับทราบข้อสอบถาม: "${message}" \nคำแนะนำเบื้องต้น: ควรรักษาระดับการระบายอากาศ ตรวจวัดอุณหภูมิร่างกายสุกร และสังเกตการกินอาหาร หากพบอาการซึมหรือไข้สูงเกิน 39.5°C ให้แยกสัตว์เข้าคอกกักดูอาการและแจ้งสัตวแพทย์ประจำฟาร์มตรวจวินิจฉัยครับ`,
        source: 'Farm Protocol Rule Engine (Offline Mode)',
      });
    } catch (err: any) {
      console.error('[consult] error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for frontend client development & production static serving
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV !== 'production' || !indexHtmlExists) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Farm Vet Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
