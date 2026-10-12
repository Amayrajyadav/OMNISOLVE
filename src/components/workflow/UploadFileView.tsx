import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, UploadCloud, AlertCircle, Bot, Sparkles, MessageSquareQuote, Check } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES, MAX_FILE_SIZE_BYTES } from '../../config/supportedFiles';
import { formatFileSize } from '../../utils/fileValidation';

interface UploadFileViewProps {
  activeMode: AnalysisMode;
  selectedFile: File | null;
  validationError: string | null;
  userRequirements: string;
  onRequirementsChange: (req: string) => void;
  onFileSelect: (file: File) => boolean;
  onContinue: () => void;
  onBack: () => void;
}

export const UploadFileView: React.FC<UploadFileViewProps> = ({
  activeMode,
  selectedFile,
  validationError,
  userRequirements,
  onRequirementsChange,
  onFileSelect,
  onContinue,
  onBack,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = ANALYSIS_MODES[activeMode];

  const getSuggestedPrompts = () => {
    switch (activeMode) {
      case 'code_debugger':
        return [
          'Find and explain errors',
          'Explain how this code works',
          'Suggest the smallest possible fix',
          'Review a specific issue',
        ];
      case 'circuit_analyzer':
        return [
          'Explain how this circuit works',
          'Identify potential wiring mistakes',
          'Explain the function of each major component',
          'Help investigate a specific circuit problem',
        ];
      case 'document_explainer':
        return [
          'Summarize this document',
          'Explain difficult concepts simply',
          'Extract important formulas',
          'Help me prepare for a viva',
        ];
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#94A0B8]">
          <span>STEP 2 OF 3</span>
          <span>•</span>
          <span className="text-white">UPLOAD & SPECIFY OBJECTIVES</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-white">
            Upload for {config.name}
          </h2>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/80">
            {config.badge}
          </span>
        </div>
        <p className="text-sm text-[#94A0B8]">
          Upload your file and describe what you want the assistant to investigate.
        </p>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded-2xl p-7 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-white/40 bg-white/[0.04]'
            : selectedFile
            ? 'border-white/20 bg-[#0E131F]'
            : 'border-white/[0.12] hover:border-white/25 bg-[#0E131F]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          accept={config.allowedExtensions.join(',')}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/80">
            <UploadCloud className="w-5 h-5 stroke-[1.75]" />
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-medium text-white">
              {selectedFile ? 'Replace uploaded file' : `Drag and drop your file here`}
            </h4>
            <p className="text-xs text-[#94A0B8] mt-0.5 font-normal">
              or <span className="text-white underline underline-offset-2">browse files</span>
            </p>
          </div>

          <div className="text-[11px] text-[#64748B] font-mono space-y-0.5 pt-0.5">
            <p>Supported: {config.allowedExtensions.join(', ')}</p>
            <p>Maximum size: {formatFileSize(MAX_FILE_SIZE_BYTES)}</p>
          </div>
        </div>
      </div>

      {/* Selected file confirmation pill */}
      {selectedFile && (
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs flex items-center justify-between text-white/90">
          <div className="truncate mr-3">
            <span className="font-medium text-[#21D2ED] mr-2">Loaded:</span>
            <span className="font-mono text-white truncate">{selectedFile.name}</span>
            <span className="text-[#94A0B8] ml-2">({formatFileSize(selectedFile.size)})</span>
          </div>
          <span className="text-xs text-emerald-400 font-mono shrink-0 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Ready</span>
          </span>
        </div>
      )}

      {/* User Requirements Assistant Panel (Revealed once file is loaded) */}
      {selectedFile && (
        <div className="verity-card p-6 space-y-4 animate-fade-in border border-[#21D2ED]/30 bg-[#0E131F]/90 shadow-2xl">
          <div className="flex items-start space-x-3 pb-3 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-[#21D2ED]/10 border border-[#21D2ED]/30 flex items-center justify-center text-[#21D2ED] shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white flex items-center space-x-2">
                <span>Requirements Assistant</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70">
                  Step 2
                </span>
              </h3>
              <p className="text-xs text-[#94A0B8] mt-0.5 leading-relaxed">
                I've received your file. What would you like me to help you with?
              </p>
            </div>
          </div>

          {/* Quick Suggested Prompts */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-[#21D2ED]" />
              <span>Suggested Objectives ({config.name}):</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getSuggestedPrompts().map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onRequirementsChange(prompt)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    userRequirements === prompt
                      ? 'bg-white/[0.08] text-white border-[#21D2ED]/50 shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] text-[#94A0B8] hover:text-white border-white/[0.06]'
                  }`}
                >
                  <span className="truncate mr-2">{prompt}</span>
                  {userRequirements === prompt ? (
                    <Check className="w-3 h-3 text-[#21D2ED] shrink-0" />
                  ) : (
                    <span className="text-[10px] text-[#64748B] font-mono shrink-0">+ Use</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Text input / Custom Requirements */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-white/90 flex items-center space-x-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-[#21D2ED]" />
              <span>Specific requirements or questions:</span>
            </label>
            <textarea
              rows={3}
              value={userRequirements}
              onChange={(e) => onRequirementsChange(e.target.value)}
              placeholder="e.g. Focus on memory allocation in line 42, inspect feedback resistor values, or summarize key formulas..."
              className="w-full bg-[#080C12] border border-white/[0.08] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
            <p className="text-[11px] text-[#64748B] font-mono flex justify-between">
              <span>These requirements are included in the diagnostic analysis request.</span>
              <span>{userRequirements.length} chars</span>
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
        <button
          onClick={onBack}
          className="verity-btn-secondary px-4 py-2.5 text-xs font-medium flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Mode</span>
        </button>

        <button
          onClick={onContinue}
          disabled={!selectedFile}
          className="verity-btn-primary px-6 py-2.5 text-xs font-medium flex items-center space-x-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Review & Confirm</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};


