import { Blockchain } from '@ton/sandbox';
import { toNano, Cell } from '@ton/core';
import { NftCollection } from '../output/InsurgenBots_NftCollection';
import { NftItem } from '../output/InsurgenBots_NftItem';

async function run(value: bigint, forwardAmount: bigint, label: string) {
  console.log(`\n=== ${label} (value=${value}, forwardAmount=${forwardAmount}) ===`);
  const blockchain = await Blockchain.create();
  const owner = await blockchain.treasury('owner');
  const saleContract = await blockchain.treasury('saleContract');
  const royaltyDest = await blockchain.treasury('royalty');

  const collection = blockchain.openContract(
    await NftCollection.fromInit(owner.address, 10n, 'https://example.com/collection.json', 'https://example.com/', {
      $$type: 'RoyaltyParams', numerator: 5n, denominator: 100n, destination: royaltyDest.address,
    })
  );
  await collection.send(owner.getSender(), { value: toNano('1') }, null);
  await collection.send(owner.getSender(), { value: toNano('0.2') }, { $$type: 'Mint', queryId: 1n });

  const itemAddress = await collection.getGetNftAddressByIndex(0n);
  const item = blockchain.openContract(NftItem.fromAddress(itemAddress));

  const result = await item.send(
    owner.getSender(),
    { value },
    {
      $$type: 'Transfer',
      queryId: 99n,
      newOwner: saleContract.address,
      responseDestination: owner.address,
      customPayload: null,
      forwardAmount,
      forwardPayload: new Cell().asSlice(),
    }
  );

  let excessesToOwner = false;
  let excessesValue = 0n;
  const isOwnerAddr = owner.address.toString();
  for (const tx of result.transactions) {
    const desc: any = tx.description;
    if (desc.type === 'generic' && desc.computePhase.type === 'vm' && !desc.computePhase.success) {
      console.log(`  FAILED compute exitCode=${desc.computePhase.exitCode} on tx to=${tx.inMessage?.info.dest}`);
    }
    for (const outMsg of tx.outMessages.values()) {
      if (outMsg.info.type !== 'internal') continue;
      if (outMsg.info.dest.toString() !== isOwnerAddr) continue;
      try {
        const slice = outMsg.body.beginParse();
        const op = slice.loadUint(32);
        if (op === 0xd53276db) {
          excessesToOwner = true;
          excessesValue = outMsg.info.value.coins;
        }
      } catch {}
    }
  }
  console.log(`  Excesses sent back to owner: ${excessesToOwner} value=${excessesValue}`);
}

(async () => {
  await run(toNano('0.2'), 0n, 'Generous value, no forward');
  await run(toNano('0.05'), 0n, 'Small value, no forward');
  await run(toNano('0.03'), 0n, 'Very small value, no forward');
  await run(toNano('0.05'), toNano('0.01'), 'Small value, with forward');
})();
