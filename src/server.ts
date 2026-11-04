import { readFileSync } from 'node:fs';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { loadFacts } from './facts.js';
import { guarded } from './guard.js';
import { renderLlmsFull, renderRecipeMarkdown } from './llms.js';
import { fromRoot } from './paths.js';
import { loadRecipes } from './recipes.js';
import { checkInput, zcashCheck } from './tools/check.js';
import { nowInput, zcashNow } from './tools/now.js';
import { recipeInput, zcashRecipe } from './tools/recipe.js';
import { txStatusInput, zcashTxStatus } from './tools/txStatus.js';

const { version } = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8')) as { version: string };

export const BUILDER_PROMPT = `You are writing code for Zcash. Before you write any:
1. Call zcash_now for the network you target, and trust it over what you remember. Orchard is closed to new funds (Ironwood replaced it in NU6.3), NU7 is live on testnet, and several servers and libraries are gone.
2. Call zcash_recipe for the task and follow it, including its privacy notes.
3. Run zcash_check on every file you write or change, and fix what it reports.
4. After a payment is sent, call zcash_tx_status until it is mined, then confirmed.
Never ask the user for a seed phrase, spending key or viewing key, and never put one in a prompt, a log or a memo.`;

export function createServer(): McpServer {
  const server = new McpServer({ name: 'zcash-now', version });

  server.registerTool(
    'zcash_now',
    {
      title: 'Current Zcash facts',
      description:
        'Dated, sourced facts about Zcash today: network upgrades (NU6.3 Ironwood, NU7), pools, light-wallet servers, faucets, explorers and which SDKs work. Includes a live check of the light-wallet server. Call it before writing Zcash code.',
      inputSchema: nowInput,
    },
    guarded(zcashNow),
  );

  server.registerTool(
    'zcash_recipe',
    {
      title: 'Tested Zcash recipe',
      description:
        'Step-by-step recipe for a Zcash task: get testnet coins, send a shielded payment, watch for payments with a viewing key, build a payment link, or connect Noir Wallet. Gives commands, expected output, privacy notes and how far the recipe has been verified.',
      inputSchema: recipeInput(),
    },
    guarded(zcashRecipe),
  );

  server.registerTool(
    'zcash_check',
    {
      title: 'Check Zcash code',
      description:
        'Lints code, config or shell commands for outdated Zcash patterns (dead servers, the Orchard pool, WebZjs, v4 transactions, 75-second blocks, fixed fees) and privacy leaks (spending keys on servers, transparent funding, personal data in memos, logged keys).',
      inputSchema: checkInput,
    },
    guarded(zcashCheck),
  );

  server.registerTool(
    'zcash_tx_status',
    {
      title: 'Zcash transaction status',
      description:
        'Looks up a transaction ID on the light-wallet server: in the mempool, mined with its confirmations, or not found, plus its version and network upgrade. Read-only.',
      inputSchema: txStatusInput,
    },
    guarded(zcashTxStatus),
  );

  server.registerResource(
    'llms-full',
    'zcash://llms.txt',
    { title: 'zcash-now llms-full.txt', description: 'Every fact and recipe in one file.', mimeType: 'text/plain' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: renderLlmsFull() }] }),
  );

  server.registerResource(
    'facts',
    'zcash://facts',
    { title: 'Zcash facts', description: 'The facts file, with sources and check dates.', mimeType: 'application/json' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(loadFacts(), null, 2) }] }),
  );

  server.registerResource(
    'recipe',
    new ResourceTemplate('zcash://recipes/{id}', {
      list: async () => ({
        resources: loadRecipes().map((recipe) => ({
          uri: `zcash://recipes/${recipe.id}`,
          name: recipe.id,
          title: recipe.title,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    { title: 'Zcash recipe', description: 'One recipe as markdown.', mimeType: 'text/markdown' },
    async (uri, variables) => {
      const recipe = loadRecipes().find((candidate) => candidate.id === String(variables.id));
      if (!recipe) throw new Error(`There is no recipe ${String(variables.id)}.`);
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: renderRecipeMarkdown(recipe) }] };
    },
  );

  server.registerPrompt(
    'zcash-builder',
    { title: 'Build with current Zcash', description: 'Sets an agent up to use zcash-now before and after writing Zcash code.' },
    () => ({ messages: [{ role: 'user' as const, content: { type: 'text' as const, text: BUILDER_PROMPT } }] }),
  );

  return server;
}
