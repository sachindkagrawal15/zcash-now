import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOPICS, loadFacts, upgradeForBranchId } from '../src/facts.js';
import { renderLlmsFull, renderLlmsIndex } from '../src/llms.js';
import { loadRecipes } from '../src/recipes.js';
import { RULES } from '../src/rules.js';

const facts = loadFacts();

test('every fact has a topic, networks, an https source and a check date', () => {
  const ids = new Set<string>();
  for (const fact of facts.facts) {
    assert.ok(!ids.has(fact.id), `duplicate fact ${fact.id}`);
    ids.add(fact.id);
    assert.ok((TOPICS as readonly string[]).includes(fact.topic), `${fact.id}: topic`);
    assert.ok(fact.networks.length > 0 && fact.networks.every((network) => network === 'main' || network === 'test'), `${fact.id}: networks`);
    assert.match(fact.source, /^https:\/\//, `${fact.id}: source`);
    assert.match(fact.verifiedAt, /^\d{4}-\d{2}-\d{2}/, `${fact.id}: verifiedAt`);
    assert.ok(['read', 'probe', 'run'].includes(fact.verifiedBy), `${fact.id}: verifiedBy`);
  }
});

test('branch IDs map to the current upgrades', () => {
  assert.equal(upgradeForBranchId(facts, '77190ad9'), 'NU7');
  assert.equal(upgradeForBranchId(facts, '0x37A5165B'), 'NU6.3 (Ironwood)');
});

test('every lint rule points at a fact', () => {
  const ids = new Set(facts.facts.map((fact) => fact.id));
  for (const rule of RULES) assert.ok(ids.has(rule.fact), `${rule.id} -> ${rule.fact}`);
});

test('recipes load, have unique ids and a privacy section', () => {
  const recipes = loadRecipes();
  assert.ok(recipes.length >= 4);
  assert.equal(new Set(recipes.map((recipe) => recipe.id)).size, recipes.length);
  for (const recipe of recipes) assert.match(recipe.body, /^## Privacy$/m, `${recipe.id}: privacy section`);
});

test('llms.txt has the llmstxt.org shape and links every recipe', () => {
  const index = renderLlmsIndex('https://example.org/');
  assert.match(index, /^# zcash-now\n\n> /);
  for (const recipe of loadRecipes()) assert.ok(index.includes(`https://example.org/recipes/${recipe.id}.md`), recipe.id);
  const full = renderLlmsFull();
  for (const fact of facts.facts) assert.ok(full.includes(fact.claim), fact.id);
});
