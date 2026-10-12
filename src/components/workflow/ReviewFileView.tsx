import React from 'react';
import { ArrowLeft, ArrowRight, FileText, Image, RefreshCw, MessageSquareQuote } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES } from '../../config/supportedFiles';
import { formatFileSize } from '../../utils/fileValidation';

interface ReviewFileViewProps {
  selectedFile: File;
  previewUrl: string | null;
  activeMode: AnalysisMode;
  userRequirements: string;
  onRequirementsChange: (req: string) => void;
  onAnalyze: (customQuestion?: string) => void;
  onReplaceFile: () => void;
  onBack: () => void;
}

export const ReviewFileView: React.FC<ReviewFileViewProps> = ({
  selectedFile,
  previewUrl,
  activeMode,
  userRequirements,
  onRequirementsChange,
  onAnalyze,
  onReplaceFile,
  onBack,
}) => {
  const config = ANALYSIS_MODES[activeMode];
  const isImage = selectedFile.type.startsWith('image/');

  const handleStartAnalysis = () => {
    onAnalyze(userRequirements.trim() ? userRequirements.trim() : undefined);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#94A0B8]">
          <span>STEP 3 OF 3</span>
          <span>•</span>
          <span className="text-white">REVIEW & CONFIRM</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-white">
          Review before analysis
        </h2>
        <p className="text-sm text-[#94A0B8]">
          Confirm your artifact and objectives before initiating inference.
        </p>
      </div>

      {/* File Card & Preview */}
      <div className="verity-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2">
            {isImage ? <Image className="w-4 h-4 text-amber-400" /> : <FileText className="w-4 h-4 text-[#21D2ED]" />}
            <span className="text-xs font-mono text-white/90">Target Artifact</span>
          </div>
          <button
            onClick={onReplaceFile}
            className="text-xs text-[#94A0B8] hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Replace file</span>
          </button>
        </div>

        {/* Optional Image Thumbnail Preview */}
        {isImage && previewUrl && (
          <div className="max-h-56 overflow-hidden rounded-xl border border-white/[0.08] bg-black/50 flex items-center justify-center p-2">
            <img
              src={previewUrl}
              alt="File preview"
              className="max-h-52 object-contain rounded-lg"
            />
          </div>
        )}

        {/* File Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[#64748B] text-[10px] font-mono block">FILE NAME</span>
            <span className="text-white font-medium truncate block mt-1" title={selectedFile.name}>
              {selectedFile.name}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[#64748B] text-[10px] font-mono block">SIZE</span>
            <span className="text-white font-medium block mt-1">
              {formatFileSize(selectedFile.size)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] col-span-2 sm:col-span-1">
            <span className="text-[#64748B] text-[10px] font-mono block">ANALYSIS MODE</span>
            <span className="text-white font-medium block mt-1">
              {config.name}
            </span>
          </div>
        </div>

        {/* Editable User Requirements Summary */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/90 flex items-center space-x-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-[#21D2ED]" />
              <span>User Requirements / Prompt to Gemma:</span>
            </label>
            <span className="text-[10px] font-mono text-[#64748B]">Editable</span>
          </div>
          <textarea
            rows={3}
            value={userRequirements}
            onChange={(e) => onRequirementsChange(e.target.value)}
            placeholder="No specific requirements specified. The assistant will perform a comprehensive diagnostic inspection."
            className="w-full bg-[#080C12] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-white/30 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
        <button
          onClick={onBack}
          className="verity-btn-secondary px-4 py-2.5 text-xs font-medium flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={handleStartAnalysis}
          className="verity-btn-primary px-7 py-2.5 text-xs font-medium flex items-center space-x-2 cursor-pointer"
        >
          <span>Analyze with OmniSolve</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
