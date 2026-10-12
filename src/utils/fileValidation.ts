import { AnalysisMode } from '../types/analysis';
import { ANALYSIS_MODES } from '../config/supportedFiles';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateFileForMode(file: File, mode: AnalysisMode): ValidationResult {
  const config = ANALYSIS_MODES[mode];
  if (!config) {
    return { isValid: false, errorMessage: `Unknown analysis mode: ${mode}` };
  }

  // Empty file validation
  if (file.size === 0) {
    return {
      isValid: false,
      errorMessage: `"${file.name}" is empty (0 bytes). Please upload a valid technical file.`,
    };
  }

  // Size validation
  if (file.size > config.maxSizeBytes) {
    return {
      isValid: false,
      errorMessage: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(config.maxSizeBytes)}.`,
    };
  }

  // Extension validation
  const fileName = file.name.toLowerCase();
  const hasValidExt = config.allowedExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExt) {
    return {
      isValid: false,
      errorMessage: `"${file.name}" is not supported for ${config.name}. Allowed formats: ${config.allowedExtensions.join(', ')}.`,
    };
  }

  return { isValid: true };
}
