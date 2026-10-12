import React from 'react';
import { Terminal, Cpu, BookOpen, ArrowUpRight } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';

interface SamplePromptsProps {
  onSelectPrompt: (mode: AnalysisMode, sampleText: string) => void;
}

export const SamplePrompts: React.FC<SamplePromptsProps> = ({ onSelectPrompt }) => {
  const samples = [
    {
      mode: 'code_debugger' as AnalysisMode,
      icon: <Terminal className="w-4 h-4 text-indigo-400" />,
      title: 'Debug React TypeError',
      desc: 'Cannot read properties of undefined reading map in component render',
      badge: 'Code Demo',
    },
    {
      mode: 'circuit_analyzer' as AnalysisMode,
      icon: <Cpu className="w-4 h-4 text-amber-400" />,
      title: 'Analyze 555 Timer Schematic',
      desc: 'Verify astable oscillation pins and check for floating reset line',
      badge: 'Circuit Demo',
    },
    {
      mode: 'document_explainer' as AnalysisMode,
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      title: 'Op-Amp Lab Manual Breakdown',
      desc: 'Extract closed-loop formulas, gain bandwidth, and viva questions',
      badge: 'Doc Demo',
    },
  ];

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Explore Sample Technical Scenarios
        </h4>
        <span className="text-[11px] text-slate-400">Click to preview mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {samples.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(s.mode, s.desc)}
            className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 hover:border-slate-700 text-left transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                {s.icon}
                <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {s.title}
                </span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {s.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
