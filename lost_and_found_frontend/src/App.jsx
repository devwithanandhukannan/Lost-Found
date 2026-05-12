import React, { useState } from "react";
import { createWalletClient, createPublicClient, custom, parseAbi } from 'viem';
import { hoodi } from 'viem/chains';

import { 
  uploadToIPFS, 
  uploadMetadataToIPFS 
} from "./api/blockchainApi.js";
import ViewItem from "./pages/viewItems.jsx";
import MakeLost from "./pages/makeLost.jsx";
import "./App.css";

// ================= CONTRACT ABI =================

import { contractABI } from './contractABI.js';

export default function App() {
  
  // ================= STATE MANAGEMENT =================
  
  const contractAddress = '0x0769304eA14C77933b1252BD33AB54D8FBD2B7E6';
  
  const [userAcc, setUserAcc] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [walletClient, setWalletClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState([]);

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    brand: "",
    model: "",
    serialNumber: "",
    imei: "",
    macAddress: "",
    operatingSystem: "",
    storageCapacity: "",
    color: "",
    condition: "",
    customMarkings: "",
    images: [],
  });

  // ================= CONNECT METAMASK =================
  
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setError('❌ MetaMask not installed. Please install MetaMask extension.');
      return;
    }

    try {
      // Create wallet client for transactions
      const wallet = createWalletClient({
        chain: hoodi,
        transport: custom(window.ethereum)
      });

      // Create public client using MetaMask provider (avoids CORS)
      const publicCli = createPublicClient({
        chain: hoodi,
        transport: custom(window.ethereum)
      });

     await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });

    // 2. Now fetch the accounts the user just authorized
    const addresses = await window.ethereum.request({ 
      method: 'eth_accounts' 
    });
      
      console.log('✅ Connected addresses:', addresses);
      
      setAllAccounts(addresses);
      setUserAcc(addresses[0]);
      setWalletClient(wallet);
      setPublicClient(publicCli);
      setSuccess(`✅ Connected: ${addresses[0].substring(0, 10)}...${addresses[0].substring(38)}`);
      setError("");
      setShowAccountDropdown(false);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAddresses) => {
        console.log('🔄 Accounts changed:', newAddresses);
        if (newAddresses.length === 0) {
          disconnectWallet();
        } else {
          setAllAccounts(newAddresses);
          setUserAcc(newAddresses[0]);
          setSuccess(`✅ Account switched to: ${newAddresses[0].substring(0, 10)}...${newAddresses[0].substring(38)}`);
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        console.log('🔄 Network changed');
        window.location.reload();
      });

    } catch (err) {
      console.error('❌ MetaMask connection error:', err);
      setError('Failed to connect MetaMask. Please try again.');
    }
  };

  // ================= SWITCH ACCOUNT =================
  
  const switchAccount = async (account) => {
    console.log('🔄 Switching to account:', account);
    setUserAcc(account);
    setSuccess(`✅ Switched to: ${account.substring(0, 10)}...${account.substring(38)}`);
    setShowAccountDropdown(false);
    setError("");
  };

  // ================= DISCONNECT WALLET =================
  
  const disconnectWallet = () => {
    setUserAcc("");
    setAllAccounts([]);
    setWalletClient(null);
    setPublicClient(null);
    setShowAccountDropdown(false);
    setSuccess("👋 Wallet disconnected");
  };

  // ================= HANDLE INPUT CHANGE =================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ================= HANDLE FILE UPLOAD =================
  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 3) {
      setError("⚠️ Maximum 3 images allowed");
      return;
    }

    setFormData({
      ...formData,
      images: files,
    });

    const imageUrls = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));
    
    setPreview(imageUrls);
    setError("");
  };

  // ================= CATEGORY CHECKS =================
  
  const isMobile = formData.category === "Mobile";
  const isElectronic = ["Mobile", "Laptop", "Tablet"].includes(formData.category);
  const isDocument = formData.category === "Document";

  // ================= REGISTER ITEM (DIRECT BLOCKCHAIN) =================
  
  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ===== VALIDATION =====
    
    if (!userAcc || !walletClient || !publicClient) {
      setError("❌ Please connect MetaMask first");
      return;
    }

    if (!formData.itemName.trim()) {
      setError("❌ Item name is required");
      return;
    }

    if (formData.images.length === 0) {
      setError("❌ Upload at least 1 image");
      return;
    }

    setLoading(true);

    try {
      
      // ===== STEP 1: UPLOAD IMAGES TO IPFS =====
      
      console.log("📤 Step 1: Uploading images to IPFS...");
      setSuccess("📤 Step 1/3: Uploading images to IPFS...");

      const uploadedImages = [];
      
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        setSuccess(`📤 Uploading image ${i + 1}/${formData.images.length}...`);
        
        const uploadRes = await uploadToIPFS(file);
        
        if (!uploadRes.success) {
          throw new Error(uploadRes.message || "Failed to upload image");
        }

        uploadedImages.push(uploadRes.cid);
      }

      console.log("✅ Uploaded Images:", uploadedImages);

      // ===== STEP 2: UPLOAD METADATA TO IPFS =====
      
      console.log("📤 Step 2: Uploading metadata to IPFS...");
      setSuccess("📤 Step 2/3: Uploading metadata to IPFS...");

      const metadata = {
        itemName: formData.itemName,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        imei: formData.imei,
        macAddress: formData.macAddress,
        operatingSystem: formData.operatingSystem,
        storageCapacity: formData.storageCapacity,
        color: formData.color,
        condition: formData.condition,
        customMarkings: formData.customMarkings,
        imageCID: uploadedImages,
        timestamp: new Date().toISOString(),
        owner: userAcc
      };

      const metadataRes = await uploadMetadataToIPFS(metadata);

      if (!metadataRes.success) {
        throw new Error(metadataRes.message || "Failed to upload metadata");
      }

      const metadataCID = metadataRes.cid;
      console.log("✅ Metadata CID:", metadataCID);

      // ===== STEP 3: REGISTER ON BLOCKCHAIN (DIRECT) =====
      
      console.log("⛓️ Step 3: Sending transaction to blockchain...");
      setSuccess("⛓️ Step 3/3: Please confirm transaction in MetaMask...");

      // Write to contract using walletClient
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'registerItem',
        args: [formData.itemName, metadataCID],
        account: userAcc,
      });

      console.log("📝 Transaction hash:", hash);
      setSuccess(`⏳ Waiting for confirmation...\n🔗 ${hash.substring(0, 20)}...`);

      // Wait for transaction confirmation using publicClient
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash,
          timeout: 60_000,
        });

        console.log("✅ Transaction confirmed:", receipt);

        // Extract itemId from logs
        let itemId = null;
        if (receipt.logs && receipt.logs.length > 0) {
          try {
            const log = receipt.logs[0];
            if (log.topics && log.topics.length > 1) {
              itemId = parseInt(log.topics[1], 16);
            }
          } catch (parseErr) {
            console.log('Error parsing itemId from logs:', parseErr);
          }
        }

        // If itemId not found in logs, try to read from contract
        if (itemId === null) {
          try {
            const counter = await publicClient.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'tokenCounter',
            });
            itemId = Number(counter) - 1;
          } catch (readErr) {
            console.log('Error reading tokenCounter:', readErr);
          }
        }

        // ===== SUCCESS MESSAGE =====
        
        const txHash = receipt.transactionHash;
        const blockNumber = receipt.blockNumber;

        setSuccess(
          `✅ NFT Minted Successfully!\n\n` +
          `🎫 Item ID: ${itemId !== null ? `#${itemId}` : 'Processing...'}\n` +
          `📦 Metadata CID: ${metadataCID.substring(0, 30)}...\n` +
          `🔗 Transaction: ${txHash.substring(0, 20)}...\n` +
          `📊 Block: ${blockNumber}\n\n` +
          `🔍 View on IPFS: https://ipfs.io/ipfs/${metadataCID}\n` +
          `🌐 View on Hoodi: https://explorer.hoodi.soneium.org/tx/${txHash}`
        );

        // ===== RESET FORM =====
        
        setTimeout(() => {
          setFormData({
            itemName: "",
            category: "",
            description: "",
            brand: "",
            model: "",
            serialNumber: "",
            imei: "",
            macAddress: "",
            operatingSystem: "",
            storageCapacity: "",
            color: "",
            condition: "",
            customMarkings: "",
            images: [],
          });

          setPreview([]);
        }, 2000);

      } catch (waitErr) {
        console.log('Transaction sent but confirmation timed out:', waitErr);
        setSuccess(
          `✅ Transaction Sent!\n\n` +
          `📝 Hash: ${hash}\n` +
          `📦 Metadata CID: ${metadataCID}\n\n` +
          `⏳ Checking transaction status...\n` +
          `🔍 View: https://explorer.hoodi.soneium.org/tx/${hash}`
        );
      }

    } catch (err) {
      console.error("❌ Error:", err);
      
      // Handle specific errors
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        setError('❌ Transaction rejected by user');
      } else if (err.message?.includes('insufficient funds')) {
        setError('❌ Insufficient ETH for gas fees. Get testnet ETH from faucet.');
      } else if (err.message?.includes('CORS')) {
        setError('❌ Network error. Please check your connection.');
      } else {
        setError(`❌ ${err.message || 'Transaction failed'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // ================= RENDER =================

  return (
    <div className="container">
      
      {/* ===== HEADER ===== */}
      
      <div className="header">
        <div className="header-left">
          <h1>🔐 Lost & Found NFT</h1>
          <p className="network-badge">🌐 Hoodi Testnet</p>
        </div>
        
        {!userAcc ? (
          <button onClick={connectMetaMask} className="connect-btn">
            🦊 Connect MetaMask
          </button>
        ) : (
          <div className="wallet-section">
            
            {/* Account Display with Dropdown */}
            <div className="account-dropdown">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="account-display"
              >
                <span className="status-dot">🟢</span>
                <span className="wallet-address">
                  {userAcc.substring(0, 6)}...{userAcc.substring(38)}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showAccountDropdown && allAccounts.length > 0 && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    Switch Account ({allAccounts.length})
                  </div>
                  
                  {allAccounts.map((account, index) => (
                    <div
                      key={account}
                      onClick={() => switchAccount(account)}
                      className={`dropdown-item ${account === userAcc ? 'active' : ''}`}
                    >
                      <span className="account-number">#{index + 1}</span>
                      <span className="account-address">
                        {account.substring(0, 10)}...{account.substring(30)}
                      </span>
                      {account === userAcc && (
                        <span className="checkmark">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disconnect Button */}
            <button 
              onClick={disconnectWallet} 
              className="disconnect-btn"
              title="Disconnect wallet"
            >
              🔓
            </button>
          </div>
        )}
      </div>

      {/* ===== OTHER COMPONENTS ===== */}
      
      {userAcc && walletClient && publicClient && (
        <>
          <ViewItem 
            userAcc={userAcc} 
            walletClient={walletClient}
            publicClient={publicClient}
            contractAddress={contractAddress}
            contractABI={contractABI}
          />
          <MakeLost 
            userAcc={userAcc} 
            walletClient={walletClient}
            publicClient={publicClient}
            contractAddress={contractAddress}
            contractABI={contractABI}
          />
        </>
      )}

      {/* ===== REGISTRATION FORM ===== */}
      
      <div className="card">
        
        <h2>📝 Register New Item</h2>
        <p className="subtitle">
          🎫 Mint an NFT to prove ownership on Hoodi blockchain
        </p>

        {/* ===== ERROR MESSAGE ===== */}
        
        {error && (
          <div className="error-box">
            <pre>{error}</pre>
          </div>
        )}

        {/* ===== SUCCESS MESSAGE ===== */}
        
        {success && (
          <div className="success-box">
            <pre>{success}</pre>
          </div>
        )}

        <form onSubmit={handleRegister} className="form">
          
          {/* ================= BASIC INFORMATION ================= */}
          
          <div className="section-title">📋 Basic Information</div>

          <div className="input-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="itemName"
              placeholder="e.g., iPhone 15 Pro Max"
              value={formData.itemName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="Mobile">📱 Mobile</option>
              <option value="Laptop">💻 Laptop</option>
              <option value="Tablet">📲 Tablet</option>
              <option value="Document">📄 Document</option>
              <option value="Accessory">🎧 Accessory</option>
              <option value="Other">📦 Other</option>
            </select>
          </div>

          <div className="input-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              rows="4"
              placeholder="Describe your item in detail..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* ================= DEVICE INFORMATION ================= */}
          
          {!isDocument && (
            <>
              <div className="section-title">🔧 Device Information</div>

              <div className="input-group">
                <label>Brand / Manufacturer</label>
                <input
                  type="text"
                  name="brand"
                  placeholder="e.g., Apple, Samsung, Dell"
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Model Name / Number</label>
                <input
                  type="text"
                  name="model"
                  placeholder="e.g., iPhone 15 Pro, MacBook Air M2"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serialNumber"
                  placeholder="Device Serial Number"
                  value={formData.serialNumber}
                  onChange={handleChange}
                />
              </div>

              {/* ===== MOBILE ONLY ===== */}
              
              {isMobile && (
                <div className="input-group">
                  <label>IMEI Number</label>
                  <input
                    type="text"
                    name="imei"
                    placeholder="15-digit IMEI"
                    value={formData.imei}
                    onChange={handleChange}
                    maxLength="15"
                  />
                  <small>ℹ️ Dial *#06# to find IMEI</small>
                </div>
              )}

              {/* ===== ELECTRONIC DEVICES ===== */}
              
              {isElectronic && (
                <>
                  <div className="input-group">
                    <label>MAC Address</label>
                    <input
                      type="text"
                      name="macAddress"
                      placeholder="WiFi MAC Address"
                      value={formData.macAddress}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Operating System</label>
                    <input
                      type="text"
                      name="operatingSystem"
                      placeholder="e.g., iOS 17, Android 14, Windows 11"
                      value={formData.operatingSystem}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Storage Capacity</label>
                    <input
                      type="text"
                      name="storageCapacity"
                      placeholder="e.g., 256GB, 512GB, 1TB"
                      value={formData.storageCapacity}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ================= PHYSICAL DETAILS ================= */}
          
          <div className="section-title">🎨 Physical Details</div>

          <div className="input-group">
            <label>Color</label>
            <input
              type="text"
              name="color"
              placeholder="e.g., Space Black, Midnight, Silver"
              value={formData.color}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Device Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="">Select Condition</option>
              <option value="New">✨ New</option>
              <option value="Like New">⭐ Like New</option>
              <option value="Used">📦 Used</option>
              <option value="Scratched">🔨 Scratched</option>
              <option value="Cracked">💔 Cracked</option>
            </select>
          </div>

          <div className="input-group full-width">
            <label>Custom Markings / Unique Scratches</label>
            <textarea
              name="customMarkings"
              rows="3"
              placeholder="Describe any unique markings, scratches, stickers, custom cases, or identifying features..."
              value={formData.customMarkings}
              onChange={handleChange}
            />
          </div>

          {/* ================= IMAGE UPLOAD ================= */}
          
          <div className="section-title">📸 Supporting Images / Documents</div>

          <div className="input-group full-width">
            <label>Upload Device Images, Invoice, Ownership Proof *</label>
            
            <div className="upload-box">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon">📤</div>
                <div className="upload-title">Click or Drag & Drop</div>
                <div className="upload-subtitle">
                  Upload up to 3 images (device photos, invoice, purchase receipt)
                </div>
              </label>
            </div>

            {/* ===== IMAGE PREVIEW ===== */}
            
            {preview.length > 0 && (
              <div className="preview-grid">
                {preview.map((img, index) => (
                  <div key={index} className="preview-item">
                    <img
                      src={img}
                      alt={`preview-${index}`}
                      className="preview-image"
                    />
                    <span className="preview-number">#{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== SUBMIT BUTTON ===== */}
          
          <button 
            type="submit" 
            disabled={loading || !userAcc}
            className="submit-btn"
          >
            {loading ? (
              <>⏳ Minting NFT on Hoodi...</>
            ) : !userAcc ? (
              <>🔒 Connect Wallet First</>
            ) : (
              <>🎫 Mint Ownership NFT</>
            )}
          </button>

          {!userAcc && (
            <p className="help-text">
              ⚠️ Please connect your MetaMask wallet to register items
            </p>
          )}

          {userAcc && !loading && (
            <p className="help-text">
              💡 Make sure you have enough ETH for gas fees on Hoodi
            </p>
          )}
        </form>
      </div>

      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-left h1 {
          margin: 0;
          font-size: 1.8rem;
        }

        .network-badge {
          margin: 0;
          padding: 0.25rem 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .connect-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .connect-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .wallet-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .account-dropdown {
          position: relative;
        }

        .account-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .account-display:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .status-dot {
          font-size: 0.8rem;
        }

        .wallet-address {
          font-family: 'Courier New', monospace;
        }

        .dropdown-arrow {
          font-size: 0.8rem;
          transition: transform 0.2s;
        }

        .account-display:hover .dropdown-arrow {
          transform: rotateZ(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 300px;
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 0.75rem 1rem;
          border-bottom: 2px solid #f0f0f0;
          font-weight: 600;
          color: #333;
          background: #f8f9fa;
          font-size: 0.9rem;
          color: #666;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f0f0f0;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:hover {
          background: #f8f9fa;
        }

        .dropdown-item.active {
          background: #e7f3ff;
          border-left: 4px solid #007bff;
          padding-left: calc(1rem - 4px);
        }

        .account-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #007bff;
          color: white;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .dropdown-item.active .account-number {
          background: #0056b3;
        }

        .account-address {
          flex: 1;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          color: #333;
        }

        .checkmark {
          color: #28a745;
          font-weight: bold;
          font-size: 1rem;
        }

        .disconnect-btn {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .disconnect-btn:hover {
          background: rgba(255, 68, 68, 0.5);
          border-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}