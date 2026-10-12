import React from 'react';
import { ArrowRight, Terminal, Cpu, FileText } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
  onSelectModeShortcut?: (mode: 'code_debugger' | 'circuit_analyzer' | 'document_explainer') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 sm:py-20 px-4 space-y-14 animate-fade-in">
      {/* Hero Header */}
      <div className="space-y-6 text-center">
        {/* Verity Tag Pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-mono tracking-tight shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#21D2ED]" />
          <span>OmniSolve Technical Intelligence</span>
        </div>

        {/* Verity Bold Headline */}
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.03em] text-white max-w-2xl mx-auto leading-[1.08]">
          Understand complex engineering problems.
        </h1>

        {/* Verity Subtitle */}
        <p className="text-base sm:text-lg text-[#94A0B8] max-w-xl mx-auto leading-relaxed font-normal">
          Inspect source code errors, analyze circuit schematics, and synthesize technical documentation in one unified workspace.
        </p>

        {/* Verity Stark White Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="verity-btn-primary w-full sm:w-auto px-7 py-3 text-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Start analyzing</span>
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Verity Architectural Product Card */}
      <div className="verity-card p-5 sm:p-7 relative overflow-hidden">
        {/* Subtle Window Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06] text-xs text-[#94A0B8]">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="font-mono text-[11px] text-[#94A0B8] ml-2">omnisolve.engineering/workspace</span>
          </div>
          <span className="font-mono text-[11px] text-white/50">Gemma 4 • Multimodal Engine</span>
        </div>

        {/* 3 Domain Capabilities Preview in Verity Card Structure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
            <div className="flex items-center space-x-2 text-[#21D2ED] text-xs font-medium">
              <Terminal className="w-4 h-4" />
              <span className="text-white font-medium">Code Debugger</span>
            </div>
            <p className="text-xs text-[#94A0B8] leading-relaxed">
              Traceback resolution, compiler logs, type invariant failures, and syntax-corrected snippets.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-medium">
              <Cpu className="w-4 h-4" />
              <span className="text-white font-medium">Circuit Analyzer</span>
            </div>
            <p className="text-xs text-[#94A0B8] leading-relaxed">
              IC topology, active/passive components, floating line detection, and bench test verification.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
              <FileText className="w-4 h-4" />
              <span className="text-white font-medium">Document Explainer</span>
            </div>
            <p className="text-xs text-[#94A0B8] leading-relaxed">
              Technical datasheets, governing mathematical expressions, and high-yield viva voce examination prep.
            </p>
          </div>
        </div>

        {/* Workflow breadcrumb hint */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <span>PROGRESSIVE WORKFLOW</span>
          <span>SELECT MODE → UPLOAD → REVIEW → RESULTS</span>
        </div>
      </div>
    </div>
  );
};

