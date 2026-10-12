import { AnalysisMode, AnalysisModeConfig } from '../types/analysis';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB per file
export const MAX_FILES_COUNT = 5; // Up to 5 files simultaneously
export const MAX_TOTAL_FILES_SIZE_BYTES = 50 * 1024 * 1024; // 50MB total per message

export const ANALYSIS_MODES: Record<AnalysisMode, AnalysisModeConfig> = {
  code_debugger: {
    id: 'code_debugger',
    name: 'Code Debugger',
    tagline: 'Fix crashes, syntax bugs & stack traces',
    description: 'Diagnose runtime exceptions, compiler tracebacks, and terminal error screenshots with actionable root-cause analysis.',
    badge: 'Code & Logs',
    accentColor: '#6366F1',
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.txt', '.py', '.js', '.ts', '.tsx', '.jsx', '.c', '.cpp', '.log'],
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'text/x-python',
      'application/javascript',
      'text/javascript',
      'text/typescript',
      'text/x-c',
      'text/x-c++'
    ],
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
  },
  circuit_analyzer: {
    id: 'circuit_analyzer',
    name: 'Circuit Analyzer',
    tagline: 'Inspect schematics, components & pinouts',
    description: 'Identify circuit topology, IC pinouts, floating lines, and missing passives from schematic diagrams or breadboard captures.',
    badge: 'Schematics & ECE',
    accentColor: '#F59E0B',
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
  },
  document_explainer: {
    id: 'document_explainer',
    name: 'Document Explainer',
    tagline: 'Understand technical PDFs & lab manuals',
    description: 'Distill dense engineering lab manuals, component datasheets, and lecture notes into formulas, summaries, and viva questions.',
    badge: 'PDFs & Manuals',
    accentColor: '#10B981',
    allowedExtensions: ['.pdf', '.txt', '.md'],
    allowedMimeTypes: ['application/pdf', 'text/plain', 'text/markdown'],
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
  },
};
