import React from 'react';
import { AnalysisMode, AnalysisResult } from '../../types/analysis';
import { CodeResultView } from './CodeResultView';
import { CircuitResultView } from './CircuitResultView';
import { DocumentResultView } from './DocumentResultView';

interface StructuredResultViewerProps {
  result: AnalysisResult;
  activeMode: AnalysisMode;
  onRetry: () => void;
}

export const StructuredResultViewer: React.FC<StructuredResultViewerProps> = ({
  result,
  activeMode,
  onRetry: _onRetry,
}) => {
  return (
    <div className="space-y-6">
      {activeMode === 'code_debugger' && <CodeResultView result={result} />}
      {activeMode === 'circuit_analyzer' && <CircuitResultView result={result} />}
      {activeMode === 'document_explainer' && <DocumentResultView result={result} />}
    </div>
  );
};
