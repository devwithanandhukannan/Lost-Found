import React, { useEffect, useState } from "react";

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/items/my-items",
        {
          method: "GET",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  if (loading) {
    return (
      <div className="text-center text-white mt-10">
        Loading items...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        My Registered Items
      </h1>

      {items.length === 0 ? (
        <p>No items registered yet</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 cursor-pointer hover:border-blue-500 transition"
              onClick={() => toggleCard(item._id)}
            >
              {/* Basic Card Info */}
              <h2 className="text-xl font-semibold mb-2">
                {item.itemName}
              </h2>

              <p className="text-gray-400">
                Category: {item.category}
              </p>

              <p className="text-gray-400">
                Brand: {item.brand || "N/A"}
              </p>

              <p className="text-gray-400">
                Condition: {item.condition || "N/A"}
              </p>

              {/* Expand Details */}
              {expandedCard === item._id && (
                <div className="mt-5 border-t border-zinc-700 pt-4 space-y-2">
                  <p>
                    <strong>Description:</strong>{" "}
                    {item.description || "N/A"}
                  </p>

                  <p>
                    <strong>Model:</strong>{" "}
                    {item.model || "N/A"}
                  </p>

                  <p>
                    <strong>Serial Number:</strong>{" "}
                    {item.serialNumber || "N/A"}
                  </p>

                  <p>
                    <strong>IMEI:</strong>{" "}
                    {item.imei || "N/A"}
                  </p>

                  <p>
                    <strong>MAC Address:</strong>{" "}
                    {item.macAddress || "N/A"}
                  </p>

                  <p>
                    <strong>Storage:</strong>{" "}
                    {item.storageCapacity || "N/A"}
                  </p>

                  <p>
                    <strong>Color:</strong>{" "}
                    {item.color || "N/A"}
                  </p>

                  <p>
                    <strong>Custom Markings:</strong>{" "}
                    {item.customMarkings || "N/A"}
                  </p>

                  <p>
                    <strong>Blockchain Item ID:</strong>{" "}
                    #{item.itemId}
                  </p>

                  <p className="break-all">
                    <strong>Transaction:</strong>{" "}
                    {item.txHash}
                  </p>

                  <p className="break-all">
                    <strong>Metadata CID:</strong>{" "}
                    {item.metadataCID}
                  </p>

                  {/* Images */}
                  {item.imageCID?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="mb-2 font-semibold">
                        Images
                      </h3>

                      <div className="grid grid-cols-2 gap-2">
                        {item.imageCID.map((cid, index) => (
                          <img
                            key={index}
                            src={`https://ipfs.io/ipfs/${cid}`}
                            alt="item"
                            className="rounded-lg h-32 w-full object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItems;