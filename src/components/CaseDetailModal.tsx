import React, { useState } from 'react';
import { HealthCase, UserRole } from '../types/farm';
import { 
  X, 
  Sparkles, 
  Thermometer, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Activity, 
  Send, 
  Loader2,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';

interface CaseDetailModalProps {
  caseItem: HealthCase;
  currentRole: UserRole;
  onClose: () => void;
  onCaseUpdated?: (updatedCase: HealthCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  currentRole,
  onClose,
  onCaseUpdated
}) => {
  const [currentCase, setCurrentCase] = useState<HealthCase>(caseItem);
  const [answerText, setAnswerText] = useState('');
  const [answering, setAnswering] = useState(false);

  const ai = currentCase.ai_triage;

  const handleAnswerQuestion = async (question: string) => {
    if (!answerText.trim() || answering) return;

    setAnswering(true);
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: currentCase.id,
          question,
          answer: answerText.trim()
        })
      });

      const data = await res.json();
      if (data.updated_case) {
        setCurrentCase(data.updated_case);
        setAnswerText('');
        if (onCaseUpdated) onCaseUpdated(data.updated_case);
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการส่งคำตอบ');
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold bg-slate-800 text-white px-2.5 py-1 rounded">
              {currentCase.case_number}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{currentCase.animal_code || 'ไม่ระบุเบอร์'}</span>
                <span className="text-xs font-normal text-slate-400">({currentCase.pen_name})</span>
              </h2>
              <p className="text-xs text-slate-400">
                แจ้งเมื่อ {new Date(currentCase.reported_at).toLocaleDateString('th-TH')} {new Date(currentCase.reported_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. โดย {currentCase.reported_by}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentCase.triage_level === 'RED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
              currentCase.triage_level === 'ORANGE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              currentCase.triage_level === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              ระดับ {currentCase.triage_level}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Chief Complaint & Observation */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              อาการหลักที่แจ้ง (Reported Complaint)
            </span>
            <p className="text-sm text-white font-medium">
              {currentCase.chief_complaint}
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-slate-300 flex-wrap">
              {currentCase.temperature_c && (
                <span className="flex items-center gap-1 font-mono text-amber-400 bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded-md">
                  <Thermometer className="w-3.5 h-3.5" /> {currentCase.temperature_c}°C
                </span>
              )}
              <span className="bg-slate-800 px-2.5 py-1 rounded-md">
                จำนวนที่พบ: <strong>{currentCase.affected_count} ตัว</strong>
              </span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-md">
                การกินอาหาร: {currentCase.feed_intake_status === 'none' ? 'ไม่กินเลย' : 'กินลดลง'}
              </span>
            </div>
          </div>

          {/* AI Veterinary Triage Breakdown (PRD Section 22 & 48) */}
          {ai && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>สรุปการประเมินทางคลินิก (AI Veterinary Triage Assessment)</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {ai.summary}
                </p>

                {/* Facts vs Unknowns vs Possible Explanations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      ✓ ข้อเท็จจริงที่พบ (Facts):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {ai.facts?.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-bold text-amber-400 block mb-1">
                      ❓ สิ่งที่ยังไม่ทราบ (Unknowns):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {ai.unknowns?.map((u, idx) => (
                        <li key={idx}>{u}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Possible Explanations & Recommended Checks */}
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
                  <div>
                    <span className="text-xs font-bold text-sky-400 block mb-1">
                      🔍 กลุ่มอาการหรือโรคที่ต้องตรวจแยกโรค (Possible Considerations):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.possible_explanations?.map((p, idx) => (
                        <span key={idx} className="text-xs bg-sky-950/40 border border-sky-500/20 text-sky-300 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-300 block mb-1">
                      📋 สิ่งที่ควรตรวจเพิ่มและมาตรการจัดการ (Action Items):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {ai.management_actions?.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Diagnostic Interview Flow (PRD Section 10: Mode B) */}
              <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>คำถามตรวจเพิ่มเพื่อลดความไม่แน่นอน (Diagnostic Interview)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">1 คำถามต่อครั้ง</span>
                </div>

                {ai.questions && ai.questions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white bg-slate-900 p-3 rounded-lg border border-slate-800">
                      ❓ {ai.questions[0]}
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnswerQuestion(ai.questions[0])}
                        placeholder="พิมพ์ผลตรวจที่สังเกตพบ เช่น คลำเต้านมแล้วพบค่อนข้างแข็งและร้อน..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAnswerQuestion(ai.questions[0])}
                        disabled={!answerText.trim() || answering}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {answering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>ส่งผลตรวจ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 font-medium">
                    ✓ ข้อมูลเพียงพอสำหรับการติดตามในรอบนี้แล้ว
                  </p>
                )}

                {/* Interview History */}
                {currentCase.interview_history && currentCase.interview_history.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400">ประวัติการตอบผลตรวจทางคลินิก:</span>
                    {currentCase.interview_history.map((item, idx) => (
                      <div key={idx} className="text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                        <div className="text-slate-400 font-medium">คำถาม: {item.question}</div>
                        <div className="text-emerald-300 mt-0.5">ตอบ: {item.answer}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical Safety Disclaimer */}
              <div className="text-[11px] text-slate-500 italic flex items-start gap-1.5 px-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{ai.clinical_disclaimer || 'ระบบเป็นผู้ช่วยสนับสนุนการตัดสินใจ ไม่ใช่การสั่งยาหรือวินิจฉัยโรคขั้นสุดท้ายโดยอิสระ'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-mono">
            สถานะเคส: {currentCase.status}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
