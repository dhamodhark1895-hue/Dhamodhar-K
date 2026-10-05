import React, { useState, useRef, useEffect } from 'react';
import { MissionScenario } from '../types/reconstruction';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Lightbulb,
  Loader2,
  Minimize2,
} from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: MissionScenario;
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const PRESET_QUERIES = [
  'How does YOLOv8 eliminate ghosting artifacts in 3DGS from moving vehicles?',
  'How does Faster R-CNN perform defect and tactical asset inspection?',
  'How do open source tools like COLMAP, OpenDroneMap & CloudCompare compare to Vyom3DGS?',
  'How do we prevent scale dishing in a single linear pass?',
];

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  scenario,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am **Vyom3DGS Copilot**, powered by Gemini 3.1 Pro with High Thinking. I am ready to advise you on single-pass 3D Gaussian Splatting (3DGS), real-time YOLOv8 dynamic suppression, Faster R-CNN high-precision defect inspection, open-source engines (COLMAP, OpenDroneMap, CloudCompare, OpenMVG/OpenMVS, Meshroom, QGIS/PDAL), and sub-10cm metric validation across all 8 operational applications. What would you like to explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle incoming initialQuery
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/reconstruction/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          context: {
            scenarioTitle: scenario.title,
            altitude: scenario.flightAltitudeMeters,
            gsd: scenario.estimatedGsdCm,
            sensor: scenario.cameraModel,
            gcps: scenario.gcps.map((g) => ({ id: g.id, errCm: g.totalErrorCm })),
          },
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(data.error || 'No reply received');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Photogrammetric Copilot Note:** ${err.message || 'Request failed'}. In single-pass missions, ensure RTK dual-frequency fixes and maintain minimum 75% forward overlap to preserve collinear bundle adjustment rigidity.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 md:w-[440px] h-[580px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-mono text-xs font-bold text-white">AEROSCAN COPILOT</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                High Thinking
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Gemini 3.1 Pro Photogrammetry Advisor</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-indigo-950 border border-indigo-700 text-cyan-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed space-y-2">{m.text}</div>
              <div
                className={`text-[9px] font-mono mt-1 ${
                  m.role === 'user' ? 'text-cyan-200 text-right' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-2 rounded bg-slate-950/60 border border-slate-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Gemini 3.1 Pro is thinking through photogrammetric geometry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Queries */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-cyan-300 hover:border-slate-700 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about single-pass flight lines, GCPs, SfM..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
