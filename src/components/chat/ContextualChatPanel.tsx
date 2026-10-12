import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { AnalysisMode } from '../../types/analysis';

interface ContextualChatPanelProps {
  messages: ChatMessage[];
  isWaiting: boolean;
  chatError: string | null;
  activeMode: AnalysisMode;
  fileName: string;
  onSendMessage: (text: string) => void;
  onRetryMessage?: () => void;
}

export const ContextualChatPanel: React.FC<ContextualChatPanelProps> = ({
  messages,
  isWaiting,
  chatError,
  activeMode,
  fileName,
  onSendMessage,
  onRetryMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getSuggestedPrompts = () => {
    switch (activeMode) {
      case 'code_debugger':
        return [
          'Explain this error in simpler terms',
          'Why did this happen on initial render?',
          'How can I write a TypeScript type guard for this?',
        ];
      case 'circuit_analyzer':
        return [
          'What happens if Pin 4 is left floating?',
          'How do I calculate the output oscillation frequency?',
          'Is there any risk of component thermal damage?',
        ];
      case 'document_explainer':
        return [
          'Summarize the core experimental objective',
          'Explain the virtual ground concept in simple words',
          'Give me 3 common viva questions on this topic',
        ];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWaiting]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isWaiting) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0E131F] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-4 py-3.5 bg-[#080C12]/90 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-[#21D2ED]" />
          <span className="text-xs font-medium text-white">
            Contextual AI Assistant
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#94A0B8] truncate max-w-[140px]" title={fileName}>
          {fileName}
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-[320px] max-h-[560px]">
        {/* Context notice */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-[#94A0B8] flex items-start space-x-2.5">
          <Bot className="w-4 h-4 text-[#21D2ED] shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium text-xs">Session initialized</p>
            <p className="text-[11px] mt-0.5 text-[#94A0B8]">
              Ask follow-up questions specifically about <span className="text-white font-mono">{fileName}</span> and findings.
            </p>
          </div>
        </div>

        {/* Suggested pills if no messages sent yet */}
        {messages.length === 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider block">
              Suggested Follow-up Questions:
            </span>
            <div className="space-y-1.5">
              {getSuggestedPrompts().map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] text-xs text-[#94A0B8] hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{prompt}</span>
                  <Sparkles className="w-3 h-3 text-[#64748B] group-hover:text-[#21D2ED] shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat message bubbles */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isError = msg.isError;

          if (isError) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between space-x-2"
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{msg.content}</span>
                </div>
                {onRetryMessage && (
                  <button
                    onClick={onRetryMessage}
                    className="text-[11px] text-rose-300 hover:text-white underline shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-white text-[#080C12]'
                    : 'bg-white/[0.06] border border-white/[0.08] text-[#21D2ED]'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-white text-[#080C12] font-normal shadow-sm'
                    : 'bg-[#080C12] border border-white/[0.08] text-white/90 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span
                  className={`text-[9px] block mt-1 ${
                    isUser ? 'text-[#080C12]/60 text-right' : 'text-[#64748B]'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Assistant Waiting State */}
        {isWaiting && (
          <div className="flex items-center space-x-2.5 text-[#94A0B8] text-xs p-2">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#21D2ED]">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center space-x-1.5 bg-[#080C12] px-3 py-2 rounded-xl border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#21D2ED] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#21D2ED] animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#21D2ED] animate-bounce delay-200" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#080C12] border-t border-white/[0.08]">
        {chatError && (
          <div className="mb-2 p-2 rounded-xl bg-rose-950/20 border border-rose-500/30 text-[11px] text-rose-300 flex items-center justify-between">
            <span>{chatError}</span>
            {onRetryMessage && (
              <button
                type="button"
                onClick={onRetryMessage}
                className="underline font-medium hover:text-white ml-2"
              >
                Retry
              </button>
            )}
          </div>
        )}
        <div className="relative flex items-end bg-[#0E131F] border border-white/[0.08] rounded-xl focus-within:border-white/30 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a question about ${fileName}...`}
            rows={2}
            className="w-full bg-transparent p-3 text-xs sm:text-sm text-white placeholder-[#64748B] resize-none focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isWaiting}
            className="m-2 p-2 rounded-lg bg-white text-[#080C12] hover:bg-slate-200 disabled:opacity-25 transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
        <p className="text-[10px] text-[#64748B] mt-1.5 px-1 flex justify-between font-mono">
          <span>Enter to send • Shift+Enter new line</span>
          <span>Context: {fileName}</span>
        </p>
      </form>
    </div>
  );
};

