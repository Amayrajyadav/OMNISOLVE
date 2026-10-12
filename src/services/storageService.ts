import { Project, Conversation } from '../types/project';

const STORAGE_PROJECTS_KEY = 'omnisolve_projects_v1';
const STORAGE_CONVERSATIONS_KEY = 'omnisolve_conversations_v1';

export const storageService = {
  getProjects(): Project[] {
    try {
      const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  },

  getConversations(): Conversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Cleanse messages: do not keep raw objectURLs that could be dead on reload
      return parsed.map((c) => ({
        ...c,
        messages: (c.messages || []).map((m: any) => ({
          ...m,
          attachment: m.attachment
            ? {
                name: m.attachment.name,
                size: m.attachment.size,
                type: m.attachment.type,
                previewUrl: null,
              }
            : undefined,
          attachments: Array.isArray(m.attachments)
            ? m.attachments.map((att: any) => ({
                id: att.id,
                name: att.name,
                size: att.size,
                type: att.type,
                previewUrl: null,
              }))
            : undefined,
        })),
      }));
    } catch {
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      // Serialize conversations safely without bulky binary payloads
      const sanitized = conversations.map((c) => ({
        ...c,
        messages: (c.messages || []).map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp,
          isError: m.isError,
          attachment: m.attachment
            ? {
                name: m.attachment.name,
                size: m.attachment.size,
                type: m.attachment.type,
              }
            : undefined,
          attachments: Array.isArray(m.attachments)
            ? m.attachments.map((att) => ({
                id: att.id,
                name: att.name,
                size: att.size,
                type: att.type,
              }))
            : undefined,
          analysisResult: m.analysisResult,
        })),
      }));
      localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to save conversations to localStorage:', e);
    }
  },
};
