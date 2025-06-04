import React, { useState } from 'react';
import ChatView from './components/ChatView';
import MessageInput from './components/MessageInput';
import SettingsModal from './components/SettingsModal';
import SessionSidebar from './components/SessionSidebar';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <SessionSidebar />
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
        <ChatView />
        <MessageInput />
      </main>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
