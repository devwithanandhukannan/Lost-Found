import React, { useEffect, useState } from "react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/items/notifications",
        {
          credentials: "include"
        }
      );

      const data = await res.json();

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

  if (loading) return <h2>Loading notifications...</h2>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        🔔 Notifications
      </h1>

      {notifications.length === 0 ? (
        <div className="bg-gray-100 p-5 rounded-lg">
          No notifications yet
        </div>
      ) : (
        notifications.map((notification) => (
  <div
    key={notification._id}
    className="bg-white shadow-md rounded-xl p-5 mb-4 border"
  >
    <h3 className="text-lg font-semibold">
      Lost Item: {notification.itemId?.itemName}
    </h3>

    <p>
      <strong>Item ID:</strong>{" "}
      #{notification.itemId?.itemId}
    </p>

    <p>
      <strong>Category:</strong>{" "}
      {notification.itemId?.category}
    </p>

    <p>
      <strong>Color:</strong>{" "}
      {notification.itemId?.color}
    </p>

    {notification.itemId?.imageCID?.length > 0 && (
      <img
        src={`https://ipfs.io/ipfs/${notification.itemId.imageCID[0]}`}
        alt="lost-item"
        className="w-40 rounded-lg mt-3"
      />
    )}

    <hr className="my-4" />

    <p>
      <strong>Finder Name:</strong>{" "}
      {notification.finderName}
    </p>

    <p>
      <strong>Phone:</strong>{" "}
      {notification.phone}
    </p>

    <p>
      <strong>Email:</strong>{" "}
      {notification.email}
    </p>

    <p>
      <strong>Message:</strong>{" "}
      {notification.message}
    </p>

    <p className="mt-2 text-sm text-gray-500">
      Status: {notification.status}
    </p>
  </div>
        ))
      )}
    </div>
  );
};

export default Notifications;