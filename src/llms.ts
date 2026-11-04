import { TOPICS, loadFacts, type Fact } from './facts.js';
import { loadRecipes, type Recipe } from './recipes.js';

const SUMMARY =
  'zcash-now keeps AI coding agents current on Zcash. Orchard has been closed to new funds since NU6.3 (Ironwood), NU7 is live on testnet with 25-second blocks, and several older servers and libraries no longer work. Every fact names its source and when it was last checked.';

const RULES_FOR_AGENTS =
  'Rules for agents writing Zcash code: use shielded funds and unified addresses; give servers a viewing key, never a spending key; let the SDK compute ZIP 317 fees; treat a payment as seen, then mined, then confirmed; keep personal data out of memos; never paste a seed phrase or key into a chat.';

// The index follows the llmstxt.org shape: a title, a summary quote, then lists of links.
export function renderLlmsIndex(baseUrl = ''): string {
  const link = (path: string) => `${baseUrl}${path}`;
  return [
    '# zcash-now',
    '',
    `> ${SUMMARY}`,
    '',
    RULES_FOR_AGENTS,
    '',
    '## Facts',
    '',
    `- [Current Zcash facts](${link('facts.md')}): network upgrades, pools, addresses, endpoints, faucets, explorers, SDK support, fees and payments`,
    '',
    '## Recipes',
    '',
    ...loadRecipes().map(
      (recipe) => `- [${recipe.title}](${link(`recipes/${recipe.id}.md`)}): ${recipe.stack}, ${recipe.status} on ${recipe.checkedAt}`,
    ),
    '',
    '## Optional',
    '',
    `- [Everything in one file](${link('llms-full.txt')}): all facts and recipes inline`,
    '',
  ].join('\n');
}

export function renderFactsMarkdown(): string {
  const file = loadFacts();
  const out = [
    '# Current Zcash facts',
    '',
    `Updated ${file.updatedAt}. Each fact says how it was checked: read (a source page), probe (a live server call) or run (a command that produced the result).`,
    '',
  ];
  for (const topic of TOPICS) {
    const facts = file.facts.filter((fact) => fact.topic === topic);
    if (facts.length === 0) continue;
    out.push(`## ${topic[0].toUpperCase()}${topic.slice(1)}`, '', ...facts.map(formatFactLine), '');
  }
  return out.join('\n');
}

export function renderRecipeMarkdown(recipe: Recipe): string {
  return [
    `# ${recipe.title}`,
    '',
    `Recipe \`${recipe.id}\` for the ${recipe.stack} stack, ${recipe.status} on ${recipe.checkedAt}. Evidence: ${recipe.evidence}`,
    '',
    recipe.body,
    '',
  ].join('\n');
}

export function renderLlmsFull(): string {
  return [`# zcash-now\n\n> ${SUMMARY}\n\n${RULES_FOR_AGENTS}\n`, renderFactsMarkdown(), ...loadRecipes().map(renderRecipeMarkdown)].join('\n');
}

function formatFactLine(fact: Fact): string {
  const status = fact.status && fact.status !== 'info' ? `**${fact.status}**: ` : '';
  const networks = fact.networks.map((network) => (network === 'test' ? 'testnet' : 'mainnet')).join(', ');
  const replaces = fact.replaces?.length ? ` Replaces: ${fact.replaces.map((item) => `"${item}"`).join(', ')}.` : '';
  return `- ${status}${fact.claim}${replaces} (${networks}; [source](${fact.source}), ${fact.verifiedBy} ${fact.verifiedAt.slice(0, 10)})`;
}
