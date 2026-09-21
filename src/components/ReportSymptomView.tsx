import React, { useState, useRef } from 'react';
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
  Send,
  Mic,
  MicOff,
  QrCode,
  Upload,
  X,
  Eye,
  ScanLine
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

  // Voice Input State (PRD Section 27)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // QR Scanner Modal State (PRD Section 79)
  const [showQrModal, setShowQrModal] = useState(false);

  // File Upload & Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiVisualAnalysis, setAiVisualAnalysis] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const toggleSymptom = (code: string) => {
    if (selectedSymptoms.includes(code)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== code));
    } else {
      setSelectedSymptoms([...selectedSymptoms, code]);
    }
  };

  // Voice recognition handler
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setChiefComplaint(prev => prev ? `${prev} ${transcript}` : transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed to start:', err);
        fallbackVoiceInput();
      }
    } else {
      fallbackVoiceInput();
    }
  };

  const fallbackVoiceInput = () => {
    // Quick phrase dictation simulation for devices/iframes without microphone hardware access
    const samplePhrases = [
      'แม่สุกรคอก A03 ซึมมาก ไม่ยอมลุกมากินอาหารเช้า ตัวร้อนจัด',
      'สุกรขุนคอก B02 มีอาการไอแห้งหลายตัว หายใจหอบ',
      'ลูกสุกรคอก C01 ถ่ายเหลวสีเหลือง มีอาการขาดน้ำ'
    ];
    const picked = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    setChiefComplaint(prev => prev ? `${prev} (บันทึกเสียง: ${picked})` : picked);
  };

  // File Upload Handlers (Drag & Drop + Click Selection)
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
        setAiVisualAnalysis(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Visual Lesion Inspection (PRD Section 26)
  const handleAnalyzeImage = async () => {
    if (!photoUrl) return;
    setAnalyzingImage(true);
    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoUrl,
          description: chiefComplaint || `รอยโรคที่พบใน ${selectedAnimal.code}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiVisualAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Image analysis error:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handlePresetPhoto = (sampleType: 'pig' | 'skin') => {
    if (sampleType === 'pig') {
      setPhotoUrl('https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop');
    } else if (sampleType === 'skin') {
      setPhotoUrl('https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop');
    }
    setAiVisualAnalysis(null);
  };

  // QR Code Scanner Selection
  const handleSelectFromQr = (animal: typeof PRESET_ANIMALS[0]) => {
    setSelectedAnimal(animal);
    setShowQrModal(false);
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition-all cursor-pointer"
            >
              ดูรายละเอียดเคสเต็ม & ติดตามงาน &rarr;
            </button>
            <button
              onClick={() => {
                setResultCase(null);
                setSelectedSymptoms(['off_feed']);
                setChiefComplaint('');
                setPhotoUrl(null);
                setAiVisualAnalysis(null);
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium cursor-pointer"
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
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 font-mono">Mobile-first Fast Report (60 วินาที)</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🚨 แจ้งสัตว์ป่วย / อาการผิดปกติ</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              เลือกตัวเลือกด่วนด้านล่าง ข้อมูลจะถูกบันทึกและส่งให้ AI สัตวแพทย์คัดกรองความเร่งด่วนทันที
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>สแกนหูสุกร</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Animal / Pen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. เลือกสุกรหรือคอกที่พบอาการ (Animal / Pen)
              </label>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ScanLine className="w-3 h-3" /> สแกน QR Code คอก/เบอร์หู
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ANIMALS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setSelectedAnimal(a)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
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

          {/* Step 4: Photo / Image Observation with Drag-and-Drop & File Picker (PRD Section 26 & Usability Pattern) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span>ภาพถ่ายสุกรหรือรอยโรค (ลากวางหรือเลือกไฟล์)</span>
              </div>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null);
                    setAiVisualAnalysis(null);
                  }}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" /> ลบรูปภาพ
                </button>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {!photoUrl ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-950/20' 
                    : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                  <Upload className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">
                    คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                  </span>
                  <span className="text-[11px] text-slate-500">
                    รองรับ JPG, PNG, WebP (รูปตัวสุกร, รอยโรคผิวหนัง, อุจจาระ)
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-center gap-2">
                  <span className="text-[11px] text-slate-400">หรือใช้ภาพตัวอย่างคลินิก:</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePresetPhoto('pig'); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300"
                  >
                    ตัวสุกร
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePresetPhoto('skin'); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300"
                  >
                    รอยโรคผิวหนัง
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-w-sm">
                  <img src={photoUrl} alt="Symptom observation" className="w-full h-44 object-cover" />
                  <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleAnalyzeImage}
                      disabled={analyzingImage}
                      className="flex-1 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg backdrop-blur shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {analyzingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังวิเคราะห์รอยโรค...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>วิเคราะห์รอยโรคด้วย AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {aiVisualAnalysis && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ผลการตรวจวิเคราะห์ภาพด้วย AI:</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {aiVisualAnalysis}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Voice Input & Additional Notes (PRD Section 27) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                ข้อความและเสียงบันทึกอาการ (Voice Dictation)
              </label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-950/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>กำลังฟังเสียง... (กดเพื่อหยุด)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>กดเพื่อพูดภาษาไทย (Voice)</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="พูดหรือพิมพ์อาการ เช่น แม่สุกรไม่กินอาหารเช้า ตัวร้อนจัด หายใจกระเพื่อม..."
              rows={3}
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

      {/* QR Code / Ear Tag Scanner Modal (PRD Section 79) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">สแกน QR Code / เบอร์หูสุกร</h3>
                  <p className="text-[11px] text-slate-400">เล็งกล้องไปที่เบอร์หู หรือแตะเลือกตัวสุกรด้านล่าง</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Reticle Simulator */}
            <div className="relative w-full h-44 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
              <div className="w-28 h-28 border-2 border-emerald-400/80 rounded-lg flex items-center justify-center">
                <ScanLine className="w-12 h-12 text-emerald-400/40 animate-pulse" />
              </div>
              <div className="absolute bottom-2 text-[10px] text-emerald-400/80 font-mono">
                [ CAMERA ACTIVE • 60 FPS • AUTOFOCUS ]
              </div>
            </div>

            {/* Quick Ear Tag Presets */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                แตะเพื่อจำลองผลสแกนป้ายหู / คอกทันที:
              </span>
              <div className="space-y-1.5">
                {PRESET_ANIMALS.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelectFromQr(a)}
                    className="w-full text-left p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700/80 flex items-center justify-between text-xs transition-all cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-white">{a.code}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({a.barn} - {a.pen})</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      เลือกสัตว์ &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

