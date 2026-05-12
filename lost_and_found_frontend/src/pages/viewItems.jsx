import React, { useState } from "react";
import { parseAbi } from 'viem';
import "./ViewItems.css";

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

  const [itemId, setItemId] = useState("");
  const [item, setItem] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ================= FETCH ITEM FROM BLOCKCHAIN =================

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setItem(null);
      setMetadata(null);

      // ===== VALIDATION =====

      if (!itemId || itemId.trim() === "") {
        setError("❌ Please enter an Item ID");
        return;
      }

      if (!publicClient) {
        setError("❌ Wallet not connected. Please connect MetaMask first.");
        return;
      }

      const id = parseInt(itemId);

      if (isNaN(id) || id < 0) {
        setError("❌ Invalid Item ID format");
        return;
      }

      console.log("🔍 Fetching item #" + id + " from blockchain...");
      setSuccess("📡 Fetching item from blockchain...");

      // ===== READ FROM BLOCKCHAIN =====

      const itemData = await publicClient.readContract({
        address: contractAddress,
        abi: passedABI || contractABI,
        functionName: 'getItem',
        args: [id],
      });

      console.log("✅ Blockchain data:", itemData);

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
      setSuccess("✅ Item found! Loading metadata from IPFS...");

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

        console.log("✅ Metadata loaded:", metadataJson);

        setMetadata(metadataJson);
        setSuccess("✅ Item loaded successfully!");

      } catch (ipfsErr) {
        console.error("⚠️ IPFS fetch error:", ipfsErr);
        setMetadata(null);
        setSuccess("✅ Item loaded from blockchain (metadata temporarily unavailable)");
      }

    } catch (err) {
      console.error("❌ Error:", err);

      if (err.message?.includes('Contract error')) {
        setError("❌ Item not found on blockchain");
      } else if (err.message?.includes('reverted')) {
        setError("❌ Item does not exist");
      } else {
        setError(`❌ ${err.message || 'Failed to fetch item'}`);
      }

      setItem(null);
      setMetadata(null);

    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE ENTER KEY =================

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchItem();
    }
  };

  // ================= RENDER =================

  return (
    <div className="page">
      <div className="item-card">

        <h1>🔍 Lost & Found NFT Lookup</h1>
        <p className="subtitle">
          Enter NFT Item ID to view details on blockchain
        </p>

        {/* ===== SEARCH BOX ===== */}

        <div className="search-box">
          <input
            type="number"
            placeholder="Enter Item ID (NFT Token ID)..."
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            min="0"
          />
          <button
            onClick={fetchItem}
            disabled={loading}
            className="search-button"
          >
            {loading ? "⏳ Loading..." : "🔍 Search"}
          </button>
        </div>

        {/* ===== ERROR MESSAGE ===== */}

        {error && (
          <div className="error-box">
            <pre>{error}</pre>
          </div>
        )}

        {/* ===== SUCCESS MESSAGE ===== */}

        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        {/* ===== LOADING STATE ===== */}

        {loading && (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Fetching from blockchain...</p>
          </div>
        )}

        {/* ===== ITEM DETAILS ===== */}

        {item && (
          <div className="item-details">

            {/* ===== ITEM IMAGE ===== */}

            {metadata?.imageCID && metadata.imageCID.length > 0 ? (
              <div className="image-container">
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${metadata.imageCID[0]}`}
                  alt={metadata.itemName || item.itemName}
                  className="item-image"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400?text=Image+Not+Available";
                  }}
                />
              </div>
            ) : (
              <div className="image-placeholder">
                <p>📷 Image not available</p>
              </div>
            )}

            {/* ===== ITEM HEADER ===== */}

            <div className="item-header">
              <div>
                <h2>{metadata?.itemName || item.itemName}</h2>
                <p className="item-id">NFT Token ID: #{item.itemId}</p>
              </div>
              <div className={`status-badge status-${item.status.toLowerCase()}`}>
                {item.status}
              </div>
            </div>

            {/* ===== DESCRIPTION ===== */}

            {metadata?.description && (
              <div className="section">
                <h3>📝 Description</h3>
                <p>{metadata.description}</p>
              </div>
            )}

            {/* ===== ITEM DETAILS GRID ===== */}

            {metadata && (
              <div className="details-grid">

                {metadata.category && (
                  <div className="detail-item">
                    <span className="detail-label">📦 Category</span>
                    <p className="detail-value">{metadata.category}</p>
                  </div>
                )}

                {metadata.brand && (
                  <div className="detail-item">
                    <span className="detail-label">🏢 Brand</span>
                    <p className="detail-value">{metadata.brand}</p>
                  </div>
                )}

                {metadata.model && (
                  <div className="detail-item">
                    <span className="detail-label">⚙️ Model</span>
                    <p className="detail-value">{metadata.model}</p>
                  </div>
                )}

                {metadata.serialNumber && (
                  <div className="detail-item">
                    <span className="detail-label">🔢 Serial Number</span>
                    <p className="detail-value">{metadata.serialNumber}</p>
                  </div>
                )}

                {metadata.imei && (
                  <div className="detail-item">
                    <span className="detail-label">📱 IMEI</span>
                    <p className="detail-value">{metadata.imei}</p>
                  </div>
                )}

                {metadata.macAddress && (
                  <div className="detail-item">
                    <span className="detail-label">🌐 MAC Address</span>
                    <p className="detail-value">{metadata.macAddress}</p>
                  </div>
                )}

                {metadata.operatingSystem && (
                  <div className="detail-item">
                    <span className="detail-label">💻 Operating System</span>
                    <p className="detail-value">{metadata.operatingSystem}</p>
                  </div>
                )}

                {metadata.storageCapacity && (
                  <div className="detail-item">
                    <span className="detail-label">💾 Storage</span>
                    <p className="detail-value">{metadata.storageCapacity}</p>
                  </div>
                )}

                {metadata.color && (
                  <div className="detail-item">
                    <span className="detail-label">🎨 Color</span>
                    <p className="detail-value">{metadata.color}</p>
                  </div>
                )}

                {metadata.condition && (
                  <div className="detail-item">
                    <span className="detail-label">✨ Condition</span>
                    <p className="detail-value">{metadata.condition}</p>
                  </div>
                )}

                {metadata.customMarkings && (
                  <div className="detail-item full-width">
                    <span className="detail-label">🔍 Custom Markings</span>
                    <p className="detail-value">{metadata.customMarkings}</p>
                  </div>
                )}

                {metadata.timestamp && (
                  <div className="detail-item">
                    <span className="detail-label">⏰ Registered</span>
                    <p className="detail-value">
                      {new Date(metadata.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ===== BLOCKCHAIN DETAILS ===== */}

            <div className="section blockchain-section">
              <h3>⛓️ Blockchain Details</h3>

              <div className="blockchain-grid">
                <div className="blockchain-item">
                  <span className="detail-label">Owner Address</span>
                  <p className="detail-value monospace">
                    {item.owner.substring(0, 10)}...{item.owner.substring(30)}
                  </p>
                  <a 
                    href={`https://explorer.hoodi.soneium.org/address/${item.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blockchain-link"
                  >
                    View on Explorer →
                  </a>
                </div>

                {item.finder !== '0x0000000000000000000000000000000000000000' && (
                  <div className="blockchain-item">
                    <span className="detail-label">Finder Address</span>
                    <p className="detail-value monospace">
                      {item.finder.substring(0, 10)}...{item.finder.substring(30)}
                    </p>
                    <a 
                      href={`https://explorer.hoodi.soneium.org/address/${item.finder}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="blockchain-link"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}

                <div className="blockchain-item">
                  <span className="detail-label">Status Code</span>
                  <p className="detail-value">{item.statusCode}</p>
                </div>

                <div className="blockchain-item full-width">
                  <span className="detail-label">IPFS Metadata CID</span>
                  <p className="detail-value monospace">
                    {item.ipfsCID}
                  </p>
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${item.ipfsCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blockchain-link"
                  >
                    📦 View on IPFS →
                  </a>
                </div>
              </div>
            </div>

            {/* ===== SHARE SECTION ===== */}

            <div className="section share-section">
              <h3>📤 Share This Item</h3>
              <div className="share-buttons">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="share-btn"
                >
                  📋 Copy Link
                </button>
                <a 
                  href={`https://explorer.hoodi.soneium.org/token/${contractAddress}?a=${item.itemId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn"
                >
                  🔗 View NFT
                </a>
              </div>
            </div>

          </div>
        )}

        {/* ===== NO ITEM SELECTED ===== */}

        {!item && !loading && itemId && !error && (
          <div className="info-box">
            👆 Click Search to fetch item details from blockchain
          </div>
        )}

      </div>

      <style jsx>{`
        .search-button {
          padding: 0.75rem 1.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 1rem;
        }

        .search-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .search-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.65;
        }

        .error-box {
          padding: 1rem;
          background: #f8d7da;
          border: 2px solid #f5c6cb;
          border-radius: 6px;
          color: #721c24;
          margin: 1rem 0;
        }

        .error-box pre {
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .success-box {
          padding: 1rem;
          background: #d4edda;
          border: 2px solid #c3e6cb;
          border-radius: 6px;
          color: #155724;
          margin: 1rem 0;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .item-details {
          margin-top: 2rem;
          animation: slideIn 0.3s ease-out;
        }

        .image-container {
          margin-bottom: 2rem;
          text-align: center;
        }

        .item-image {
          max-width: 100%;
          max-height: 400px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .image-placeholder {
          width: 100%;
          height: 300px;
          background: #f0f0f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          margin-bottom: 2rem;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e0e0e0;
        }

        .item-id {
          margin: 0.5rem 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .status-active {
          background: #cce5ff;
          color: #004085;
        }

        .status-lost {
          background: #f8d7da;
          color: #721c24;
        }

        .status-found {
          background: #fff3cd;
          color: #856404;
        }

        .status-returned {
          background: #d4edda;
          color: #155724;
        }

        .section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .section h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.1rem;
          color: #333;
        }

        .section p {
          margin: 0.5rem 0;
          color: #555;
          line-height: 1.6;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .detail-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-label {
          display: block;
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .detail-value {
          margin: 0;
          font-size: 0.95rem;
          color: #333;
          word-break: break-word;
        }

        .monospace {
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
        }

        .blockchain-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #ffc107;
        }

        .blockchain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .blockchain-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }

        .blockchain-item.full-width {
          grid-column: 1 / -1;
        }

        .blockchain-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: #007bff;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: color 0.2s;
        }

        .blockchain-link:hover {
          color: #0056b3;
          text-decoration: underline;
        }

        .share-section {
          background: #e7f3ff;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #0056b3;
        }

        .share-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .share-btn {
          padding: 0.75rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-block;
        }

        .share-btn:hover {
          background: #0056b3;
        }

        .info-box {
          padding: 1rem;
          background: #d1ecf1;
          border: 2px solid #bee5eb;
          border-radius: 6px;
          color: #0c5460;
          text-align: center;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}

export default ViewItem;