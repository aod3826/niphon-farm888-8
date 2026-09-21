import React, { useState, useEffect } from 'react';
import { FarmTask, UserRole, HealthCase } from '../types/farm';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  Check, 
  FileText, 
  Stethoscope,
  Filter,
  RefreshCw
} from 'lucide-react';

interface TasksViewProps {
  currentRole: UserRole;
  onSelectCaseById?: (caseId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  currentRole,
  onSelectCaseById
}) => {
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [cases, setCases] = useState<HealthCase[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'vet_queue'>('tasks');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Review modal state for vet
  const [reviewingCase, setReviewingCase] = useState<HealthCase | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [confirmedDiag, setConfirmedDiag] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchTasksAndCases = async () => {
    try {
      setLoading(true);
      const [tasksRes, casesRes] = await Promise.all([
        fetch('/api/farm/tasks').then(r => r.json()),
        fetch('/api/farm/cases').then(r => r.json())
      ]);
      setTasks(tasksRes);
      setCases(casesRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndCases();
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`/api/farm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          completed_by: currentRole === 'staff' ? 'กานดา มีสุข' : 'วิทยา สุขใส'
        })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveCase = async (caseId: string) => {
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/farm/cases/${caseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          clinical_notes: clinicalNotes || 'สัตวแพทย์ตรวจสอบและเห็นชอบตามมาตรการที่ AI แนะนำ',
          confirmed_diagnosis: confirmedDiag || 'สงสัย MMA / ตรวจติดตามทางคลินิก',
          reviewed_by: 'น.สพ. ดร. ปริญญา ภักดี (ว.สพ. 12940)'
        })
      });
      if (res.ok) {
        setReviewingCase(null);
        setClinicalNotes('');
        setConfirmedDiag('');
        fetchTasksAndCases();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterPriority === 'all') return true;
    return t.priority === filterPriority;
  });

  const pendingVetCases = cases.filter(c => c.status !== 'resolved');

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📋 งานและการติดตามการรักษา (Tasks & Vet Queue)</span>
          </h1>
          <p className="text-xs text-slate-400">
            ระบบงานอัตโนมัติที่สร้างจากคำแนะนำ AI และคิวตรวจรับรองโดยสัตวแพทย์ (PRD Section 31 & 66)
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tasks' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            งานปฏิบัติการฟาร์ม ({tasks.filter(t => t.status !== 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('vet_queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'vet_queue' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>คิวสัตวแพทย์ตรวจ ({pendingVetCases.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Priority filter buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">กรองความเร่งด่วน:</span>
            {['all', 'high', 'medium'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                  filterPriority === p
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {p === 'all' ? 'ทั้งหมด' : p === 'high' ? '🔴 ด่วนสูง (High)' : '🟡 ปานกลาง (Medium)'}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map((t) => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className={`border rounded-2xl p-4 transition-all flex items-start gap-3.5 ${
                    isDone 
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(t.id, t.status)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.priority === 'high' ? 'ความสำคัญสูง' : 'ปกติ'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {t.pen_name || t.animal_code || 'ทั่วไป'}
                      </span>
                      {isDone && (
                        <span className="text-xs text-emerald-400">✓ เสร็จแล้ว</span>
                      )}
                    </div>

                    <h3 className={`text-sm font-bold text-white ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {t.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> ผู้รับผิดชอบ: {t.assigned_to_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> กำหนดเสร็จ: {new Date(t.due_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'vet_queue' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Veterinary Review Queue (สัตวแพทย์ประจำฟาร์ม):</span>
              <p className="text-slate-400 mt-0.5">
                สัตวแพทย์มีหน้าที่ตรวจสอบข้อเสนอแนะของ AI อนุมัติการรักษา และบันทึกคำสั่งทางคลินิกอย่างเป็นทางการ
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingVetCases.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-white">
                      {c.case_number}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {c.animal_code} ({c.pen_name})
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    c.triage_level === 'RED' ? 'bg-rose-500/20 text-rose-300' : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    Triage: {c.triage_level}
                  </span>
                </div>

                <p className="text-xs text-slate-200">
                  <span className="text-slate-400">อาการ:</span> {c.chief_complaint}
                </p>

                {c.ai_triage && (
                  <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                    <div className="font-semibold text-emerald-400">
                      💡 สรุปการประเมินเบื้องต้นจาก AI:
                    </div>
                    <p className="text-slate-300">{c.ai_triage.summary}</p>
                    {c.ai_triage.possible_explanations && (
                      <div className="text-slate-400 text-[11px] pt-1">
                        โรคที่สงสัย: {c.ai_triage.possible_explanations.join(' • ')}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    แจ้งโดย: {c.reported_by} ({c.reported_by_role})
                  </span>

                  <button
                    onClick={() => setReviewingCase(c)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>ตรวจวินิจฉัย & บันทึกผล</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal for Vet */}
      {reviewingCase && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              <span>บันทึกความเห็นทางคลินิก (สัตวแพทย์)</span>
            </h2>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-slate-300">{reviewingCase.case_number}: {reviewingCase.animal_code}</div>
              <p className="text-slate-400 mt-1">{reviewingCase.chief_complaint}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                การวินิจฉัยโรคขั้นต้น (Diagnosis)
              </label>
              <input
                type="text"
                placeholder="เช่น สงสัยภาวะเต้านมอักเสบ MMA / หวัดสุกร"
                value={confirmedDiag}
                onChange={(e) => setConfirmedDiag(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                คำสั่งการจัดการ & แผนการรักษา (Clinical Instructions)
              </label>
              <textarea
                rows={3}
                placeholder="ระบุคำสั่งการดูแล เช่น แยกสัตว์เข้าคอกพัก เช็ดตัวลดไข้ ให้น้ำเกลือแร่ หรือส่งตรวจแล็บ..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewingCase(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleApproveCase(reviewingCase.id)}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                {submittingReview ? 'กำลังบันทึก...' : 'อนุมัติและปิดเคส ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
