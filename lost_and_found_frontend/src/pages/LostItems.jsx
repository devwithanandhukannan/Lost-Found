import React, { useEffect, useState } from "react";
import LostItemTicket from "../components/model/Model";
const LostItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5001/api/items/lost-items")
      .then(res => res.json())
      .then(data => {
        setItems(data.items);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching items:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-black text-sm font-medium tracking-wide">Loading registry...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white p-6 md:p-16 font-sans">
        {/* Header - Clean and Minimal */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-semibold tracking-tighter mb-4 text-black">
              Lost Items
            </h1>
            <p className="text-lg text-gray-500 font-normal mb-8">
              A secure registry for missing belongings.
            </p>
            <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
          </div>

          <p className="text-center text-gray-400 mt-8 text-sm font-medium">
            {items.length} {items.length === 1 ? "item" : "items"} currently reported missing
          </p>
        </div>

        {/* No Items Found */}
        {items.length === 0 ? (
          <div className="max-w-7xl mx-auto text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-gray-400 text-lg font-medium">
              No lost items found in the registry.
            </p>
          </div>
        ) : (
          /* Items Grid - Clean Card Style */
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div
                key={item.itemId}
                onClick={() => setSelectedItem(item)}
                className="cursor-pointer group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative mb-6 overflow-hidden bg-gray-100 rounded-xl h-56 w-full">
                  {item.imageCID && item.imageCID[0] ? (
                    <img
                      src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                      No Image Available
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-black uppercase tracking-wider shadow-sm">
                    {item.status || "Lost"}
                  </div>
                </div>

                {/* Item Details */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-black mb-2 tracking-tight line-clamp-1">
                    {item.itemName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {item.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium border-t border-gray-100 pt-4 mt-auto">
                    <span>{item.category}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <LostItemTicket item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
};

export default LostItems;