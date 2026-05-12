import { useState } from "react";
import "./App.css";

function App() {

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    serialNumber: "",
    color: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);

  // Handle Input Change
  const handleChange = (e) => {

    const { name, value, files } = e.target;

    if (files) {

      setFormData({
        ...formData,
        [name]: files[0],
      });

      setPreview(URL.createObjectURL(files[0]));

    } else {

      setFormData({
        ...formData,
        [name]: value,
      });

    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const data = new FormData();

      data.append("itemName", formData.itemName);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("serialNumber", formData.serialNumber);
      data.append("color", formData.color);
      data.append("image", formData.image);

      // Backend API
      const response = await fetch(
        "http://localhost:5000/api/items/register",
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      console.log(result);

      alert("Item Registered Successfully");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">

      <div className="card">

        <h1>Lost & Found NFT Registry</h1>

        <p className="subtitle">
          Register your item ownership securely using blockchain
        </p>

        <form onSubmit={handleSubmit} className="form">

          {/* Item Name */}
          <div className="input-group">
            <label>Item Name</label>

            <input
              type="text"
              name="itemName"
              placeholder="Enter item name"
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="input-group">
            <label>Category</label>

            <select
              name="category"
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Documents">
                Documents
              </option>

              <option value="Accessories">
                Accessories
              </option>

              <option value="Bags">
                Bags
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* Description */}
          <div className="input-group">
            <label>Description</label>

            <textarea
              name="description"
              rows="4"
              placeholder="Describe your item"
              onChange={handleChange}
              required
            />
          </div>

          {/* Serial Number */}
          <div className="input-group">
            <label>Serial Number / Unique ID</label>

            <input
              type="text"
              name="serialNumber"
              placeholder="Enter serial number"
              onChange={handleChange}
            />
          </div>

          {/* Color */}
          <div className="input-group">
            <label>Color</label>

            <input
              type="text"
              name="color"
              placeholder="Enter item color"
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div className="input-group">
            <label>Upload Item Image</label>

            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              required
            />
          </div>

          {/* Image Preview */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="preview"
            />
          )}

          <button type="submit">
            Register Ownership NFT
          </button>

        </form>

      </div>

    </div>
  );
}

export default App;