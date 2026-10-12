export type AnalysisMode = 'code_debugger' | 'circuit_analyzer' | 'document_explainer';

export interface AnalysisModeConfig {
  id: AnalysisMode;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  accentColor: string;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}

export interface CircuitComponentItem {
  name: string;
  designator?: string;
  package?: string;
  description?: string;
}

export interface AnalysisResult {
  session_id?: string;
  analysis_type: AnalysisMode;
  summary: string;
  findings?: string[];
  explanation?: string;
  likely_problem?: string;
  suggested_solution?: string;
  solution_code?: string;
  components_identified?: (string | CircuitComponentItem)[];
  apparent_function?: string;
  potential_issues?: string[];
  key_concepts?: string[];
  formulas_or_definitions?: string[];
  suggested_viva_questions?: { question: string; answer: string }[];
  steps?: string[];
  uncertainties?: string[];
}

export interface AnalyzePayload {
  file?: File;
  files?: File[];
  analysis_type: AnalysisMode;
  question?: string;
}

export interface HealthCheckResponse {
  status: string;
  model_available: boolean;
  provider?: string;
}
