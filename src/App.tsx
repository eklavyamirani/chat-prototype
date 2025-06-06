import React, { useState } from 'react';
import ChatView from './components/ChatView';
import MessageInput from './components/MessageInput';
import SettingsModal from './components/SettingsModal';
import SessionSidebar from './components/SessionSidebar';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { ChatSession } from './types';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().limit(50).toArray(), []);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Set default session if none selected
  React.useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
    if (sessions && sessions.length === 0 && selectedSessionId) {
      setSelectedSessionId(null);
    }
  }, [sessions, selectedSessionId]);

  const selectedSession = sessions?.find((s: ChatSession) => s.id === selectedSessionId) || null;

  return (
    <div className="flex h-screen">
      <SessionSidebar
        sessions={sessions || []}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />
      <main className="flex-1 flex flex-col">
        <header className="p-2 flex justify-between items-center bg-gray-200 dark:bg-gray-800">
          <h1 className="font-bold text-lg">Chat Prototype</h1>
          <button
            className="px-3 py-1 rounded bg-blue-500 text-white"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </header>
        <ChatView session={selectedSession} />
        <MessageInput session={selectedSession} />
      </main>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
