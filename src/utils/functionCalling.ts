// MVP: parse function_call messages and run built-in demo functions in browser

export function handleFunctionCall(message: string): string | null {
  try {
    const data = JSON.parse(message);
    if (data.function_call && data.function_call.name === 'get_time') {
      return JSON.stringify({
        function_call: {
          name: 'get_time',
          result: new Date().toISOString(),
        },
      });
    }
  } catch {}
  return null;
}
