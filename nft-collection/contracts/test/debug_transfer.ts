import { Blockchain } from '@ton/sandbox';
import { toNano, Cell } from '@ton/core';
import { NftCollection } from '../output/InsurgenBots_NftCollection';
import { NftItem } from '../output/InsurgenBots_NftItem';

async function run(forwardAmount: bigint, label: string) {
  console.log(`\n=== ${label} (forwardAmount=${forwardAmount}) ===`);
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
    { value: toNano('0.2') },
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

  for (const tx of result.transactions) {
    const desc: any = tx.description;
    if (desc.type === 'generic') {
      const cp = desc.computePhase;
      const success = cp.type === 'vm' ? cp.success : 'skipped';
      console.log(`  tx to=${tx.inMessage?.info.dest} computeSuccess=${success}`);
      if (cp.type === 'vm' && !cp.success) {
        console.log(`    exitCode=${cp.exitCode}`);
      }
      for (const outMsg of tx.outMessages.values()) {
        const dest = outMsg.info.type === 'internal' ? outMsg.info.dest.toString() : '(external)';
        let opcode = 'n/a';
        try {
          const slice = outMsg.body.beginParse();
          opcode = '0x' + slice.loadUint(32).toString(16);
        } catch {}
        console.log(`    -> out to ${dest} opcode=${opcode}`);
      }
    }
  }

  const isOwnerAddr = owner.address.toString();
  let excessesToOwner = false;
  for (const tx of result.transactions) {
    for (const outMsg of tx.outMessages.values()) {
      if (outMsg.info.type !== 'internal') continue;
      if (outMsg.info.dest.toString() !== isOwnerAddr) continue;
      try {
        const slice = outMsg.body.beginParse();
        const op = slice.loadUint(32);
        if (op === 0xd53276db) excessesToOwner = true;
      } catch {}
    }
  }
  console.log(`  Excesses sent back to owner: ${excessesToOwner}`);
}

(async () => {
  await run(0n, 'No forward (typical marketplace listing)');
  await run(toNano('0.01'), 'With forward notify');
})();
