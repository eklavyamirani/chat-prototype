import React, { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { marked } from 'marked';
import { ChatMessage } from '../types';

type ChatViewProps = {
  session: { id: string } | null;
};

export default function ChatView({ session }: ChatViewProps) {
  const messages = useLiveQuery(
    () => session ? db.messages.where('sessionId').equals(session.id).sortBy('ts') : [],
    [session]
  ) as ChatMessage[] | undefined;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!session) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">No session selected.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
      {messages?.map((msg: ChatMessage) => (
        <div key={msg.id} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
          {msg.role === 'assistant' ? (
            <div className="inline-block px-3 py-2 rounded-lg max-w-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
              {msg.subtext && (
                <div className="mt-1 text-xs text-gray-500 break-all whitespace-pre-wrap">{msg.subtext}</div>
              )}
            </div>
          ) : (
            <div
              className={`inline-block px-3 py-2 rounded-lg max-w-xl ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
            >
              {msg.content}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
