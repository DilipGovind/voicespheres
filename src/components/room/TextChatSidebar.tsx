'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { ChatMessageItem } from '@/types/room';
import {
  Send,
  X,
  Download,
  CheckSquare,
  Square,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface TextChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => void;
  currentUserId: string;
}

export function TextChatSidebar({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
}: TextChatSidebarProps) {
  const { announce } = useAccessibility();
  const [inputText, setInputText] = useState('');
  const [hasTranscriptConsent, setHasTranscriptConsent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleDownloadTranscript = () => {
    if (!hasTranscriptConsent) {
      announce('Cannot download transcript without affirmative participant consent.', 'assertive');
      return;
    }

    const transcriptText = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName} ${
            m.isAac ? '(via AAC)' : ''
          }: ${m.text}`
      )
      .join('\n');

    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VoiceSphere-Transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    announce('Transcript downloaded successfully.', 'polite');
  };

  return (
    <aside
      role="complementary"
      aria-label="Text Participation Chat Alongside Voice"
      className="w-full sm:w-80 md:w-96 flex flex-col border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-md h-[calc(100vh-4rem)] fixed right-0 top-16 z-30 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="font-extrabold text-sm text-white">Text Participation</h3>
        </div>

        <button
          onClick={onClose}
          aria-label="Close text chat"
          className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs italic">
            No messages yet. Send a message to chat alongside room voice.
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[11px] text-zinc-400 mb-1">
                  <span className="font-bold text-zinc-300">{msg.senderName}</span>
                  {msg.isAac && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase">
                      AAC
                    </span>
                  )}
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs md:text-sm font-medium max-w-[88%] leading-relaxed ${
                    isSelf
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Transcript Consent & Download Bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
        <label className="flex items-start space-x-2 rtl:space-x-reverse cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={hasTranscriptConsent}
            onChange={(e) => setHasTranscriptConsent(e.target.checked)}
            className="mt-0.5 accent-blue-500 rounded"
          />
          <span className="text-[11px] leading-tight">
            I verify that room participants have provided affirmative consent to save this text transcript.
          </span>
        </label>

        <button
          type="button"
          onClick={handleDownloadTranscript}
          disabled={!hasTranscriptConsent || messages.length === 0}
          className="w-full py-1.5 px-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Transcript (.txt)</span>
        </button>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type text message..."
            aria-label="Send message to room text chat"
            className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs sm:text-sm focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
