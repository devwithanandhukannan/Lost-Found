import React, { useState } from 'react';
import { parseAbi } from 'viem';

import { contractABI } from '../contractABI';

const statusMap = {
  0: 'Active',
  1: 'Lost',
  2: 'Found',
  3: 'Returned'
};

const MakeLost = ({ userAcc, walletClient, publicClient, contractAddress, contractABI }) => {
  
  const [itemId, setItemId] = useState('');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionPending, setTransactionPending] = useState(false);

  // ================= VALIDATE INPUTS =================
  
  const validateInputs = () => {
    if (!userAcc) {
      setError('❌ Please connect your MetaMask wallet first');
      return false;
    }
    if (!walletClient || !publicClient) {
      setError('❌ Wallet not fully initialized');
      return false;
    }
    if (!itemId || itemId.trim() === '') {
      setError('❌ Please enter an Item ID');
      return false;
    }
    return true;
  };

  // ================= SEARCH FOR ITEM =================
  
  const handleSearch = async () => {
    if (!itemId) {
      setError('❌ Please enter an Item ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setItem(null);

    try {
      console.log('🔍 Searching for item ID:', itemId);
      
      const id = parseInt(itemId);
      
      if (isNaN(id) || id < 0) {
        throw new Error('Invalid item ID format');
      }

      // Read item data from contract
      const itemData = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getItem',
        args: [id],
      });

      console.log('✅ Item found:', itemData);

      // Get NFT owner
      const owner = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'ownerOf',
        args: [id],
      });

      const formattedItem = {
        itemId: itemData[0].toString(),
        owner: itemData[1].toString(),
        nftOwner: owner.toString(),
        itemName: itemData[2].toString(),
        ipfsCID: itemData[3].toString(),
        status: statusMap[Number(itemData[4])] || 'Unknown',
        statusCode: Number(itemData[4]),
        finder: itemData[5].toString(),
        isOwner: owner.toLowerCase() === userAcc.toLowerCase(),
        isFinder: itemData[5].toLowerCase() === userAcc.toLowerCase()
      };

      setItem(formattedItem);
      setSuccess(`✅ Item #${id} found successfully`);

    } catch (err) {
      console.error('❌ Search error:', err);
      setError(`❌ ${err.message || 'Item not found or error reading from contract'}`);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  // ================= MARK AS LOST =================
  
  const handleMarkAsLost = async () => {
    if (!validateInputs() || !item) return;

    if (!item.isOwner) {
      setError('❌ Only the NFT owner can mark item as lost');
      return;
    }

    if (item.statusCode !== 0) {
      setError('❌ Item must be in Active status to mark as lost');
      return;
    }

    await executeTransaction(
      'markAsLost',
      [parseInt(itemId)],
      '🔴 Marking item as Lost...'
    );
  };

  // ================= REPORT AS FOUND =================
  
  const handleReportFound = async () => {
    if (!validateInputs() || !item) return;

    if (item.isOwner) {
      setError('❌ Owner cannot report their own item as found');
      return;
    }

    if (item.statusCode !== 1) {
      setError('❌ Item must be marked as Lost to report found');
      return;
    }

    await executeTransaction(
      'reportFound',
      [parseInt(itemId)],
      '🟢 Reporting item as Found...'
    );
  };

  // ================= CONFIRM RETURN =================
  
  const handleConfirmReturn = async () => {
    if (!validateInputs() || !item) return;

    if (!item.isOwner) {
      setError('❌ Only the NFT owner can confirm return');
      return;
    }

    if (item.statusCode !== 2) {
      setError('❌ Item must be reported as Found before confirming return');
      return;
    }

    await executeTransaction(
      'confirmReturn',
      [parseInt(itemId)],
      '🔄 Confirming return...'
    );
  };

  // ================= EXECUTE TRANSACTION =================
  
  const executeTransaction = async (functionName, args, statusMessage) => {
    setLoading(true);
    setTransactionPending(true);
    setError('');
    setSuccess(statusMessage);

    try {
      console.log(`⛓️ Executing ${functionName}...`);

      // Write to contract
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: functionName,
        args: args,
        account: userAcc,
      });

      console.log('📝 Transaction hash:', hash);
      setSuccess(`⏳ Waiting for confirmation...\n🔗 ${hash.substring(0, 20)}...`);

      // Wait for confirmation
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash,
          timeout: 60_000,
        });

        console.log('✅ Transaction confirmed:', receipt);

        setSuccess(
          `✅ Transaction Successful!\n\n` +
          `📝 Function: ${functionName}\n` +
          `🔗 Hash: ${hash.substring(0, 20)}...\n` +
          `📊 Block: ${receipt.blockNumber}`
        );

        // Refresh item data
        setTimeout(() => {
          handleSearch();
        }, 1000);

      } catch (waitErr) {
        console.log('Transaction sent but confirmation timed out:', waitErr);
        setSuccess(
          `✅ Transaction Sent!\n\n` +
          `📝 Hash: ${hash.substring(0, 20)}...\n` +
          `⏳ Still processing...\n` +
          `Refresh in a moment to see updated status`
        );
      }

    } catch (err) {
      console.error('❌ Transaction error:', err);

      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        setError('❌ Transaction rejected by user');
      } else if (err.message?.includes('insufficient funds')) {
        setError('❌ Insufficient ETH for gas fees');
      } else {
        setError(`❌ ${err.message || 'Transaction failed'}`);
      }
    } finally {
      setLoading(false);
      setTransactionPending(false);
    }
  };

  // ================= RENDER =================

  return (
    <div className="container">
      <div className="card">
        
        <h2>🔄 Item Status Management</h2>
        <p className="subtitle">
          Track and update item status on blockchain
        </p>

        {/* ===== CONNECTION CHECK ===== */}
        
        {!userAcc && (
          <div className="error-box">
            ⚠️ Please connect your MetaMask wallet to manage items
          </div>
        )}

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

        {/* ===== SEARCH SECTION ===== */}
        
        <div className="search-section">
          <h3>🔍 Search Item</h3>
          
          <div className="search-input-group">
            <input
              type="number"
              placeholder="Enter Item ID (NFT Token ID)..."
              className="search-input"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={loading}
              min="0"
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !userAcc}
              className="search-button"
            >
              {loading ? '⏳ Searching...' : '🔍 Lookup Item'}
            </button>
          </div>
        </div>

        {/* ===== ITEM DETAILS ===== */}
        
        {item && (
          <div className="item-details-section">
            
            <div className="item-header">
              <div>
                <h3>📦 {item.itemName}</h3>
                <p className="item-id">Item ID: #{item.itemId}</p>
              </div>
              <span className={`status-badge status-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>

            {/* Item Information */}
            <div className="item-info-grid">
              
              <div className="info-item">
                <span className="info-label">Owner</span>
                <span className="info-value">
                  {item.owner.substring(0, 10)}...{item.owner.substring(30)}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Current NFT Holder</span>
                <span className="info-value">
                  {item.nftOwner.substring(0, 10)}...{item.nftOwner.substring(30)}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Status Code</span>
                <span className="info-value">{item.statusCode}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Your Role</span>
                <span className="info-value">
                  {item.isOwner ? '👤 Owner' : item.isFinder ? '🔎 Finder' : '👁️ Viewer'}
                </span>
              </div>

              {item.finder !== '0x0000000000000000000000000000000000000000' && (
                <div className="info-item">
                  <span className="info-label">Finder</span>
                  <span className="info-value">
                    {item.finder.substring(0, 10)}...{item.finder.substring(30)}
                  </span>
                </div>
              )}

              <div className="info-item">
                <span className="info-label">Metadata CID</span>
                <a 
                  href={`https://ipfs.io/ipfs/${item.ipfsCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-link"
                >
                  {item.ipfsCID.substring(0, 15)}...
                </a>
              </div>
            </div>

            {/* Status Transitions */}
            <div className="actions-section">
              <h4>📋 Available Actions</h4>
              
              <div className="action-buttons">
                
                {/* MARK AS LOST */}
                <button
                  onClick={handleMarkAsLost}
                  disabled={
                    loading || 
                    !item.isOwner || 
                    item.statusCode !== 0
                  }
                  className="action-btn action-lost"
                  title={
                    !item.isOwner ? 'Only owner can mark as lost' :
                    item.statusCode !== 0 ? 'Item must be in Active status' : 
                    'Mark item as lost'
                  }
                >
                  <span className="btn-icon">🔴</span>
                  <span className="btn-text">Mark as Lost</span>
                </button>

                {/* REPORT FOUND */}
                <button
                  onClick={handleReportFound}
                  disabled={
                    loading || 
                    item.isOwner || 
                    item.statusCode !== 1
                  }
                  className="action-btn action-found"
                  title={
                    item.isOwner ? 'Owner cannot report own item' :
                    item.statusCode !== 1 ? 'Item must be marked as Lost' :
                    'Report item as found'
                  }
                >
                  <span className="btn-icon">🟢</span>
                  <span className="btn-text">Report Found</span>
                </button>

                {/* CONFIRM RETURN */}
                <button
                  onClick={handleConfirmReturn}
                  disabled={
                    loading || 
                    !item.isOwner || 
                    item.statusCode !== 2
                  }
                  className="action-btn action-returned"
                  title={
                    !item.isOwner ? 'Only owner can confirm return' :
                    item.statusCode !== 2 ? 'Item must be reported as Found' :
                    'Confirm item return'
                  }
                >
                  <span className="btn-icon">🔄</span>
                  <span className="btn-text">Confirm Return</span>
                </button>
              </div>

              <p className="action-hint">
                💡 Buttons are disabled based on your role and item status. 
                {transactionPending && ' Transaction is being processed...'}
              </p>
            </div>

            {/* Status Workflow */}
            <div className="workflow-section">
              <h4>📊 Status Workflow</h4>
              <div className="workflow">
                <div className={`workflow-step ${item.statusCode >= 0 ? 'active' : ''}`}>
                  <span>Active</span>
                </div>
                <span className="workflow-arrow">→</span>
                <div className={`workflow-step ${item.statusCode >= 1 ? 'active' : ''}`}>
                  <span>Lost</span>
                </div>
                <span className="workflow-arrow">→</span>
                <div className={`workflow-step ${item.statusCode >= 2 ? 'active' : ''}`}>
                  <span>Found</span>
                </div>
                <span className="workflow-arrow">→</span>
                <div className={`workflow-step ${item.statusCode >= 3 ? 'active' : ''}`}>
                  <span>Returned</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== NO ITEM SELECTED ===== */}
        
        {!item && itemId && !loading && !error && (
          <div className="info-box">
            👆 Click "Lookup Item" to fetch item details
          </div>
        )}
      </div>

      <style jsx>{`
        .search-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .search-section h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .search-input-group {
          display: flex;
          gap: 0.75rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
        }

        .search-input:disabled {
          background-color: #f0f0f0;
          cursor: not-allowed;
        }

        .search-button {
          padding: 0.75rem 1.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .search-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.65;
        }

        .item-details-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e0e0e0;
        }

        .item-header h3 {
          margin: 0;
          font-size: 1.3rem;
        }

        .item-id {
          margin: 0.25rem 0 0 0;
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

        .item-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .info-value {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          word-break: break-all;
          color: #333;
        }

        .info-link {
          color: #007bff;
          text-decoration: none;
          transition: color 0.2s;
        }

        .info-link:hover {
          color: #0056b3;
          text-decoration: underline;
        }

        .actions-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .actions-section h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .btn-icon {
          font-size: 1.5rem;
        }

        .action-lost {
          background: #f8d7da;
          color: #721c24;
        }

        .action-lost:hover:not(:disabled) {
          background: #f5c6cb;
        }

        .action-found {
          background: #fff3cd;
          color: #856404;
        }

        .action-found:hover:not(:disabled) {
          background: #ffeaa7;
        }

        .action-returned {
          background: #d4edda;
          color: #155724;
        }

        .action-returned:hover:not(:disabled) {
          background: #c3e6cb;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-hint {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .workflow-section {
          padding: 1.5rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
        }

        .workflow-section h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .workflow {
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .workflow-step {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          background: #e9ecef;
          font-weight: 600;
          font-size: 0.9rem;
          text-align: center;
          padding: 0.5rem;
          color: #666;
          transition: all 0.2s;
        }

        .workflow-step.active {
          background: #007bff;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        .workflow-arrow {
          font-size: 1.5rem;
          color: #999;
        }

        .info-box {
          padding: 1rem;
          background: #cce5ff;
          border: 2px solid #0056b3;
          border-radius: 6px;
          color: #004085;
          text-align: center;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default MakeLost;