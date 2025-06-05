export type ChatMessage = {
  id: string;
  sessionId: string;
  agent: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  ts: number;
  subtext?: string; // Optional subtext for assistant messages (e.g., raw JSON)
};

export type ChatSession = {
  id: string;
  startedAt: number;
  title: string;
};

export type UserFunctionDef = {
  name: string;
  description: string;
  parameters: any; // JSON schema object
  code: string; // JS code as string
};

export type ChatConfig = {
  backendUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  agents: string[];
  functions?: UserFunctionDef[];
};
