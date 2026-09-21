import React, { useState, useEffect } from 'react';
import { Animal, UserRole, AnimalTimelineEvent } from '../types/farm';
import { 
  Search, 
  Filter, 
  Calendar, 
  History, 
  HeartPulse, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  Syringe,
  Baby
} from 'lucide-react';

interface AnimalsViewProps {
  currentRole: UserRole;
  onSelectAnimalForReport?: (animal: Animal) => void;
}

export const AnimalsView: React.FC<AnimalsViewProps> = ({
  currentRole,
  onSelectAnimalForReport
}) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarn, setSelectedBarn] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeAnimal, setActiveAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/farm/animals')
      .then(res => res.json())
      .then(data => {
        setAnimals(data);
        setFilteredAnimals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let list = [...animals];
    if (selectedBarn !== 'all') {
      list = list.filter(a => a.barn_id === selectedBarn);
    }
    if (selectedStatus !== 'all') {
      list = list.filter(a => a.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.animal_code.toLowerCase().includes(q) ||
        a.pen_name.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q)
      );
    }
    setFilteredAnimals(list);
  }, [searchQuery, selectedBarn, selectedStatus, animals]);

  const getStatusBadge = (status: Animal['status']) => {
    switch (status) {
      case 'sick':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">ป่วย / Sick</span>;
      case 'isolated':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">กักโรค / Isolated</span>;
      case 'monitoring':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">เฝ้าระวัง</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ปกติ / แข็งแรง</span>;
    }
  };

  const getTimelineIcon = (type: AnimalTimelineEvent['type']) => {
    switch (type) {
      case 'birth':
        return <Baby className="w-4 h-4 text-sky-400" />;
      case 'vaccination':
        return <Syringe className="w-4 h-4 text-purple-400" />;
      case 'health_case':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'farrowing':
        return <HeartPulse className="w-4 h-4 text-pink-400" />;
      default:
        return <Clock className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🐖 ทะเบียนสัตว์และประวัติฝูง (Herd & Animals)</span>
            </h1>
            <p className="text-xs text-slate-400">ค้นหาประวัติรายตัว รายคอก และไทม์ไลน์สุขภาพตลอดอายุขัย</p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 self-start md:self-auto font-mono">
            แสดง {filteredAnimals.length} จาก {animals.length} ตัว
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ค้นหาเบอร์สุกร (เช่น M128, B201) หรือคอก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedBarn}
              onChange={(e) => setSelectedBarn(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">ทุกโรงเรือน (All Barns)</option>
              <option value="barn-a">โรงเรือน A (แม่พันธุ์อุ้มท้อง & คลอด)</option>
              <option value="barn-b">โรงเรือน B (สุกรขุน)</option>
              <option value="barn-c">โรงเรือน C (อนุบาล & หย่านม)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">ทุกสถานะสุขภาพ</option>
              <option value="sick">ป่วย / Sick</option>
              <option value="monitoring">เฝ้าระวัง / Monitoring</option>
              <option value="healthy">ปกติ / Healthy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Animal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAnimals.map((anim) => (
          <div
            key={anim.id}
            onClick={() => setActiveAnimal(anim)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between shadow-md hover:shadow-xl group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                  {anim.animal_code}
                </span>
                {getStatusBadge(anim.status)}
              </div>

              <div className="text-xs text-slate-400 mb-2">
                สายพันธุ์: <span className="text-slate-200">{anim.breed}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-xl p-2.5 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">ตำแหน่ง</span>
                  <span>{anim.pen_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">น้ำหนัก / อายุ</span>
                  <span>{anim.weight_kg} กก. ({anim.age_months} เดือน)</span>
                </div>
              </div>

              {anim.health_notes && (
                <p className="mt-2.5 text-xs text-amber-300/90 line-clamp-2 bg-amber-950/20 border border-amber-500/20 rounded-lg p-2">
                  ⚠️ {anim.health_notes}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <History className="w-3.5 h-3.5" /> ดู Animal Timeline
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Animal Timeline Modal / Drawer (PRD Section 37) */}
      {activeAnimal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-mono">{activeAnimal.animal_code}</h2>
                  {getStatusBadge(activeAnimal.status)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeAnimal.barn_name} • {activeAnimal.pen_name} • สายพันธุ์ {activeAnimal.breed}
                </p>
              </div>
              <button
                onClick={() => setActiveAnimal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Animal Profile Details */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">เพศ / ชนิด</span>
                <span className="text-white font-medium">{activeAnimal.type} ({activeAnimal.sex})</span>
              </div>
              <div>
                <span className="text-slate-500 block">รอบการคลอด (Parity)</span>
                <span className="text-white font-medium">{activeAnimal.parity ? `ท้องที่ ${activeAnimal.parity}` : 'สุกรขุน'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">น้ำหนักปัจจุบัน</span>
                <span className="text-white font-medium font-mono">{activeAnimal.weight_kg} กิโลกรัม</span>
              </div>
            </div>

            {/* Chronological Timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>ลำดับเหตุการณ์ประวัติสุขภาพ (Chronological Medical Timeline)</span>
                </span>
              </div>

              {activeAnimal.timeline && activeAnimal.timeline.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 my-2">
                  {activeAnimal.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-500/60 flex items-center justify-center text-xs shadow-md">
                        {getTimelineIcon(event.type)}
                      </div>

                      {/* Content */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{event.title}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{event.date}</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {event.description}
                        </p>
                        <div className="text-[10px] text-slate-500 pt-1">
                          ผู้บันทึก: {event.performed_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  ยังไม่มีประวัติการรักษาบันทึกเพิ่มเติม
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-2">
              <button
                onClick={() => setActiveAnimal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
