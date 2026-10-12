import React from 'react';
import { Terminal, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES } from '../../config/supportedFiles';

interface ModeSelectorCardsProps {
  activeMode: AnalysisMode;
  onSelectMode: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

export const ModeSelectorCards: React.FC<ModeSelectorCardsProps> = ({
  activeMode,
  onSelectMode,
  disabled = false,
}) => {
  const modes = Object.values(ANALYSIS_MODES);

  const getIcon = (id: AnalysisMode) => {
    switch (id) {
      case 'code_debugger':
        return <Terminal className="w-5 h-5 text-indigo-400" />;
      case 'circuit_analyzer':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'document_explainer':
        return <FileText className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBorderColor = (id: AnalysisMode, isSelected: boolean) => {
    if (!isSelected) return 'border-slate-800/80 hover:border-slate-700 bg-slate-900/60';
    switch (id) {
      case 'code_debugger':
        return 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30';
      case 'circuit_analyzer':
        return 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30';
      case 'document_explainer':
        return 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {modes.map((mode) => {
        const isSelected = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMode(mode.id)}
            className={`relative p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${getBorderColor(
              mode.id,
              isSelected
            )} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* Top row with icon & selection indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                {getIcon(mode.id)}
              </div>
              {isSelected ? (
                <span className="flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Selected</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">
                  {mode.badge}
                </span>
              )}
            </div>

            {/* Mode title and tagline */}
            <h3 className="text-base font-semibold text-slate-100 mb-1 tracking-tight">
              {mode.name}
            </h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {mode.description}
            </p>

            {/* Formats tag list */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
              {mode.allowedExtensions.slice(0, 5).map((ext) => (
                <span
                  key={ext}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                >
                  {ext}
                </span>
              ))}
              {mode.allowedExtensions.length > 5 && (
                <span className="text-[10px] font-mono px-1 py-0.5 text-slate-400">
                  +{mode.allowedExtensions.length - 5}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
