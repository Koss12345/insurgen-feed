// Insurgen Bots — TEP-62/TEP-64 compatible NFT collection + item, written in Tact.
// Fixed-supply collection (maxSupply, default 100). Off-chain metadata (IPFS/HTTPS URIs).

import "@stdlib/content";

message(0x5fcc3d14) Transfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x05138d91) OwnershipAssigned {
    queryId: Int as uint64;
    prevOwner: Address;
    forwardPayload: Slice as remaining;
}

message(0xd53276db) Excesses {
    queryId: Int as uint64;
}

message(0x2fcb26a2) GetStaticData {
    queryId: Int as uint64;
}

message(0x8b771735) ReportStaticData {
    queryId: Int as uint64;
    index: Int as uint256;
    collection: Address;
}

message(0x693d3950) GetRoyaltyParams {
    queryId: Int as uint64;
}

message(0xa8cb00ad) ReportRoyaltyParams {
    queryId: Int as uint64;
    numerator: Int as uint16;
    denominator: Int as uint16;
    destination: Address;
}

// Custom (non-TEP-62) admin messages used only by the collection owner to mint.
message Mint {
    queryId: Int as uint64;
}

message BatchMint {
    queryId: Int as uint64;
    count: Int as uint16;
}

// Sent by the collection to a freshly deployed item contract to set its
// initial owner + content. Only accepted once, and only from the collection.
message InitializeItem {
    queryId: Int as uint64;
    itemOwner: Address;
    individualContent: Cell;
}

struct CollectionData {
    nextItemIndex: Int;
    collectionContent: Cell;
    ownerAddress: Address;
}

struct RoyaltyParams {
    numerator: Int;
    denominator: Int;
    destination: Address;
}

struct GetNftData {
    isInitialized: Bool;
    index: Int;
    collectionAddress: Address;
    ownerAddress: Address;
    individualContent: Cell;
}

struct NftItemInit {
    index: Int;
    collectionAddress: Address;
}

fun computeItemInit(collectionAddress: Address, index: Int): StateInit {
    return initOf NftItem(index, collectionAddress);
}

contract NftCollection {
    owner: Address;
    nextItemIndex: Int as uint64 = 0;
    maxSupply: Int as uint64;
    collectionContent: Cell;
    royaltyParams: RoyaltyParams;

    init(owner: Address, maxSupply: Int, collectionContentUri: String, royaltyParams: RoyaltyParams) {
        self.owner = owner;
        self.maxSupply = maxSupply;
        self.collectionContent = createOffchainContent(collectionContentUri);
        self.royaltyParams = royaltyParams;
    }

    receive() {
        // Accept plain TON transfers (e.g. topping up the contract for gas) without failing.
    }

    receive(msg: Mint) {
        self.requireOwner();
        require(self.nextItemIndex < self.maxSupply, "All items already minted");
        self.mintItem(self.owner, self.nextItemIndex, msg.queryId);
        self.nextItemIndex += 1;
    }

    // Capped well below the ~75-80 item ceiling a single transaction hits under the
    // standard TVM compute gas limit (measured empirically in the sandbox test suite).
    receive(msg: BatchMint) {
        self.requireOwner();
        require(msg.count > 0 && msg.count <= 30, "Invalid batch count (max 30 per transaction)");
        require(self.nextItemIndex + msg.count <= self.maxSupply, "Batch exceeds max supply");
        let i: Int = 0;
        while (i < msg.count) {
            self.mintItem(self.owner, self.nextItemIndex, msg.queryId);
            self.nextItemIndex += 1;
            i += 1;
        }
    }

    fun mintItem(itemOwner: Address, index: Int, queryId: Int) {
        let indexUri: String = beginString().concat(index.toString()).concat(".json").toString();
        let init: StateInit = computeItemInit(myAddress(), index);
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.05"),
            bounce: false,
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data,
            body: InitializeItem{
                queryId: queryId,
                itemOwner: itemOwner,
                individualContent: createOffchainContent(indexUri)
            }.toCell()
        });
    }

    receive(msg: GetRoyaltyParams) {
        send(SendParameters{
            to: sender(),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: ReportRoyaltyParams{
                queryId: msg.queryId,
                numerator: self.royaltyParams.numerator,
                denominator: self.royaltyParams.denominator,
                destination: self.royaltyParams.destination
            }.toCell()
        });
    }

    fun requireOwner() {
        require(sender() == self.owner, "Only the collection owner can do this");
    }

    get fun get_collection_data(): CollectionData {
        return CollectionData{
            nextItemIndex: self.nextItemIndex,
            collectionContent: self.collectionContent,
            ownerAddress: self.owner
        };
    }

    get fun get_nft_address_by_index(index: Int): Address {
        let init: StateInit = computeItemInit(myAddress(), index);
        return contractAddress(init);
    }

    get fun royalty_params(): RoyaltyParams {
        return self.royaltyParams;
    }

    get fun max_supply(): Int {
        return self.maxSupply;
    }
}

contract NftItem {
    index: Int as uint64;
    collectionAddress: Address;
    owner: Address?;
    content: Cell?;

    init(index: Int, collectionAddress: Address) {
        self.index = index;
        self.collectionAddress = collectionAddress;
        self.owner = null;
        self.content = null;
    }

    receive(msg: InitializeItem) {
        require(sender() == self.collectionAddress, "Only the collection can initialize this item");
        require(self.owner == null, "Item already initialized");
        self.owner = msg.itemOwner;
        self.content = msg.individualContent;
    }

    receive(msg: Transfer) {
        let currentOwner: Address = self.requireInitialized();
        require(sender() == currentOwner, "Only the current owner can transfer this item");
        self.owner = msg.newOwner;

        if (msg.forwardAmount > 0) {
            send(SendParameters{
                to: msg.newOwner,
                value: msg.forwardAmount,
                bounce: false,
                mode: SendPayGasSeparately,
                body: OwnershipAssigned{
                    queryId: msg.queryId,
                    prevOwner: currentOwner,
                    forwardPayload: msg.forwardPayload
                }.toCell()
            });
        }

        send(SendParameters{
            to: msg.responseDestination,
            value: 0,
            bounce: false,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: Excesses{queryId: msg.queryId}.toCell()
        });
    }

    receive(msg: GetStaticData) {
        send(SendParameters{
            to: sender(),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: ReportStaticData{
                queryId: msg.queryId,
                index: self.index,
                collection: self.collectionAddress
            }.toCell()
        });
    }

    fun requireInitialized(): Address {
        require(self.owner != null, "Item has not been minted yet");
        return self.owner!!;
    }

    get fun get_nft_data(): GetNftData {
        let initialized: Bool = self.owner != null;
        let ownerAddress: Address = initialized ? self.owner!! : self.collectionAddress;
        let individualContent: Cell = initialized ? self.content!! : emptyCell();
        return GetNftData{
            isInitialized: initialized,
            index: self.index,
            collectionAddress: self.collectionAddress,
            ownerAddress: ownerAddress,
            individualContent: individualContent
        };
    }
}
