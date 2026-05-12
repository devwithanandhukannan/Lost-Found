import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';


const MakeLost = () => {
  const [itemId, setItemId] = useState('');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search for the item to see its current state
  const handleSearch = async () => {
    if (!itemId) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/blockchain/get-item/${itemId}`);
      setItem(response.data.item);
    } catch (err) {
      setError('Item not found or contract error.');
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  // Generic function to hit the patch routes
  const changeStatus = async (statusEndpoint) => {
    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/blockchain/item/${itemId}/${statusEndpoint}`);
      // Refresh the item data to show new status
      handleSearch(); 
    } catch (err) {
      setError(`Transaction failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Admin Control Panel
        </h1>

        {/* Search Bar */}
        <div className="flex gap-2 mb-8">
          <input
            type="number"
            placeholder="Enter Item ID..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Fetching...' : 'Lookup Item'}
          </button>
        </div>

        {error && <p className="text-red-500 mb-4 bg-red-50 p-2 rounded">{error}</p>}

        {/* Item Details and Admin Actions */}
        {item && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Item Name</p>
                <p className="font-semibold text-lg">{item.itemName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${
                  item.status === 'Lost' ? 'bg-red-100 text-red-600' :
                  item.status === 'Found' ? 'bg-yellow-100 text-yellow-600' :
                  item.status === 'Returned' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
                Available Actions
              </p>
              <div className="flex flex-wrap gap-3">
                
                {/* Logic: Only show 'Mark Lost' if the item is currently Active */}
                <button
                  onClick={() => changeStatus('lost')}
                  disabled={loading || item.status !== 'Active'}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Force Status: LOST
                </button>

                {/* Logic: Only show 'Report Found' if the item is currently Lost */}
                <button
                  onClick={() => changeStatus('found')}
                  disabled={loading || item.status !== 'Lost'}
                  className="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Force Status: FOUND
                </button>

                {/* Logic: Only show 'Confirm Return' if the item is currently Found */}
                <button
                  onClick={() => changeStatus('returned')}
                  disabled={loading || item.status !== 'Found'}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Force Status: RETURNED
                </button>
                
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">
                Note: Buttons are disabled based on smart contract requirement rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakeLost;