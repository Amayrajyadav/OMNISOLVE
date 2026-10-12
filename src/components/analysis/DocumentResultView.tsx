import React, { useState } from 'react';
import { BookOpen, HelpCircle, FileText, Copy, Check, Hash } from 'lucide-react';
import { AnalysisResult } from '../../types/analysis';

interface DocumentResultViewProps {
  result: AnalysisResult;
}

export const DocumentResultView: React.FC<DocumentResultViewProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="verity-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Document Synthesis</span>
          </span>
          <button
            onClick={handleCopySummary}
            className="verity-btn-secondary text-xs px-2.5 py-1 flex items-center space-x-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
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

      {/* Extracted Core Concepts */}
      {result.key_concepts && result.key_concepts.length > 0 && (
        <div className="verity-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono text-white/90 uppercase tracking-wider">
              Core Technical Principles & Theoretical Takeaways
            </h4>
          </div>
          <ul className="space-y-3">
            {result.key_concepts.map((concept, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                <span className="leading-relaxed">{concept}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Formulas & Equations */}
      {result.formulas_or_definitions && result.formulas_or_definitions.length > 0 && (
        <div className="verity-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-[#21D2ED]" />
            <h4 className="text-xs font-mono text-white/90 uppercase tracking-wider">
              Essential Equations & Mathematical Models
            </h4>
          </div>
          <div className="space-y-2.5">
            {result.formulas_or_definitions.map((formula, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#080C12] border border-white/[0.08] font-mono text-xs sm:text-sm text-[#21D2ED]"
              >
                {formula}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viva / Oral Examination Prep Questions */}
      {result.suggested_viva_questions && result.suggested_viva_questions.length > 0 && (
        <div className="verity-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono text-white/90 uppercase tracking-wider">
              High-Yield Viva Voce & Laboratory Exam Questions
            </h4>
          </div>
          <div className="space-y-3">
            {result.suggested_viva_questions.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-xs font-mono font-bold text-amber-400 shrink-0">Q{idx + 1}:</span>
                  <p className="text-xs sm:text-sm font-medium text-white">{item.question}</p>
                </div>
                <div className="pl-6 border-l border-white/[0.08] text-xs sm:text-sm text-[#94A0B8] leading-relaxed">
                  <span className="text-emerald-400 font-medium mr-1.5">Answer:</span>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uncertainties & Extracted Document Limitations */}
      {result.uncertainties && result.uncertainties.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-[#94A0B8] space-y-1.5 font-mono">
          <span className="font-semibold text-white/80">Document Boundary Caveats:</span>
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

