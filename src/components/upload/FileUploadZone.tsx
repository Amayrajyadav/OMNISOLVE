import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES, MAX_FILE_SIZE_BYTES } from '../../config/supportedFiles';
import { formatFileSize } from '../../utils/fileValidation';

interface FileUploadZoneProps {
  activeMode: AnalysisMode;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  activeMode,
  onFileSelect,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = ANALYSIS_MODES[activeMode];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ${
        isDragging
          ? 'border-indigo-400 bg-indigo-950/20 scale-[0.99]'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        disabled={disabled}
        onChange={handleChange}
        accept={config.allowedExtensions.join(',')}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
        {/* Visual icon badge */}
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8 stroke-[1.5]" />
        </div>

        {/* Action prompt */}
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight">
            Drop your {config.name.toLowerCase()} input here
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            or <span className="text-indigo-400 font-medium underline underline-offset-2">browse files</span> from your computer
          </p>
        </div>

        {/* Accepted formats summary */}
        <div className="bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center gap-2">
          <span>Accepted for {config.name}:</span>
          <span className="font-mono text-indigo-300 font-medium">
            {config.allowedExtensions.slice(0, 6).join(' ')}
            {config.allowedExtensions.length > 6 ? ` +${config.allowedExtensions.length - 6}` : ''}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span>Max {formatFileSize(MAX_FILE_SIZE_BYTES)}</span>
        </div>
      </div>
    </div>
  );
};
