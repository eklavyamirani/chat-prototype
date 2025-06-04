import React, { useState } from 'react';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from '../config';
import { llmFetch } from '../utils/llmFetch';

export default function MessageInput() {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim()) return;
    setSending(true);
    const config = loadConfig();
    if (!config) {
      alert('Please configure the backend in Settings.');
      setSending(false);
      return;
    }
    // For MVP, use the latest session
    const session = await db.sessions.orderBy('startedAt').last();
    if (!session) {
      setSending(false);
      return;
    }
    // Add user message
    const userMsgId = uuidv4();
    await db.messages.add({
      id: userMsgId,
      sessionId: session.id,
      agent: 'default',
      role: 'user',
      content: value,
      ts: Date.now(),
    });
    setValue('');

    // Add assistant message (empty, to be filled as tokens stream)
    const assistantMsgId = uuidv4();
    await db.messages.add({
      id: assistantMsgId,
      sessionId: session.id,
      agent: 'default',
      role: 'assistant',
      content: '',
      ts: Date.now() + 1, // ensure assistant comes after user
    });

    // Fetch all messages for this session
    const messages = await db.messages.where('sessionId').equals(session.id).sortBy('ts');

    // Stream tokens and update assistant message
    let assistantContent = '';
    await llmFetch({
      config,
      messages,
      onToken: async (token: string) => {
        if (token) {
          assistantContent += token;
          await db.messages.update(assistantMsgId, { content: assistantContent });
        }
      },
    });
    setSending(false);
  };

  return (
    <form
      className="p-4 flex gap-2 bg-gray-100 dark:bg-gray-800"
      onSubmit={e => {
        e.preventDefault();
        handleSend();
      }}
    >
      <textarea
        className="flex-1 resize-none rounded p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        rows={2}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        disabled={sending}
      />
      <button
        type="submit"
        className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
        disabled={sending || !value.trim()}
      >
        Send
      </button>
    </form>
  );
}
