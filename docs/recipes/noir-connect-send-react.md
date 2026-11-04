# Connect Noir Wallet and send a shielded payment from a web app

Recipe `noir-connect-send-react` for the react stack, unverified on 2026-11-04. Evidence: Written from the @noir-wallet/sdk README and the wallet's source. On 4 Nov 2026 the testnet extension received TAZ, but a send from it failed on NU7 testnet with "transaction uses an incorrect consensus branch id", so sendTransaction will fail on testnet until Noir supports NU7.

## Known problem (4 Nov 2026)

Noir Wallet's testnet build signs transactions for the network upgrade before NU7, and testnet nodes reject them: "transaction uses an incorrect consensus branch id". Receiving and balances work. Until Noir ships NU7 support, pay from zcash-devtool (the send-shielded recipe), and use Noir only to receive.

## Install the testnet wallet

1. Open the [Noir Wallet releases](https://github.com/NoirWallet/noir-wallet/releases) and download the asset ending in `-testnet.zip` (v1.0.40 or later).
2. Unzip it, open `chrome://extensions`, turn on Developer mode and choose Load unpacked.
3. Check that the extension is named `[Testnet] Noir Wallet`. Mainnet and testnet are separate extensions; `switchNetwork()` always throws.

## Code

```bash
npm install @noir-wallet/sdk
```

```tsx
import { useState } from 'react';
import { getNoirWallet } from '@noir-wallet/sdk';

export function PayButton({ to, amount, memo }: { to: string; amount: string; memo: string }) {
  const [status, setStatus] = useState('');

  async function pay() {
    // getNoirWallet() is null during server rendering or without the extension.
    const wallet = getNoirWallet();
    if (!wallet) return setStatus('Install the Noir Wallet testnet extension first.');
    const { zcash } = wallet;
    try {
      // connect() opens an approval window, so call it from a click.
      if (!(await zcash.getAccounts())) await zcash.connect();
      const txid = await zcash.sendTransaction({ to, amount, memo, fundingSource: 'shielded' });
      setStatus(`Sent ${txid}. Waiting for it to be mined.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Wallet request failed');
    }
  }

  return (
    <div>
      <button onClick={pay}>Pay {amount} TAZ</button>
      <p>{status}</p>
    </div>
  );
}
```

## Gotchas

- Amounts are decimal ZEC strings, for example `'0.01'`. The field is `to`, not `address`.
- A memo needs a shielded recipient and holds at most 512 UTF-8 bytes.
- The wallet's approval screen sets the final fee. `getMaxTransfer()` estimates the most you can send.
- `sendTransaction` returns once the transaction is broadcast. Check `zcash_tx_status` or `getTransactionHistory()` for mined and confirmed.

## Privacy

- `fundingSource: 'shielded'` keeps the payment fully shielded. Transparent funding can reveal and link the coins it spends.
- Your site learns the connected account's addresses and balance. Ask only for what the flow needs.
- For identity, `signMessage(message, { signingMode: 'derived' })` gives a key that is unlinkable to the main transparent address.
