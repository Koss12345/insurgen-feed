# Insurgen Bots — 100 NFT collection (TON)

Everything needed to generate, deploy, and list a fixed-supply 100-item NFT
collection on TON, ready for [Getgems](https://getgems.io).

```
nft-collection/
  generator/     generative art (SVG -> PNG) + TEP-64 metadata for 100 unique tokens
  contracts/     TEP-62 NFT collection + item smart contracts, written in Tact
```

## 1. Generate the art + metadata

```bash
cd generator
npm install
npm run generate -- --count 100 --seed 1337
```

This writes to `generator/output/`:
- `images/0.png … 99.png` — 500x500 PNGs, procedurally composed (background, shape,
  pattern, eyes, mouth, accessory), no external art assets needed.
- `metadata/0.json … 99.json` — one TEP-64 metadata file per token (`name`,
  `description`, `image`, `attributes`).
- `collection.json`, `cover.png` — collection-level metadata.
- `rarity_report.json` — trait distribution, so you can sanity-check rarity before minting.

Traits and their weights (rarity) live in `generator/traits.js` — edit the
`TRAITS` object to change the art style, add categories, or adjust drop rates.
Re-running with the same `--seed` always reproduces the same 100 images.

Run `node generate.js --help`-equivalent flags: `--count`, `--seed`, `--out`, `--base-uri`.

## 2. Upload to IPFS

Metadata `image` fields are placeholders until you know the final IPFS URI. Upload
via [Pinata](https://pinata.cloud) or [nft.storage](https://nft.storage) — either
their web UI (drag the whole `output/images` folder) or CLI:

```bash
# example with the Pinata CLI, after `pinata login`
pinata upload output/images --group insurgen-bots-images
pinata upload output/metadata --group insurgen-bots-metadata
```

Take the resulting IPFS CID for the metadata folder and regenerate with it baked in
so every `metadata/*.json`'s `image` field points at the real image CID:

```bash
node generate.js --count 100 --seed 1337 --base-uri https://gateway.pinata.cloud/ipfs/<IMAGES_CID>/
```

Then upload the regenerated `metadata/` folder itself and note *that* CID —
you'll need `https://<gateway>/ipfs/<METADATA_CID>/collection.json` as
`COLLECTION_CONTENT_URI` in the next step. Each item's on-chain content pointer
(set by the contract at mint time) is `<index>.json`, so it must resolve
against the same base as `collection.json`.

## 3. Compile, test, and deploy the contract

```bash
cd ../contracts
npm install
npm run build       # Tact -> FunC -> TVM bytecode, writes contracts/output/
npm test            # full sandbox simulation: deploy, mint, batch-mint, transfer, access control
```

The test suite (`test/nft.test.ts`) deploys the contract in a local TON sandbox
and asserts: minting increments supply correctly, minting past `maxSupply` is
rejected, only the owner can mint, transfers move ownership, and a non-owner
cannot transfer someone else's item. All checks currently pass.

To deploy for real:

```bash
cp .env.example .env    # fill in MNEMONIC, TON_ENDPOINT, TON_API_KEY, COLLECTION_CONTENT_URI
npm run deploy           # -> prints the collection address
# put that address into .env as COLLECTION_ADDRESS, then:
npm run mint              # mints all 100 items in batches of 30
```

**Always deploy to testnet first** (`https://testnet.toncenter.com/api/v2/jsonRPC`,
get testnet TON from [@testgiver_ton_bot](https://t.me/testgiver_ton_bot)) and
verify the collection page renders correctly before touching mainnet.

### Why batches of 30

`BatchMint` mints several items in one transaction, but each mint does a real
contract deploy (state-init + address computation), and a single TON
transaction has a hard TVM compute-gas ceiling. This was **measured, not
guessed**: the sandbox test suite tried batch sizes up to 99 and found batches
above ~75-80 run out of gas and revert entirely. The contract enforces a
`count <= 30` cap with a safety margin below that measured cliff — minting all
100 takes 4 `BatchMint` transactions, which `mint.ts` handles automatically.

## 4. List on Getgems

Once the collection is deployed and fully minted:
1. Go to [getgems.io](https://getgems.io) (never a look-alike domain) and connect
   the same wallet used to deploy.
2. Getgems auto-indexes any TEP-62-compliant collection within roughly an hour —
   search for your collection address, or wait for it to appear under your wallet.
3. Verify the contract address on [tonviewer.com](https://tonviewer.com) matches
   what `deploy.ts` printed before trusting anything about the listing.

## Security notes

- `.env` holds your wallet seed phrase — it's gitignored; never commit it or paste
  it anywhere.
- The contract's `mintItem`/`requireOwner` checks mean only the deployer wallet can
  mint or batch-mint; ownership can be transferred later via a standard `Transfer`
  message if you want a different address to hold minting rights.
- This contract has been tested for the logic paths above but has **not** had an
  external security audit — treat it as solid for a personal/small collection, not
  as audited infrastructure for handling large sums.
- Heads-up: `@tact-lang/compiler` currently ships an npm deprecation notice
  pointing at [Tolk](https://docs.ton.org/tolk/overview) as TON's newer contract
  language. The compiled output here is valid, tested TVM bytecode either way,
  but for new contracts going forward it's worth knowing Tact itself is being
  phased out in favor of Tolk.
