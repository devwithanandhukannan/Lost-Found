import React, { useEffect, useState } from "react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/items/notifications",
        {
          credentials: "include"
        }
      );

      const data = await res.json();
      console.log(data);
      
      if (data.success) {
        console.log(data.notifications);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleContactFinder = (notification) => {
    const { finderName, phone, email } = notification;
    
    // Create mailto link with pre-filled subject
    const subject = `Re: Found Item - ${notification.itemId?.itemName}`;
    const body = `Hi ${finderName},\n\nThank you for finding my ${notification.itemId?.itemName}.\n\nPlease let me know the next steps.\n\nBest regards`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Notifications</h1>
        <p className="text-sm text-gray-600 mt-2">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-gray-200 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-gray-600 text-base font-medium">No notifications yet</p>
          <p className="text-sm text-gray-500 mt-1">When someone finds your item, they'll appear here</p>
        </div>
      ) : (
        /* Notifications List */
        <div className="space-y-4">
          {notifications.map((notification) => {
            const isExpanded = expandedId === notification._id;
            const item = notification.itemId;
            
            return (
              <div
                key={notification._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Main Content */}
                <div className="p-6">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black">
                        {item?.itemName}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Item ID: #{item?.itemId}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded flex-shrink-0 ${
                      notification.status === 'resolved' 
                        ? 'bg-green-100 text-green-700' 
                        : notification.status === 'read'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {notification.status || 'pending'}
                    </span>
                  </div>

                  {/* Item Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Category</p>
                      <p className="text-gray-900 mt-1">{item?.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Color</p>
                      <p className="text-gray-900 mt-1">{item?.color || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Brand</p>
                      <p className="text-gray-900 mt-1">{item?.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Condition</p>
                      <p className="text-gray-900 mt-1">{item?.condition || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Item Image */}
                  {item?.imageCID?.length > 0 && (
                    <div className="mb-4">
                      <img
                        src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
                        alt={item?.itemName}
                        className="w-64 h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Finder Details Section */}
                  <div className="space-y-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Finder Information</h4>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Name</p>
                      <p className="text-sm text-gray-900 mt-1">{notification.finderName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Phone</p>
                        <a 
                          href={`tel:${notification.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-700 mt-1 font-medium"
                        >
                          {notification.phone}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Email</p>
                        <a 
                          href={`mailto:${notification.email}`}
                          className="text-sm text-blue-600 hover:text-blue-700 mt-1 font-medium break-all"
                        >
                          {notification.email}
                        </a>
                      </div>
                    </div>

                    {notification.wallet && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Wallet Address</p>
                        <p className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded border border-gray-200 mt-1 break-all">
                          {notification.wallet}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Message</p>
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  {/* Additional Item Details - Toggle */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-700">Additional Item Details</h4>
                      
                      {item?.description && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Description</p>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.description}</p>
                        </div>
                      )}

                      {item?.serialNumber && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Serial Number</p>
                          <p className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded border border-gray-200 mt-1 break-all">
                            {item.serialNumber}
                          </p>
                        </div>
                      )}

                      {item?.model && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Model</p>
                          <p className="text-sm text-gray-900 mt-1">{item.model}</p>
                        </div>
                      )}

                      {item?.customMarkings && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Custom Markings</p>
                          <p className="text-sm text-gray-900 mt-1">{item.customMarkings}</p>
                        </div>
                      )}

                      {/* All Images */}
                      {item?.imageCID?.length > 1 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                            All Images ({item.imageCID.length})
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {item.imageCID.map((cid, idx) => (
                              <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={`https://ipfs.io/ipfs/${cid}`}
                                  alt={`${item.itemName} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blockchain Details */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Blockchain Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-medium text-gray-600">Block Number</p>
                            <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded border border-gray-200 mt-1">
                              {item?.blockNumber}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Status</p>
                            <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded border border-gray-200 mt-1">
                              {item?.status}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="font-medium text-gray-600">Transaction Hash</p>
                            <a 
                              href={`https://etherscan.io/tx/${item?.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 mt-1 break-all inline-block"
                            >
                              {item?.txHash}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Metadata Link */}
                      {item?.metadataCID && (
                        <div className="border-t border-gray-200 pt-4">
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${item.metadataCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13.2 3H12a2 2 0 0 0-2 2v9.5M9 17H5a2 2 0 0 1-2-2v-4M19 3h1.2a2 2 0 0 1 2 2v4m0 0a2 2 0 0 1-2 2h-1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            View Metadata on IPFS
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                    Reported on {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Footer with Action Buttons */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col md:flex-row gap-3">
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : notification._id)}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    {isExpanded ? 'Show Less' : 'View More Details'}
                  </button>
                  <button 
                    onClick={() => handleContactFinder(notification)}
                    className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    Contact Finder
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;