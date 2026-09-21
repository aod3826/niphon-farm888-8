import React from 'react';
import { UserRole } from '../types/farm';
import { ShieldCheck, CloudSun, UserCheck, Bell } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  openCasesCount: number;
  urgentCasesCount: number;
  weatherTemp: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  openCasesCount,
  urgentCasesCount,
  weatherTemp
}) => {
  const roleLabels: Record<UserRole, { label: string; icon: string; desc: string }> = {
    staff: { label: 'พนักงานฟาร์ม', icon: '👩‍🌾', desc: 'เน้นแจ้งอาการด่วน & บันทึกงาน' },
    manager: { label: 'หัวหน้าฟาร์ม', icon: '👷‍♂️', desc: 'ตรวจงาน มอบหมายงาน & สรุปภาพรวม' },
    owner: { label: 'เจ้าของฟาร์ม', icon: '👨‍🌾', desc: 'Executive Dashboard & สรุปแนวโน้ม' },
    veterinarian: { label: 'สัตวแพทย์คุมฟาร์ม', icon: '🩺', desc: 'วินิจฉัย อนุมัติการรักษา & ตรวจ SOP' },
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Farm Identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner">
              🐖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">นิพนธ์ฟาร์ม (พัทลุง)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  NP-PTL-08
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ระบบบริหารสุขภาพฟาร์ม + AI Veterinary Agent</span>
              </p>
            </div>
          </div>

          {/* Quick weather badge on mobile */}
          <div className="md:hidden flex items-center gap-1 text-xs bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-300">
            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
            <span>{weatherTemp}°C พัทลุง</span>
          </div>
        </div>

        {/* Right: Weather & Role Selector */}
        <div className="flex items-center gap-3 justify-between md:justify-end">
          {/* Weather status */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
            <span>พัทลุง {weatherTemp}°C (ความชื้น 78%)</span>
          </div>

          {/* Alert pill */}
          {urgentCasesCount > 0 ? (
            <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs px-2.5 py-1.5 rounded-xl font-medium animate-pulse">
              <Bell className="w-3.5 h-3.5 text-rose-400" />
              <span>{urgentCasesCount} เคสเร่งด่วน</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{openCasesCount} เคสติดตาม</span>
            </div>
          )}

          {/* Role Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl p-1 shadow-sm">
            <div className="text-slate-400 pl-2 hidden sm:block">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs sm:text-sm font-medium text-white outline-none cursor-pointer pr-2 py-0.5"
            >
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {roleLabels[r].icon} {roleLabels[r].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
