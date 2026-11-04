# Feedback

What slowed us down or broke during Free Society Hack, 4 Nov 2026.

## Faucet

- **Valar:** two claims, to a unified address and a Sapling address, both failed with "the wallet cannot pay this address". The faucet showed no payouts in the previous 24 hours. Its source maps that message to zecd errors -5 and -8. Failed claims don't use the daily allowance.
- **Fauzec:** worked. 1 TAZ arrived in the Ironwood pool at a shielded-only unified address (`cc2d88b8…`).

## Node or indexer (lightwalletd, Zebra, Zaino)

- **testnet.zec.rocks:** one `SendTransaction` closed the connection mid-broadcast ("peer closed connection without sending TLS close_notify"). The same bytes were accepted a minute later.
- **The hack's agent guide** says lightwalletd v0.5.4; `GetLightdInfo` reported ECC LightWalletD v0.6.1.

## SDK or wallet tool

- **zcash-devtool (commit 0b3436b):** after a dropped broadcast, `send` keeps the signed transaction and locks its coins until expiry, with no retry and no rebroadcast command. We rebroadcast the raw bytes from `data.sqlite` with `SendTransaction`.
- **zcash-devtool:** `gen-addr` in the source is `generate-address` on the command line, and `init`'s default address includes a transparent receiver.
- **zcash-devtool:** that commit pins librustzcash from 16 Oct, before NU7's mainnet height was set, so it needs a rebuild for mainnet.
- **WebZjs:** `@chainsafe/webzjs-wallet` returns 404 on npm.

## Wallet

- **Noir Wallet (testnet extension):** receives TAZ and shows Ironwood balances, but sends fail with "transaction uses an incorrect consensus branch id". Its source has no testnet NU7 height or branch ID.

## Explorers

- **explorer.testnet.zec.rocks and explorer.zec.rocks:** accept the TLS connection, then return HTTP 503 after about 38 seconds.
- **testnet.zcashexplorer.app:** a 1 TAZ transfer from Orchard into Ironwood shows "Transaction fee 1.00015 TAZ". It seems to read the Orchard part of the transaction but not the Ironwood part.

## Docs

- **NU7 mainnet:** the resources page and agent guide say mainnet NU7 isn't scheduled, but librustzcash set height 3,543,405 on 21 Oct (commit f53a9b46e8).
- **Noir Wallet:** the agent guide lists Noir's testnet extension as a wallet to send test payments from; it can't send on NU7 yet.

## Other

- **npm:** a laptop configured for a company npm registry couldn't install packages at the venue; a project `.npmrc` pointing at the public registry fixed it.
- **MCP TypeScript SDK v2:** replaced `StdioServerTransport` plus `connect` with `serveStdio`, so v1 examples don't compile.
