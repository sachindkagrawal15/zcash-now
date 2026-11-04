import { writeFileSync } from 'node:fs';
import { factsPath, loadFacts, upgradeForBranchId, type Fact } from '../src/facts.js';
import { Lightwalletd } from '../src/lightwalletd.js';

// Re-checks the facts a live call can confirm, records when, and flags the ones
// that no longer hold. The scheduled workflow turns any change into a pull request.

const file = loadFacts();
const now = new Date().toISOString().slice(0, 19) + 'Z';
const report: string[] = [];

function fact(id: string): Fact {
  const found = file.facts.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`facts.json has no ${id}`);
  return found;
}

function confirm(id: string, note: string): void {
  const entry = fact(id);
  entry.verifiedAt = now;
  entry.verifiedBy = 'probe';
  delete entry.lastFailure;
  report.push(`ok    ${id}: ${note}`);
}

function flag(id: string, note: string): void {
  const entry = fact(id);
  entry.status = 'unverified';
  entry.lastFailure = `${now}: ${note}`;
  report.push(`FAIL  ${id}: ${note}`);
}

async function lightdInfo(network: 'test' | 'main', endpoint?: string) {
  const lwd = new Lightwalletd(network, { endpoint, timeoutMs: 8_000 });
  try {
    return await lwd.getLightdInfo();
  } finally {
    lwd.close();
  }
}

try {
  const info = await lightdInfo('test');
  confirm('endpoint.lightwalletd.test', `height ${info.blockHeight}, ${info.vendor} ${info.version}`);
  const upgrade = upgradeForBranchId(file, info.consensusBranchId);
  if (upgrade === 'NU7') confirm('upgrade.nu7.testnet', `tip is on branch ${info.consensusBranchId} (NU7)`);
  else flag('upgrade.nu7.testnet', `tip is on branch ${info.consensusBranchId} (${upgrade ?? 'unknown'})`);
} catch (error) {
  flag('endpoint.lightwalletd.test', String(error));
}

try {
  const info = await lightdInfo('main');
  confirm('endpoint.lightwalletd.main', `height ${info.blockHeight}, ${info.vendor} ${info.version}`);
} catch (error) {
  flag('endpoint.lightwalletd.main', String(error));
}

const answered: string[] = [];
for (const endpoint of ['lightwalletd.testnet.electriccoin.co:9067', 'testnet.lightwalletd.com:9067']) {
  try {
    await lightdInfo('test', endpoint);
    answered.push(endpoint);
  } catch {
    // Expected: these servers are gone.
  }
}
if (answered.length === 0) confirm('endpoint.lightwalletd.dead', 'neither old server answers');
else flag('endpoint.lightwalletd.dead', `${answered.join(', ')} answered again`);

// An explorer counts as working when its page for a known mined transaction shows that txid.
async function showsTransaction(urlTemplate: string, txid: string): Promise<boolean> {
  try {
    const response = await fetch(urlTemplate.replace('{txid}', txid), {
      headers: { 'user-agent': 'zcash-now-freshness' },
      signal: AbortSignal.timeout(45_000),
    });
    return response.ok && (await response.text()).includes(txid);
  } catch {
    return false;
  }
}

const referenceTx = file.referenceTx?.test;
const explorerTx = file.explorerTx.test;
if (referenceTx && explorerTx) {
  if (await showsTransaction(explorerTx, referenceTx)) confirm('explorer.testnet', 'shows the reference transaction');
  else flag('explorer.testnet', 'did not show the reference transaction');

  if (await showsTransaction('https://explorer.testnet.zec.rocks/transactions/{txid}', referenceTx)) {
    flag('explorer.zec-rocks', 'explorer.testnet.zec.rocks shows transactions again');
  } else {
    confirm('explorer.zec-rocks', 'explorer.testnet.zec.rocks still does not show transactions');
  }
}

file.updatedAt = now.slice(0, 10);
writeFileSync(factsPath(), `${JSON.stringify(file, null, 2)}\n`);
console.log(report.join('\n'));
