import React, { useState } from 'react';
import { UserRole, HealthCase, AITriageResponse } from '../types/farm';
import { 
  Check, 
  AlertCircle, 
  Camera, 
  Sparkles, 
  Loader2, 
  Thermometer, 
  Users, 
  ArrowLeft,
  ShieldAlert,
  Send
} from 'lucide-react';

interface ReportSymptomViewProps {
  currentRole: UserRole;
  onCaseCreated: (newCase: HealthCase) => void;
  onCancel: () => void;
}

const QUICK_SYMPTOMS = [
  { code: 'off_feed', label: 'ไม่กินอาหาร / เบื่ออาหาร', icon: '🥣' },
  { code: 'lethargy', label: 'ซึม / นอนนิ่งไม่ลุก', icon: '😴' },
  { code: 'fever', label: 'ไข้ / ตัวร้อนจัด', icon: '🌡️' },
  { code: 'coughing', label: 'ไอแห้ง / หายใจมีเสียง', icon: '😮‍💨' },
  { code: 'rapid_breathing', label: 'หายใจหอบ / ท้องกระเพื่อม', icon: '🫁' },
  { code: 'diarrhea', label: 'ท้องเสีย / ถ่ายเหลว', icon: '💧' },
  { code: 'skin_lesion', label: 'ผื่นแดง / จ้ำเลือดตามตัว', icon: '🔴' },
  { code: 'lameness', label: 'เดินกะเผลก / ขาเจ็บ', icon: '🦵' },
  { code: 'abortion', label: 'แท้งลูก / มีมูกไหล', icon: '⚠️' },
  { code: 'swelling', label: 'บวม / เต้านมคัดแข็ง', icon: '🧊' },
  { code: 'vomiting', label: 'อาเจียน', icon: '🤮' },
  { code: 'death', label: 'พบสุกรตายเฉียบพลัน', icon: '☠️' },
];

const PRESET_ANIMALS = [
  { id: 'anim-128', code: 'แม่สุกร M128', pen: 'คอก A03 (แม่พันธุ์)', barn: 'โรงเรือน A' },
  { id: 'anim-129', code: 'แม่สุกร M129', pen: 'คอก A01 (แม่พันธุ์)', barn: 'โรงเรือน A' },
  { id: 'anim-201', code: 'สุกรขุน B201', pen: 'คอก B02 (สุกรขุน)', barn: 'โรงเรือน B' },
  { id: 'anim-301', code: 'ลูกสุกร C301', pen: 'คอก C01 (อนุบาล)', barn: 'โรงเรือน C' },
  { id: 'pen-custom', code: 'ระบุเฉพาะหมายเลขคอก / กลุ่ม', pen: 'คอก B03', barn: 'โรงเรือน B' }
];

export const ReportSymptomView: React.FC<ReportSymptomViewProps> = ({
  currentRole,
  onCaseCreated,
  onCancel
}) => {
  const [selectedAnimal, setSelectedAnimal] = useState(PRESET_ANIMALS[0]);
  const [customCode, setCustomCode] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['off_feed']);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [affectedCount, setAffectedCount] = useState<number>(1);
  const [temperature, setTemperature] = useState<string>('39.5');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Smart Form additional conditions
  const [coughDetails, setCoughDetails] = useState('ไอแห้งต่อเนื่อง');
  const [diarrheaDetails, setDiarrheaDetails] = useState('สีเหลืองเหลว');

  const [submitting, setSubmitting] = useState(false);
  const [resultCase, setResultCase] = useState<HealthCase | null>(null);

  const toggleSymptom = (code: string) => {
    if (selectedSymptoms.includes(code)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== code));
    } else {
      setSelectedSymptoms([...selectedSymptoms, code]);
    }
  };

  const handlePresetPhoto = (sampleType: 'pig' | 'skin' | 'feces') => {
    // High quality clinical photo placeholders
    if (sampleType === 'pig') {
      setPhotoUrl('https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop');
    } else if (sampleType === 'skin') {
      setPhotoUrl('https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !chiefComplaint) return;

    setSubmitting(true);
    try {
      const activeSymptomObjs = selectedSymptoms.map(code => {
        const found = QUICK_SYMPTOMS.find(s => s.code === code);
        return {
          code,
          name_th: found?.label || code,
          severity,
          onset: new Date().toISOString()
        };
      });

      const fullComplaint = chiefComplaint.trim() || 
        `${selectedAnimal.code} พบอาการ: ${activeSymptomObjs.map(s => s.name_th).join(', ')} (จำนวน ${affectedCount} ตัว)`;

      const payload = {
        animal_id: selectedAnimal.id.startsWith('pen') ? undefined : selectedAnimal.id,
        animal_code: customCode.trim() || selectedAnimal.code,
        barn_id: selectedAnimal.barn === 'โรงเรือน A' ? 'barn-a' : selectedAnimal.barn === 'โรงเรือน B' ? 'barn-b' : 'barn-c',
        barn_name: selectedAnimal.barn,
        pen_name: selectedAnimal.pen,
        affected_count: affectedCount,
        reported_by: currentRole === 'staff' ? 'กานดา มีสุข (พนักงาน)' : currentRole === 'manager' ? 'วิทยา สุขใส (หัวหน้า)' : 'ผู้ใช้ระบบ',
        reported_by_role: currentRole,
        chief_complaint: fullComplaint,
        symptoms: activeSymptomObjs,
        temperature_c: temperature ? parseFloat(temperature) : undefined,
        photos: photoUrl ? [photoUrl] : []
      };

      const res = await fetch('/api/farm/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create case');

      const savedCase: HealthCase = await res.json();
      setResultCase(savedCase);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  // If already submitted and triage is ready, show quick triage summary with diagnostic question
  if (resultCase) {
    const ai = resultCase.ai_triage;
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">บันทึกข้อมูลเรียบร้อยแล้ว</h2>
              <p className="text-xs text-slate-300 font-mono">รหัสเคส {resultCase.case_number} • บันทึกลงฐานข้อมูลแล้ว</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">ผลการประเมินความเร่งด่วน (AI Triage):</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                resultCase.triage_level === 'RED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                resultCase.triage_level === 'ORANGE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                resultCase.triage_level === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                ระดับ {resultCase.triage_level}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {ai?.summary || resultCase.chief_complaint}
            </p>

            {/* Minimum Necessary Question (PRD Section 10) */}
            {ai?.questions && ai.questions.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> คำถามตรวจเพิ่มเพื่อลดความไม่แน่นอน:
                </span>
                <p className="text-xs text-slate-200">
                  {ai.questions[0]}
                </p>
              </div>
            )}

            {ai?.safety_notes && ai.safety_notes.length > 0 && (
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-800">
                ⚠️ {ai.safety_notes[0]}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onCaseCreated(resultCase)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition-all"
            >
              ดูรายละเอียดเคสเต็ม & ติดตามงาน &rarr;
            </button>
            <button
              onClick={() => {
                setResultCase(null);
                setSelectedSymptoms(['off_feed']);
                setChiefComplaint('');
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
            >
              + แจ้งเคสอื่นต่อ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </button>
        <span className="text-xs text-emerald-400 font-mono">Mobile-first Fast Report (60 วินาที)</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🚨 แจ้งสัตว์ป่วย / อาการผิดปกติ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            เลือกตัวเลือกด่วนด้านล่าง ข้อมูลจะถูกบันทึกและส่งให้ AI สัตวแพทย์คัดกรองความเร่งด่วนทันที
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Animal / Pen */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. เลือกสุกรหรือคอกที่พบอาการ (Animal / Pen)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ANIMALS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setSelectedAnimal(a)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedAnimal.id === a.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{a.code}</div>
                  <div className="text-[11px] text-slate-400">{a.pen}</div>
                </button>
              ))}
            </div>

            {selectedAnimal.id === 'pen-custom' && (
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="ระบุเบอร์สัตว์ หรือชื่อคอก เช่น สุกรขุนคอก B04"
                className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Step 2: Quick Symptoms Chips (PRD Section 7) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              2. เลือกอาการที่สังเกตพบ (Quick Symptoms - กดเลือกได้หลายข้อ)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_SYMPTOMS.map((s) => {
                const isSelected = selectedSymptoms.includes(s.code);
                return (
                  <button
                    type="button"
                    key={s.code}
                    onClick={() => toggleSymptom(s.code)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800/70 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Forms: Contextual sub-questions (PRD Section 28) */}
          {selectedSymptoms.includes('coughing') && (
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl space-y-1.5">
              <span className="text-xs text-amber-300 font-medium">📋 ลักษณะอาการไอเพิ่มเติม:</span>
              <div className="flex gap-2">
                {['ไอแห้งตอนเช้า', 'ไอเสียงก้องมีเสมหะ', 'ไอต่อเนื่องตลอดวัน'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setCoughDetails(opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      coughDetails === opt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSymptoms.includes('diarrhea') && (
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl space-y-1.5">
              <span className="text-xs text-amber-300 font-medium">💧 ลักษณะอุจจาระ:</span>
              <div className="flex gap-2 flex-wrap">
                {['สีเหลืองเหลว', 'สีขาวน้ำนม', 'มีมูกปนเลือด', 'สีเทาเข้ม'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setDiarrheaDetails(opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      diarrheaDetails === opt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Vital Signs & Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> จำนวนสุกรที่มีอาการ (ตัว)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={affectedCount}
                onChange={(e) => setAffectedCount(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" /> อุณหภูมิทางทวารหนัก (°C)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="เช่น 39.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* Step 4: Optional Photo / Image Observation */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>ภาพถ่ายสุกรหรือรอยโรค (ทางเลือกเพื่อประกอบการตรวจ)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePresetPhoto('pig')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300"
              >
                📷 แนบภาพตัวสุกร
              </button>
              <button
                type="button"
                onClick={() => handlePresetPhoto('skin')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300"
              >
                🔍 แนบภาพรอยโรคผิวหนัง
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="text-xs text-rose-400 hover:underline ml-auto"
                >
                  ลบรูป
                </button>
              )}
            </div>

            {photoUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700 w-32 h-24">
                <img src={photoUrl} alt="Symptom observation" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Additional notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ข้อความเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="เช่น อาหารเช้าไม่กินเลย หายใจถี่กว่าตัวอื่น..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || selectedSymptoms.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังบันทึกและรัน AI Triage...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>บันทึกเคส & วิเคราะห์ด่วนด้วย AI Vet</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              ✓ ข้อมูลจะถูกบันทึกลงระบบทันที และ AI จะประเมินระดับความเร่งด่วนตามหลักสัตวแพทย์
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
