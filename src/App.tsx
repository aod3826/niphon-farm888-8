import React, { useState, useEffect } from 'react';
import { UserRole, HealthCase } from './types/farm';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ReportSymptomView } from './components/ReportSymptomView';
import { AnimalsView } from './components/AnimalsView';
import { TasksView } from './components/TasksView';
import { AIVetView } from './components/AIVetView';
import { CaseDetailModal } from './components/CaseDetailModal';
import { 
  Home, 
  AlertTriangle, 
  Users, 
  ClipboardCheck, 
  Sparkles, 
  PlusCircle 
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'report' | 'animals' | 'tasks' | 'ai_vet';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('staff');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [openCasesCount, setOpenCasesCount] = useState<number>(4);
  const [urgentCasesCount, setUrgentCasesCount] = useState<number>(0);
  const [weatherTemp, setWeatherTemp] = useState<number>(30.5);
  const [selectedCaseForModal, setSelectedCaseForModal] = useState<HealthCase | null>(null);

  const fetchSummaryCounts = async () => {
    try {
      const res = await fetch('/api/farm/summary');
      const data = await res.json();
      if (data) {
        setOpenCasesCount(data.open_cases || 0);
        setUrgentCasesCount(data.urgent_cases || 0);
        if (data.weather?.temp_c) {
          setWeatherTemp(data.weather.temp_c);
        }
      }
    } catch (err) {
      console.warn("Summary fetch error", err);
    }
  };

  useEffect(() => {
    fetchSummaryCounts();
    const interval = setInterval(fetchSummaryCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCaseCreated = (newCase: HealthCase) => {
    setSelectedCaseForModal(newCase);
    setActiveTab('dashboard');
    fetchSummaryCounts();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header with Role Switcher & Weather */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        openCasesCount={openCasesCount}
        urgentCasesCount={urgentCasesCount}
        weatherTemp={weatherTemp}
      />

      {/* Main Navigation Tabs (Desktop & Tablet) */}
      <nav className="hidden md:block bg-slate-900/90 border-b border-slate-800 sticky top-[61px] z-30 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 py-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span>หน้าแรก</span>
            </button>

            <button
              onClick={() => setActiveTab('animals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'animals'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>สัตว์และฝูง (Herd)</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              <span>งาน & ติดตาม (Tasks)</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_vet')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ai_vet'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI สัตวแพทย์ & SOP</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              activeTab === 'report'
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>แจ้งสัตว์ป่วย (60s)</span>
          </button>
        </div>
      </nav>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 pt-5">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentRole={currentRole}
            onNavigateToReport={() => setActiveTab('report')}
            onNavigateToTasks={() => setActiveTab('tasks')}
            onNavigateToAnimals={() => setActiveTab('animals')}
            onSelectCase={(c) => setSelectedCaseForModal(c)}
          />
        )}

        {activeTab === 'report' && (
          <ReportSymptomView
            currentRole={currentRole}
            onCaseCreated={handleCaseCreated}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'animals' && (
          <AnimalsView
            currentRole={currentRole}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            currentRole={currentRole}
            onSelectCaseById={async (id) => {
              const res = await fetch('/api/farm/cases');
              const list: HealthCase[] = await res.json();
              const found = list.find(c => c.id === id);
              if (found) setSelectedCaseForModal(found);
            }}
          />
        )}

        {activeTab === 'ai_vet' && (
          <AIVetView
            currentRole={currentRole}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (PRD Section 4.1 & 6) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>หน้าแรก</span>
        </button>

        <button
          onClick={() => setActiveTab('animals')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'animals' ? 'text-sky-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>สัตว์</span>
        </button>

        {/* Big Report Button on Mobile */}
        <button
          onClick={() => setActiveTab('report')}
          className="flex flex-col items-center -mt-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-3 rounded-full shadow-lg shadow-emerald-950/60 border-2 border-slate-950 transition-all"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'tasks' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span>งาน</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_vet')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'ai_vet' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>AI Vet</span>
        </button>
      </nav>

      {/* Case Detail Modal */}
      {selectedCaseForModal && (
        <CaseDetailModal
          caseItem={selectedCaseForModal}
          currentRole={currentRole}
          onClose={() => setSelectedCaseForModal(null)}
          onCaseUpdated={() => {
            fetchSummaryCounts();
          }}
        />
      )}
    </div>
  );
}
