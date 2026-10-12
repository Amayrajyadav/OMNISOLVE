import React from 'react';
import { Cpu, Terminal, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';

interface AppHeaderProps {
  activeMode: AnalysisMode;
  isOnline: boolean;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onReset: () => void;
  hasActiveAnalysis: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeMode,
  isOnline,
  isMockMode,
  onToggleMockMode,
  onReset,
  hasActiveAnalysis,
}) => {
  const getModeIcon = () => {
    switch (activeMode) {
      case 'code_debugger':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case 'circuit_analyzer':
        return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
      case 'document_explainer':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getModeLabel = () => {
    switch (activeMode) {
      case 'code_debugger':
        return 'Code Debugger';
      case 'circuit_analyzer':
        return 'Circuit Analyzer';
      case 'document_explainer':
        return 'Document Explainer';
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#080C12]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Brand logo & tagline */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onReset}
          className="flex items-center space-x-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-white/15 to-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-white/20">
            <span className="font-mono font-medium text-white text-sm">Ω</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white text-sm tracking-tight transition-colors">
                OmniSolve
              </span>
              <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/10">
                Gemma 4
              </span>
            </div>
            <p className="text-[11px] text-[#94A0B8] hidden sm:block tracking-normal">
              Technical Intelligence
            </p>
          </div>
        </button>
      </div>

      {/* Center status pill */}
      <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0E131F] border border-white/[0.08]">
        {getModeIcon()}
        <span className="text-xs font-normal text-[#94A0B8]">{getModeLabel()} Active</span>
      </div>

      {/* Right controls: Backend health & Mock switch */}
      <div className="flex items-center space-x-2.5">
        {/* Backend health status badge */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-normal border ${
            isOnline
              ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/20'
              : 'bg-amber-950/30 text-amber-300 border-amber-500/20'
          }`}
          title={isOnline ? 'FastAPI Backend Online' : 'FastAPI Backend Offline'}
        >
          {isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
        </div>

        {/* Development Mock Mode Toggle */}
        <button
          onClick={onToggleMockMode}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center space-x-1.5 cursor-pointer ${
            isMockMode
              ? 'bg-white/[0.08] text-white border-white/20'
              : 'bg-transparent text-[#94A0B8] border-white/[0.08] hover:text-white hover:border-white/15'
          }`}
          title="Toggle mock responses for local frontend inspection"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{isMockMode ? 'Mock Mode' : 'Live API'}</span>
        </button>

        {/* New analysis reset action button */}
        {hasActiveAnalysis && (
          <button
            onClick={onReset}
            className="verity-btn-primary text-xs px-3.5 py-1.5 cursor-pointer"
          >
            + New Analysis
          </button>
        )}
      </div>
    </header>
  );
};

