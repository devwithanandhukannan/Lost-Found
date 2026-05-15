// MakeLost.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contractABI } from '../contractABI';

const statusMap = {
  0: 'Active',
  1: 'Lost',
  2: 'Found',
  3: 'Returned'
};

const MakeLost = ({ userAcc, walletClient, publicClient, contractAddress, contractABI, addNotification, initialItemId }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemId, setItemId] = useState('');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionPending, setTransactionPending] = useState(false);
  const [view, setView] = useState('list');
  const [searchParams] = useSearchParams();

  // ================= FETCH MY ITEMS =================
  
  useEffect(() => {
    if (userAcc) {
      fetchMyItems();
    }
  }, [userAcc]);

  // ================= HANDLE QUERY PARAMS =================
  
  useEffect(() => {
    const queryItemId = searchParams.get('itemId');
    if (queryItemId) {
      setItemId(queryItemId);
      setView('search');
      // Delay the search to ensure state is updated
      setTimeout(() => {
        handleSearchWithId(parseInt(queryItemId));
      }, 100);
    }
  }, [searchParams, publicClient, userAcc, contractAddress]);

  // ================= HANDLE INITIAL ITEM ID FROM PROP =================
  
  useEffect(() => {
    if (initialItemId && publicClient && userAcc && contractAddress) {
      setItemId(initialItemId.toString());
      setView('search');
      // Delay the search to ensure state is updated
      setTimeout(() => {
        handleSearchWithId(parseInt(initialItemId));
      }, 100);
    }
  }, [initialItemId, publicClient, userAcc, contractAddress]);

  const fetchMyItems = async () => {
    setItemsLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/items/my-items', {
        method: 'GET',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        addNotification({
          type: 'success',
          title: 'Items Loaded',
          message: `Successfully loaded ${data.items.length} items`
        });
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load items'
      });
    } finally {
      setItemsLoading(false);
    }
  };

  // ================= VALIDATE INPUTS =================
  
  const validateInputs = () => {
    if (!userAcc) {
      const msg = 'Please connect your MetaMask wallet first';
      setError(msg);
      addNotification({ type: 'error', title: 'Wallet Not Connected', message: msg });
      return false;
    }
    if (!walletClient || !publicClient) {
      const msg = 'Wallet not fully initialized';
      setError(msg);
      addNotification({ type: 'error', title: 'Initialization Error', message: msg });
      return false;
    }
    if (!itemId || itemId.trim() === '') {
      const msg = 'Please enter an Item ID';
      setError(msg);
      addNotification({ type: 'error', title: 'Input Required', message: msg });
      return false;
    }
    return true;
  };

  // ================= SEARCH FOR ITEM =================
  
  const handleSearch = async () => {
    if (!itemId) {
      const msg = 'Please enter an Item ID';
      setError(msg);
      addNotification({ type: 'error', title: 'Input Required', message: msg });
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setItem(null);

    try {
      console.log('Searching for item ID:', itemId);
      
      const id = parseInt(itemId);
      
      if (isNaN(id) || id < 0) {
        throw new Error('Invalid item ID format');
      }

      const itemData = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getItem',
        args: [id],
      });

      console.log('Item found:', itemData);

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
      const successMsg = `Item #${id} found successfully`;
      setSuccess(successMsg);
      addNotification({ type: 'success', title: 'Item Found', message: successMsg });

    } catch (err) {
      console.error('Search error:', err);
      const errorMsg = err.message || 'Item not found or error reading from contract';
      setError(errorMsg);
      addNotification({ type: 'error', title: 'Search Failed', message: errorMsg });
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  // ================= SELECT ITEM FROM LIST =================
  
  const handleSelectItem = (selectedItem) => {
    setItemId(selectedItem.itemId.toString());
    setSelectedItem(selectedItem);
    setView('search');
    setTimeout(() => {
      handleSearchWithId(selectedItem.itemId);
    }, 100);
  };

  const handleSearchWithId = async (id) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setItem(null);

    try {
      const itemData = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getItem',
        args: [id],
      });

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
      const successMsg = `Item #${id} loaded successfully`;
      setSuccess(successMsg);
      addNotification({ type: 'success', title: 'Item Loaded', message: successMsg });

    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.message || 'Error reading from contract';
      setError(errorMsg);
      addNotification({ type: 'error', title: 'Load Failed', message: errorMsg });
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  // ================= MARK AS LOST =================
  
  const handleMarkAsLost = async () => {
    if (!validateInputs() || !item) return;

    try {
      await executeTransaction(
        "markAsLost",
        [parseInt(itemId)],
        "Marking item as Lost..."
      );

      const res = await fetch(
        `http://localhost:5001/api/items/status/${itemId}/lost`,
        {
          method: "PUT",
          credentials: "include"
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const successMsg = "Item marked as Lost in blockchain and database";
      setSuccess(successMsg);
      addNotification({ type: 'success', title: 'Item Marked', message: successMsg });
      handleSearchWithId(parseInt(itemId));
      fetchMyItems();

    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      addNotification({ type: 'error', title: 'Mark Failed', message: errorMsg });
    }
  };

  // ================= REPORT AS FOUND =================
  
  const handleReportFound = async () => {
    if (!validateInputs() || !item) return;

    const finderName = prompt("Enter your name");
    if (!finderName) return;
    
    const phone = prompt("Enter phone number");
    if (!phone) return;
    
    const email = prompt("Enter email");
    if (!email) return;
    
    const message = prompt("Message to owner");
    if (!message) return;

    try {
      await executeTransaction(
        "reportFound",
        [parseInt(itemId)],
        "Reporting item as Found..."
      );

      const res = await fetch(
        `http://localhost:5001/api/items/report-found/${itemId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            finderName,
            phone,
            email,
            message,
            finderWallet: userAcc
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const successMsg = "Owner notified successfully";
      setSuccess(successMsg);
      addNotification({ type: 'success', title: 'Owner Notified', message: successMsg });
      handleSearchWithId(parseInt(itemId));
      fetchMyItems();

    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      addNotification({ type: 'error', title: 'Report Failed', message: errorMsg });
    }
  };

  // ================= CONFIRM RETURN =================
  
  const handleConfirmReturn = async () => {
    if (!validateInputs() || !item) return;

    try {
      await executeTransaction(
        "confirmReturn",
        [parseInt(itemId)],
        "Confirming return..."
      );

      const res = await fetch(
        `http://localhost:5001/api/items/confirm-return/${itemId}`,
        {
          method: "PUT",
          credentials: "include"
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const successMsg = "Item returned successfully";
      setSuccess(successMsg);
      addNotification({ type: 'success', title: 'Return Confirmed', message: successMsg });
      handleSearchWithId(parseInt(itemId));
      fetchMyItems();

    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      addNotification({ type: 'error', title: 'Confirm Failed', message: errorMsg });
    }
  };

  // ================= EXECUTE TRANSACTION =================
  
  const executeTransaction = async (functionName, args, statusMessage) => {
    setLoading(true);
    setTransactionPending(true);
    setError('');
    setSuccess(statusMessage);
    addNotification({ type: 'info', title: 'Transaction Started', message: statusMessage });

    try {
      console.log(`Executing ${functionName}...`);

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: functionName,
        args: args,
        account: userAcc,
      });

      console.log('Transaction hash:', hash);
      const pendingMsg = `Waiting for confirmation... ${hash.substring(0, 20)}...`;
      setSuccess(pendingMsg);
      addNotification({ type: 'info', title: 'Waiting Confirmation', message: pendingMsg });

      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash,
          timeout: 60_000,
        });

        console.log('Transaction confirmed:', receipt);

        const confirmMsg = `Transaction Successful - Block: ${receipt.blockNumber}`;
        setSuccess(confirmMsg);
        addNotification({ 
          type: 'success', 
          title: 'Transaction Confirmed', 
          message: confirmMsg 
        });

      } catch (waitErr) {
        console.log('Transaction sent but confirmation timed out:', waitErr);
        const timeoutMsg = `Transaction Sent - Hash: ${hash.substring(0, 20)}... (Still processing)`;
        setSuccess(timeoutMsg);
        addNotification({ 
          type: 'warning', 
          title: 'Confirmation Timeout', 
          message: 'Transaction sent. Refresh to see updated status.' 
        });
      }

    } catch (err) {
      console.error('Transaction error:', err);

      let errorMsg = 'Transaction failed';
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMsg = 'Transaction rejected by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient ETH for gas fees';
      } else {
        errorMsg = err.message || 'Transaction failed';
      }

      setError(errorMsg);
      addNotification({ type: 'error', title: 'Transaction Failed', message: errorMsg });
    } finally {
      setLoading(false);
      setTransactionPending(false);
    }
  };

  // ================= STATUS WORKFLOW COMPONENT =================
  
  const StatusWorkflow = ({ statusCode }) => {
    const steps = [
      { code: 0, label: 'Active' },
      { code: 1, label: 'Lost' },
      { code: 2, label: 'Found' },
      { code: 3, label: 'Returned' }
    ];

    const progressPercentage = (statusCode / 3) * 100;

    return (
      <div className="w-full space-y-4">
        {/* Multi-step progress bar */}
        <div className="relative pt-8">
          {/* Background track */}
          <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 rounded-full" />

          {/* Progress fill */}
          <div 
            className="absolute top-3 left-0 h-1 bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Step indicators */}
          <div className="relative flex justify-between items-start">
            {steps.map((step, idx) => {
              const isCompleted = statusCode > step.code;
              const isCurrent = statusCode === step.code;

              return (
                <div key={step.code} className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white border-2 border-green-600'
                        : isCurrent
                        ? 'bg-white text-green-500 border-2 border-green-500'
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  {/* Label */}
                  <p
                    className={`text-xs font-medium mt-3 text-center transition-colors duration-300 ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress stats */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-green-600">{statusCode + 1}/4 steps</span>
        </div>
      </div>
    );
  };

  // ================= RENDER =================

  return (
    <div className="space-y-6">
      {/* Header */}
      

      {/* Connection Check */}
      {!userAcc && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">Please connect your MetaMask wallet to manage items</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 whitespace-pre-line">{success}</p>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-3 border-b border-gray-200">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            view === 'list'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          My Products
        </button>
        <button
          onClick={() => setView('search')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            view === 'search'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          Search Item
        </button>
      </div>

      {/* MY PRODUCTS LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-4">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading your products...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white border border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <p className="text-gray-600 text-sm">No products registered yet</p>
              <p className="text-xs text-gray-500 mt-1">Register a product to manage its status</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleSelectItem(item)}
                >
                  {/* Image */}
                  {item.imageCID && item.imageCID.length > 0 ? (
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
                        alt={item.itemName}
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
                      {item.itemName}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-600">#{item.itemId}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        item.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'Lost' ? 'bg-red-100 text-red-700' :
                        item.status === 'Found' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 mb-3">
                      <p><span className="font-medium">Category:</span> {item.category}</p>
                      {item.color && <p><span className="font-medium">Color:</span> {item.color}</p>}
                    </div>

                    <button className="w-full py-2 text-xs font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors">
                      Manage Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEARCH VIEW */}
      {view === 'search' && (
        <div className="space-y-6">
          {/* Search Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Search Item by ID</h2>
            
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Enter Item ID..."
                className="flex-1 px-4 py-2 text-sm border border-gray-200 bg-white text-black placeholder-gray-400 outline-none transition-colors focus:border-black rounded"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                disabled={loading}
                min="0"
              />
              <button 
                onClick={handleSearch}
                disabled={loading || !userAcc}
                className="px-6 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-all"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Item Details */}
          {item && (
            <div className="space-y-4">
              {/* Item Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-bold text-black">{item.itemName}</h3>
                    <p className="text-sm text-gray-600 mt-1">Item ID: #{item.itemId}</p>
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

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Owner</p>
                    <p className="text-sm text-gray-900 font-mono">{item.owner.substring(0, 10)}...{item.owner.substring(30)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">NFT Holder</p>
                    <p className="text-sm text-gray-900 font-mono">{item.nftOwner.substring(0, 10)}...{item.nftOwner.substring(30)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Your Role</p>
                    <p className="text-sm text-gray-900">
                      {item.isOwner ? 'Owner' : item.isFinder ? 'Finder' : 'Viewer'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Status Code</p>
                    <p className="text-sm text-gray-900">{item.statusCode}</p>
                  </div>

                  {item.finder !== '0x0000000000000000000000000000000000000000' && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Finder</p>
                      <p className="text-sm text-gray-900 font-mono">{item.finder.substring(0, 10)}...{item.finder.substring(30)}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Metadata</p>
                    <a 
                      href={`https://ipfs.io/ipfs/${item.ipfsCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-black hover:text-gray-700 font-mono"
                    >
                      {item.ipfsCID.substring(0, 15)}...
                    </a>
                  </div>
                </div>

                {/* Status Workflow - Multi-step Progress Bar */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Status Workflow</p>
                  <StatusWorkflow statusCode={item.statusCode} />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Available Actions</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={handleMarkAsLost}
                      disabled={
                        loading || 
                        !item.isOwner || 
                        item.statusCode !== 0
                      }
                      className={`py-3 px-4 text-sm font-medium rounded transition-all ${
                        !item.isOwner || item.statusCode !== 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title={
                        !item.isOwner ? 'Only owner can mark as lost' :
                        item.statusCode !== 0 ? 'Item must be in Active status' : 
                        'Mark item as lost'
                      }
                    >
                      Mark as Lost
                    </button>

                    <button
                      onClick={handleReportFound}
                      disabled={
                        loading || 
                        item.isOwner || 
                        item.statusCode !== 1
                      }
                      className={`py-3 px-4 text-sm font-medium rounded transition-all ${
                        item.isOwner || item.statusCode !== 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                      title={
                        item.isOwner ? 'Owner cannot report own item' :
                        item.statusCode !== 1 ? 'Item must be marked as Lost' :
                        'Report item as found'
                      }
                    >
                      Report Found
                    </button>

                    <button
                      onClick={handleConfirmReturn}
                      disabled={
                        loading || 
                        !item.isOwner || 
                        item.statusCode !== 2
                      }
                      className={`py-3 px-4 text-sm font-medium rounded transition-all ${
                        !item.isOwner || item.statusCode !== 2
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={
                        !item.isOwner ? 'Only owner can confirm return' :
                        item.statusCode !== 2 ? 'Item must be reported as Found' :
                        'Confirm item return'
                      }
                    >
                      Confirm Return
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 mt-3">
                    Buttons are disabled based on your role and item status.
                    {transactionPending && ' Transaction is being processed...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!item && itemId && !loading && !error && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Click "Search" to fetch item details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MakeLost;