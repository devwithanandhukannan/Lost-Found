import React, { useEffect, useState } from "react";

const LostItems = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/items/lost-items")
      .then(res => res.json())
      .then(data => setItems(data.items));
  }, []);

  return (
    <div>
      <h2>Lost Items</h2>

      {items.map((item) => (
        <div key={item.itemId}>
          <h3>{item.itemName}</h3>
          <p>{item.category}</p>
          <p>{item.color}</p>
          <p>Status: {item.status}</p>

          <img
            src={`https://ipfs.io/ipfs/${item.imageCID[0]}`}
            width="200"
          />
        </div>
      ))}
    </div>
  );
};

export default LostItems;