import React from 'react';
import { Eye, ArrowLeft, RefreshCw } from 'lucide-react';
import { AnalysisMode, AnalysisResult } from '../../types/analysis';
import { StructuredResultViewer } from './StructuredResultViewer';
import { ContextualChatPanel } from '../chat/ContextualChatPanel';
import { ChatMessage } from '../../types/chat';
import { formatFileSize } from '../../utils/fileValidation';

interface AnalysisWorkspaceProps {
  selectedFile: File;
  previewUrl: string | null;
  activeMode: AnalysisMode;
  result: AnalysisResult;
  messages: ChatMessage[];
  isWaitingChat: boolean;
  chatError: string | null;
  onSendMessage: (text: string) => void;
  onRetryChatMessage?: () => void;
  onReset: () => void;
  onRetryAnalysis: () => void;
}

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  selectedFile,
  previewUrl,
  activeMode,
  result,
  messages,
  isWaitingChat,
  chatError,
  onSendMessage,
  onRetryChatMessage,
  onReset,
  onRetryAnalysis,
}) => {
  const isImage = selectedFile.type.startsWith('image/');

  return (
    <div className="space-y-6">
      {/* Top Workspace Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center space-x-3 truncate">
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-slate-100 truncate" title={selectedFile.name}>
              {selectedFile.name}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {formatFileSize(selectedFile.size)} • {activeMode.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRetryAnalysis}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-analyze</span>
          </button>
          <button
            onClick={onReset}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Main Grid: Left Side Results & File Preview (60%) | Right Side Contextual Chat (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Inspection Card & Structured AI Results */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Preview Card (Collapsible/Previewable) */}
          {isImage && previewUrl && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Uploaded Visual Input</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">Active Reference</span>
              </div>
              <div className="max-h-72 overflow-hidden rounded-xl border border-slate-850 bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={previewUrl}
                  alt="Uploaded Schematic or Screenshot"
                  className="max-h-64 object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Structured Result Display */}
          <StructuredResultViewer
            result={result}
            activeMode={activeMode}
            onRetry={onRetryAnalysis}
          />
        </div>

        {/* Right Column: Contextual Chat Box */}
        <div className="lg:col-span-5 sticky top-20">
          <ContextualChatPanel
            messages={messages}
            isWaiting={isWaitingChat}
            chatError={chatError}
            activeMode={activeMode}
            fileName={selectedFile.name}
            onSendMessage={onSendMessage}
            onRetryMessage={onRetryChatMessage}
          />
        </div>
      </div>
    </div>
  );
};
