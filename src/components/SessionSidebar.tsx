import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export default function SessionSidebar() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().limit(50).toArray(), []);
  const [newTitle, setNewTitle] = useState('');

  const createSession = async () => {
    if (!newTitle.trim()) return;
    await db.sessions.add({
      id: uuidv4(),
      startedAt: Date.now(),
      title: newTitle,
    });
    setNewTitle('');
    // LRU eviction
    const all = await db.sessions.orderBy('startedAt').reverse().toArray();
    if (all.length > 50) {
      const toDelete = all.slice(50);
      await db.sessions.bulkDelete(toDelete.map(s => s.id));
    }
  };

  const deleteSession = async (id: string) => {
    await db.sessions.delete(id);
    await db.messages.where('sessionId').equals(id).delete();
  };

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col gap-2 border-r border-gray-300 dark:border-gray-700">
      <h2 className="font-bold mb-2">Sessions</h2>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 p-1 rounded border"
          placeholder="New session title"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />
        <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={createSession}>+</button>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {sessions?.map(s => (
          <li key={s.id} className="flex items-center justify-between mb-1">
            <span>{s.title}</span>
            <button className="text-red-500" onClick={() => deleteSession(s.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
