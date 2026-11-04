import { readdirSync, readFileSync } from 'node:fs';
import { fromRoot } from './paths.js';

export type RecipeStatus = 'verified' | 'partial' | 'unverified';

const STATUSES: RecipeStatus[] = ['verified', 'partial', 'unverified'];

export interface Recipe {
  id: string;
  title: string;
  task: string;
  stack: string;
  tools: string[];
  status: RecipeStatus;
  checkedAt: string;
  evidence: string;
  body: string;
}

type Meta = Record<string, string | string[]>;

// Recipes use a small front-matter subset: `key: value` and `key: [a, b]`.
export function parseFrontMatter(source: string): { meta: Meta; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error('A recipe starts with front matter between --- lines.');
  const meta: Meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!field) continue;
    const [, key, raw] = field;
    meta[key] =
      raw.startsWith('[') && raw.endsWith(']')
        ? raw
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : raw.replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: match[2].trim() };
}

export function toRecipe(file: string, source: string): Recipe {
  const { meta, body } = parseFrontMatter(source);
  const text = (key: string): string => {
    const value = meta[key];
    if (typeof value !== 'string' || !value) throw new Error(`${file}: front matter needs ${key}`);
    return value;
  };
  const status = text('status') as RecipeStatus;
  if (!STATUSES.includes(status)) throw new Error(`${file}: status must be one of ${STATUSES.join(', ')}`);
  const tools = meta.tools;
  return {
    id: text('id'),
    title: text('title'),
    task: text('task'),
    stack: text('stack'),
    tools: Array.isArray(tools) ? tools : [],
    status,
    checkedAt: text('checkedAt'),
    evidence: text('evidence'),
    body,
  };
}

let cache: Recipe[] | undefined;

export function loadRecipes(): Recipe[] {
  cache ??= readdirSync(fromRoot('recipes'))
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => toRecipe(file, readFileSync(fromRoot('recipes', file), 'utf8')));
  return cache;
}
