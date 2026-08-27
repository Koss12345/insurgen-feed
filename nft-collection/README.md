# Insurgen Ballers — 100 chibi footballer NFT collection (TON)

Everything needed to generate, deploy, and list a fixed-supply 100-item NFT
collection on TON, ready for [Getgems](https://getgems.io).

```
nft-collection/
  chibi-spin/    current art pipeline — chibi footballers with an idle
                 animation (blink + breathing bob + prop sparkle), TEP-64 metadata
  contracts/     TEP-62 NFT collection + item smart contracts, written in Tact
  generator/     earlier prototype: abstract procedural "bot" avatars (static PNGs)
  figurine-3d/   earlier prototype: true rotating 3D box-mesh figurine (GIF)
```

`chibi-spin/` is the current collection — a flat cel-shaded chibi character
(big head, small body, thick outline, glossy gradients) standing still and
blinking/breathing rather than spinning, matching a reference the collection
style was calibrated against. `generator/` and `figurine-3d/` were earlier
directions kept for reference; you don't need them to ship the collection.

**Design note:** every character is a generic archetype (procedurally varied
traits — no fixed identity), not a depiction of any real, named footballer.
Selling NFTs of real athletes' likeness/name without a license is a real legal
risk (image rights, not just an implementation detail) — see the original
design discussion in this repo's commit history if you're tempted to add real
names or portraits later.

## 1. Generate the art + metadata

```bash
cd chibi-spin
npm install
npm run generate -- --count 100 --seed 1337
```

Takes about 2 minutes and writes to `chibi-spin/output/collection/`:
- `images/0.gif … 99.gif` — 420x420 looping animated GIFs (24 frames each,
  ~350-450KB), procedurally composed from weighted traits (background, skin,
  hairstyle + color, jersey, shorts, boots, expression, held prop, arm pose).
  Jersey number is the token id + 1, so every token has a distinct number.
- `metadata/0.json … 99.json` — one TEP-64 metadata file per token (`name`,
  `description`, `image`, `attributes`).
- `collection.json`, `cover.png` — collection-level metadata.
- `rarity_report.json` — trait distribution, so you can sanity-check rarity
  before minting.

Traits and their weights (rarity) live in `chibi-spin/traits.js` — edit the
`TRAITS` object to change colors, add hairstyles, or adjust drop rates. The
actual drawing code (shapes, gradients, animation timing) is in
`character.js` and `idle.js`. Re-running with the same `--seed` always
reproduces the same 100 characters.

Flags: `--count`, `--seed`, `--out`, `--base-uri`. `npm run preview` renders
just one token to `output/preview/` for a quick look while iterating on style.

### Why GIF, not a spinning 3D model

An earlier round of this asked for a "rotating 3D model." A reference video
turned out to show something different: the character never rotates — it's a
front-facing idle loop (blink, soft bob, a sparkle burst near the held prop).
That's what's implemented here. If you actually want a literal spin, the
abandoned `figurine-3d/` prototype has a real from-scratch 3D engine (box
mesh, painter's-algorithm rendering, no GPU) that produces a true turntable
GIF instead — see its own code for that approach.

## 2. Upload to IPFS

Metadata `image` fields are placeholders until you know the final IPFS URI.
Upload via [Pinata](https://pinata.cloud) or [nft.storage](https://nft.storage)
— either their web UI (drag the whole `output/collection/images` folder) or CLI:

```bash
# example with the Pinata CLI, after `pinata login`
pinata upload output/collection/images --group insurgen-ballers-images
pinata upload output/collection/metadata --group insurgen-ballers-metadata
```

Take the resulting IPFS CID for the images folder and regenerate with it baked
in so every `metadata/*.json`'s `image` field points at the real CID:

```bash
npm run generate -- --count 100 --seed 1337 --base-uri https://gateway.pinata.cloud/ipfs/<IMAGES_CID>/
```

Then upload the regenerated `metadata/` folder itself and note *that* CID —
you'll need both, in the next step:
- `COLLECTION_CONTENT_URI` = `https://<gateway>/ipfs/<METADATA_CID>/collection.json`
- `ITEM_BASE_URI` = `https://<gateway>/ipfs/<METADATA_CID>/` (same folder, no filename)

The contract builds each item's full metadata URL itself at mint time as
`ITEM_BASE_URI + "<index>.json"` — every item ends up with a complete,
directly-fetchable URI, not a bare relative filename an indexer has no base
to resolve it against.

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
cannot transfer someone else's item. All checks currently pass. The contract
itself is generic — it doesn't hardcode a collection name or art style, so it
works unchanged regardless of which generator produced the metadata.

To deploy for real:

```bash
cp .env.example .env    # fill in MNEMONIC, TON_ENDPOINT, TON_API_KEY, COLLECTION_CONTENT_URI, ITEM_BASE_URI
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
4. Animated GIF images display and auto-play on Getgems the same as static
   images — no special handling needed on your end.

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
