import Dexie, { Table } from 'dexie';
import { ChatMessage, ChatSession } from './types';

export class ChatDB extends Dexie {
  messages!: Table<ChatMessage, string>;
  sessions!: Table<ChatSession, string>;

  constructor() {
    super('chatDB');
    this.version(1).stores({
      messages: 'id, sessionId, ts',
      sessions: 'id, startedAt',
    });
  }
}

export const db = new ChatDB();
