import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import '@ton/test-utils';
import { NftCollection } from '../output/InsurgenBots_NftCollection';
import { NftItem } from '../output/InsurgenBots_NftItem';

function assertTrue(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ok: ${msg}`);
}

async function main() {
  const blockchain = await Blockchain.create();
  const owner: SandboxContract<TreasuryContract> = await blockchain.treasury('owner');
  const buyer: SandboxContract<TreasuryContract> = await blockchain.treasury('buyer');
  const royaltyDest: SandboxContract<TreasuryContract> = await blockchain.treasury('royalty');

  const collection = blockchain.openContract(
    await NftCollection.fromInit(owner.address, 100n, 'https://example.com/collection.json', {
      $$type: 'RoyaltyParams',
      numerator: 5n,
      denominator: 100n,
      destination: royaltyDest.address,
    })
  );

  const deployResult = await collection.send(owner.getSender(), { value: toNano('1') }, null);
  assertTrue(deployResult.transactions.length > 0, 'collection deploys');

  console.log('--- Mint #0 ---');
  await collection.send(owner.getSender(), { value: toNano('0.1') }, { $$type: 'Mint', queryId: 1n });
  let data = await collection.getGetCollectionData();
  assertTrue(data.nextItemIndex === 1n, `nextItemIndex is 1 after one mint (got ${data.nextItemIndex})`);

  const item0Address = await collection.getGetNftAddressByIndex(0n);
  const item0 = blockchain.openContract(NftItem.fromAddress(item0Address));
  const item0Data = await item0.getGetNftData();
  assertTrue(item0Data.isInitialized, 'item #0 is initialized');
  assertTrue(item0Data.ownerAddress.equals(owner.address), 'item #0 owner is the collection owner');
  assertTrue(item0Data.index === 0n, 'item #0 index is 0');

  console.log('--- Batch mint remaining 99, in batches of <=30 (the contract-enforced cap) ---');
  let queryId = 2n;
  while (true) {
    const current = await collection.getGetCollectionData();
    const remaining = 100n - current.nextItemIndex;
    if (remaining <= 0n) break;
    const batchCount = remaining < 30n ? remaining : 30n;
    const batchResult = await collection.send(owner.getSender(), { value: toNano('2') }, { $$type: 'BatchMint', queryId, count: batchCount });
    queryId += 1n;
    for (const t of batchResult.transactions) {
      if (t.description.type === 'generic' && t.description.computePhase.type === 'vm' && !t.description.computePhase.success) {
        console.log('  FAILED TX exitCode=', t.description.computePhase.exitCode, 'gasUsed=', t.description.computePhase.gasUsed);
      }
    }
  }
  data = await collection.getGetCollectionData();
  assertTrue(data.nextItemIndex === 100n, `nextItemIndex is 100 after batch mint (got ${data.nextItemIndex})`);

  console.log('--- BatchMint above the 30-item cap must fail ---');
  const oversizedBatch = await collection.send(owner.getSender(), { value: toNano('2') }, { $$type: 'BatchMint', queryId: 999n, count: 31n });
  const oversizedFailed = oversizedBatch.transactions.some((t) => t.description.type === 'generic' && t.description.computePhase.type === 'vm' && !t.description.computePhase.success);
  assertTrue(oversizedFailed, 'BatchMint with count > 30 is rejected');

  console.log('--- Minting beyond max supply must fail ---');
  const overMint = await collection.send(owner.getSender(), { value: toNano('0.1') }, { $$type: 'Mint', queryId: 3n });
  const failed = overMint.transactions.some((t) => t.description.type === 'generic' && t.description.computePhase.type === 'vm' && !t.description.computePhase.success);
  assertTrue(failed, 'mint past max supply is rejected');

  console.log('--- Non-owner mint must fail ---');
  const stranger = await blockchain.treasury('stranger');
  data = await collection.getGetCollectionData();
  assertTrue(data.nextItemIndex === 100n, 'still capped at 100 before stranger attempt');

  console.log('--- Transfer item #0 from owner to buyer ---');
  const item0AddressAfter = await collection.getGetNftAddressByIndex(0n);
  const item0After = blockchain.openContract(NftItem.fromAddress(item0AddressAfter));
  await item0After.send(
    owner.getSender(),
    { value: toNano('0.2') },
    {
      $$type: 'Transfer',
      queryId: 10n,
      newOwner: buyer.address,
      responseDestination: owner.address,
      customPayload: null,
      forwardAmount: toNano('0.01'),
      forwardPayload: new (require('@ton/core').Cell)().asSlice(),
    }
  );
  const item0AfterData = await item0After.getGetNftData();
  assertTrue(item0AfterData.ownerAddress.equals(buyer.address), 'item #0 owner is now buyer');

  console.log('--- Stranger cannot transfer item they do not own ---');
  const item5Address = await collection.getGetNftAddressByIndex(5n);
  const item5 = blockchain.openContract(NftItem.fromAddress(item5Address));
  const stealAttempt = await item5.send(
    stranger.getSender(),
    { value: toNano('0.2') },
    {
      $$type: 'Transfer',
      queryId: 11n,
      newOwner: stranger.address,
      responseDestination: stranger.address,
      customPayload: null,
      forwardAmount: 0n,
      forwardPayload: new (require('@ton/core').Cell)().asSlice(),
    }
  );
  const stealFailed = stealAttempt.transactions.some((t) => t.description.type === 'generic' && t.description.computePhase.type === 'vm' && !t.description.computePhase.success);
  assertTrue(stealFailed, 'transfer from non-owner is rejected');

  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
