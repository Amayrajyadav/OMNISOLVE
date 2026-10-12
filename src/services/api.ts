import { AnalysisResult, AnalyzePayload, HealthCheckResponse } from '../types/analysis';
import { ChatRequestPayload, ChatResponsePayload } from '../types/chat';
import { MOCK_ANALYSIS_RESULTS, MOCK_CHAT_RESPONSES } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 30000; // 30s timeout for AI inference requests

class ApiService {
  /**
   * Health check to test backend availability and Gemma model readiness.
   */
  async checkHealth(signal?: AbortSignal): Promise<HealthCheckResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check returned status ${response.status}`);
      }

      const data = await response.json();
      return {
        status: data.status || 'ok',
        model_available: Boolean(data.model_available),
        provider: data.provider || 'FastAPI + Gemma Backend',
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const msg = isAbort ? 'Health check timed out (8s)' : err instanceof Error ? err.message : String(err);
      return {
        status: 'error',
        model_available: false,
        provider: `Offline (${msg})`,
      };
    }
  }

  /**
   * Submit file and metadata for AI analysis.
   */
  async analyzeFile(
    payload: AnalyzePayload,
    useMockFallback = false,
    externalSignal?: AbortSignal
  ): Promise<AnalysisResult> {
    if (useMockFallback) {
      // Simulate realistic API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockResult = MOCK_ANALYSIS_RESULTS[payload.analysis_type] || MOCK_ANALYSIS_RESULTS.code_debugger;
      const fileCount = payload.files ? payload.files.length : (payload.file ? 1 : 0);
      const summaryPrefix = fileCount > 1 ? `[Multi-File Analysis: ${fileCount} files processed] ` : '';
      return {
        ...mockResult,
        summary: summaryPrefix + mockResult.summary,
        session_id: `mock_${Date.now()}`,
      };
    }

    const formData = new FormData();
    const filesToUpload = payload.files && payload.files.length > 0 
      ? payload.files 
      : (payload.file ? [payload.file] : []);

    // Append files: Add repeated 'files' field for standard multi-file FastAPI endpoints,
    // and keep 'file' with the primary file for backward compatibility with single-file FastAPI endpoints.
    if (filesToUpload.length > 0) {
      filesToUpload.forEach((f) => {
        formData.append('files', f);
      });
      // Backward compatibility: append first file as 'file'
      formData.append('file', filesToUpload[0]);
    }

    const modeMap: Record<string, string> = {
      code_debugger: 'screenshot',
      circuit_analyzer: 'circuit',
      document_explainer: 'document',
    };
    const mode = modeMap[payload.analysis_type] || payload.analysis_type;
    formData.append('mode', mode);
    formData.append('analysis_type', payload.analysis_type);
    if (payload.question) {
      formData.append('question', payload.question);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const combinedSignal = externalSignal || controller.signal;

    try {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail?.message ||
          errorData.detail ||
          errorData.message ||
          `Backend returned error ${response.status}: ${response.statusText}`
        );
      }

      const json = await response.json();

      // Validate required response fields
      if (!json || typeof json !== 'object') {
        throw new Error('Invalid response structure: Expected JSON object from backend.');
      }
      
      const summaryText =
        json.summary ||
        json.result?.summary ||
        json.result?.overview ||
        'Analysis completed successfully.';

      if (!summaryText) {
        throw new Error('Invalid analysis response: Missing required "summary" field.');
      }

      const rawResult = json.result || {};
      const causes = Array.isArray(rawResult.likely_causes)
        ? rawResult.likely_causes.map((c: { cause?: string; rationale?: string }) => (typeof c === 'string' ? c : `${c.cause}: ${c.rationale}`)).join('\n')
        : rawResult.likely_problem;
      const steps = [
        ...(Array.isArray(rawResult.debugging_steps) ? rawResult.debugging_steps : []),
        ...(Array.isArray(rawResult.suggested_checks) ? rawResult.suggested_checks : []),
        ...(Array.isArray(rawResult.steps) ? rawResult.steps : []),
      ];
      const components = Array.isArray(rawResult.visible_components)
        ? rawResult.visible_components.map((c: { name?: string; visible_label?: string; notes?: string }) => ({
            name: c.name || 'Component',
            designator: c.visible_label,
            description: c.notes,
          }))
        : rawResult.components_identified;
      const issues = Array.isArray(rawResult.possible_issues)
        ? rawResult.possible_issues.map((i: { issue?: string; evidence?: string }) => (typeof i === 'string' ? i : `${i.issue} (${i.evidence || ''})`))
        : rawResult.potential_issues;
      const terms = Array.isArray(rawResult.important_terms)
        ? rawResult.important_terms.map((t: { term?: string; explanation?: string }) => (typeof t === 'string' ? t : `${t.term}: ${t.explanation}`))
        : rawResult.formulas_or_definitions;

      return {
        ...rawResult,
        ...json,
        summary: summaryText,
        analysis_type: json.analysis_type || payload.analysis_type,
        session_id: json.session_id || rawResult.session_id,
        likely_problem: causes || rawResult.likely_problem,
        steps: steps.length > 0 ? steps : rawResult.steps,
        components_identified: components,
        potential_issues: issues,
        formulas_or_definitions: terms,
        key_concepts: rawResult.key_points || rawResult.key_concepts,
        apparent_function: rawResult.apparent_function || rawResult.overview,
        uncertainties: [
          ...(Array.isArray(rawResult.limitations) ? rawResult.limitations : []),
          ...(Array.isArray(rawResult.uncertainties) ? rawResult.uncertainties : []),
          ...(Array.isArray(json.warnings) ? json.warnings : []),
        ],
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Analysis request timed out after 30 seconds. Please check if the model server is responding.');
      }
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to backend at ${BASE_URL}. Ensure the FastAPI server is running and accessible.`);
      }
      throw err;
    }
  }

  /**
   * Send follow-up contextual questions to the active session.
   */
  async sendChatMessage(
    payload: ChatRequestPayload,
    useMockFallback = false,
    externalSignal?: AbortSignal
  ): Promise<ChatResponsePayload> {
    if (useMockFallback) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mode = payload.analysis_type || 'code_debugger';
      const answers = MOCK_CHAT_RESPONSES[mode] || MOCK_CHAT_RESPONSES.code_debugger;
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      return {
        session_id: payload.session_id,
        answer: randomAnswer,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const combinedSignal = externalSignal || controller.signal;

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
          errorData.message ||
          `Chat request failed with status ${response.status}: ${response.statusText}`
        );
      }

      const json = await response.json();
      if (!json || typeof json.answer !== 'string') {
        throw new Error('Invalid response from chat endpoint: Expected "answer" string.');
      }

      return json;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Chat request timed out after 30 seconds.');
      }
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to backend at ${BASE_URL}.`);
      }
      throw err;
    }
  }
}

export const apiService = new ApiService();
