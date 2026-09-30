import React, { useState } from 'react';
import { Coins, Home, Heart, BookOpen, Send, Sparkles, AlertTriangle, CheckCircle, Smile } from 'lucide-react';
import { UserProfile } from '../types';

interface FinancialStabilityProps {
  profile: UserProfile;
}

interface LocalResource {
  category: 'childcare' | 'housing' | 'food' | 'career';
  name: string;
  description: string;
  contact: string;
  url: string;
}

export const FinancialStability: React.FC<FinancialStabilityProps> = ({ profile }) => {
  // Budget states
  const [income, setIncome] = useState<number>(2200);
  const [rent, setRent] = useState<number>(1200);
  const [childcare, setChildcare] = useState<number>(500);
  const [food, setFood] = useState<number>(400);
  const [utilities, setUtilities] = useState<number>(250);
  const [numKids, setNumKids] = useState<number>(2);

  // Chatbot states
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: `Hello ${profile.name.split(' ')[0]}! I am your Miami-Dade Financial Stability Coach. Balancing work, bills, and children is incredibly hard, but you are not alone. Ask me about local childcare subsidies (like ELC of Miami-Dade/Monroe), utility assistance programs in Miami-Dade County, or tips on budgeting and finding flexible career opportunities!`
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Calculate Net Cash Flow
  const totalExpenses = rent + childcare + food + utilities;
  const netCashFlow = income - totalExpenses;

  // Local Resources Directory
  const localResources: LocalResource[] = [
    {
      category: 'childcare',
      name: 'Early Learning Coalition of Miami-Dade/Monroe (ELC)',
      description: 'Provides School Readiness child care subsidies that cover a majority of child care/daycare costs for working single parents or parents enrolled in education/training programs.',
      contact: 'Phone: (305) 646-7220',
      url: 'https://www.elcmdm.org'
    },
    {
      category: 'housing',
      name: 'Miami-Dade CAHSD - Community Action & Human Services',
      description: 'Offers emergency rental support, utility bill assistance (LIHEAP), and water bill payment assistance programs for low-to-moderate-income families in Miami-Dade County.',
      contact: 'Phone: (786) 469-4600',
      url: 'https://www.miamidade.gov/global/socialservices/home.page'
    },
    {
      category: 'food',
      name: 'Feeding South Florida & Farm Share Miami-Dade',
      description: 'Provides family food assistance boxes and hosts local school food markets directly within Miami-Dade County Public Schools (M-DCPS) campuses.',
      contact: 'Phone: (305) 631-4211 (JCS 211)',
      url: 'https://feedingsouthflorida.org'
    },
    {
      category: 'career',
      name: 'CareerSource South Florida',
      description: 'Offers single mothers fully funded WIOA vocational scholarship vouchers, tuition grants, job placement services, and career coaching across Miami-Dade County.',
      contact: 'Phone: (305) 594-7615',
      url: 'https://careersourcesfl.com'
    }
  ];

  // Send message to Gemini backend coach
  const handleSendMessage = async () => {
    if (!inputText.trim() || isAiLoading) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setIsAiLoading(true);

    try {
      const promptContext = `
        You are the "Miami-Dade Single Mother Financial Stability Advisor", an empathetic AI coach specialized in assisting single mothers in Miami-Dade County, Florida.
        The user is ${profile.name}, a single mother of ${numKids} living in Miami-Dade County, FL.
        Her current estimated profile is:
        - Monthly Income: $${income}
        - Rent/Housing: $${rent}
        - Childcare costs: $${childcare}
        - Monthly Expenses: $${totalExpenses}
        - Remaining Cash Flow: $${netCashFlow}

        Provide practical, highly supportive, encouraging, and local advice. Mention Miami-Dade programs by name (like Early Learning Coalition of Miami-Dade/Monroe (ELC) childcare subsidies, Miami-Dade CAHSD rental support, CareerSource South Florida, or Miami Dade College options) when relevant.
        Keep answers supportive, well-formatted, and concise (under 200 words). Do not give generic corporate filler. Focus on steps she can take right now.
      `;

      const response = await fetch('/api/stability/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: promptContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error('Response error');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I apologize, I'm experiencing a brief network hiccup. If you are struggling with child care or rental bills, please reach out to the Early Learning Coalition of Miami-Dade/Monroe or JCS 211 Miami directly for immediate relief. How can I assist you with another budgeting or job search question?"
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Budget Calculator */}
      <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Stability Budget</h2>
              <p className="text-xs text-slate-500">Track and optimize your household cash flow</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Number of Kids */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Number of Dependent Children
              </label>
              <select
                value={numKids}
                onChange={e => setNumKids(parseInt(e.target.value))}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value={1}>1 Child</option>
                <option value={2}>2 Children</option>
                <option value={3}>3 Children</option>
                <option value={4}>4+ Children</option>
              </select>
            </div>

            {/* Income Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Net Monthly Income</span>
                <span className="text-indigo-600 font-bold">${income}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={6000}
                step={100}
                value={income}
                onChange={e => setIncome(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Rent Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Rent & Utilities</span>
                <span className="text-amber-600 font-bold">${rent}</span>
              </div>
              <input
                type="range"
                min={500}
                max={2500}
                step={50}
                value={rent}
                onChange={e => setRent(parseInt(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Daycare Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Daycare / Child Care</span>
                <span className="text-rose-500 font-bold">${childcare}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1500}
                step={50}
                value={childcare}
                onChange={e => setChildcare(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
              {childcare > 300 && (
                <p className="text-[10px] text-rose-600 mt-1 leading-normal font-medium">
                  💡 High childcare bills detected. See ELC subsidies in Local Resources!
                </p>
              )}
            </div>

            {/* Food Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Food & Essentials</span>
                <span className="text-emerald-600 font-bold">${food}</span>
              </div>
              <input
                type="range"
                min={200}
                max={1200}
                step={50}
                value={food}
                onChange={e => setFood(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-600">Remaining Savings Cash Flow:</span>
              <span className={`text-base font-extrabold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${netCashFlow}/mo
              </span>
            </div>

            {netCashFlow < 0 ? (
              <div className="flex gap-2 items-start text-[11px] text-rose-700 font-medium mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>
                  <strong>Monthly Shortfall:</strong> You are spending more than your net income. Consider applying for <strong>ELC Daycare subsidies</strong> or exploring higher-paying administrative roles in Miami-Dade County.
                </span>
              </div>
            ) : (
              <div className="flex gap-2 items-start text-[11px] text-emerald-700 font-medium mt-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>
                  <strong>Savings Surplus:</strong> Great! You are in the green. Let's focus on securing stable government jobs or saving for emergency reserves (aim for $1,000 first!).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: Local Resource Directory */}
      <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Miami-Dade County Resources</h2>
              <p className="text-xs text-slate-500">Local support programs for single mothers</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {localResources.map((res, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl p-3.5 hover:border-emerald-200 hover:bg-emerald-50/10 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    res.category === 'childcare' ? 'bg-rose-400' :
                    res.category === 'housing' ? 'bg-amber-400' :
                    res.category === 'food' ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`} />
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{res.name}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">{res.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">{res.contact}</span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Apply Online →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 leading-normal font-medium">
            💡 Dial <strong>2-1-1</strong> on your phone for 24/7 free, confidential help with child care, rental bills, or food assistance in Central Florida.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: AI stability advisor */}
      <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-[520px]">
        {/* Chat Header */}
        <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base leading-tight">Stability AI Advisor</h2>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Empathetic, local coaching by Gemini
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 flex flex-col scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white self-end rounded-br-none'
                  : 'bg-slate-100 text-slate-800 self-start rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {isAiLoading && (
            <div className="bg-slate-100 text-slate-500 self-start rounded-2xl rounded-bl-none px-4 py-2 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Thinking of local programs...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="relative flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask about childcare, utility grants, or careers..."
            className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 pr-10"
          />
          <button
            onClick={handleSendMessage}
            disabled={isAiLoading || !inputText.trim()}
            className="absolute right-2 top-[13px] text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
