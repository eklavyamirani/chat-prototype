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

    // Prepare function definitions for LLM (exclude code)
    const functionDefs = (config.functions || []).map(fn => ({
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters
    }));

    // Stream tokens, update assistant message, and accumulate tool call arguments
    let assistantContent = '';
    let toolCalls: Record<string, { name: string; arguments: string }> = {};
    let toolCallsFinished = false;
    await llmFetch({
      config,
      messages,
      functions: functionDefs,
      onToken: async (tokenOrJson: string) => {
        // Only append to assistantContent if delta.content exists, never save raw JSON
        if (tokenOrJson.trim().startsWith('{')) {
          try {
            const data = JSON.parse(tokenOrJson);
            // Handle tool_calls streaming
            const delta = data.choices?.[0]?.delta;
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                // Always use the same id for accumulating name and arguments
                const id = tc.id || Object.keys(toolCalls)[0];
                if (!toolCalls[id]) {
                  toolCalls[id] = { name: tc.function?.name, arguments: '' };
                }
                if (tc.function?.name) {
                  toolCalls[id].name = tc.function.name;
                }
                if (tc.function?.arguments) {
                  toolCalls[id].arguments += tc.function.arguments;
                }
              }
              return;
            }

            // Detect finish_reason for tool_calls
            if (data.choices?.[0]?.finish_reason === 'tool_calls') {
              toolCallsFinished = true;
              return;
            }

            if (delta?.content) {
              assistantContent += delta.content;
              return;
            }
          } catch (err) {
            // Not JSON, ignore
          }
        }
      },
    });
    // ...existing code...

    // If tool calls finished, run each function in sandbox and add tool message
    if (toolCallsFinished && Object.keys(toolCalls).length > 0) {
      for (const id of Object.keys(toolCalls)) {
        const tc = toolCalls[id];
        await db.messages.update(assistantMsgId, { subtext: JSON.stringify(tc) });
        const fnDef = (config.functions || []).find(f => f.name === tc.name);
        if (fnDef) {
          const { FunctionSandbox } = await import('../utils/FunctionSandbox');
          const sandbox = new FunctionSandbox();
          let toolResult = '';
          try {
            const args = tc.arguments ? JSON.parse(tc.arguments) : {};
            const res = await sandbox.runFunction(fnDef.code, args);
            if (res && res.result !== undefined) {
              if (typeof res.result === 'string') {
                toolResult = res.result;
              } else if (res.result !== null && res.result !== undefined) {
                toolResult = JSON.stringify(res.result);
              } else {
                toolResult = '[Function returned empty result]';
              }
            } else if (res && res.error) {
              toolResult = res.error;
            } else {
              toolResult = '[Function returned no result]';
            }
          } catch (err) {
            toolResult = 'Function error: ' + (err?.toString() || 'unknown');
          }
          sandbox.destroy();
          const toolMsg = {
            id: uuidv4(),
            sessionId: session.id,
            agent: 'default',
            role: 'tool' as const,
            content: toolResult,
            ts: Date.now() + 2,
          };
          // ...existing code...
          await db.messages.add(toolMsg);
        }
      }
    } else {
      // If no tool calls, just update the assistant message with the final content
      if (assistantContent.startsWith('{')) {
        const data = JSON.parse(assistantContent);
        if (data?.choices?.[0]?.delta?.content) {
          assistantContent = data.choices[0].delta.content;
        }
      }
      await db.messages.update(assistantMsgId, { content: assistantContent });
    }
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
