import React, { useState, useEffect } from 'react';
import { UserRole, FarmProtocol } from '../types/farm';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  ShieldCheck, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';

interface AIVetViewProps {
  currentRole: UserRole;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  time: string;
}

export const AIVetView: React.FC<AIVetViewProps> = ({ currentRole }) => {
  const [protocols, setProtocols] = useState<FarmProtocol[]>([]);
  const [activeTab, setActiveTab] = useState<'consult' | 'protocols'>('consult');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'สวัสดีครับ ผมคือ AI ผู้ช่วยสัตวแพทย์ประจำ นิพนธ์ฟาร์ม พัทลุง พร้อมสนับสนุนการคัดกรองอาการสุกร ตรวจสอบมาตรฐาน SOP ของฟาร์ม และแนวทาง Biosecurity เพื่อความปลอดภัยของฝูงสุกร มีเรื่องใดให้ช่วยตรวจสอบในวันนี้ครับ?',
      time: '08:00',
      source: 'Farm Veterinary Knowledge Base & Gemini AI'
    }
  ]);

  useEffect(() => {
    fetch('/api/farm/protocols')
      .then(res => res.json())
      .then(data => setProtocols(data))
      .catch(console.error);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          role: currentRole === 'staff' ? 'พนักงานฟาร์ม' : currentRole === 'manager' ? 'หัวหน้าฟาร์ม' : 'เจ้าของฟาร์ม'
        })
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'ไม่สามารถรับข้อมูลการตอบกลับได้ในขณะนี้',
        source: data.source || 'AI Veterinary Model',
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'ตรวจพบสุกรไอ 3 ตัวในโรงเรือน B ควรปรับสิ่งแวดล้อมอย่างไร?',
    'ขอขั้นตอนมาตรฐาน Biosecurity พ่นยาฆ่าเชื้อรถเข้าฟาร์ม',
    'วิธีรับมือภาวะความเครียดจากความร้อน (Heat Stress) ในพัทลุง',
    'แม่สุกรซึมไม่กินอาหารหลังคลอด ควรรีบตรวจเช็กสิ่งใดก่อน?'
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>AI สัตวแพทย์ประจำฟาร์ม & คลังความรู้ (AI Vet & RAG)</span>
          </h1>
          <p className="text-xs text-slate-400">
            ระบบสนับสนุนการตัดสินใจ ตอบคำถามทางคลินิก และระเบียบปฏิบัติมาตรฐาน (PRD Section 15 & 47)
          </p>
        </div>

        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('consult')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'consult' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ปรึกษาเคสสุขภาพ (Consultation)
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'protocols' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>มาตรฐาน SOP ฟาร์ม ({protocols.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'consult' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
          {/* Quick Prompts */}
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 shrink-0 flex items-center gap-1">
              ⚡ หัวข้อด่วน:
            </span>
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 px-3 py-1.5 rounded-full transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto justify-end' : ''}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base shrink-0">
                    🩺
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  
                  <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                    {m.source && (
                      <span className="flex items-center gap-1 text-emerald-400/90 font-mono">
                        <ShieldCheck className="w-3 h-3" /> {m.source}
                      </span>
                    )}
                    <span className="font-mono ml-auto">{m.time} น.</span>
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>AI สัตวแพทย์กำลังประมวลผลข้อมูลฟาร์มและมาตรฐานทางคลินิก...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2 focus-within:border-emerald-500">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="พิมพ์ข้อสงสัย เช่น มีสุกรไม่กินอาหาร 2 ตัว ควรทำอย่างไร..."
                className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || loading}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>* AI ทำหน้าที่เป็นระบบสนับสนุนการตัดสินใจ (Decision Support) ไม่ใช่การสั่งยาแทนสัตวแพทย์</span>
              <span className="font-mono">นิพนธ์ฟาร์ม พัทลุง</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'protocols' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocols.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold bg-slate-800 px-2.5 py-0.5 rounded text-emerald-400">
                  {p.code}
                </span>
                <span className="text-[11px] text-slate-400">เวอร์ชัน {p.version}</span>
              </div>

              <h2 className="text-base font-bold text-white">{p.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{p.summary}</p>

              <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 block">
                  ขั้นตอนและระเบียบปฏิบัติ (Approved Steps):
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {p.steps.map((step, sIdx) => (
                    <li key={sIdx}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>อนุมัติโดย: <strong className="text-slate-300">{p.approved_by_vet}</strong></span>
                <span className="text-slate-500">อ้างอิง: {p.reference_source}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
