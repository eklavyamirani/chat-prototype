import { ChatConfig } from './types';

const CONFIG_KEY = 'llm_chat_config';

export function loadConfig(): ChatConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConfig(config: ChatConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig() {
  localStorage.removeItem(CONFIG_KEY);
}
