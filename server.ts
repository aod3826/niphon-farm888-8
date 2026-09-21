import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { farmStore } from "./server/data/farmStore.ts";
import { aiVetService, generateContentWithFallback } from "./server/services/aiVetService.ts";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // ===================== FARM REST APIs =====================

  // 1. Farm Summary & Overview (PRD Section 5 & 33)
  app.get("/api/farm/summary", (req, res) => {
    try {
      const summary = farmStore.getSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Animals List & Filtering (PRD Section 18)
  app.get("/api/farm/animals", (req, res) => {
    try {
      const { barn, status, search } = req.query;
      let animals = [...farmStore.animals];

      if (barn) {
        animals = animals.filter(a => a.barn_id === barn);
      }
      if (status) {
        animals = animals.filter(a => a.status === status);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        animals = animals.filter(a => 
          a.animal_code.toLowerCase().includes(q) || 
          a.pen_name.toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q)
        );
      }

      res.json(animals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Animal Detail & Timeline (PRD Section 37)
  app.get("/api/farm/animals/:id", (req, res) => {
    const animal = farmStore.animals.find(a => a.id === req.params.id || a.animal_code === req.params.id);
    if (!animal) {
      return res.status(404).json({ error: "Animal not found" });
    }
    res.json(animal);
  });

  // 4. Barns & Pens
  app.get("/api/farm/barns", (req, res) => {
    res.json({
      barns: farmStore.barns,
      pens: farmStore.pens
    });
  });

  // 5. Health Cases - GET
  app.get("/api/farm/cases", (req, res) => {
    try {
      res.json(farmStore.cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Health Case - Create (Fast Reporting - PRD Section 7 & 72)
  app.post("/api/farm/cases", async (req, res) => {
    try {
      const caseData = req.body;
      
      // Step 1: Save record immediately (Independent from AI processing)
      const newCase = farmStore.createCase(caseData);

      // Step 2: Trigger AI Triage & Clinical Decision Support asynchronously or inline
      try {
        const triageResult = await aiVetService.runTriage(newCase);
        newCase.ai_triage = triageResult;
        newCase.triage_level = triageResult.triage_level;
        newCase.status = 'triage_completed';

        // Auto-create tasks suggested by AI if any
        if (triageResult.create_tasks && triageResult.create_tasks.length > 0) {
          for (const taskDef of triageResult.create_tasks) {
            farmStore.tasks.unshift({
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              farm_id: farmStore.farm.id,
              title: taskDef.title,
              description: taskDef.description,
              priority: taskDef.priority,
              category: 'clinical_check',
              case_id: newCase.id,
              animal_code: newCase.animal_code,
              pen_name: newCase.pen_name,
              assigned_to_name: taskDef.assigned_role === 'veterinarian' ? 'น.สพ. ดร. ปริญญา ภักดี' : 'วิทยา สุขใส',
              assigned_to_role: taskDef.assigned_role,
              due_at: new Date(Date.now() + taskDef.due_in_hours * 3600000).toISOString(),
              status: 'pending'
            });
          }
        }
      } catch (aiErr) {
        console.warn("AI Triage failed, record remains securely saved:", aiErr);
      }

      res.status(201).json(newCase);
    } catch (err: any) {
      console.error("Error creating health case:", err);
      res.status(500).json({ error: err.message || "Failed to create case" });
    }
  });

  // 7. Interactive Diagnostic Interview Question Flow (PRD Section 10)
  app.post("/api/ai/interview", async (req, res) => {
    try {
      const { case_id, question, answer } = req.body;
      const targetCase = farmStore.cases.find(c => c.id === case_id);
      
      if (!targetCase) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!targetCase.interview_history) {
        targetCase.interview_history = [];
      }

      targetCase.interview_history.push({
        question,
        answer,
        timestamp: new Date().toISOString()
      });

      // Update case triage based on newly answered clinical observation
      const updatedTriage = await aiVetService.runTriage({
        ...targetCase,
        chief_complaint: `${targetCase.chief_complaint} (ผลตรวจเพิ่มเติม: ${question} -> ${answer})`
      });

      targetCase.ai_triage = updatedTriage;
      targetCase.triage_level = updatedTriage.triage_level;

      res.json({
        success: true,
        updated_case: targetCase,
        next_question: updatedTriage.questions?.[0] || null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Daily Farm Vet Morning Briefing (PRD Section 14)
  app.get("/api/ai/daily-briefing", async (req, res) => {
    try {
      const briefing = await aiVetService.generateDailyBriefing();
      res.json(briefing);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Farm Tasks (PRD Section 31)
  app.get("/api/farm/tasks", (req, res) => {
    res.json(farmStore.tasks);
  });

  app.patch("/api/farm/tasks/:id", (req, res) => {
    const { status, completed_by } = req.body;
    const task = farmStore.updateTaskStatus(req.params.id, status, completed_by);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  // 10. Veterinarian Clinical Review Queue (PRD Section 66)
  app.post("/api/farm/cases/:id/review", (req, res) => {
    const { status, clinical_notes, confirmed_diagnosis, reviewed_by } = req.body;
    const targetCase = farmStore.cases.find(c => c.id === req.params.id);
    if (!targetCase) return res.status(404).json({ error: "Case not found" });

    targetCase.vet_review = {
      reviewed_by: reviewed_by || 'น.สพ. ดร. ปริญญา ภักดี',
      reviewed_at: new Date().toISOString(),
      status: status || 'approved',
      clinical_notes: clinical_notes || '',
      confirmed_diagnosis: confirmed_diagnosis || undefined
    };
    targetCase.status = 'resolved';

    res.json(targetCase);
  });

  // 11. Farm Protocols & Knowledge Documents (PRD Section 15 & 16)
  app.get("/api/farm/protocols", (req, res) => {
    res.json(farmStore.protocols);
  });

  // 12. Freeform AI Farm Veterinary Consult Grounded in Context
  app.post("/api/ai/consult", async (req, res) => {
    try {
      const { message, role } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const summary = farmStore.getSummary();
      const activeCases = farmStore.cases.filter(c => c.status !== 'resolved');

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
คุณคือ "AI ผู้ช่วยสัตวแพทย์ประจำฟาร์มสุกร" ประจำ นิพนธ์ฟาร์ม พัทลุง
ผู้สอบถามคือ: ${role || 'พนักงานฟาร์ม'}

บริบทฟาร์มปัจจุบัน:
- สุกรทั้งหมด: ${summary.total_animals} ตัว, กำลังป่วย/เฝ้าระวัง: ${summary.sick_animals} ตัว
- เคสที่ยังเปิดอยู่: ${activeCases.map(c => `${c.case_number} (${c.chief_complaint})`).join(', ')}
- สภาพอากาศพัทลุง: ${summary.weather.temp_c}°C, ความชื้น ${summary.weather.humidity_pct}% (${summary.weather.condition})

คำถามหรือข้อปรึกษาจากผู้ใช้:
"${message}"

แนวทางการตอบ:
1. ตอบเป็นภาษาไทยที่สุภาพ เป็นมิตร กระชับ ชัดเจน และมีหลักฐานอิงตามหลักวิชาการสัตวแพทย์
2. เน้นการจัดการสภาพแวดล้อม สุขอนามัย การคัดกรอง และความปลอดภัยทางชีวภาพ (Biosecurity)
3. หากถามเรื่องยา ห้ามสั่งยาปฏิชีวนะหรือจ่ายยาเองเด็ดขาด ให้แนะนำสิ่งที่ควรตรวจแยกโรคและเตือนให้ขออนุมัติจากสัตวแพทย์คุมฟาร์ม
4. หากพบความเสี่ยงโรคระบาดร้ายแรง (เช่น ASF, PRRS) ให้แนะนำการกักกันโรคทันที
`;

        const replyText = await generateContentWithFallback(ai, prompt);

        if (replyText) {
          return res.json({
            reply: replyText,
            source: "Gemini Veterinary Intelligence (Grounded in Farm Context)"
          });
        }
      }

      // Fallback response if API key is not present
      res.json({
        reply: `รับทราบข้อสอบถาม: "${message}" \nคำแนะนำเบื้องต้นสำหรับฟาร์มในสภาพอากาศพัทลุง: ควรรักษาระดับการระบายอากาศ ตรวจวัดอุณหภูมิร่างกายสุกร และสังเกตการกินอาหาร หากพบอาการซึมหรือไข้สูงเกิน 39.5°C ให้แยกสัตว์เข้าคอกกักดูอาการและแจ้งสัตวแพทย์ประจำฟาร์มตรวจวินิจฉัยครับ`,
        source: "Farm Protocol Rule Engine (Offline Mode)"
      });
    } catch (err: any) {
      console.error("[consult] error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for frontend client development & production static serving
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV !== "production" || !indexHtmlExists) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Farm Vet Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
