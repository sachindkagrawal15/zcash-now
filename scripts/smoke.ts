import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { loadFacts } from '../src/facts.js';
import { fromRoot } from '../src/paths.js';

// Starts the built server over stdio, the way an MCP client does, and calls
// every tool once. Pass a testnet txid to check a different transaction.
const txid = process.argv[2] ?? loadFacts().referenceTx?.test ?? '';
const TEST_MNEMONIC = `${'abandon '.repeat(11)}about`;

const client = new Client({ name: 'zcash-now-smoke', version: '0.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [fromRoot('dist', 'src', 'cli.js')] }));

let failures = 0;

function report(name: string, ok: boolean, detail: string): void {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}: ${detail.replace(/\s+/g, ' ').slice(0, 150)}`);
}

async function callText(name: string, args: Record<string, unknown>): Promise<{ text: string; isError: boolean }> {
  const result = await client.callTool({ name, arguments: args });
  const content = (result.content ?? []) as Array<{ type: string; text?: string }>;
  return { text: content.map((part) => part.text ?? '').join('\n'), isError: result.isError === true };
}

const { tools } = await client.listTools();
const names = tools.map((tool) => tool.name).sort();
report('tools/list', names.join(',') === 'zcash_check,zcash_now,zcash_recipe,zcash_tx_status', names.join(', '));

const now = await callText('zcash_now', { network: 'test', topic: 'upgrades' });
report('zcash_now', !now.isError && /Live: .*NU7/.test(now.text), now.text.split('\n')[1] ?? now.text);

const recipe = await callText('zcash_recipe', { task: 'send-shielded' });
report('zcash_recipe', !recipe.isError && recipe.text.includes('generate-address'), recipe.text.split('\n')[0]);

const lint = await callText('zcash_check', {
  code: "const lwd = 'lightwalletd.testnet.electriccoin.co:9067';\nconst memo = 'paid by alice@example.com';",
});
report('zcash_check', /stale\/dead-lightwalletd/.test(lint.text) && /privacy\/pii-in-memo/.test(lint.text), lint.text.split('\n')[0]);

const refused = await callText('zcash_check', { code: TEST_MNEMONIC });
report('secret guard', refused.isError && /seed phrase/.test(refused.text), refused.text);

const tx = await callText('zcash_tx_status', { txid, network: 'test' });
report('zcash_tx_status', !tx.isError && /mined at height/.test(tx.text), tx.text.split('\n')[0]);

const llms = await client.readResource({ uri: 'zcash://llms.txt' });
const llmsText = (llms.contents[0] as { text?: string }).text ?? '';
report('resource zcash://llms.txt', llmsText.startsWith('# zcash-now'), `${llmsText.length} characters`);

const prompt = await client.getPrompt({ name: 'zcash-builder' });
report('prompt zcash-builder', prompt.messages.length === 1, 'one message');

await client.close();
process.exit(failures === 0 ? 0 : 1);
