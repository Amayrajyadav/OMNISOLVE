import React from 'react';
import { ArrowLeft, ArrowRight, Terminal, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES } from '../../config/supportedFiles';

interface SelectModeViewProps {
  selectedMode: AnalysisMode;
  onSelectMode: (mode: AnalysisMode) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const SelectModeView: React.FC<SelectModeViewProps> = ({
  selectedMode,
  onSelectMode,
  onContinue,
  onBack,
}) => {
  const modes = Object.values(ANALYSIS_MODES);

  const getIcon = (id: AnalysisMode) => {
    switch (id) {
      case 'code_debugger':
        return <Terminal className="w-4 h-4 text-[#21D2ED]" />;
      case 'circuit_analyzer':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'document_explainer':
        return <FileText className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getCardStyle = (_id: AnalysisMode, isSelected: boolean) => {
    if (!isSelected) {
      return 'border-white/[0.08] bg-[#0E131F] hover:border-white/[0.16] hover:bg-[#121827] text-left';
    }
    return 'border-white/30 bg-[#141B2B] ring-1 ring-white/20 text-left';
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-fade-in">
      {/* Header & Step progress */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#94A0B8]">
          <span>STEP 1 OF 3</span>
          <span>•</span>
          <span className="text-white">SELECT ANALYSIS MODE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-white">
          Choose what you want to analyze
        </h2>
        <p className="text-sm text-[#94A0B8]">
          Select an engineering domain to apply specialized multimodal inspection rules.
        </p>
      </div>

      {/* 3 Domain Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${getCardStyle(
                mode.id,
                isSelected
              )}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    {getIcon(mode.id)}
                  </div>
                  {isSelected && (
                    <span className="flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20">
                      <CheckCircle2 className="w-3 h-3 text-[#21D2ED]" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-medium text-white mb-1.5 tracking-tight">
                  {mode.name}
                </h3>
                <p className="text-xs text-[#94A0B8] leading-relaxed mb-4 font-normal">
                  {mode.description}
                </p>
              </div>

              {/* Supported extensions snippet */}
              <div className="pt-3 border-t border-white/[0.06] flex flex-wrap gap-1 text-[10px] font-mono text-[#64748B]">
                {mode.allowedExtensions.slice(0, 4).join(' ')}
                {mode.allowedExtensions.length > 4 && ` +${mode.allowedExtensions.length - 4}`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Nav Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
        <button
          onClick={onBack}
          className="verity-btn-secondary px-4 py-2.5 text-xs font-medium flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={onContinue}
          className="verity-btn-primary px-6 py-2.5 text-xs font-medium flex items-center space-x-2 cursor-pointer"
        >
          <span>Continue to Upload</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};

