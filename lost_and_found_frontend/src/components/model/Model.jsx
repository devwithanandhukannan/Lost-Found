import React from "react";

const LostItemTicket = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xl overflow-y-auto">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-8 right-8 z-[60] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-black hover:bg-gray-100 transition-all"
      >
        ✕
      </button>

      {/* Ticket Outer Wrapper */}
      <div className="relative max-w-4xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden m-10">
        
        {/* The "Ticket" Layout */}
        <div className="flex flex-col md:flex-row">
          
          {/* LEFT STUB (The Metadata) */}
          <div className="relative w-full md:w-60 bg-[#F5F5F7] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-200">
            
            {/* Top Circular Cutout (Visual Only) */}
            <div className="hidden md:block absolute -top-3 right-0 w-6 h-6 bg-black/40 rounded-full" />
            {/* Bottom Circular Cutout (Visual Only) */}
            <div className="hidden md:block absolute -bottom-3 right-0 w-6 h-6 bg-black/40 rounded-full" />

            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  Ticket ID
                </p>
                <p className="text-xs font-mono text-black break-all leading-relaxed">
                  {item.itemId}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  Lost Date
                </p>
                <p className="text-sm font-semibold text-black">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  Location
                </p>
                <p className="text-sm font-semibold text-black">
                  Block #{item.blockNumber}
                </p>
              </div>
            </div>

            {/* Minimal Barcode Area */}
            <div className="mt-12 flex flex-col items-center">
              <div className="flex gap-1 h-12 items-end opacity-30">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-black w-[2px]" 
                    style={{ height: `${Math.random() * 100}%` }} 
                  />
                ))}
              </div>
              <p className="text-[8px] font-mono text-gray-400 mt-2">VERIFIED ENTRY</p>
            </div>
          </div>

          {/* MAIN CONTENT SECTION */}
          <div className="flex-1 p-8 md:p-12 bg-white">
            {/* Hero Image */}
            <div className="w-full h-72 bg-[#F5F5F7] rounded-[32px] overflow-hidden mb-8 shadow-inner border border-gray-100">
              {item.imageCID && item.imageCID[0] ? (
                <img
                  src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                  No Image Available
                </div>
              )}
            </div>

            {/* Title & Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-black">
                {item.itemName}
              </h2>
              <span className="inline-block bg-black text-white px-4 py-1 text-xs font-bold rounded-full w-fit">
                {item.status}
              </span>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <DetailItem label="Category" value={item.category} />
              <DetailItem label="Brand" value={item.brand} />
              <DetailItem label="Color" value={item.color} />
              <DetailItem label="Condition" value={item.condition} />
            </div>

            {/* Description */}
            {item.description && (
              <div className="mb-10 p-6 bg-[#FBFBFB] rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Notes
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}

            {/* Contact Section - Ultra Minimal */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-8 border-t border-gray-100">
              <div className="text-center md:text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Owner Contact
                </p>
                <p className="text-sm font-medium text-black">
                  {item.user?.email || item.user?.phoneNumber || "No contact provided"}
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => window.location.href = `mailto:${item.user?.email}`}
                  className="flex-1 md:flex-none px-6 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all active:scale-95"
                >
                  Email Owner
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-3 bg-gray-100 text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Grid Details
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="text-sm font-semibold text-black truncate">
      {value || "—"}
    </p>
  </div>
);

export default LostItemTicket;