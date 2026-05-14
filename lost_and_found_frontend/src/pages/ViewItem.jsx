import React, { useState, useEffect } from "react";
import { parseAbi } from 'viem';

const contractABI = parseAbi([
  'function getItem(uint256 _itemId) public view returns (uint256, address, string memory, string memory, uint8, address)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'event ItemRegistered(uint256 indexed itemId, address indexed owner, string itemName)'
]);

const statusMap = {
  0: 'Active',
  1: 'Lost',
  2: 'Found',
  3: 'Returned'
};

function ViewItem({ userAcc, publicClient, contractAddress, contractABI: passedABI }) {
  const [allItems, setAllItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [item, setItem] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ================= FETCH ALL MY ITEMS =================

  useEffect(() => {
    if (userAcc) {
      fetchAllItems();
    }
  }, [userAcc]);

  const fetchAllItems = async () => {
    setItemsLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/items/my-items', {
        method: 'GET',
        credentials: 'include'
      });
     
      const data = await res.json();
      if (data.success) {
        setAllItems(data.items);
      }
      
      
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  // ================= FETCH ITEM DETAILS FROM BLOCKCHAIN =================

  const fetchItemDetails = async (id) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setItem(null);
      setMetadata(null);

      if (!publicClient) {
        setError("Wallet not connected. Please connect MetaMask first.");
        return;
      }

      const numId = parseInt(id);

      if (isNaN(numId) || numId < 0) {
        setError("Invalid Item ID format");
        return;
      }

      console.log(" Fetching item #" + numId + " from blockchain...");
      setSuccess("Fetching item from blockchain...");

      const itemData = await publicClient.readContract({
        address: contractAddress,
        abi: passedABI || contractABI,
        functionName: 'getItem',
        args: [numId],
      });

      console.log("Blockchain data:", itemData);

      const formattedItem = {
        itemId: itemData[0].toString(),
        owner: itemData[1].toString(),
        itemName: itemData[2].toString(),
        ipfsCID: itemData[3].toString(),
        status: statusMap[Number(itemData[4])] || 'Unknown',
        statusCode: Number(itemData[4]),
        finder: itemData[5].toString(),
        ipfsUrl: `https://ipfs.io/ipfs/${itemData[3].toString()}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${itemData[3].toString()}`
      };

      setItem(formattedItem);
      setSuccess("Item found! Loading metadata from IPFS...");

      // ===== FETCH METADATA FROM IPFS =====

      try {
        console.log("📦 Fetching metadata from IPFS...");

        const metadataRes = await fetch(formattedItem.gatewayUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!metadataRes.ok) {
          throw new Error(`IPFS fetch failed with status ${metadataRes.status}`);
        }

        const metadataJson = await metadataRes.json();

        console.log("Metadata loaded:", metadataJson);

        setMetadata(metadataJson);
        setSuccess("Item loaded successfully!");

      } catch (ipfsErr) {
        console.error("⚠️ IPFS fetch error:", ipfsErr);
        setMetadata(null);
        setSuccess("Item loaded from blockchain (metadata temporarily unavailable)");
      }

    } catch (err) {
      console.error("Error:", err);

      if (err.message?.includes('Contract error')) {
        setError("Item not found on blockchain");
      } else if (err.message?.includes('reverted')) {
        setError("Item does not exist");
      } else {
        setError(`${err.message || 'Failed to fetch item'}`);
      }

      setItem(null);
      setMetadata(null);

    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE SEARCH =================

  const handleSearch = async () => {
    if (!itemId.trim()) {
      setError("Please enter an Item ID");
      return;
    }
    await fetchItemDetails(itemId);
  };

  const handleSelectItem = (selectedItem) => {
    setItemId(selectedItem.itemId.toString());
    fetchItemDetails(selectedItem.itemId);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCloseDetails = () => {
    setItem(null);
    setMetadata(null);
    setItemId("");
    setError("");
    setSuccess("");
  };

  // ================= RENDER =================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          {showSearch ? 'Hide Search' : 'Search Item'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* SEARCH SECTION - Toggle */}
      {showSearch && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Search Item by ID</h2>
          
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter Item ID..."
              className="flex-1 px-4 py-2 text-sm border border-gray-200 bg-white text-black placeholder-gray-400 outline-none transition-colors focus:border-black rounded"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              min="0"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      )}

      {/* MY ITEMS LIST - DEFAULT VIEW */}
      {!showSearch && !item && (
        <div className="space-y-4">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading your items...</p>
              </div>
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white border border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <p className="text-gray-600 text-sm">No items found</p>
              <p className="text-xs text-gray-500 mt-1">Register an item to view its details</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allItems.map((listItem) => (
                <div
                  key={listItem._id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleSelectItem(listItem)}
                >
                  {/* Image */}
                  {listItem.imageCID && listItem.imageCID.length > 0 ? (
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={`https://ipfs.io/ipfs/${listItem.imageCID[0]}`}
                        alt={listItem.itemName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-black text-sm line-clamp-2 mb-2">
                      {listItem.itemName}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-600">#{listItem.itemId}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        listItem.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        listItem.status === 'Lost' ? 'bg-red-100 text-red-700' :
                        listItem.status === 'Found' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {listItem.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 mb-3">
                      <p><span className="font-medium">Category:</span> {listItem.category}</p>
                      {listItem.color && <p><span className="font-medium">Color:</span> {listItem.color}</p>}
                    </div>

                    <button className="w-full py-2 text-xs font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ITEM DETAILS VIEW */}
      {item && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Close Button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">Item Details</h2>
            <button
              onClick={handleCloseDetails}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Image */}
            {metadata?.imageCID && metadata.imageCID.length > 0 ? (
              <div className="text-center">
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${metadata.imageCID[0]}`}
                  alt={metadata.itemName || item.itemName}
                  className="max-w-full max-h-96 rounded-lg mx-auto border border-gray-200"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400?text=Image+Not+Available";
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">📷 Image not available</p>
              </div>
            )}

            {/* Header */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-black">{metadata?.itemName || item.itemName}</h3>
                  <p className="text-sm text-gray-600 mt-2">NFT Token ID: #{item.itemId}</p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded ${
                  item.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'Lost' ? 'bg-red-100 text-red-700' :
                  item.status === 'Found' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Description */}
            {metadata?.description && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{metadata.description}</p>
              </div>
            )}

            {/* Details Grid */}
            {metadata && (
              <div className="grid grid-cols-2 gap-4">
                {metadata.category && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Category</p>
                    <p className="text-sm text-black">{metadata.category}</p>
                  </div>
                )}

                {metadata.brand && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Brand</p>
                    <p className="text-sm text-black">{metadata.brand}</p>
                  </div>
                )}

                {metadata.model && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Model</p>
                    <p className="text-sm text-black">{metadata.model}</p>
                  </div>
                )}

                {metadata.color && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Color</p>
                    <p className="text-sm text-black">{metadata.color}</p>
                  </div>
                )}

                {metadata.serialNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Serial Number</p>
                    <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded border border-gray-200">{metadata.serialNumber}</p>
                  </div>
                )}

                {metadata.condition && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Condition</p>
                    <p className="text-sm text-black">{metadata.condition}</p>
                  </div>
                )}

                {metadata.imei && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">IMEI</p>
                    <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded border border-gray-200">{metadata.imei}</p>
                  </div>
                )}

                {metadata.macAddress && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">MAC Address</p>
                    <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded border border-gray-200">{metadata.macAddress}</p>
                  </div>
                )}

                {metadata.operatingSystem && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Operating System</p>
                    <p className="text-sm text-black">{metadata.operatingSystem}</p>
                  </div>
                )}

                {metadata.storageCapacity && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Storage</p>
                    <p className="text-sm text-black">{metadata.storageCapacity}</p>
                  </div>
                )}

                {metadata.customMarkings && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Custom Markings</p>
                    <p className="text-sm text-black">{metadata.customMarkings}</p>
                  </div>
                )}

                {metadata.timestamp && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Registered</p>
                    <p className="text-sm text-black">{new Date(metadata.timestamp).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}

            {/* Blockchain Details */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Blockchain Details</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Owner Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded border border-gray-200 flex-1 break-all">
                      {item.owner.substring(0, 10)}...{item.owner.substring(30)}
                    </p>
                    <a 
                      href={`https://explorer.hoodi.soneium.org/address/${item.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-black hover:text-gray-700 font-medium whitespace-nowrap"
                    >
                      View →
                    </a>
                  </div>
                </div>

                {item.finder !== '0x0000000000000000000000000000000000000000' && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Finder Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded border border-gray-200 flex-1 break-all">
                        {item.finder.substring(0, 10)}...{item.finder.substring(30)}
                      </p>
                      <a 
                        href={`https://explorer.hoodi.soneium.org/address/${item.finder}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-black hover:text-gray-700 font-medium whitespace-nowrap"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Status Code</p>
                  <p className="text-sm text-black">{item.statusCode}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">IPFS Metadata</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded border border-gray-200 flex-1 break-all">
                      {item.ipfsCID.substring(0, 20)}...
                    </p>
                    <a 
                      href={`https://gateway.pinata.cloud/ipfs/${item.ipfsCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-black hover:text-gray-700 font-medium whitespace-nowrap"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Share This Item</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="flex-1 py-2 px-4 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                 Copy Link
                </button>
                <a 
                  href={`https://explorer.hoodi.soneium.org/token/${contractAddress}?a=${item.itemId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 text-sm font-medium bg-gray-100 text-black rounded hover:bg-gray-200 transition-colors text-center"
                >
                 View NFT
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewItem;