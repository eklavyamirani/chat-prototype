import { ChatMessage, ChatConfig } from '../types';

export async function llmFetch({
  config,
  messages,
  functions,
  onToken,
}: {
  config: ChatConfig;
  messages: ChatMessage[];
  functions?: any;
  onToken: (token: string) => void;
}): Promise<void> {
  const { backendUrl, apiKey, model } = config;
  const res = await fetch(`${backendUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
      functions,
    }),
  });

  if (res.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            onToken(json.choices?.[0]?.delta?.content || '');
          } catch {}
        }
      }
    }
  } else {
    // fallback: not streaming
    const json = await res.json();
    onToken(json.choices?.[0]?.message?.content || '');
  }
}
