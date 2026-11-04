import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { renderFactsMarkdown, renderLlmsFull, renderLlmsIndex, renderRecipeMarkdown } from '../src/llms.js';
import { fromRoot } from '../src/paths.js';
import { loadRecipes } from '../src/recipes.js';

// Links stay relative unless LLMS_BASE_URL is set (for example https://<user>.github.io/zcash-now/).
const baseUrl = process.env.LLMS_BASE_URL ?? '';
const recipes = loadRecipes();
const docs = (...parts: string[]) => fromRoot('docs', ...parts);

rmSync(docs('recipes'), { recursive: true, force: true });
mkdirSync(docs('recipes'), { recursive: true });
writeFileSync(docs('llms.txt'), renderLlmsIndex(baseUrl));
writeFileSync(docs('llms-full.txt'), renderLlmsFull());
writeFileSync(docs('facts.md'), renderFactsMarkdown());
for (const recipe of recipes) writeFileSync(docs('recipes', `${recipe.id}.md`), renderRecipeMarkdown(recipe));

// GitHub Pages serves docs/ as-is: .nojekyll keeps the markdown raw for agents.
writeFileSync(docs('.nojekyll'), '');
writeFileSync(docs('index.html'), indexPage());

console.log(`Wrote docs/llms.txt, docs/llms-full.txt, docs/facts.md, docs/index.html and ${recipes.length} recipes.`);

function indexPage(): string {
  const items = recipes.map((recipe) => `      <li><a href="recipes/${recipe.id}.md">${recipe.title}</a> (${recipe.status})</li>`).join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>zcash-now</title>
    <style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}code{background:#f2f2f2;padding:0 .25rem}</style>
  </head>
  <body>
    <h1>zcash-now</h1>
    <p>Current, sourced Zcash facts and tested recipes for AI coding agents: Ironwood, NU7 testnet, live servers, faucets and which SDKs work.</p>
    <p>For agents: <a href="llms.txt">llms.txt</a> · <a href="llms-full.txt">llms-full.txt</a> · <a href="facts.md">facts.md</a></p>
    <p>MCP server: <code>claude mcp add zcash-now -- npx -y zcash-now-mcp</code></p>
    <h2>Recipes</h2>
    <ul>
${items}
    </ul>
  </body>
</html>
`;
}
