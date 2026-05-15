import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const FoundItemPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, []);

  const fetchItem = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/items/findItem/${itemId}`
      );

      const data = await res.json();
      console.log(data);
      
      if (data.success) {
        setItem(data.item);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading item...</h2>;
  }

  if (!item) {
    return <h2>Item not found</h2>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
        
        {item.imageCID?.length > 0 && (
          <img
            src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
            alt={item.itemName}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}

        <h1 className="text-2xl font-bold">{item.itemName}</h1>
        <p className="text-gray-600 mt-2">{item.category}</p>

        <div className="mt-4 space-y-2">
          <p><strong>Status:</strong> {item.status}</p>
          <p><strong>Brand:</strong> {item.brand || "N/A"}</p>
          <p><strong>Color:</strong> {item.color || "N/A"}</p>
        </div>

        {item.status === "Lost" && (
          <button 
            onClick={() => navigate(`/dashboard?action=report-found&itemId=${item.itemId}`)}
            className="w-full mt-6 bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Report Found
          </button>
        )}
      </div>
    </div>
  );
};

export default FoundItemPage;