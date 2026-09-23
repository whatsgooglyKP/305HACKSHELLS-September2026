import React, { useState } from 'react';
import { TailoredApplication } from '../types';
import { Sparkles, Check, Copy, X, FileText, Briefcase, Download, ChevronRight, CheckCircle2 } from 'lucide-react';
import { formatFullTailoredResumeText } from '../utils/aiSimulator';

interface ResumeTailorModalProps {
  application: TailoredApplication | null;
  isLoading: boolean;
  onClose: () => void;
  onViewAllApplications: () => void;
}

export const ResumeTailorModal: React.FC<ResumeTailorModalProps> = ({
  application,
  isLoading,
  onClose,
  onViewAllApplications
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');
  const [copiedResume, setCopiedResume] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  if (!application && !isLoading) return null;

  const fullResumeText = application?.fullTailoredResumeText || formatFullTailoredResumeText(application?.tailoredResume);

  const handleCopy = (type: 'resume' | 'letter', text: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'resume') {
      setCopiedResume(true);
      setTimeout(() => setCopiedResume(false), 2000);
    } else {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    }
  };

  const handleDownload = (filename: string, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Fallback candidate experience and education if not structured in app object
  const defaultExperience = [
    {
      company: 'ORLANDO HEALTH',
      title: 'Data Analyst, HR Analytics',
      dates: '10/2023 – 03/2026',
      location: 'Orlando, FL',
      bullets: [
        `Leveraged Microsoft Copilot and DAX code to engineer executive Power BI reporting dashboards tailored to target goals at ${application?.company || 'company'}.`,
        'Spearheaded an enterprise automation initiative using MS Power Automate and SQL, streamlining manual HR dashboard pipelines resulting in a 37% productivity boost.',
        'Took end-to-end technical ownership of physician recruitment analytics software lifecycle, from data pipeline construction to automated refreshes and KPI development.',
        'Migrated organizational data from legacy Excel master files to Azure Databricks; engineered a SQL key-matching audit system that improved manager data accuracy from 80% to 99.3%.'
      ]
    },
    {
      company: 'AMAZON',
      title: 'Logistics Associate',
      dates: '10/2017 – 05/2019',
      location: 'Orlando, FL',
      bullets: [
        'Collaborated with management to lead Lean Six Sigma project for Scan Compliance Rate across warehouse logistics workflows.',
        'Identified root cause training deficiencies and implemented a three-pronged standard operating procedure (SOP) training program for incoming personnel.',
        'Elevated daily scan compliance rates from 98.6% to over 99%, demonstrating strong analytical problem-solving and operational execution.'
      ]
    }
  ];

  const defaultEducation = [
    { school: 'Udacity', degree: 'M.S., Artificial Intelligence', dates: '03/2026 – Present' },
    { school: 'Springboard', degree: 'Bootcamp, Data Analytics Career Track', dates: '02/2022 – 03/2023' },
    { school: 'Udacity', degree: 'Nanodegree, Business Analytics', dates: '06/2016 – 01/2017' },
    { school: 'Seminole State College of Florida', degree: 'Technical Cert., Computer Programming', dates: '05/2015 – 06/2016' },
    { school: 'Rollins College', degree: 'B.A., Economics', dates: '08/2011 – 08/2014' },
    { school: 'Seminole State College of Florida', degree: 'A.A., Business', dates: '06/2008 – 05/2010' }
  ];

  const expData = application?.tailoredResume?.experience || defaultExperience;
  const eduData = application?.tailoredResume?.education || defaultEducation;
  const headerData = application?.tailoredResume?.header || {
    name: 'Kevin Pinard',
    email: 'Kevinpolymath@gmail.com',
    phone: '+1 (352) 406-3847',
    location: 'Orlando, FL',
    title: application?.jobTitle || 'AI Agentic Engineer / HR Analytics Professional'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isLoading ? 'Antigravity AI is Tailoring Your Application Package...' : `Tailored Application Package for ${application?.jobTitle}`}
              </h2>
              <p className="text-xs text-slate-500">
                {isLoading
                  ? 'Generating job-specific resume summary, natural keyword-rewritten bullets, and custom cover letter'
                  : `Target Company: ${application?.company} • Full Ready-to-Submit Package`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Generating Tailored Resume & Custom Cover Letter
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                Rewriting professional summary and experience bullets with target keywords while keeping real work history and education 100% truthful.
              </p>
            </div>
          ) : application ? (
            <div className="space-y-6">
              {/* Match Score & Keywords Header Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-xs">
                    {application.matchScore}%
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-900">
                      Keyword Match Score: {application.matchScore}%
                    </div>
                    <p className="text-xs text-slate-500">
                      Hybrid Match Score: 60% Keyword Overlap + 40% Gemini Semantic Embedding Similarity.
                    </p>
                  </div>
                </div>

                {/* Keyword Pills */}
                {application.matchedKeywords && application.matchedKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Matched:</span>
                    {application.matchedKeywords.slice(0, 5).map((kw, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 pt-2 rounded-t-xl border">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'resume'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Full Tailored Resume</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('coverLetter')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'coverLetter'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Custom Cover Letter</span>
                  </button>
                </div>

                {/* Document Actions */}
                <div className="flex items-center gap-2 pb-2">
                  {activeTab === 'resume' ? (
                    <>
                      <button
                        onClick={() => handleCopy('resume', fullResumeText)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedResume ? 'Copied Full Resume' : 'Copy Full Resume'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload(`${application.company}_Tailored_Resume.txt`, fullResumeText)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download (.txt)</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCopy('letter', application.coverLetter)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLetter ? 'Copied Cover Letter' : 'Copy Cover Letter'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload(`${application.company}_Cover_Letter.txt`, application.coverLetter)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download (.txt)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* TAB 1: Full Tailored Resume Paper Document */}
              {activeTab === 'resume' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm space-y-6 font-sans">
                  {/* Resume Header */}
                  <div className="text-center pb-6 border-b border-slate-200">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {(headerData.name || 'KEVIN PINARD').toUpperCase()}
                    </h1>
                    <div className="text-sm font-semibold text-indigo-600 mt-1">
                      Target Role: {headerData.title || application.jobTitle}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-2 flex-wrap">
                      <span>{headerData.email || 'Kevinpolymath@gmail.com'}</span>
                      <span>•</span>
                      <span>{headerData.phone || '+1 (352) 406-3847'}</span>
                      <span>•</span>
                      <span>{headerData.location || 'Orlando, FL'}</span>
                    </p>
                  </div>

                  {/* Professional Summary */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
                      Professional Summary
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/70">
                      {application.tailoredResume?.summary || application.tailoredResumeSummary}
                    </p>
                  </div>

                  {/* Core Competencies & Skills */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
                      Core Competencies & Key Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(application.tailoredResume?.skills || ['Power BI', 'SQL', 'Azure Databricks', 'MS Power Automate', 'Python', 'Agentic Engineering', 'Data Storytelling']).map((skill, idx) => (
                        <span key={idx} className="text-xs font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
                      Professional Experience
                    </h3>
                    <div className="space-y-5">
                      {expData.map((exp, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
                            <div>
                              <span className="font-bold text-slate-900">{exp.company}</span>
                              <span className="text-slate-400 mx-1.5">|</span>
                              <span className="font-semibold text-indigo-700">{exp.title}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500">{exp.dates} {exp.location ? `• ${exp.location}` : ''}</span>
                          </div>
                          <ul className="list-disc ml-5 space-y-1.5 text-sm text-slate-700 leading-relaxed">
                            {exp.bullets.map((bullet, bIdx) => (
                              <li key={bIdx}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
                      Education & Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {eduData.map((edu, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          <div className="font-bold text-slate-900">{edu.school}</div>
                          <div className="text-slate-600 font-medium">{edu.degree}</div>
                          <div className="text-slate-400 mt-0.5">{edu.dates}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Custom Cover Letter Document */}
              {activeTab === 'coverLetter' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm space-y-6 font-sans">
                  <div className="border-b border-slate-200 pb-4">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                      Custom Cover Letter for {application.company}
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      Target Role: {application.jobTitle}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans bg-slate-50/50 p-6 rounded-xl border border-slate-200">
                    {application.coverLetter}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {application ? `Saved to "My Applications" pipeline automatically` : ''}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            {application && (
              <button
                onClick={() => {
                  onClose();
                  onViewAllApplications();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <span>View In Pipeline</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
