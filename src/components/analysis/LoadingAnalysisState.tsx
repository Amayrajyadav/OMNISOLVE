import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';

interface LoadingAnalysisStateProps {
  activeMode: AnalysisMode;
  fileName: string;
}

export const LoadingAnalysisState: React.FC<LoadingAnalysisStateProps> = ({
  activeMode: _activeMode,
  fileName,
}) => {
  return (
    <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-5 animate-pulse">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-base font-semibold text-slate-100">
          Processing {fileName}
        </h4>
        <p className="text-xs text-slate-400">
          Extracting multimodal features & consulting Gemma 4 model...
        </p>
      </div>

      {/* Progress pill stages */}
      <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
        <span className="text-emerald-400">✓ Ingested</span>
        <span>→</span>
        <span className="text-indigo-400 animate-pulse">Inferencing</span>
        <span>→</span>
        <span className="text-slate-400">Formatting</span>
      </div>
    </div>
  );
};
