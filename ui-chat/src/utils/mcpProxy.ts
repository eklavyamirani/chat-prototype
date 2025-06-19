import { McpTool } from '../types';

// Fetch tools from an MCP server (assumes /v1/tools endpoint)
export async function fetchMcpTools(serverUrl: string): Promise<McpTool[]> {
  const res = await fetch('/api/mcp-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `${serverUrl}` }),
  });

  if (!res.ok) throw new Error('Failed to fetch tools');
  const data = await res.json();
  // Assume data is an array of { name, description, parameters }
  return (data.tools || data).map((tool: any) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    enabled: true, // default to enabled when first added
  }));
}
