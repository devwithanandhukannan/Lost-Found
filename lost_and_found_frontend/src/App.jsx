import React, { useState } from "react";

import { uploadToIPFS, uploadMetadataToIPFS, registerItem as registerItemAPI } from "./api/blockchainApi.js";
import ViewItem from "./pages/viewItems.jsx";

import "./App.css";
import MakeLost from "./pages/makeLost.jsx";

export default function App() {

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    brand: "",
    model: "",
    serialNumber: "",
    imei: "",
    macAddress: "",
    operatingSystem: "",
    storageCapacity: "",
    color: "",
    condition: "",
    customMarkings: "",
    images: [],
  });

  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ================= HANDLE INPUT =================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ================= HANDLE FILE =================

  const handleFileUpload = (e) => {
    const files = Array.from(
      e.target.files
    );
    setFormData({
      ...formData,
      images: files,
    });
    const imageUrls = files
      .filter((file) =>
        file.type.startsWith("image/")
      )
      .map((file) =>
        URL.createObjectURL(file)
      );
    setPreview(imageUrls);
  };

  // ================= CATEGORY CHECK =================

  const isMobile = formData.category === "Mobile";

  const isElectronic = formData.category === "Mobile" || formData.category === "Laptop" || formData.category === "Tablet";

  const isDocument = formData.category === "Document";

  // ================= REGISTER =================

  async function handleRegister(e) {

    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.itemName.trim()) {
      setError(
        "Item name is required"
      );
      return;
    }

    if (formData.images.length === 0) {
      setError(
        "Upload at least 1 image"
      );
      return;
    }

    setLoading(true);
    try {

      console.log( "Step 1: Uploading images...");

      // ================= UPLOAD IMAGES =================

      const uploadedImages = [];
      for (const file of formData.images) {
        const uploadRes = await uploadToIPFS(file);
        if (!uploadRes.success) {
          throw new Error(
            uploadRes.message ||
            "Failed to upload image"
          );
        }

        uploadedImages.push(
          uploadRes.cid
        );
      }

      console.log( "Uploaded Images:", uploadedImages);

      // ================= METADATA =================

      console.log("Step 2: Uploading metadata...");

      const metadataRes =
        await uploadMetadataToIPFS({
          itemName:formData.itemName,
          description:formData.description,
          category:formData.category,
          brand:formData.brand,
          model:formData.model,
          color:formData.color,
          condition:formData.condition,
          customMarkings:formData.customMarkings,
          imageCID: uploadedImages,
        });

      if (!metadataRes.success) {
        throw new Error(metadataRes.message ||"Failed to upload metadata");
      }

      const metadataCID = metadataRes.cid;
      console.log(" Metadata CID:", metadataCID);

      // ================= BLOCKCHAIN =================

      console.log( "Step 3: Registering on blockchain...");

      const registerRes = await registerItemAPI(formData.itemName, metadataCID );

      if (!registerRes.success) {
        throw new Error(registerRes.message || "Failed to register item"
        );
      }

      console.log("✅ Registration success:",registerRes);

      // ================= SUCCESS =================

      const txHash =
        registerRes.transactionHash ||
        registerRes.txHash ||
        "unknown";

      const itemId =
        registerRes.itemId ||
        "pending";

      setSuccess(
        `✅ Item registered successfully!

Item ID: ${itemId}

Metadata CID:
${metadataCID.substring(0, 20)}...

Transaction:
${txHash.substring(0, 20)}...`
      );

      // ================= RESET =================

      setFormData({

        itemName: "",
        category: "",
        description: "",

        brand: "",
        model: "",
        serialNumber: "",
        imei: "",
        macAddress: "",
        operatingSystem: "",
        storageCapacity: "",

        color: "",
        condition: "",
        customMarkings: "",

        images: [],

      });

      setPreview([]);

    } catch (err) {

      console.error(
        "❌ Error:",
        err
      );

      setError(
        `❌ ${err.message}`
      );

    } finally {

      setLoading(false);

    }
  }

  return (

    <div className="container">
      <ViewItem/>
      <MakeLost/>
      <div className="card">

        <h1>
          Lost & Found NFT Registry
        </h1>

        <p className="subtitle">
          Register your ownership
          securely on blockchain
        </p>

        {/* ERROR */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        <form
          onSubmit={handleRegister}
          className="form"
        >

          {/* ================= BASIC INFORMATION ================= */}

          <div className="section-title">
            Basic Information
          </div>

          <div className="input-group">

            <label>
              Item Name
            </label>

            <input
              type="text"
              name="itemName"
              placeholder="Enter item name"
              value={
                formData.itemName
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="input-group">

            <label>
              Category
            </label>

            <select
              name="category"
              value={
                formData.category
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="">
                Select Category
              </option>

              <option value="Mobile">
                Mobile
              </option>

              <option value="Laptop">
                Laptop
              </option>

              <option value="Tablet">
                Tablet
              </option>

              <option value="Document">
                Document
              </option>

              <option value="Accessory">
                Accessory
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

          <div className="input-group full-width">

            <label>
              Description
            </label>

            <textarea
              name="description"
              rows="4"
              placeholder="Describe your item"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
            />

          </div>

          {/* ================= DEVICE INFORMATION ================= */}

          {!isDocument && (

            <>

              <div className="section-title">
                Device Information
              </div>

              <div className="input-group">

                <label>
                  Brand / Manufacturer
                </label>

                <input
                  type="text"
                  name="brand"
                  placeholder="Apple"
                  value={
                    formData.brand
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Model Name / Number
                </label>

                <input
                  type="text"
                  name="model"
                  placeholder="iPhone 15"
                  value={
                    formData.model
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Serial Number
                </label>

                <input
                  type="text"
                  name="serialNumber"
                  placeholder="Serial Number"
                  value={
                    formData.serialNumber
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* MOBILE ONLY */}

              {isMobile && (

                <div className="input-group">

                  <label>
                    IMEI Number
                  </label>

                  <input
                    type="text"
                    name="imei"
                    placeholder="15-digit IMEI"
                    value={
                      formData.imei
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              )}

              {/* ELECTRONIC ONLY */}

              {isElectronic && (

                <>

                  <div className="input-group">

                    <label>
                      MAC Address
                    </label>

                    <input
                      type="text"
                      name="macAddress"
                      placeholder="WiFi MAC"
                      value={
                        formData.macAddress
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="input-group">

                    <label>
                      Operating System
                    </label>

                    <input
                      type="text"
                      name="operatingSystem"
                      placeholder="Android"
                      value={
                        formData.operatingSystem
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="input-group">

                    <label>
                      Storage Capacity
                    </label>

                    <input
                      type="text"
                      name="storageCapacity"
                      placeholder="256GB"
                      value={
                        formData.storageCapacity
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                </>

              )}

            </>

          )}

          {/* ================= PHYSICAL DETAILS ================= */}

          <div className="section-title">
            Physical Details
          </div>

          <div className="input-group">

            <label>
              Color
            </label>

            <input
              type="text"
              name="color"
              placeholder="Black"
              value={
                formData.color
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="input-group">

            <label>
              Device Condition
            </label>

            <select
              name="condition"
              value={
                formData.condition
              }
              onChange={
                handleChange
              }
            >

              <option value="">
                Select Condition
              </option>

              <option value="New">
                New
              </option>

              <option value="Like New">
                Like New
              </option>

              <option value="Used">
                Used
              </option>

              <option value="Scratched">
                Scratched
              </option>

              <option value="Cracked">
                Cracked
              </option>

            </select>

          </div>

          <div className="input-group full-width">

            <label>
              Custom Markings /
              Unique Scratches
            </label>

            <textarea
              name="customMarkings"
              rows="3"
              placeholder="Sticker near camera..."
              value={
                formData.customMarkings
              }
              onChange={
                handleChange
              }
            />

          </div>

          {/* ================= IMAGE UPLOAD ================= */}

          <div className="section-title">
            Supporting Images /
            Invoice
          </div>

          <div className="input-group full-width">

            <label>
              Upload Device Images,
              Invoice, Ownership Proof
            </label>

            <div className="upload-box">

              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={
                  handleFileUpload
                }
              />

              <div className="upload-title">
                Drag & Drop Files Here
              </div>

              <div className="upload-subtitle">
                Upload up to 3 images,
                invoice, ownership
                proof, scratches, etc.
              </div>

            </div>

            {/* PREVIEW */}

            {preview.length > 0 && (

              <div className="preview-grid">

                {preview.map(
                  (img, index) => (

                    <img
                      key={index}
                      src={img}
                      alt="preview"
                      className="preview-image"
                    />

                  )
                )}

              </div>

            )}

          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Registering..."
              : "Register Ownership NFT"}

          </button>

        </form>

      </div>

    </div>
  );
}