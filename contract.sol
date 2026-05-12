// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin ERC721 NFT
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LostAndFound is ERC721 {

    // NFT Counter
    uint256 public tokenCounter;

    // Item status
    enum ItemStatus { Active, Lost, Found, Returned }

    // Item Structure
    struct Item {
        uint256 itemId;
        address owner;
        string itemName;
        string ipfsCID;
        ItemStatus status;
        address finder;
        uint256 timestamp;
    }

    // Storage
    mapping(uint256 => Item) public items;
    mapping(address => uint256[]) public ownerItems;

    // Events
    event ItemRegistered(
        uint256 indexed itemId,
        address indexed owner,
        string itemName
    );

    event ItemMarkedLost(
        uint256 indexed itemId,
        address indexed owner
    );

    event ItemReportedFound(
        uint256 indexed itemId,
        address indexed finder
    );

    event ItemReturned(
        uint256 indexed itemId,
        address indexed owner
    );

    // Constructor
    constructor() ERC721("LostAndFoundNFT", "LFNFT") {}

    // 1️⃣ Register Item + Mint NFT
    function registerItem(
        string memory _itemName,
        string memory _ipfsCID
    ) public {

        uint256 newItemId = tokenCounter;

        // Mint NFT to Owner
        _safeMint(msg.sender, newItemId);

        // Store Item Data
        items[newItemId] = Item({
            itemId: newItemId,
            owner: msg.sender,
            itemName: _itemName,
            ipfsCID: _ipfsCID,
            status: ItemStatus.Active,
            finder: address(0),
            timestamp: block.timestamp
        });

        ownerItems[msg.sender].push(newItemId);

        emit ItemRegistered(
            newItemId,
            msg.sender,
            _itemName
        );

        tokenCounter++;
    }

    // 2️⃣ Mark Item as Lost
    function markAsLost(uint256 _itemId) public {

        require(
            ownerOf(_itemId) == msg.sender,
            "Only owner can mark lost"
        );

        require(
            items[_itemId].status == ItemStatus.Active,
            "Item already lost/found"
        );

        items[_itemId].status = ItemStatus.Lost;

        emit ItemMarkedLost(_itemId, msg.sender);
    }

    // 3️⃣ Report Found
    function reportFound(uint256 _itemId) public {

        require(
            items[_itemId].status == ItemStatus.Lost,
            "Item not marked as lost"
        );

        require(
            ownerOf(_itemId) != msg.sender,
            "Owner cannot report own item"
        );

        items[_itemId].status = ItemStatus.Found;
        items[_itemId].finder = msg.sender;

        emit ItemReportedFound(_itemId, msg.sender);
    }

    // 4️⃣ Confirm Return
    function confirmReturn(uint256 _itemId) public {

        require(
            ownerOf(_itemId) == msg.sender,
            "Only owner can confirm"
        );

        require(
            items[_itemId].status == ItemStatus.Found,
            "Item not found yet"
        );

        items[_itemId].status = ItemStatus.Returned;

        emit ItemReturned(_itemId, msg.sender);
    }

    // 5️⃣ Get Item Details
    function getItem(uint256 _itemId)
        public
        view
        returns (
            uint256 itemId,
            address owner,
            string memory itemName,
            string memory ipfsCID,
            ItemStatus status,
            address finder
        )
    {
        Item memory item = items[_itemId];

        return (
            item.itemId,
            item.owner,
            item.itemName,
            item.ipfsCID,
            item.status,
            item.finder
        );
    }

    // 6️⃣ Get My Items
    function getMyItems()
        public
        view
        returns (uint256[] memory)
    {
        return ownerItems[msg.sender];
    }

    // 7️⃣ Get Status as String
    function getItemStatus(uint256 _itemId)
        public
        view
        returns (string memory)
    {
        ItemStatus status = items[_itemId].status;

        if (status == ItemStatus.Active) return "Active";
        if (status == ItemStatus.Lost) return "Lost";
        if (status == ItemStatus.Found) return "Found";

        return "Returned";
    }
}