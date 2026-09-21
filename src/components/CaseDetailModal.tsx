import React, { useState, useEffect } from 'react';
import { HealthCase, UserRole, TreatmentRecord } from '../types/farm';
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
  ClipboardList,
  Stethoscope,
  Pill,
  Check,
  Camera,
  Plus
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

  // Vet Case Review State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewDiagnosis, setReviewDiagnosis] = useState(currentCase.vet_review?.confirmed_diagnosis || '');
  const [reviewNotes, setReviewNotes] = useState(currentCase.vet_review?.clinical_notes || '');
  const [reviewStatus, setReviewStatus] = useState<HealthCase['status']>(currentCase.status);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Treatment & Follow-up State
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState<string | null>(null);
  const [followupProgression, setFollowupProgression] = useState<'improving' | 'stable' | 'deteriorating'>('improving');
  const [followupObs, setFollowupObs] = useState('');
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  const ai = currentCase.ai_triage;

  // Load treatments for this animal or case
  useEffect(() => {
    const fetchTreatments = async () => {
      setLoadingTreatments(true);
      try {
        const res = await fetch('/api/farm/treatments');
        if (res.ok) {
          const all: TreatmentRecord[] = await res.json();
          const filtered = all.filter(t => 
            t.case_id === currentCase.id || 
            (currentCase.animal_code && t.animal_code === currentCase.animal_code)
          );
          setTreatments(filtered);
        }
      } catch (err) {
        console.error('Failed to load treatments:', err);
      } finally {
        setLoadingTreatments(false);
      }
    };
    fetchTreatments();
  }, [currentCase.id, currentCase.animal_code]);

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

  // Submit Veterinarian / Manager Case Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/farm/cases/${currentCase.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          confirmed_diagnosis: reviewDiagnosis.trim() || undefined,
          clinical_notes: reviewNotes.trim() || undefined,
          reviewed_by: currentRole === 'veterinarian' ? 'น.สพ. ดร. ปริญญา ภักดี' : 'วิทยา สุขใส'
        })
      });

      if (res.ok) {
        const updatedCase = await res.json();
        setCurrentCase(updatedCase);
        setShowReviewForm(false);
        if (onCaseUpdated) onCaseUpdated(updatedCase);
      } else {
        alert('ไม่สามารถบันทึกผลการตรวจได้');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit Treatment Follow-up Progress
  const handleSubmitFollowup = async (treatmentId: string) => {
    setSubmittingFollowup(true);
    try {
      const res = await fetch(`/api/farm/treatments/${treatmentId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recorded_by: currentRole === 'veterinarian' ? 'น.สพ. ดร. ปริญญา ภักดี' : currentRole === 'manager' ? 'วิทยา สุขใส' : 'กานดา มีสุข',
          progression: followupProgression,
          notes: followupObs || `ติดตามอาการประจำวัน พบสุกร${followupProgression === 'improving' ? 'อาการดีขึ้น เริ่มกินอาหาร' : followupProgression === 'stable' ? 'อาการทรงตัว' : 'อาการทรุดลง'}`
        })
      });

      if (res.ok) {
        const updatedTreatment = await res.json();
        setTreatments(prev => prev.map(t => t.id === treatmentId ? updatedTreatment : t));
        setShowFollowupModal(null);
        setFollowupObs('');
      } else {
        alert('ไม่สามารถบันทึกการติดตามการรักษาได้');
      }
    } catch (err) {
      console.error('Followup submit error:', err);
    } finally {
      setSubmittingFollowup(false);
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
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Chief Complaint & Observation */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                อาการหลักที่แจ้ง (Reported Complaint)
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentCase.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                currentCase.status === 'in_progress' ? 'bg-sky-500/20 text-sky-300' :
                currentCase.status === 'vet_review' ? 'bg-purple-500/20 text-purple-300' :
                'bg-slate-800 text-slate-400'
              }`}>
                สถานะ: {currentCase.status}
              </span>
            </div>

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

            {/* Photos if attached */}
            {currentCase.photos && currentCase.photos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> ภาพถ่ายบันทึกเคส:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {currentCase.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Case observation ${i+1}`}
                      className="w-24 h-20 object-cover rounded-xl border border-slate-700 shadow"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Veterinarian Case Review Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">การตรวจวินิจฉัยโดยสัตวแพทย์ (Veterinary Review)</h3>
                  <p className="text-[11px] text-slate-400">
                    {currentCase.vet_review?.reviewed_by ? `ตรวจโดย ${currentCase.vet_review.reviewed_by}` : 'รอสัตวแพทย์ลงความเห็นและคำสั่งการรักษา'}
                  </p>
                </div>
              </div>

              {(currentRole === 'veterinarian' || currentRole === 'manager') && (
                <button
                  type="button"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  {showReviewForm ? 'ซ่อนแบบฟอร์ม' : '📝 บันทึกผลวินิจฉัย/สั่งการ'}
                </button>
              )}
            </div>

            {currentCase.vet_review?.confirmed_diagnosis && (
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold">ผลการวินิจฉัยอย่างเป็นทางการ:</span>
                <p className="text-xs font-semibold text-sky-300">{currentCase.vet_review.confirmed_diagnosis}</p>
                {currentCase.vet_review.clinical_notes && (
                  <p className="text-xs text-slate-300 mt-1 italic">
                    บันทึกสัตวแพทย์: {currentCase.vet_review.clinical_notes}
                  </p>
                )}
              </div>
            )}

            {/* Review Form for Vet */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="p-3 bg-slate-950 rounded-xl border border-sky-500/30 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    การวินิจฉัยโรค (Definitive Diagnosis):
                  </label>
                  <input
                    type="text"
                    value={reviewDiagnosis}
                    onChange={(e) => setReviewDiagnosis(e.target.value)}
                    placeholder="เช่น เต้านมอักเสบเฉียบพลัน (Acute Mastitis), หรือ PRRS คัดกรอง"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    บันทึกและคำสั่งการรักษาทางคลินิก (Clinical Notes / Protocol):
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="ระบุข้อกำหนดการกักโรค ยาที่สั่งใช้ หรือการเฝ้าระวังเพิ่มเติม..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">ปรับสถานะเคส:</span>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    >
                      <option value="open">เปิดเคส (Open)</option>
                      <option value="in_progress">กำลังรักษา (In Progress)</option>
                      <option value="vet_review">รอความเห็นสัตวแพทย์ (Vet Review)</option>
                      <option value="resolved">ปิดเคส/รักษาหาย (Resolved)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>บันทึกยืนยัน</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Treatment Log & Follow-up (PRD Section 12 & 32) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">บันทึกยาและการรักษา (Treatment Records & Follow-up)</h3>
                  <p className="text-[11px] text-slate-400">ติดตามผลตอบสนองต่อการรักษาและระยะหยุดยา (Withdrawal)</p>
                </div>
              </div>
            </div>

            {loadingTreatments ? (
              <div className="text-center py-3 text-xs text-slate-400">กำลังโหลดข้อมูลการรักษา...</div>
            ) : treatments.length === 0 ? (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center text-xs text-slate-400">
                ยังไม่มีบันทึกการสั่งยาสำหรับเคสนี้ (สามารถสั่งการได้โดยสัตวแพทย์)
              </div>
            ) : (
              <div className="space-y-2">
                {treatments.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400">{t.treatment_name}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            ขนาด: {t.dosage}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          สั่งโดย: {t.prescribed_by} • เริ่ม {new Date(t.start_date).toLocaleDateString('th-TH')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowFollowupModal(t.id)}
                        className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> บันทึกผลติดตาม
                      </button>
                    </div>

                    {/* Withdrawal Warning */}
                    {t.withdrawal_meat_days > 0 && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        ⚠️ ระยะหยุดยาเนื้อ {t.withdrawal_meat_days} วัน (กำหนดสิ้นสุด: {new Date(t.end_date).toLocaleDateString('th-TH')})
                      </div>
                    )}

                    {/* Follow-up history */}
                    {t.followups && t.followups.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">ประวัติการติดตามผล:</span>
                        {t.followups.map((f, fIdx) => (
                          <div key={fIdx} className="text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                            <div>
                              <span className={`font-bold mr-2 ${
                                f.progression === 'improving' ? 'text-emerald-400' :
                                f.progression === 'stable' ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {f.progression === 'improving' ? '✓ ดีขึ้น' : f.progression === 'stable' ? '• ทรงตัว' : '⚠️ แย่ลง'}
                              </span>
                              <span className="text-slate-300">{f.notes}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(f.date).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Follow-up recording popup modal */}
                    {showFollowupModal === t.id && (
                      <div className="mt-2 p-3 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in">
                        <span className="text-xs font-bold text-white block">
                          บันทึกการติดตามผลประจำวัน ({t.treatment_name})
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFollowupProgression('improving')}
                            className={`flex-1 py-1 text-xs rounded-lg border font-medium cursor-pointer ${
                              followupProgression === 'improving' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            ✓ ดีขึ้น
                          </button>
                          <button
                            type="button"
                            onClick={() => setFollowupProgression('stable')}
                            className={`flex-1 py-1 text-xs rounded-lg border font-medium cursor-pointer ${
                              followupProgression === 'stable' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            • ทรงตัว
                          </button>
                          <button
                            type="button"
                            onClick={() => setFollowupProgression('deteriorating')}
                            className={`flex-1 py-1 text-xs rounded-lg border font-medium cursor-pointer ${
                              followupProgression === 'deteriorating' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            ⚠️ แย่ลง
                          </button>
                        </div>

                        <input
                          type="text"
                          value={followupObs}
                          onChange={(e) => setFollowupObs(e.target.value)}
                          placeholder="รายละเอียดอาการ เช่น เริ่มลุกมากินอาหารเองได้แล้ว..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowFollowupModal(null)}
                            className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitFollowup(t.id)}
                            disabled={submittingFollowup}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {submittingFollowup ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>บันทึกผล</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      🩺 ขั้นตอนการจัดการเบื้องต้นและการกักกัน (Containment Protocols):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {ai.recommended_checks?.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Minimum Necessary Diagnostic Interview (PRD Section 10 & 29) */}
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
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
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
