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

After you push, this is the URL for the GitHub account `gh` is signed in to:

```
https://github.com/sachindkagrawal18/zcash-now
```

## Track

Privacy (Zcash)

## One-line pitch (126 of 140 characters)

```
Keeps AI coding agents current on Zcash, so developers new to Zcash get code that works on today's NU7 testnet the first time.
```

## What is it?

SDK or library. It is an npm package that MCP clients install. "other" also fits; there is no MCP option.

## Public URL (apps only)

Optional for an SDK. Leave it blank, or after turning on GitHub Pages for `/docs`:

```
https://sachindkagrawal18.github.io/zcash-now/llms.txt
```

## Technologies used

```
TypeScript, Node.js 24, MCP TypeScript SDK v2, zod, gRPC (@grpc/grpc-js, @grpc/proto-loader), lightwalletd protocol (librustzcash protos), zcash-devtool, Noir Wallet, ZIP 317, ZIP 321, llms.txt, @scure/bip39, GitHub Actions, GitHub Pages
```

## Next 30-day milestone

```
By 4 Dec: publish zcash-now to npm and the MCP Registry and serve llms.txt on GitHub Pages; prove all five recipes on testnet with transaction IDs, including the Noir Wallet recipe once Noir ships NU7 sends; get ZecHub to link the llms.txt and create-zcash-app to include the MCP config; route live lookups over Nym so the light-wallet server can't see developers' IPs; and keep the daily freshness job opening reviewed fact updates.
```

## Links to anything already started

One per line. Add each bug report's link here once it's filed.

```
https://github.com/sachindkagrawal18/zcash-now
https://testnet.zcashexplorer.app/transactions/c00460bfaef41be5147089572189c5548bf1fbc6454e1b532c09f9c717d06abe
```

## Feedback for the Zcash teams

```
Noir Wallet (testnet extension): sends fail on NU7 testnet with "transaction uses an incorrect consensus branch id"; receiving and balances work. Its source has no testnet NU7 height or branch ID.
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

### Privacy and trust note

```
What stays private: zcash-now never asks for, stores or sends keys, seed phrases or balances; a secret guard refuses them on every tool. Its recipes keep amounts, senders and receivers shielded on-chain, fund from shielded balances and give servers viewing keys only.
What it reveals, and to whom: the light-wallet server operator (zec.rocks by default) sees the developer's IP address, when each lookup happens and any transaction ID checked. GitHub sees who fetches llms.txt. The AI model provider sees prompts, code and transaction IDs, as with any agent work.
What users must trust: the maintainers to keep facts accurate (each links its source and check date), zec.rocks to answer honestly (an explorer can cross-check it), npm and GitHub to serve the package unmodified, and the AI provider with whatever enters the chat.
What we would fix next: route lookups over Nym, sign facts.json releases, re-run every recipe on testnet on a schedule, and extend the guard to transparent private keys. The guard can't undo a key already pasted into a chat.
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
