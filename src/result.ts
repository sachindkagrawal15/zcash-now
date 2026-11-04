import type { CallToolResult } from '@modelcontextprotocol/server';

export function textResult(...parts: string[]): CallToolResult {
  return { content: parts.map((text) => ({ type: 'text' as const, text })) };
}

export function errorResult(text: string): CallToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}

export function jsonBlock(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
