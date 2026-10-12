import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FileValidationErrorProps {
  message: string;
}

export const FileValidationError: React.FC<FileValidationErrorProps> = ({ message }) => {
  return (
    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start space-x-3 text-rose-300 text-xs sm:text-sm animate-fade-in">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-rose-200">Validation Notice</p>
        <p className="text-rose-300/90 mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
