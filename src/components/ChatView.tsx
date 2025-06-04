import React, { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { marked } from 'marked';

export default function ChatView() {
  // For MVP, use the latest session
  const session = useLiveQuery(() => db.sessions.orderBy('startedAt').last(), []);
  const messages = useLiveQuery(
    () => session ? db.messages.where('sessionId').equals(session.id).sortBy('ts') : [],
    [session]
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
      {messages?.map(msg => (
        <div key={msg.id} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
          {msg.role === 'assistant' ? (
            <div
              className="inline-block px-3 py-2 rounded-lg max-w-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
            />
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
