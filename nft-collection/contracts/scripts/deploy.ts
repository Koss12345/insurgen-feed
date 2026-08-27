import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import { toNano, Address } from '@ton/core';
import 'dotenv/config';
import { NftCollection } from '../output/InsurgenBots_NftCollection';

// Deploys the NftCollection contract. Does NOT mint any items yet — run mint.ts after.
//
// Required env vars (put them in a local .env file, never commit it):
//   MNEMONIC                24-word wallet seed phrase (the collection owner + gas payer)
//   TON_ENDPOINT             e.g. https://testnet.toncenter.com/api/v2/jsonRPC
//   TON_API_KEY              toncenter API key (get one for free at https://t.me/tonapibot)
//   COLLECTION_CONTENT_URI   e.g. https://<ipfs-gateway>/<metadata-cid>/collection.json
//   ITEM_BASE_URI            directory each item's "<index>.json" is appended to —
//                            e.g. https://<ipfs-gateway>/<metadata-cid>/ (same folder
//                            as COLLECTION_CONTENT_URI, just without the filename)
//   ROYALTY_DESTINATION      address to receive royalties (defaults to the deployer)
//   MAX_SUPPLY               defaults to 100

async function main() {
  const mnemonic = requireEnv('MNEMONIC').split(' ');
  const endpoint = requireEnv('TON_ENDPOINT');
  const apiKey = process.env.TON_API_KEY;
  const collectionContentUri = requireEnv('COLLECTION_CONTENT_URI');
  const itemBaseUri = requireEnv('ITEM_BASE_URI');
  const maxSupply = BigInt(process.env.MAX_SUPPLY ?? '100');

  const client = new TonClient({ endpoint, apiKey });
  const key = await mnemonicToWalletKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
  const walletContract = client.open(wallet);
  const sender = walletContract.sender(key.secretKey);

  const royaltyDestination = process.env.ROYALTY_DESTINATION
    ? Address.parse(process.env.ROYALTY_DESTINATION)
    : wallet.address;

  const collection = client.open(
    await NftCollection.fromInit(wallet.address, maxSupply, collectionContentUri, itemBaseUri, {
      $$type: 'RoyaltyParams',
      numerator: 5n,
      denominator: 100n,
      destination: royaltyDestination,
    })
  );

  console.log('Deployer / owner address:', wallet.address.toString());
  console.log('Collection address (computed before deploy):', collection.address.toString());

  await collection.send(sender, { value: toNano('0.15') }, null);

  const explorerHost = endpoint.includes('testnet') ? 'testnet.tonviewer.com' : 'tonviewer.com';
  console.log('Deploy transaction sent. Wait for confirmation, then check the address on an explorer:');
  console.log(`  https://${explorerHost}/${collection.address.toString()}`);
  console.log('Once confirmed, set COLLECTION_ADDRESS and run mint.ts to mint all items.');
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
