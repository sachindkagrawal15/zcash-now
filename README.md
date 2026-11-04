# zcash-now

**A keyless MCP server and llms.txt that keep AI coding agents current on Zcash, so a developer new to Zcash gets code that works on today's NU7 testnet the first time.**

AI coding agents trained before mid-2026 write code for a Zcash that no longer exists:

- They reach for the Orchard pool. Orchard has accepted withdrawals only since NU6.3 (Ironwood) on 28 Jul 2026.
- They assume 75-second blocks. NU7 has been live on testnet since height 4,465,026, with 25-second blocks and v4 transactions invalid.
- They connect to `lightwalletd.testnet.electriccoin.co` (dead), install WebZjs (not on npm, no Ironwood) or `zecli` from crates.io (its addresses can't receive funds).

zcash-now gives the agent dated, sourced facts, recipes proven on testnet, a lint for stale patterns and privacy leaks, and a live transaction check. It never touches keys or funds.

## Install

Claude Code:

```bash
claude mcp add zcash-now -- npx -y zcash-now-mcp
```

Cursor, Claude Desktop and other MCP clients:

```json
{ "mcpServers": { "zcash-now": { "command": "npx", "args": ["-y", "zcash-now-mcp"] } } }
```

From a clone, before the npm package is published:

```bash
npm install && npm run build
claude mcp add zcash-now -- node "$PWD/dist/src/cli.js"
```

Agents without MCP can read `docs/llms.txt`, served by GitHub Pages at `https://<user>.github.io/zcash-now/llms.txt`.

## What the agent gets

| Tool | What it does | Network use |
| --- | --- | --- |
| `zcash_now` | Facts on upgrades, pools, addresses, endpoints, faucets, explorers, SDK support, fees and payments. Each has a source and a check date. Adds a live probe: height and consensus branch, mapped to the upgrade. | `GetLightdInfo` |
| `zcash_recipe` | Step-by-step recipes with commands, expected output, gotchas, a privacy section and an honest verification status. | none |
| `zcash_check` | Twelve lint rules for stale Zcash patterns and privacy leaks, each finding linked to its fact. | none |
| `zcash_tx_status` | Mempool, mined with confirmations, fork or not found, plus transaction version and upgrade. | `GetTransaction`, `GetLatestBlock` |

Also exposed: resources `zcash://llms.txt`, `zcash://facts` and `zcash://recipes/{id}`, and a prompt, `zcash-builder`, that tells the agent to call `zcash_now` first, follow a recipe and lint what it writes.

Every tool runs behind a **secret guard**. It refuses seed phrases (12 or more consecutive BIP-39 words) and Zcash or age key encodings, so a pasted key never reaches a handler or a reply.

## Example

> Write a script that sends 0.01 TAZ shielded to utest1… with the memo "order 7f3a" on testnet.

1. The agent calls `zcash_now` and learns that testnet is on NU7, the server is `testnet.zec.rocks:443`, and new funds go to Ironwood.
2. It calls `zcash_recipe` with `send-shielded` and writes the zcash-devtool commands from it.
3. It runs `zcash_check` on its script. A fixed fee or a transparent funding source would be flagged.
4. The script sends; the agent calls `zcash_tx_status` until the payment is mined, then confirmed.

## Verified so far (4 Nov 2026)

- `npm test`: 32 unit tests for the guard, the lint rules, ZIP 321 links, txid handling and the data files.
- `npm run smoke`: a real MCP client starts the server over stdio and calls every tool, resource and prompt against live testnet.
- Live probes: `testnet.zec.rocks:443` on consensus branch `77190ad9` (NU7), `zec.rocks:443` on mainnet, and both old testnet servers dead.
- `zcash_tx_status` found a known testnet payout using the internal byte order: version 6, NU7, mined.
- zcash-devtool built from source, made a testnet wallet, synced NU7 testnet and reported Ironwood balances. A view-only wallet made with `init-fvk` synced and listed transactions as CSV.

| Recipe | Status | What is still missing |
| --- | --- | --- |
| send-shielded (cli) | verified | Nothing: 0.1 TAZ sent to Noir Wallet in `c00460bf…`, mined at height 4,581,860 |
| watch-payments (cli) | partial | A payment to detect |
| get-test-coins (cli) | verified | Nothing: Fauzec sent 1 TAZ into Ironwood in `cc2d88b8…`, mined at height 4,581,808 |
| payment-link (node) | partial | A wallet paying a generated link |
| noir-connect-send (react) | unverified | Blocked: Noir's testnet build fails to send on NU7 ("incorrect consensus branch id"); receiving works |

## Privacy and trust note

1. **What stays private?** zcash-now never asks for, stores or sends keys, seed phrases or balances; the secret guard refuses them. Its recipes keep amounts, senders and receivers shielded on-chain, fund from shielded balances and give servers viewing keys only.
2. **What does it reveal, and to whom?** The light-wallet server operator (zec.rocks by default) sees your IP address, when each lookup happens and any transaction ID you check. GitHub sees who fetches llms.txt. The AI model provider sees your prompts, code and transaction IDs, as with any agent work.
3. **What must users trust?** The maintainers to keep facts accurate (each links its source and check date), zec.rocks to answer honestly (an explorer can cross-check it), npm and GitHub to serve the package unmodified, and the AI provider with whatever enters the chat.
4. **What would we fix next?** Route lookups over Nym so the server can't see the developer's IP. Sign `facts.json` releases. Re-run every recipe on testnet on a schedule. Extend the guard to transparent private keys. The guard can't undo a key already pasted into a chat; it only stops zcash-now processing or echoing it.

## Technologies

- TypeScript 7 on Node.js 24, ES modules
- MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, `@modelcontextprotocol/client` for the smoke test), stdio transport
- zod 4 for tool schemas
- `@grpc/grpc-js` and `@grpc/proto-loader` with lightwalletd's `service.proto` and `compact_formats.proto` from librustzcash
- `@scure/bip39` English wordlist for seed-phrase detection
- zcash-devtool (Rust, librustzcash) to prove the CLI recipes; Noir Wallet SDK for the web recipe
- Node's built-in test runner
- GitHub Actions (CI and a daily freshness job) and GitHub Pages (llms.txt)
- The llms.txt format from llmstxt.org, ZIP 317 fees and ZIP 321 payment links

## Design decisions

- **Keyless.** Payments go through zcash-devtool or Noir Wallet, which hold the keys. zcash-now can't lose funds or leak a key it never had.
- **Curated facts, checked on a schedule.** `data/facts.json` is reviewed in pull requests, and every claim carries `source`, `verifiedAt` and `verifiedBy` (read, probe or run). Fetching docs at query time would be slower, unverified and open to prompt injection.
- **Honest recipe status.** A recipe says whether it is verified, partial or unverified, and what evidence backs it.
- **lightwalletd over an explorer API.** It's the same source wallets use and adds no third party. The txid is sent in internal byte order, with the displayed order as a fallback.
- **Local stdio, not a hosted server.** No server sees developers' questions. Set `ZCASH_NOW_OFFLINE=1` to turn off all network calls.
- **Regex lint rules.** They work on any language and are quick to extend. They can misfire, so each finding links its fact.
- **One source, two outputs.** `npm run build:llms` writes `docs/` from the same files the MCP server reads, and CI fails if `docs/` is stale.

## Development

```bash
npm install
npm test              # build and run the unit tests
npm run smoke         # MCP client over stdio, live testnet
npm run freshness     # live probes; updates verifiedAt in data/facts.json
npm run build:llms    # regenerate docs/ (set LLMS_BASE_URL for absolute links)
```

Environment variables: `ZCASH_NOW_OFFLINE=1` turns off network calls. `ZCASH_NOW_LIGHTWALLETD_TEST` and `ZCASH_NOW_LIGHTWALLETD_MAIN` override the servers (`host:port`).

The project `.npmrc` points npm at the public registry, so installs work even where a company registry is configured.

To publish: `npm publish` for the package; GitHub Pages from `main` and `/docs` for llms.txt. For the freshness job to open pull requests, turn on "Allow GitHub Actions to create and approve pull requests" under Settings, Actions, General.

## Adding a fact or recipe

- A fact needs `id`, `topic`, `networks`, `claim`, `source` (https) and `verifiedAt`, plus `verifiedBy`, `status` and `replaces` where they apply. `npm test` checks the shape.
- A recipe is a markdown file in `recipes/` with front matter (`id`, `title`, `task`, `stack`, `tools`, `status`, `checkedAt`, `evidence`) and a `## Privacy` section. A new task appears in `zcash_recipe`'s schema automatically.

## License

MIT. `proto/` is copied from librustzcash (MIT OR Apache-2.0).
