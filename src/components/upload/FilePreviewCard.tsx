import React from 'react';
import { File, Trash2, ArrowRight, Eye, Code2, Cpu, FileText } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { formatFileSize } from '../../utils/fileValidation';

interface FilePreviewCardProps {
  file: File;
  previewUrl: string | null;
  activeMode: AnalysisMode;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  file,
  previewUrl,
  activeMode,
  onClear,
  onAnalyze,
  isAnalyzing,
}) => {
  const isImage = file.type.startsWith('image/');

  const getModeIcon = () => {
    switch (activeMode) {
      case 'code_debugger':
        return <Code2 className="w-4 h-4 text-indigo-400" />;
      case 'circuit_analyzer':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'document_explainer':
        return <FileText className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          {getModeIcon()}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Selected File Ready For Analysis
          </span>
        </div>
        <button
          onClick={onClear}
          disabled={isAnalyzing}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
      </div>

      {/* Main File Information & Optional Image Preview */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Preview Container */}
        {isImage && previewUrl ? (
          <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative group">
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className="w-full h-full object-contain p-1"
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[11px] text-slate-200 flex items-center space-x-1 bg-slate-900/90 px-2 py-1 rounded border border-slate-700">
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full md:w-32 h-28 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-3 text-center">
            <File className="w-8 h-8 text-slate-500 mb-1" />
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">
              {file.name.split('.').pop() || 'FILE'}
            </span>
          </div>
        )}

        {/* File details description */}
        <div className="flex-1 space-y-1.5 w-full">
          <div className="flex items-center space-x-2">
            <h4 className="text-base font-semibold text-slate-100 truncate max-w-sm" title={file.name}>
              {file.name}
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {formatFileSize(file.size)}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Detected format: <span className="font-mono text-slate-300">{file.type || 'plain/code'}</span>
          </p>
          <p className="text-xs text-slate-500">
            Ready to process using the multimodal pipeline. Click Analyze to begin.
          </p>
        </div>

        {/* Primary Analyze Action Button */}
        <div className="w-full md:w-auto">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{isAnalyzing ? 'Analyzing with Gemma...' : 'Analyze File'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
