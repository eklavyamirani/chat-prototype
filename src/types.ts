export type ChatMessage = {
  id: string;
  sessionId: string;
  agent: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  ts: number;
};

export type ChatSession = {
  id: string;
  startedAt: number;
  title: string;
};

export type ChatConfig = {
  backendUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  agents: string[];
};
