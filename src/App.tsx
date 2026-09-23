import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, FileText, CheckSquare, Clock, Bus, Phone, 
  Copy, Check, RotateCcw, Upload, ShieldAlert, Heart, Info, AlertTriangle, Languages, Key, Settings
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  functionName?: string;
}

interface Scenario {
  id: string;
  name: string;
  functionNum: number;
  icon: React.ReactNode;
  description: string;
  prompt: string;
  context: string;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "¡Hola! Men dy pou ou! Hello! I am your Miami-Dade Single Mother Financial Stability Advisor. I serve single mothers and caregivers in Miami-Dade County (The 305).\n\nTell me about an ELC notice you received, ask if you're eligible for childcare subsidies or SNAP, audit your document packet, or plan out late hospitality shifts with Miami-Dade Transit. How can I help you support your children today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [activeContext, setActiveContext] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeMode, setActiveMode] = useState<string>('Dynamic 305 Engine');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // 6 Gemma Functions Playground - Miami-Dade Editions
  const scenarios: Scenario[] = [
    {
      id: 'scen-1',
      name: 'Letter Reader',
      functionNum: 1,
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      description: 'Audit an ELC Miami-Dade warning letter',
      prompt: 'I got this message in my portal: "ELC OF MIAMI-DADE/MONROE WARNING NOTICE: Your School Readiness waitlist status is marked Active. However, your document packet is incomplete. You must submit consecutive paystubs for the past 4 weeks by October 5, 2026, or your application will be cancelled and you will be removed from the waitlist."',
      context: 'User received an incomplete notice warning from ELC of Miami-Dade/Monroe with an October 5th deadline.'
    },
    {
      id: 'scen-2',
      name: 'Eligibility Map',
      functionNum: 2,
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
      description: 'Check child care eligibility in the 305',
      prompt: 'I live in ZIP 33142 (Allapattah), have two children (ages 1 and 4), and I work 25 hours a week at a boutique in Brickell. My lease is signed, and my income is around $1,900 a month. Am I eligible for School Readiness or SNAP?',
      context: 'User in Miami ZIP 33142 with 2 kids (1 & 4), working 25 hours, income $1,900/mo, has a signed lease.'
    },
    {
      id: 'scen-3',
      name: 'Revalidation Tracker',
      functionNum: 3,
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      description: 'Miami Early Learning 6-month rules',
      prompt: 'My status on School Readiness has been "Active" since March. Do I have a childcare seat yet? Also, my work hours just dropped to 15 hours next week. What do I do?',
      context: 'User waitlisted since March (6 months ago), "Active" status, work hours dropping from over 20 to 15.'
    },
    {
      id: 'scen-4',
      name: 'Document Checklist',
      functionNum: 4,
      icon: <CheckSquare className="w-4 h-4 text-indigo-500" />,
      description: 'Verify Miami ELC paperwork logs',
      prompt: 'I have my Florida ID and my kids birth certificates, but my lease has my old address. I am also the only parent in the house and I get paid in cash for cleaning houses in Coral Gables. What papers do I need?',
      context: 'User is a single parent, old lease address in Miami, paid cash, has FL ID and birth certs.'
    },
    {
      id: 'scen-5',
      name: 'Shift & Transit',
      functionNum: 5,
      icon: <Bus className="w-4 h-4 text-rose-500" />,
      description: 'Plan late-shifts & Metrobus rides',
      prompt: 'I work a late hospitality shift in South Beach on Ocean Drive from 5:00 PM to 1:00 AM. I live in ZIP 33147 (Liberty City) and use the Metrobus and Metrorail. Standard daycares are closed. How do I get childcare and get home?',
      context: 'User lives in 33147, works South Beach 5pm-1am, relies on Miami-Dade Transit, needs night childcare.'
    },
    {
      id: 'scen-6',
      name: 'Private Phone',
      functionNum: 6,
      icon: <Phone className="w-4 h-4 text-slate-500" />,
      description: 'Test sensitive Miami parking-lot chat',
      prompt: 'I am on my phone in the parking lot in Brickell. I am afraid to put my kids real names or my housing status. Is it safe to talk to you? Can you tell me ACCESS Florida phone number?',
      context: 'User on mobile, concerned about privacy, needs ACCESS Florida contact.'
    }
  ];

  const quickPills = [
    { label: '🚨 Safety / Abuse Help', text: 'I am scared. My partner hit my 4-year-old child and we are hiding in the car. What do I do?' },
    { label: '🏠 Eviction Tonight', text: 'I got an eviction notice on my door in Allapattah today. I have no money and my kids need a safe place to sleep tonight. Please help.' },
    { label: '🌴 Geofence Check', text: 'Can I text 898211 or apply to CalFresh or OCPS in Orlando to get rent help?' },
    { label: '🇪🇸 En Español', text: 'Hola, tengo una niña de 3 años en La Pequeña Habana (33125) y trabajo 22 horas a la semana. ¿Califico para cuidado infantil?' },
    { label: '🇭🇹 Kreyòl Ayisyen', text: 'Bonjou, mwen se yon manman nan Little Haiti (33150). Mwen bezwen èd pou timoun mwen ale lekòl pandan mwen travay.' }
  ];

  const extractFunctionBadge = (text: string) => {
    const match = text.match(/\*\*Function(?: Used)?:\*\*\s*([^\n\r]+)/i) || 
                  text.match(/\*\*Función:\*\*\s*([^\n\r]+)/i);
    return match ? match[1].replace(/\*\*/g, '').trim() : null;
  };

  const handleSelectScenario = (scen: Scenario, autoRun: boolean = true) => {
    setActiveScenarioId(scen.id);
    setActiveContext(scen.context);
    if (autoRun) {
      setInputText('');
      handleSendMessage(scen.prompt, scen.context);
    } else {
      setInputText(scen.prompt);
    }
  };

  const handleSendMessage = async (overrideText?: string, overrideContext?: string) => {
    const textToSend = overrideText || inputText;
    // CRITICAL: If user typed in inputText directly, do not pass stale activeContext
    const contextToSend = overrideContext !== undefined ? overrideContext : (overrideText ? activeContext : undefined);

    if (!textToSend.trim() || isAiLoading) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: contextToSend,
          apiKey: customApiKey.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply,
            functionName: data.functionName,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        if (data.mode) {
          setActiveMode(data.mode === 'gemini-2.5' ? 'Gemini 2.5 Flash (Live API)' : 'Dynamic 305 Engine');
        }
      } else {
        throw new Error();
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I apologize, our stability system is undergoing standard maintenance. For immediate, secure, and confidential child care or housing assistance in Miami-Dade County, please dial **2-1-1** (Jewish Community Services of South Florida Helpline) or call ELC Miami-Dade/Monroe Family Support at **305-646-7220**.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveMode('Dynamic 305 Engine');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyScript = (text: string) => {
    // Look for script section or quotes
    const scriptIndex = text.indexOf('Script:');
    let textToCopy = text;
    if (scriptIndex !== -1) {
      textToCopy = text.substring(scriptIndex + 7).trim().replace(/^"/, '').replace(/"$/, '');
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: "¡Hola! Men dy pou ou! Hello! I am your Miami-Dade Single Mother Financial Stability Advisor. I serve single mothers and caregivers in Miami-Dade County (The 305).\n\nTell me about an ELC notice you received, ask if you're eligible for childcare subsidies or SNAP, audit your document packet, or plan out late hospitality shifts with Miami-Dade Transit. How can I help you support your children today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setActiveContext('');
    setActiveScenarioId(null);
    setInputText('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white border-b border-emerald-950 shadow-md py-3.5 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs">
              <Heart className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight">
                  Miami-Dade Single Mother Financial Stability Agent
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                  Miami 305 Edition
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-medium">
                Autonomous Economic Mobility & Local Subsidies Router • Miami-Dade County, Florida
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
              title="API Key Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              onClick={handleResetChat}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Optional Settings Drawer */}
        {showSettings && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-slate-900/90 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold shrink-0">
              <Key className="w-4 h-4" />
              <span>Google AI Studio Key (Optional):</span>
            </div>
            <input
              type="password"
              value={customApiKey}
              onChange={e => setCustomApiKey(e.target.value)}
              placeholder="Paste AIzaSy... key for live Gemini 2.5 Flash, or leave empty for Dynamic 305 Engine"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-mono text-xs"
            />
            <span className="text-[10px] text-slate-300 shrink-0">
              Active Mode: <strong className="text-emerald-400">{activeMode}</strong>
            </span>
          </div>
        )}
      </header>

      {/* Main Split Interface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Scenario Tester (Col 1-3) */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 text-emerald-800">
                <ActivityIcon />
                <span>6 Gemma Functions</span>
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Interactive
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Click any scenario card below to test the agent's targeted rules, document checklists, and local routing:
            </p>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {scenarios.map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => handleSelectScenario(scen, true)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md ${
                    activeScenarioId === scen.id
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        activeScenarioId === scen.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {scen.icon}
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{scen.name}</span>
                    </div>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      Function {scen.functionNum}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {scen.description}
                  </p>

                  <div className="flex gap-2 pt-1 border-t border-slate-200/50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectScenario(scen, false);
                      }}
                      className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-white px-2 py-1 rounded-md border border-slate-200"
                    >
                      ✏️ Edit Prompt
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectScenario(scen, true);
                      }}
                      className="text-[10px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-md shadow-2xs ml-auto"
                    >
                      Run Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {activeContext && (
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-[11px] text-amber-900 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Active Context Payload</span>
                  <button
                    onClick={() => {
                      setActiveContext('');
                      setActiveScenarioId(null);
                    }}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline"
                  >
                    Clear
                  </button>
                </div>
                <p className="leading-normal font-mono text-[10px] break-words">{activeContext}</p>
              </div>
            )}
          </div>
        </section>

        {/* MIDDLE COLUMN: High-Fidelity Mobile Chat Console (Col 4-8) */}
        <section className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-900 rounded-[36px] border-[10px] border-slate-950 shadow-xl p-3.5 flex flex-col justify-between h-[660px] relative">
            
            {/* Phone Speaker Slot */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-950 rounded-full flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Mobile Header */}
            <div className="bg-slate-950 text-white rounded-t-2xl py-2.5 px-4 flex items-center justify-between border-b border-slate-800 mt-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-xs">M-DCPS Financial Stability</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Languages className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-emerald-300">305 Trilingual</span>
              </div>
            </div>

            {/* Conversational Stream */}
            <div className="flex-1 bg-slate-950 p-3.5 overflow-y-auto space-y-4 flex flex-col scrollbar-thin">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed flex flex-col gap-1.5 ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white self-end rounded-br-none shadow-xs'
                      : 'bg-slate-800 text-slate-100 self-start rounded-bl-none shadow-sm border border-slate-700/60'
                  }`}
                >
                  {msg.sender === 'ai' && (msg.functionName || extractFunctionBadge(msg.text)) && (
                    <div className="mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-2xs">
                        ⚡ {msg.functionName || extractFunctionBadge(msg.text)}
                      </span>
                    </div>
                  )}
                  <div className="font-medium whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-[9px] self-end flex items-center gap-1 ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopyScript(msg.text)}
                        title="Copy script / reply"
                        className="p-1 hover:bg-slate-700 rounded-md transition-colors ml-1 text-slate-300 hover:text-white"
                      >
                        {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="bg-slate-800 border border-slate-700 text-slate-300 self-start rounded-2xl rounded-bl-none p-3.5 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Evaluating Miami-Dade rules & resources...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Test Chips */}
            <div className="py-2 overflow-x-auto flex gap-1.5 no-scrollbar border-t border-slate-800/80 bg-slate-950 px-1">
              {quickPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveScenarioId(null);
                    setActiveContext('');
                    handleSendMessage(pill.text, '');
                  }}
                  className="whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Interactive Mobile Inputs */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              
              {/* Active Scenario Banner */}
              {activeScenarioId && (
                <div className="flex items-center justify-between px-3 py-1 bg-emerald-950/90 border border-emerald-700/60 rounded-xl text-[10px] text-emerald-300">
                  <span>Selected: <strong>{scenarios.find(s => s.id === activeScenarioId)?.name}</strong></span>
                  <button
                    onClick={() => {
                      setActiveScenarioId(null);
                      setActiveContext('');
                      setInputText('');
                    }}
                    className="hover:text-white underline text-[9px] font-semibold"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Simulated Letters Upload Tool */}
              <div className="flex items-center justify-between px-2.5 py-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-emerald-400" />
                  Simulate document upload
                </span>
                <button 
                  onClick={() => {
                    setInputText('Attached document: [NOTICE of Eligibility / Waitlist Active. ELC Miami-Dade requests proof of Miami-Dade residency by utility bill within 10 days.]');
                  }}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-2 py-0.5 rounded-md transition-colors font-medium text-[9px]"
                >
                  <Upload className="w-2.5 h-2.5 text-emerald-300" />
                  <span>Attach Document</span>
                </button>
              </div>

              {/* Chat Input Field */}
              <div className="relative flex items-center gap-2 bg-slate-950">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ask a question or test a scenario..."
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isAiLoading || !inputText.trim()}
                  className="absolute right-2 top-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white p-2 rounded-lg transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active Reasoner mode */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 px-1">
                <span>Miami-Dade 305 Engine</span>
                <span className="text-emerald-400 font-bold">{activeMode}</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Strict Policy & Geofencing Inspector (Col 9-12) */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Policy Guardrails Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col gap-3.5">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 text-emerald-800">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Geofencing & Guardrails</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rules enforced across all outputs:
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-emerald-700" />
                  Miami-Dade Geofence (The 305!)
                </span>
                <p className="text-[11px] text-emerald-800 leading-normal font-medium">
                  <strong>HARD GEO RULE:</strong> Serves Miami-Dade County, Florida. Any California citation (CalFresh, 211OC, text 898211) OR Orange County, FL (Orlando, OCPS, Lynx bus) is strictly redirected to Miami-Dade counterparts.
                </p>
              </div>

              <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3.5">
                <span className="font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Crisis Safety Overrides
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 font-medium leading-relaxed">
                  <li><strong>Child Abuse:</strong> Immediate lead with 911 and Florida Abuse Hotline (1-800-96-ABUSE).</li>
                  <li><strong>Homeless Tonight:</strong> Direct routing to Miami-Dade Homeless Trust (1-877-994-HELP).</li>
                  <li><strong>Emergency Aid:</strong> JCS 211 Helpline (305-631-4211).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Approved Florida Portals DB */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 text-indigo-800">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>305 Verified Portals</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official assistance directories:
              </p>
            </div>

            <div className="space-y-2 mt-3 overflow-y-auto max-h-[170px] pr-1">
              {[
                { name: 'ELC of Miami-Dade/Monroe', url: 'https://www.elcmdm.org/', desc: 'School Readiness & VPK' },
                { name: 'Florida Early Learning Portal', url: 'https://familyservices.floridaearlylearning.com/', desc: 'Waitlist & Document Upload' },
                { name: 'DCF ACCESS Florida', url: 'https://www.myflfamilies.com/services/public-assistance/access-florida', desc: 'SNAP, TANF, Medicaid' },
                { name: 'JCS 211 Miami Helpline', url: 'https://211miami.org/', desc: 'Crisis, Rent, Food, Utilities' },
                { name: 'M-DCPS Public Schools', url: 'https://www.dadeschools.net/', desc: 'Project UP-START & Meals' },
                { name: 'Miami-Dade Transit (MDT)', url: 'https://www.miamidade.gov/transit', desc: 'Metrobus & Metrorail routes' }
              ].map((site) => (
                <div key={site.name} className="flex justify-between items-center p-2 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{site.name}</span>
                    <span className="text-[10px] text-slate-500">{site.desc}</span>
                  </div>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-600 hover:underline font-bold shrink-0 ml-2"
                  >
                    Open →
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-center bg-slate-50 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-500 font-bold block">
                ELC Miami Multilingual Hotline
              </span>
              <p className="text-xs font-extrabold text-emerald-800">
                305-646-7220 (Eng, Esp, Kreyòl)
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

const ActivityIcon = () => (
  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

export default App;
