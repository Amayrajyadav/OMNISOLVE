import React, { useState } from 'react';
import { Cpu, AlertTriangle, CheckCircle, Zap, ShieldAlert, Copy, Check } from 'lucide-react';
import { AnalysisResult, CircuitComponentItem } from '../../types/analysis';

interface CircuitResultViewProps {
  result: AnalysisResult;
}

export const CircuitResultView: React.FC<CircuitResultViewProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `OmniSolve AI — Circuit Diagnostic\nFunction: ${result.apparent_function || result.summary}\nPotential Issues: ${result.potential_issues?.join('; ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Functional Summary */}
      <div className="verity-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Apparent Circuit Function</span>
          </span>
          <button
            onClick={handleCopy}
            className="verity-btn-secondary text-xs px-2.5 py-1 flex items-center space-x-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">
          {result.apparent_function || result.summary}
        </h3>
        {result.explanation && (
          <p className="text-xs sm:text-sm text-[#94A0B8] mt-3 leading-relaxed font-normal">
            {result.explanation}
          </p>
        )}
      </div>

      {/* Identified Electronic Components */}
      {result.components_identified && result.components_identified.length > 0 && (
        <div className="verity-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono text-white/90 uppercase tracking-wider">
              Identified Circuit Components ({result.components_identified.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.components_identified.map((comp, idx) => {
              const isObj = typeof comp === 'object';
              const name = isObj ? (comp as CircuitComponentItem).name : String(comp);
              const designator = isObj ? (comp as CircuitComponentItem).designator : undefined;
              const pkg = isObj ? (comp as CircuitComponentItem).package : undefined;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-xs font-medium text-white truncate">{name}</span>
                  </div>
                  {(designator || pkg) && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#94A0B8] border border-white/10">
                      {designator ? `${designator} ` : ''}{pkg ? `(${pkg})` : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Potential Issues & Floating Line Warnings */}
      {result.potential_issues && result.potential_issues.length > 0 && (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3.5">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-mono text-rose-300 uppercase tracking-wider">
              Potential Circuit Flaws & Wiring Risks
            </h4>
          </div>
          <ul className="space-y-2.5">
            {result.potential_issues.map((issue, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-white/90">
                <span className="text-rose-400 font-bold shrink-0">•</span>
                <span className="leading-relaxed">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Bench Verification Steps */}
      {result.steps && result.steps.length > 0 && (
        <div className="verity-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono text-white/90 uppercase tracking-wider">
              Recommended Bench Measurements & Checks
            </h4>
          </div>
          <ol className="space-y-3">
            {result.steps.map((step, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-[#94A0B8]">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed text-white/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Circuit Uncertainties & High Voltage Caveat */}
      {result.uncertainties && result.uncertainties.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-[#94A0B8] space-y-1.5 font-mono">
          <span className="font-semibold text-amber-400 flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Hardware Safety & Interpretation Limitations:</span>
          </span>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[#94A0B8]">
            {result.uncertainties.map((u, idx) => (
              <li key={idx}>{u}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

