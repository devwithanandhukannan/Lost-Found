import React, { useEffect, useState } from "react";

const MyItems = ({ addNotification }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/items/my-items", {
        method: "GET",
        credentials: "include"
      });
      
      const data = await res.json();
      console.log(data);
      
      if (data.success) {
        setItems(data.items);
        addNotification({
          type: 'success',
          title: 'Items Loaded',
          message: `Successfully loaded ${data.items.length} items`
        });
      }
    } catch (error) {
      console.error(error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load items'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading your items...</p>
        </div>
      </div>
    );
  }

  // Get the expanded item
  const expandedItem = items.find(item => item._id === expandedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-600 mt-1">
          {items.length} item{items.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <h3 className="text-lg font-semibold text-black mb-2">No Items Yet</h3>
          <p className="text-sm text-gray-600 mb-6">You haven't registered any products yet</p>
          <button className="px-6 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors">
            Register Your First Item
          </button>
        </div>
      ) : (
        /* Grid of Cards */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col"
            >
              {/* Image Section - Square */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden group">
                {item.imageCID && item.imageCID.length > 0 ? (
                  <>
                    <img
                      src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
                
                {/* Status Badge */}
                <span className="absolute top-2 right-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {item.status || 'Active'}
                </span>
              </div>

              {/* Content Section */}
              <div className="p-3 flex-1 flex flex-col">
                {/* Title */}
                <h3 className="font-semibold text-black text-sm line-clamp-2 mb-1">
                  {item.itemName}
                </h3>
                <p className="text-xs text-gray-500 mb-3">#{item.itemId}</p>

                {/* Quick Info */}
                <div className="space-y-1.5 text-xs mb-3 flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-black">{item.category}</span>
                  </div>
                  {item.color && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color</span>
                      <span className="font-medium text-black line-clamp-1">{item.color}</span>
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => setExpandedId(item._id)}
                  className="w-full py-2 text-xs font-medium text-black border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Rendered at root level */}
      {expandedItem && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedId(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-black">{expandedItem.itemName}</h2>
                <p className="text-sm text-gray-600 mt-1">#{expandedItem.itemId}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {expandedItem.status || 'Active'}
                </span>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Main Image */}
              {expandedItem.imageCID && expandedItem.imageCID.length > 0 && (
                <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`https://ipfs.io/ipfs/${expandedItem.imageCID[0]}`}
                    alt={expandedItem.itemName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Category</p>
                  <p className="text-sm text-black mt-2">{expandedItem.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Brand</p>
                  <p className="text-sm text-black mt-2">{expandedItem.brand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Color</p>
                  <p className="text-sm text-black mt-2">{expandedItem.color || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Condition</p>
                  <p className="text-sm text-black mt-2">{expandedItem.condition || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Item ID</p>
                  <p className="text-sm text-black mt-2">#{expandedItem.itemId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Status</p>
                  <p className="text-sm text-black mt-2">{expandedItem.status || 'Active'}</p>
                </div>
              </div>

              {/* Model */}
              {expandedItem.model && (
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Model</p>
                  <p className="text-sm text-black">{expandedItem.model}</p>
                </div>
              )}

              {/* Description */}
              {expandedItem.description && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{expandedItem.description}</p>
                </div>
              )}

              {/* Serial Number */}
              {expandedItem.serialNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Serial Number</p>
                  <p className="text-xs text-black font-mono bg-gray-50 p-3 rounded border border-gray-200 break-all">
                    {expandedItem.serialNumber}
                  </p>
                </div>
              )}

              {/* Custom Markings */}
              {expandedItem.customMarkings && (
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Custom Markings</p>
                  <p className="text-sm text-black">{expandedItem.customMarkings}</p>
                </div>
              )}

              {/* IMEI */}
              {expandedItem.imei && (
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">IMEI</p>
                  <p className="text-xs text-black font-mono bg-gray-50 p-3 rounded border border-gray-200 break-all">
                    {expandedItem.imei}
                  </p>
                </div>
              )}

              {/* MAC Address */}
              {expandedItem.macAddress && (
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">MAC Address</p>
                  <p className="text-xs text-black font-mono bg-gray-50 p-3 rounded border border-gray-200 break-all">
                    {expandedItem.macAddress}
                  </p>
                </div>
              )}

              {/* All Images */}
              {expandedItem.imageCID && expandedItem.imageCID.length > 1 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">All Images ({expandedItem.imageCID.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {expandedItem.imageCID.map((cid, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={`https://ipfs.io/ipfs/${cid}`}
                          alt={`${expandedItem.itemName} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Block Info */}
              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Block Number</p>
                  <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded">{expandedItem.blockNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Transaction Hash</p>
                  <p className="text-xs text-black font-mono bg-gray-50 p-2 rounded break-all">{expandedItem.txHash}</p>
                </div>
              </div>

              {/* IPFS Link */}
              <div className="border-t border-gray-200 pt-4">
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${expandedItem.metadataCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.2 3H12a2 2 0 0 0-2 2v9.5M9 17H5a2 2 0 0 1-2-2v-4M19 3h1.2a2 2 0 0 1 2 2v4m0 0a2 2 0 0 1-2 2h-1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  View on IPFS Gateway
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setExpandedId(null)}
                className="w-full py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyItems;