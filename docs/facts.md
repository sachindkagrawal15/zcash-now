# Current Zcash facts

Updated 2026-11-04. Each fact says how it was checked: read (a source page), probe (a live server call) or run (a command that produced the result).

## Upgrades

- NU7 is active on testnet from height 4,465,026: blocks target 25 seconds, and v4 transactions are invalid. Replaces: "testnet blocks every 75 seconds", "v4 transactions". (testnet; [source](https://github.com/zcash/librustzcash/blob/eb38d7a373661179dbc083a2fd58b3a6c9b25818/components/zcash_protocol/src/consensus.rs), probe 2026-11-04)
- librustzcash set NU7's mainnet activation height to 3,543,405 on 21 Oct 2026. Mainnet was at height 3,541,302 on 4 Nov 2026, so at 75-second blocks activation is about 44 hours later. Zebra's mainnet readiness tracker (issue 11674) was still open. Replaces: "NU7 mainnet activation is not scheduled yet". (mainnet; [source](https://github.com/zcash/librustzcash/commit/f53a9b46e8), read 2026-11-04)
- NU6.3 (Ironwood) activated on mainnet at block 3,428,143 on 28 Jul 2026, and on testnet at height 4,134,000, after a flaw in Orchard's circuit that could have allowed counterfeit ZEC. (mainnet, testnet; [source](https://www.theblock.co/news/ecosystems/2026-07-28-zcash-ironwood-upgrade-launching-new-shielded-pool-after-orchard-vulnerability-409934), read 2026-11-04)

## Pools

- Orchard accepts withdrawals only. New shielded funds go to the Ironwood pool. Replaces: "use the Orchard pool", "pool: 'orchard'", "orchard_zatoshi". (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)

## Addresses

- Ironwood notes go to the Orchard receiver a unified address already carries, so existing u1 and utest1 addresses keep working. Replaces: "unified addresses need a new Ironwood receiver". (mainnet, testnet; [source](https://zechub.wiki/guides/zcash-devtool), read 2026-11-04)
- Testnet addresses start utest1 (unified), ztestsapling1 (Sapling) or tm (transparent). Coins on testnet are TAZ and have no value. (testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- zcash-devtool's wallet init gives the account a default address with a transparent receiver. wallet generate-address with no --pool flag makes an address with shielded receivers only, which is the one to hand to payers. (mainnet, testnet; [source](https://github.com/zcash/zcash-devtool), run 2026-11-04)

## Endpoints

- **works**: Use testnet.zec.rocks:443 (gRPC over TLS) as the testnet light-wallet server. (testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), probe 2026-11-04)
- **works**: zec.rocks:443 serves mainnet light-wallet clients over gRPC with TLS. (mainnet; [source](https://zcash-sdk.nym.com/guidance/), probe 2026-11-04)
- **broken**: The old testnet light-wallet servers lightwalletd.testnet.electriccoin.co and testnet.lightwalletd.com are dead. Replaces: "lightwalletd.testnet.electriccoin.co", "testnet.lightwalletd.com". (testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), probe 2026-11-04)

## Faucets

- **works**: Fauzec sends 1 TAZ per address every 24 hours to unified or Sapling addresses, shielded. Its web form has a Cloudflare Turnstile human check. A claim to a shielded-only unified address arrived in the Ironwood pool in transaction cc2d88b8… (version 6, NU7, height 4,581,808) and was spendable after about 10 confirmations. (testnet; [source](https://fauzec.com/), run 2026-11-04)
- **works**: Noir Wallet's testnet extension gives its own account a daily TAZ allowance; 1 TAZ arrived on 4 Nov 2026. The wallet can't send it on NU7 yet, so it is only useful for receiving. (testnet; [source](https://github.com/NoirWallet/noir-wallet/releases), run 2026-11-04)
- **broken**: Valar's faucet (0.125 TAZ per IP address every 24 hours) refused both a unified address and a Sapling address with "the wallet cannot pay this address", and had made no payouts in the previous 24 hours. Failed claims do not use up the daily allowance. (testnet; [source](https://faucet.testnet.valargroup.dev/), run 2026-11-04)
- **broken**: The Jino Labs faucet is paused for NU7. (testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- At the Free Society Hack, post a utest1 address in the mentors chat and a Zcash mentor sends TAZ. (testnet; [source](https://fancy-spectacles-44b.notion.site/Privacy-track-Zcash-4073e52aeb1580e9b24fe57aeddb8b3e), read 2026-11-04)

## Explorers

- **works**: testnet.zcashexplorer.app shows a testnet transaction at /transactions/<txid>, including version-6 NU7 transactions, with its block and confirmations. It misreads Ironwood value: a 1 TAZ transfer into Ironwood showed "Transaction fee 1.00015 TAZ", because it counts the Orchard part of the transaction but not the Ironwood part. Take amounts and fees from the wallet. zexplorer.app is another explorer that answers. (testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), probe 2026-11-04)
- **broken**: zec.rocks runs explorer.testnet.zec.rocks (testnet) and explorer.zec.rocks (mainnet), but on 4 Nov 2026 both accepted connections and then returned HTTP 503 after about 38 seconds. Link to testnet.zcashexplorer.app instead. Replaces: "explorer.testnet.zec.rocks works". (mainnet, testnet; [source](https://forum.zcashcommunity.com/t/block-explorer-testnet-infrastructure-2025/51451/8), probe 2026-11-04)

## Sdks

- **works**: zcash-devtool, built from source (commit 0b3436b), creates a testnet wallet, syncs NU7 testnet, reports Ironwood balances and sends shielded Ironwood payments with memos (transaction c00460bf…, mined at height 4,581,860). It is for prototyping, not production. That commit pins librustzcash from 16 Oct 2026, before NU7's mainnet height was set, so rebuild against a newer pin before using it on mainnet. (mainnet, testnet; [source](https://github.com/zcash/zcash-devtool), run 2026-11-04)
- **broken**: Noir Wallet's testnet extension receives TAZ and shows Ironwood balances, but on 4 Nov 2026 its sends on NU7 testnet failed with "transaction uses an incorrect consensus branch id": it signs for the upgrade before NU7, and its source has no testnet NU7 height or branch ID. Until that is fixed, pay from zcash-devtool. The SDK offers connect, getBalance, sendTransaction({ to, amount, memo, fundingSource }) and getTransactionHistory. Replaces: "Noir Wallet's testnet build can send on NU7 testnet". (mainnet, testnet; [source](https://github.com/NoirWallet/noir-wallet/releases), run 2026-11-04)
- **unverified**: Thus Spoke Zakura v0.4 runs a disposable local regtest network in Docker with NU7 and Ironwood active, a faucet and on-demand mining. Its API takes pool 'ironwood' and rejects 'orchard'. Replaces: "pool: 'orchard' in the Thus Spoke Zakura API". (testnet; [source](https://github.com/zcashlabs/thus-spoke-zakura/releases), read 2026-11-04)
- **unverified**: Zingolib has active Ironwood support work, and zshield-mcp reports real testnet payments through zingo-cli. (mainnet, testnet; [source](https://github.com/Steeve-Crypto/zshield-mcp), read 2026-11-04)
- **broken**: WebZjs (@chainsafe/webzjs-wallet) is not on npm and has no Ironwood support. Building it needs Rust nightly, wasm-pack, just, yarn and a gRPC-web proxy. Replaces: "npm install @chainsafe/webzjs-wallet". (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- **broken**: @zcash/monitor in ronykris/zcash-sdk wraps WebZjs, so it inherits WebZjs's NU7 problems. Its @zcash/uri package only builds ZIP 321 links. (mainnet, testnet; [source](https://github.com/ronykris/zcash-sdk), read 2026-11-04)
- **broken**: zecli from crates.io makes Orchard-only addresses, which cannot receive funds. The git version needs a zidecar server, and none is hosted for testnet. Replaces: "cargo install zecli". (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- **broken**: Zallet and zecd have no NU7 release. (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- **broken**: ZPay, the x402 facilitator with a spend-limited agent wallet, needs a self-hosted Zinder stack in Docker. (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- **unverified**: CipherPay is a hosted checkout that watches a merchant's viewing key and calls the merchant's server when a payment arrives. Its testnet is at testnet.cipherpay.app. (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- Frontier Compute's zcash-mcp is a read-only ZAP1 attestation server, not a wallet. (mainnet, testnet; [source](https://github.com/Frontier-Compute/zcash-mcp), read 2026-11-04)

## Fees

- Under ZIP 317 the conventional fee is the marginal fee times the larger of 2 and the number of logical actions. The marginal fee is 5,000 zatoshis before Revision 2 and 1,000 from Revision 2. Let the wallet or SDK compute it. Replaces: "fee: 10000", "a fixed fee of 0.0001 ZEC". (mainnet, testnet; [source](https://zips.z.cash/zip-0317), read 2026-11-04)

## Payments

- Treat a payment as seen, then mined, then confirmed, and wait for more confirmations on larger amounts. At 25-second testnet blocks, 10 confirmations take about 4 minutes. Replaces: "a broadcast payment is a finished payment". (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- Give a payment server a viewing key: it can see incoming payments but cannot spend them. Keep the spending key off the server. (mainnet, testnet; [source](https://fancy-spectacles-44b.notion.site/Zcash-Developer-Resources-3ff3e52aeb1580a583c8e82b95a6f94e), read 2026-11-04)
- Fund payments from shielded balances. Transparent funding can reveal and link the coins it spends. (mainnet, testnet; [source](https://github.com/NoirWallet/noir-wallet-sdk), read 2026-11-04)
- Memos go only to shielded recipients and hold at most 512 bytes. Put an order token in them, not personal data. (mainnet, testnet; [source](https://github.com/NoirWallet/noir-wallet-sdk), read 2026-11-04)
- Keep ZEC amounts as decimal strings or integer zatoshis (1 ZEC is 100,000,000 zatoshis), never as floating-point numbers. (mainnet, testnet; [source](https://github.com/NoirWallet/noir-wallet-sdk), read 2026-11-04)
- Payment links follow ZIP 321: zcash:<address>?amount=<ZEC with up to 8 decimals>&memo=<base64url, no padding>. Memos are only allowed for shielded addresses, and an unknown req- parameter makes the whole link invalid. (mainnet, testnet; [source](https://zips.z.cash/zip-0321), read 2026-11-04)
