import { AnalysisMode } from './analysis';
import { ChatMessage } from './chat';

export interface Project {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  projectId?: string; // Optional: assigned project or unassigned
  analysisMode: AnalysisMode;
  sessionId?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
