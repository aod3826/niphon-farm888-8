import React, { useState, useEffect } from 'react';
import { UserRole, HealthCase, FarmTask, Barn } from '../types/farm';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Thermometer, 
  ArrowUpRight, 
  PlusCircle, 
  ClipboardList, 
  ShieldAlert, 
  RefreshCw,
  Eye,
  Calendar
} from 'lucide-react';

interface DashboardViewProps {
  currentRole: UserRole;
  onNavigateToReport: () => void;
  onNavigateToTasks: () => void;
  onNavigateToAnimals: () => void;
  onSelectCase: (caseItem: HealthCase) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentRole,
  onNavigateToReport,
  onNavigateToTasks,
  onNavigateToAnimals,
  onSelectCase
}) => {
  const [summary, setSummary] = useState<any>(null);
  const [cases, setCases] = useState<HealthCase[]>([]);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingBriefing, setRefreshingBriefing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, casesRes, tasksRes, barnsRes, briefRes] = await Promise.all([
        fetch('/api/farm/summary').then(r => r.json()),
        fetch('/api/farm/cases').then(r => r.json()),
        fetch('/api/farm/tasks').then(r => r.json()),
        fetch('/api/farm/barns').then(r => r.json()),
        fetch('/api/ai/daily-briefing').then(r => r.json())
      ]);

      setSummary(sumRes);
      setCases(casesRes);
      setTasks(tasksRes);
      setBarns(barnsRes.barns || []);
      setBriefing(briefRes);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshBriefing = async () => {
    setRefreshingBriefing(true);
    try {
      const res = await fetch('/api/ai/daily-briefing');
      const data = await res.json();
      setBriefing(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingBriefing(false);
    }
  };

  const getTriageBadge = (level: string) => {
    switch (level) {
      case 'RED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>เร่งด่วน RED</span>;
      case 'ORANGE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ความเสี่ยงสูง ORANGE</span>;
      case 'YELLOW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">เฝ้าระวัง YELLOW</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ปกติ GREEN</span>;
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm">กำลังโหลดข้อมูลสุขภาพฟาร์ม...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 5 Core Questions Quick Bar (PRD Section 5) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>ภาพรวมสุขภาพฟาร์ม 5 คำถามหลัก (5 Core Answers)</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              สถานการณ์ฟาร์มวันนี้: {summary?.health_trend || 'ปกติ - เฝ้าระวังตามเกณฑ์'}
            </h1>
          </div>

          <button
            onClick={onNavigateToReport}
            className="flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all text-sm w-full md:w-auto"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ แจ้งสัตว์ป่วยใหม่ (60 วินาที)</span>
          </button>
        </div>

        {/* 5 Metrics Cards corresponding to the 5 PRD questions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-5">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs text-slate-400">1. สุกรทั้งหมด</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-white font-mono">{summary?.total_animals}</span>
              <span className="text-xs text-slate-400">ตัว</span>
            </div>
            <span className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> ความสมบูรณ์ 88%
            </span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs text-slate-400">2. กำลังป่วย/เฝ้าระวัง</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-amber-400 font-mono">{summary?.sick_animals + summary?.monitoring_animals}</span>
              <span className="text-xs text-slate-400">ตัว</span>
            </div>
            <span className="text-[11px] text-amber-300 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> ใน 2 คอก (A03, B02)
            </span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs text-slate-400">3. เคสเร่งด่วน (RED)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-rose-400 font-mono">{summary?.urgent_cases || 0}</span>
              <span className="text-xs text-slate-400">เคส</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              {summary?.urgent_cases === 0 ? '✓ ไม่มีเคสวิกฤต' : '⚠️ ต้องกักโรคด่วน'}
            </span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs text-slate-400">4. งานค้างที่ต้องทำ</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-sky-400 font-mono">{summary?.pending_tasks}</span>
              <span className="text-xs text-slate-400">งาน</span>
            </div>
            <button 
              onClick={onNavigateToTasks}
              className="text-[11px] text-sky-300 hover:text-sky-200 mt-2 flex items-center gap-1 text-left"
            >
              ดูรายการงาน &rarr;
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400">5. ตายวันนี้ (Mortality)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-emerald-400 font-mono">{summary?.today_mortality || 0}</span>
              <span className="text-xs text-slate-400">ตัว</span>
            </div>
            <span className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              ✓ อยู่ในเกณฑ์ปกติ
            </span>
          </div>
        </div>
      </div>

      {/* AI Daily Farm Vet Briefing (PRD Section 14) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>สรุปสุขภาพฟาร์มประจำวัน (Daily Farm Vet Briefing)</span>
                <span className="text-[11px] font-normal text-slate-400 font-mono">21 ก.ย. 2026</span>
              </h2>
              <p className="text-xs text-slate-400">ประมวลผลด้วย AI Veterinary Agent ผสานข้อมูลสดในฟาร์มและสภาพอากาศพัทลุง</p>
            </div>
          </div>

          <button
            onClick={refreshBriefing}
            disabled={refreshingBriefing}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="รีเฟรชสรุปสุขภาพ"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingBriefing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {briefing && (
          <div className="space-y-3 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 text-sm">
            <div className="font-semibold text-emerald-300">
              📢 {briefing.headline}
            </div>
            <p className="text-slate-300 leading-relaxed">
              {briefing.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> สิ่งที่ต้องจัดการด่วนวันนี้:
                </span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {briefing.urgent_actions?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1 mb-1.5">
                  <Thermometer className="w-3.5 h-3.5" /> การจัดการสภาพแวดล้อม & ตรวจเช็ก:
                </span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {briefing.checks_for_today?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barns Grid & Environment */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-emerald-400" />
            <span>สภาพแวดล้อมโรงเรือน (Barns & Climate)</span>
          </h2>
          <span className="text-xs text-slate-400">ควบคุมอัตโนมัติ • พ่นหมอก & พัดลม</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {barns.map((barn) => (
            <div
              key={barn.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">{barn.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  barn.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {barn.status === 'warning' ? 'เฝ้าระวัง' : 'ปกติ'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                จำนวนสุกร: <span className="font-bold text-slate-200">{barn.current_count}</span> / {barn.capacity} ตัว
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/50 rounded-lg p-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block">อุณหภูมิ</span>
                  <span className="font-mono font-bold text-white text-sm">{barn.temperature}°C</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ความชื้นสัมพัทธ์</span>
                  <span className="font-mono font-bold text-white text-sm">{barn.humidity}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Health Cases Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <span>เคสสุขภาพที่กำลังติดตาม (Active Clinical Cases)</span>
            </h2>
            <p className="text-xs text-slate-400">บันทึกโดยพนักงาน & วิเคราะห์โดย AI Triage</p>
          </div>
          <button
            onClick={onNavigateToReport}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            + บันทึกเคสใหม่
          </button>
        </div>

        <div className="space-y-3">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c)}
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                    {c.case_number}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {c.animal_code || 'ไม่ระบุเบอร์'} ({c.pen_name})
                  </span>
                  {getTriageBadge(c.triage_level)}
                  <span className="text-xs text-slate-400 font-mono">
                    จำนวน: {c.affected_count} ตัว
                  </span>
                </div>
                <p className="text-sm text-slate-200 line-clamp-1">
                  {c.chief_complaint}
                </p>
                {c.ai_triage?.summary && (
                  <p className="text-xs text-emerald-400/90 line-clamp-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>AI: {c.ai_triage.summary}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <div className="text-right text-xs text-slate-400 hidden sm:block">
                  <div>ผู้แจ้ง: {c.reported_by}</div>
                  <div className="text-[11px] text-slate-500">{new Date(c.reported_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-700/60 text-slate-300 hover:text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
