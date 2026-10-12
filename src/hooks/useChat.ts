import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { AnalysisMode } from '../types/analysis';
import { apiService } from '../services/api';

export function useChat(
  sessionId: string | null,
  activeMode: AnalysisMode,
  isMockMode: boolean
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const lastQuestionRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isWaiting) return;

      lastQuestionRef.current = trimmed;
      const userMsg: ChatMessage = {
        id: `msg_u_${Date.now()}`,
        sender: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsWaiting(true);
      setChatError(null);

      try {
        const response = await apiService.sendChatMessage(
          {
            session_id: sessionId || 'default_session',
            question: trimmed,
            analysis_type: activeMode,
          },
          isMockMode
        );

        const assistantMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          sender: 'assistant',
          content: response.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve answer from AI.';
        setChatError(errorMsg);
        
        // Add error notification message in chat flow
        const errorChatMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          sender: 'system',
          content: `Error: ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, errorChatMsg]);
      } finally {
        setIsWaiting(false);
      }
    },
    [sessionId, activeMode, isMockMode, isWaiting]
  );

  const retryLastMessage = useCallback(() => {
    if (lastQuestionRef.current && !isWaiting) {
      sendMessage(lastQuestionRef.current);
    }
  }, [sendMessage, isWaiting]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsWaiting(false);
    setChatError(null);
    lastQuestionRef.current = null;
  }, []);

  return {
    messages,
    setMessages,
    isWaiting,
    chatError,
    sendMessage,
    retryLastMessage,
    resetChat,
  };
}
