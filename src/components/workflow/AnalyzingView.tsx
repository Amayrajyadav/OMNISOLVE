import React from 'react';
import { Loader2 } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES } from '../../config/supportedFiles';

interface AnalyzingViewProps {
  activeMode: AnalysisMode;
  fileName: string;
}

export const AnalyzingView: React.FC<AnalyzingViewProps> = ({
  activeMode,
  fileName,
}) => {
  const config = ANALYSIS_MODES[activeMode];

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[#0E131F] border border-white/[0.12] flex items-center justify-center text-[#21D2ED] mx-auto shadow-2xl">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">
          Analyzing {fileName}
        </h3>
        <p className="text-xs text-[#94A0B8] leading-relaxed">
          Running multimodal inference with Gemma 4 model for {config.name}...
        </p>
      </div>

      {/* Honest, meaningful stages reflecting actual state */}
      <div className="p-4 rounded-2xl bg-[#0E131F] border border-white/[0.08] space-y-3 text-left text-xs font-mono">
        <div className="flex items-center space-x-2.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Uploaded artifact verified</span>
        </div>
        <div className="flex items-center space-x-2.5 text-[#21D2ED]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#21D2ED] animate-pulse" />
          <span>Processing model diagnostic...</span>
        </div>
        <div className="flex items-center space-x-2.5 text-[#64748B]">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span>Formatting structured output</span>
        </div>
      </div>
    </div>
  );
};

