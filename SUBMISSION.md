# Stadium submission

Fields in the order the form shows them. Save a draft now. Finalize by 20:00 IST to be in the first judging session; a finalized entry stays editable until midnight.

Before you can finalize you also need the demo video link, the public repo, the event feedback ratings and the terms checkbox.

## Project title

```
zcash-now
```

## Description (480 of 500 characters)

```
zcash-now is a keyless MCP server and llms.txt that keep AI coding agents current on Zcash after Ironwood and NU7. It gives agents dated, sourced facts with live light-wallet checks, recipes proven on testnet, a lint for stale patterns and privacy leaks, and a transaction-status tool, while a secret guard refuses seed phrases and keys. It has already caught real drift: Noir Wallet's testnet sends fail on NU7, the zec.rocks explorers are down, and NU7 mainnet is now scheduled.
```

## Demo video link

TODO: record the demo (3 minutes or less; judges watch only the first 3), upload it unlisted to YouTube, Loom or Google Drive with link sharing on, and paste the link.

## Public repo with a README

Your repo:

```
https://github.com/sachindkagrawal15/zcash-now
```

## Track

Privacy (Zcash)

## Themes (Privacy track)

1. Private payment rails. Its brief lists "an MCP server or llms.txt so AI agents write current Zcash code" and names developers new to Zcash and agent builders as its users. If the form takes more than one theme, leave the other two unticked: they target first-time end users and disclosure or network privacy.

## One-line pitch (126 of 140 characters)

```
Keeps AI coding agents current on Zcash, so developers new to Zcash get code that works on today's NU7 testnet the first time.
```

## What is it?

SDK or library. It is an npm package that MCP clients install. "other" also fits; there is no MCP option.

## Public URL (apps only)

Optional for an SDK. Leave it blank, or after turning on GitHub Pages for `/docs`:

```
https://sachindkagrawal15.github.io/zcash-now/llms.txt
```

## Technologies used

```
TypeScript, Node.js 24, MCP TypeScript SDK v2, zod, gRPC (@grpc/grpc-js, @grpc/proto-loader), lightwalletd protocol (librustzcash protos), zcash-devtool, Noir Wallet, ZIP 317, ZIP 321, llms.txt, @scure/bip39, GitHub Actions, GitHub Pages
```

## Next 30-day milestone

```
By Fri 4 Dec (about 10 hours of work), ship zcash-now v1.0:
1. Publish it on npm and the MCP Registry, and serve llms.txt on GitHub Pages.
2. Prove all five recipes on testnet with transaction IDs. The Noir Wallet recipe follows once Noir ships NU7 sends; we're reporting the bug we found to the Noir team.
3. Get ZecHub to link the llms.txt from its developer hub, and present it at a ZecHub Friday Lounge.
4. Keep the facts fresh with the daily live checks, reviewed in pull requests.
Stretch: route live lookups over Nym, so the light-wallet server can't see developers' IP addresses.
```

## Links to anything already started

One per line. The repo line works only after you push. Add each bug report's link once it's filed.

```
https://github.com/sachindkagrawal15/zcash-now
https://testnet.zcashexplorer.app/transactions/c00460bfaef41be5147089572189c5548bf1fbc6454e1b532c09f9c717d06abe
https://testnet.zcashexplorer.app/transactions/cc2d88b88890805b8a216b20adbbb492c3541271764526c234dfb40e607a8df4
```

## Feedback for the Zcash teams

```
Noir Wallet (testnet extension): sends fail on NU7 testnet with "transaction uses an incorrect consensus branch id"; receiving and balances work. Its source has no testnet NU7 height or branch ID.
Valar faucet: refused both a unified and a Sapling address with "the wallet cannot pay this address" and made no payouts in 24 hours.
zec.rocks explorers: explorer.testnet.zec.rocks and explorer.zec.rocks return HTTP 503 after about 38 seconds.
testnet.zcashexplorer.app: a 1 TAZ transfer from Orchard into Ironwood shows "Transaction fee 1.00015 TAZ"; it reads the Orchard part but not the Ironwood part.
zcash-devtool: when send lost its connection while broadcasting ("peer closed connection"), the signed transaction stayed saved and its coins locked until expiry, with no retry or rebroadcast command. We rebroadcast the bytes from the wallet database.
Docs: the hack's resources page says NU7 mainnet isn't scheduled, but librustzcash set height 3,543,405 on 21 Oct (commit f53a9b46e8).
```

## If the Privacy track asks for these

### Testnet transaction ID

A real shielded NU7 payment made by following zcash-now's send recipe. Replace it with the demo's transaction if you record a new one.

```
c00460bfaef41be5147089572189c5548bf1fbc6454e1b532c09f9c717d06abe
```

### Wallet birth height (optional)

The block height at which the CLI wallet that sent that transaction (`hack-wallet`) was created. It tells a scanner where to start, so verification doesn't scan the whole chain.

```
4580587
```

### Privacy and trust note (judges score Private from this; limit 3000 characters)

```
1. What stays private?
zcash-now is keyless. It never asks for, stores, logs or sends seed phrases, spending keys, viewing keys or balances. A secret guard runs before every tool and refuses seed phrases and key encodings without echoing them. It runs locally over stdio, with no zcash-now server and no telemetry. The payments its recipes make are fully shielded: our test payment c00460bf… went from Ironwood to Ironwood, so amount, sender, receiver and memo are encrypted on-chain; explorers see only that a shielded transaction was mined. Recipes default to shielded-only addresses, shielded funding, viewing keys (not spending keys) on servers and random order tokens in memos. zcash_check flags transparent funding, personal data in memos, keys in logs and spending keys on servers.

2. What does it reveal, and to whom?
- The light-wallet server (testnet.zec.rocks by default) sees the developer's IP, when each live check runs and every transaction ID looked up, so it can link an IP to the payments someone checks.
- The AI model provider sees prompts, the code the agent writes and checks, and any addresses or transaction IDs typed; zcash-now only keeps keys out of it.
- GitHub and npm see who downloads the package or fetches llms.txt.
- Faucets the recipes point to see your IP next to the address you claim with.
- Explorer links from zcash_tx_status tell that explorer which transaction you opened.
- A watch-payments server holding a viewing key sees every payment of that account; store the key like a password.
- Memos are readable by the recipient and anyone with their viewing key.

3. What do users have to trust?
- Us, as maintainers, to keep facts and recipes accurate: each fact links its source and check date, and each recipe states its verification with transaction evidence. Open source (MIT).
- zec.rocks, to report heights and transactions honestly. An explorer or another light-wallet server can cross-check it.
- npm and GitHub, to serve the published code unmodified.
- The AI model provider, with whatever enters the chat.
- The wallet software the recipes drive (zcash-devtool, Noir Wallet), to handle keys correctly. zcash-now never sees them.
No payment processor and no zcash-now server are involved.

4. What would we fix next?
- Route live lookups over Nym so the light-wallet server can't link a developer's IP to the transactions they check (ZCASH_NOW_OFFLINE=1 already turns lookups off).
- Sign facts.json releases, and publish the npm package with provenance.
- Re-run every recipe on testnet on a schedule, so "verified" can't go stale.
- Extend the guard to transparent private keys. It can't undo a key already pasted into a chat, and its refusal says so.
- Make explorer links opt-in.
Known gaps today: Noir Wallet's testnet sends fail on NU7, so the browser recipe is unproven, and zcash-devtool doesn't retry a dropped broadcast (the send recipe documents our rebroadcast).
```

## Demo video script (3 minutes or less)

1. 0:00 to 0:20: the problem. Agents trained before mid-2026 use Orchard, dead servers and WebZjs. Even the hack's resources page says NU7 mainnet isn't scheduled, but librustzcash set its height on 21 Oct.
2. 0:20 to 1:00: without zcash-now. Give a fresh Claude Code session the prompt in the README and show what it reaches for.
3. 1:00 to 2:20: with zcash-now. The same prompt, tool calls visible: `zcash_now`, `zcash_recipe`, the script, `zcash_check`, the send, then `zcash_tx_status` showing it mined. Show it arriving in Noir Wallet.
4. 2:20 to 3:00: privacy. Paste the BIP-39 test mnemonic and the guard refuses it; lint a memo that carries an email address.

## Needed evidence (fill in on the day)

- Teams that used it:
- Quotes:
- Mentor or partner interest:
