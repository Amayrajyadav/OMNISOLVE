import React from 'react';
import { Eye, ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { AnalysisMode, AnalysisResult } from '../../types/analysis';
import { StructuredResultViewer } from '../analysis/StructuredResultViewer';
import { ContextualChatPanel } from '../chat/ContextualChatPanel';
import { ChatMessage } from '../../types/chat';
import { formatFileSize } from '../../utils/fileValidation';

interface ResultsWorkspaceViewProps {
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

export const ResultsWorkspaceView: React.FC<ResultsWorkspaceViewProps> = ({
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

  const handleDownloadReport = () => {
    const content = JSON.stringify(result, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnisolve_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Workspace Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E131F] border border-white/[0.08]">
        <div className="flex items-center space-x-3 truncate">
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[#94A0B8] hover:text-white transition-colors cursor-pointer"
            title="Start New Analysis"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="truncate">
            <h3 className="text-sm font-medium text-white truncate" title={selectedFile.name}>
              {selectedFile.name}
            </h3>
            <span className="text-xs text-[#94A0B8] font-mono">
              {formatFileSize(selectedFile.size)} • {activeMode.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadReport}
            className="verity-btn-secondary text-xs px-3.5 py-2 flex items-center space-x-1.5 cursor-pointer"
            title="Download JSON report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
          <button
            onClick={onRetryAnalysis}
            className="verity-btn-secondary text-xs px-3.5 py-2 flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-analyze</span>
          </button>
          <button
            onClick={onReset}
            className="verity-btn-primary text-xs px-4 py-2 cursor-pointer"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Main Grid: Left Side Structured Results (60%) | Right Side Contextual Chat (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Preview (if image) & Structured Diagnostic Cards */}
        <div className="lg:col-span-7 space-y-6">
          {isImage && previewUrl && (
            <div className="verity-card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#94A0B8]">
                <span className="flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#21D2ED]" />
                  <span className="text-white/80">VISUAL INPUT REFERENCE</span>
                </span>
              </div>
              <div className="max-h-72 overflow-hidden rounded-xl border border-white/[0.08] bg-black/50 flex items-center justify-center p-2">
                <img
                  src={previewUrl}
                  alt="Uploaded Schematic or Screenshot"
                  className="max-h-64 object-contain rounded-lg"
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

