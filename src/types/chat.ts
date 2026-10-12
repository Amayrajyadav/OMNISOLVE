import { AnalysisMode } from './analysis';

export type MessageSender = 'user' | 'assistant' | 'system';

export interface AttachmentItem {
  id?: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  isError?: boolean;
  attachment?: AttachmentItem; // Backward compatibility with single attachment
  attachments?: AttachmentItem[]; // Multi-file attachments
  analysisResult?: import('./analysis').AnalysisResult;
}

export interface ChatRequestPayload {
  session_id: string;
  question: string;
  analysis_type?: AnalysisMode;
}

export interface ChatResponsePayload {
  session_id?: string;
  answer: string;
}
