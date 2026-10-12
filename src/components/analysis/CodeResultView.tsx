import React, { useState } from 'react';
import { Copy, Check, Terminal, AlertTriangle, Lightbulb, ListChecks } from 'lucide-react';
import { AnalysisResult } from '../../types/analysis';

interface CodeResultViewProps {
  result: AnalysisResult;
}

export const CodeResultView: React.FC<CodeResultViewProps> = ({ result }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyCode = () => {
    if (!result.solution_code) return;
    navigator.clipboard.writeText(result.solution_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopySummary = () => {
    const text = `OmniSolve AI — Code Diagnostic\nSummary: ${result.summary}\nLikely Problem: ${result.likely_problem}\nFix: ${result.suggested_solution}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="verity-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-[#21D2ED] uppercase tracking-wider">
            Diagnostic Summary
          </span>
          <button
            onClick={handleCopySummary}
            className="verity-btn-secondary text-xs px-2.5 py-1 flex items-center space-x-1 cursor-pointer"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Copied' : 'Copy Summary'}</span>
          </button>
        </div>
        <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">
          {result.summary}
        </h3>
        {result.explanation && (
          <p className="text-xs sm:text-sm text-[#94A0B8] mt-3 leading-relaxed font-normal">
            {result.explanation}
          </p>
        )}
      </div>

      {/* Likely Cause / Root Problem */}
      {result.likely_problem && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start space-x-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono text-amber-300 uppercase tracking-wider">
              Identified Root Cause
            </h4>
            <p className="text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
              {result.likely_problem}
            </p>
          </div>
        </div>
      )}

      {/* Suggested Code Solution */}
      {result.solution_code && (
        <div className="verity-card overflow-hidden">
          <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-[#21D2ED]" />
              <span className="text-xs font-medium text-white">
                Recommended Solution Code
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="verity-btn-secondary text-xs px-3 py-1 flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed bg-[#080C12]/90">
            <code>{result.solution_code}</code>
          </pre>
        </div>
      )}

      {/* Actionable Debugging Steps */}
      {result.steps && result.steps.length > 0 && (
        <div className="verity-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <ListChecks className="w-4 h-4 text-[#21D2ED]" />
            <h4 className="text-xs font-mono text-white/90 uppercase tracking-wider">
              Verification & Debugging Steps
            </h4>
          </div>
          <ol className="space-y-3">
            {result.steps.map((step, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-[#94A0B8]">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed text-white/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Uncertainties & Assumptions Warning */}
      {result.uncertainties && result.uncertainties.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-[#94A0B8] space-y-1.5 font-mono">
          <span className="font-semibold text-white/80 flex items-center space-x-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Limitations & Verification Notice:</span>
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
