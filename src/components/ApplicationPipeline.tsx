import React from 'react';
import { TailoredApplication } from '../types';
import { FileText, Building2, Calendar, Sparkles, ChevronRight, Trash2, CheckCircle2, Send, Clock, Award } from 'lucide-react';

interface ApplicationPipelineProps {
  applications: TailoredApplication[];
  onSelectApplication: (app: TailoredApplication) => void;
  onUpdateStatus: (id: string, status: TailoredApplication['status']) => void;
  onDeleteApplication: (id: string) => void;
}

const COLUMNS: { id: TailoredApplication['status']; title: string; color: string; icon: any }[] = [
  { id: 'Saved', title: 'Saved & Indexing', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock },
  { id: 'Tailored', title: 'AI Tailored', color: 'bg-indigo-50 text-indigo-700 border-indigo-300', icon: Sparkles },
  { id: 'Applied', title: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-300', icon: Send },
  { id: 'Interviewing', title: 'Interviewing', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: Award }
];

export const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({
  applications,
  onSelectApplication,
  onUpdateStatus,
  onDeleteApplication
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            My Applications & AI Tailoring Pipeline
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Track your capstone job search workflow. Click any application card to review your custom ATS bullets and cover letter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Applications: {applications.length}
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No Tailored Applications Yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Go to the Job Discovery tab and click &quot;⚡ AI Tailor Resume & Letter&quot; on any listing to automatically optimize your resume bullets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(column => {
            const appsInCol = applications.filter(a => a.status === column.id);
            const Icon = column.icon;

            return (
              <div key={column.id} className="flex flex-col bg-slate-100/60 rounded-2xl p-4 border border-slate-200/70">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {column.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {appsInCol.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="space-y-3 flex-1">
                  {appsInCol.map(app => (
                    <div
                      key={app.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                      onClick={() => onSelectApplication(app)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          Keyword Match Score: {app.matchScore}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteApplication(app.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {app.jobTitle}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium line-clamp-1">{app.company}</span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {app.tailoredResumeSummary}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {app.createdAt}
                        </span>
                        <div
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Review Resume & Cover Letter</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Quick Status Select */}
                      <div
                        className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-slate-400 mr-1">Move:</span>
                        {COLUMNS.map(c => (
                          <button
                            key={c.id}
                            onClick={() => onUpdateStatus(app.id, c.id)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              app.status === c.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {c.title.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
