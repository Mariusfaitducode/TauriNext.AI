'use client';

import React from 'react';

type ChatMessageProps = {
  content: string;
  role: 'system' | 'user' | 'assistant' | 'data';
};

export default function ChatMessage({ content, role }: ChatMessageProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] p-4 rounded-lg ${
          role === 'user'
            ? 'bg-foreground text-background rounded-tr-none'
            : 'bg-black/[.05] dark:bg-white/[.06] rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
} 