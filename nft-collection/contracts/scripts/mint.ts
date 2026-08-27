import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import { toNano, Address } from '@ton/core';
import 'dotenv/config';
import { NftCollection } from '../output/InsurgenBots_NftCollection';

// Mints the remaining supply in batches of 30 (the contract's per-transaction cap —
// see nft.tact for why: it's the empirically-measured ceiling before a single
// transaction runs out of TVM compute gas). Safe to re-run; it always mints only
// what's left, and waits for each batch's seqno to land before sending the next.
//
// Required env vars: MNEMONIC, TON_ENDPOINT, TON_API_KEY, COLLECTION_ADDRESS

const BATCH_SIZE = 30n;
const POLL_INTERVAL_MS = 5000;

async function main() {
  const mnemonic = requireEnv('MNEMONIC').split(' ');
  const endpoint = requireEnv('TON_ENDPOINT');
  const apiKey = process.env.TON_API_KEY;
  const collectionAddress = Address.parse(requireEnv('COLLECTION_ADDRESS'));

  const client = new TonClient({ endpoint, apiKey });
  const key = await mnemonicToWalletKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
  const walletContract = client.open(wallet);
  const sender = walletContract.sender(key.secretKey);
  const collection = client.open(NftCollection.fromAddress(collectionAddress));

  let queryId = BigInt(Date.now());

  while (true) {
    const data = await collection.getGetCollectionData();
    const maxSupply = await collection.getMaxSupply();
    const remaining = maxSupply - data.nextItemIndex;
    if (remaining <= 0n) {
      console.log(`Done. ${data.nextItemIndex}/${maxSupply} items minted.`);
      break;
    }

    const batchCount = remaining < BATCH_SIZE ? remaining : BATCH_SIZE;
    console.log(`Minting batch of ${batchCount} (progress: ${data.nextItemIndex}/${maxSupply})...`);

    const seqnoBefore = await walletContract.getSeqno();
    // ~0.06 TON per item (covers the 0.05 forwarded to each new item plus its own gas) + buffer.
    const value = toNano((0.06 * Number(batchCount) + 0.05).toFixed(3));
    await collection.send(sender, { value }, { $$type: 'BatchMint', queryId, count: batchCount });
    queryId += 1n;

    await waitForSeqno(walletContract, seqnoBefore);
  }
}

async function waitForSeqno(walletContract: ReturnType<TonClient['open']> & { getSeqno(): Promise<number> }, prevSeqno: number) {
  for (;;) {
    await sleep(POLL_INTERVAL_MS);
    const seqno = await walletContract.getSeqno();
    if (seqno > prevSeqno) return;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
