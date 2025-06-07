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
  // Convert functions to tools if present
  let tools = undefined;
  if (functions && Array.isArray(functions) && functions.length > 0) {
    tools = functions.map((fn: any) => ({
      type: 'function',
      function: fn
    }));
  }
  const reqBody: any = {
    model,
    stream: true,
    messages,
  };
  if (tools) reqBody.tools = tools;
  const res = await fetch(`${backendUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(reqBody),
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
          onToken(data);
        }
      }
    }
  } else {
    // fallback: not streaming
    const json = await res.json();
    // Only pass the content string, not the full JSON
    const content = json.choices?.[0]?.message?.content || '';
    onToken(content);
  }
}
