// src/pages/RegisterItem.jsx
import React, { useState } from "react";
import { uploadToIPFS, uploadMetadataToIPFS } from "../api/blockchainApi.js";

const RegisterItem = ({
    userAcc,
    walletClient,
    publicClient,
    contractAddress,
    contractABI,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [preview, setPreview] = useState([]);

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

    // ================= HANDLERS =================

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 3) {
            setError("⚠️ Maximum 3 images allowed");
            return;
        }

        setFormData({ ...formData, images: files });

        const imageUrls = files
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => URL.createObjectURL(file));

        setPreview(imageUrls);
        setError("");
    };

    // ================= CATEGORY CHECKS =================

    const isMobile = formData.category === "Mobile";
    const isElectronic = ["Mobile", "Laptop", "Tablet"].includes(formData.category);
    const isDocument = formData.category === "Document";

    // ================= REGISTER ITEM =================

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");


        if (!userAcc || !walletClient || !publicClient) {
            setError("❌ Please connect MetaMask first");
            return;
        }

        if (!formData.itemName.trim()) {
            setError("❌ Item name is required");
            return;
        }

        if (formData.images.length === 0) {
            setError("❌ Upload at least 1 image");
            return;
        }

        setLoading(true);

        try {
            // -----------------------------------
            // STEP 1: Upload images to IPFS
            // -----------------------------------
            setSuccess("📤 Uploading images to IPFS...");

            const uploadedImages = [];

            for (const file of formData.images) {
                const uploadRes = await uploadToIPFS(file);

                if (!uploadRes.success) {
                    throw new Error(uploadRes.message);
                }

                uploadedImages.push(uploadRes.cid);
            }

            console.log("Uploaded Images:", uploadedImages);

            // -----------------------------------
            // STEP 2: Upload minimal metadata to IPFS
            // -----------------------------------
            setSuccess("📤 Uploading metadata to IPFS...");

            const metadata = {
                itemName: formData.itemName,
                category: formData.category,
                imageCID: uploadedImages,
                owner: userAcc,
                timestamp: new Date().toISOString(),
            };

            const metadataRes = await uploadMetadataToIPFS(metadata);

            if (!metadataRes.success) {
                throw new Error("Metadata upload failed");
            }

            const metadataCID = metadataRes.cid;

            console.log("Metadata CID:", metadataCID);

            // -----------------------------------
            // STEP 3: Blockchain Registration
            // -----------------------------------
            setSuccess("⛓️ Confirm transaction in MetaMask...");

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "registerItem",
                args: [formData.itemName, metadataCID],
                account: userAcc,
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
                timeout: 60000,
            });

            let itemId = null;

            try {
                const counter = await publicClient.readContract({
                    address: contractAddress,
                    abi: contractABI,
                    functionName: "tokenCounter",
                });

                itemId = Number(counter.toString()) - 1;
            } catch (err) {
                console.log("Error fetching itemId:", err);
            }

            const txHash = receipt.transactionHash;
            const blockNumber = Number(receipt.blockNumber);

            // -----------------------------------
            // STEP 4: Save full details in backend DB
            // -----------------------------------
            setSuccess("💾 Saving item details to database...");
            console.log({
                itemId,
                blockNumber,
                txHash
            });
            const dbPayload = {
                itemId: Number(itemId),
                itemName: formData.itemName,
                category: formData.category,
                description: formData.description,
                brand: formData.brand,
                model: formData.model,
                serialNumber: formData.serialNumber,
                imei: formData.imei,
                macAddress: formData.macAddress,
                operatingSystem: formData.operatingSystem,
                storageCapacity: formData.storageCapacity,
                color: formData.color,
                condition: formData.condition,
                customMarkings: formData.customMarkings,
                imageCID: uploadedImages,
                metadataCID,
                txHash,
                blockNumber: Number(blockNumber),
                walletAddress: userAcc
            };

            const dbRes = await fetch(
                "http://localhost:5001/api/items/register",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dbPayload)
                }
            );

            const dbData = await dbRes.json();

            if (!dbRes.ok) {
                throw new Error(dbData.message || "Database save failed");
            }

            console.log("Saved to DB:", dbData);

            // -----------------------------------
            // SUCCESS
            // -----------------------------------
            setSuccess(`
✅ Item Registered Successfully!

🎫 Item ID: #${itemId}
📦 Metadata CID: ${metadataCID}
🔗 TX Hash: ${txHash}
📊 Block: ${blockNumber}

Stored:
✔ Blockchain → Ownership proof
✔ IPFS → Images + metadata
✔ Database → Full item details
    `);

            // Reset form
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
            console.error(err);
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-semibold mb-2">📝 Register New Item</h2>
                <p className="text-gray-400">🎫 Mint an NFT to prove ownership on Hoodi blockchain</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-xl">
                    <pre className="text-red-400 whitespace-pre-wrap text-sm">{error}</pre>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-green-950/50 border border-green-800 rounded-xl">
                    <pre className="text-green-400 whitespace-pre-wrap text-sm">{success}</pre>
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-10">
                {/* ========== BASIC INFORMATION ========== */}
                <div>
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        📋 <span>Basic Information</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Item Name *</label>
                            <input
                                type="text"
                                name="itemName"
                                required
                                placeholder="e.g., iPhone 15 Pro Max"
                                value={formData.itemName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Category *</label>
                            <select
                                name="category"
                                required
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
                            >
                                <option value="">Select Category</option>
                                <option value="Mobile">📱 Mobile</option>
                                <option value="Laptop">💻 Laptop</option>
                                <option value="Tablet">📲 Tablet</option>
                                <option value="Document">📄 Document</option>
                                <option value="Accessory">🎧 Accessory</option>
                                <option value="Other">📦 Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <label className="text-sm font-medium text-gray-400">Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Describe your item in detail..."
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                        />
                    </div>
                </div>

                {/* ========== DEVICE INFORMATION ========== */}
                {!isDocument && (
                    <div>
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            🔧 <span>Device Information</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Brand / Manufacturer</label>
                                <input
                                    type="text"
                                    name="brand"
                                    placeholder="e.g., Apple, Samsung, Dell"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Model Name / Number</label>
                                <input
                                    type="text"
                                    name="model"
                                    placeholder="e.g., iPhone 15 Pro, MacBook Air M2"
                                    value={formData.model}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Serial Number</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    placeholder="Device Serial Number"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            {/* Mobile Only - IMEI */}
                            {isMobile && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">IMEI Number</label>
                                    <input
                                        type="text"
                                        name="imei"
                                        placeholder="15-digit IMEI"
                                        value={formData.imei}
                                        onChange={handleChange}
                                        maxLength="15"
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                    />
                                    <small className="text-xs text-gray-500">ℹ️ Dial *#06# to find IMEI</small>
                                </div>
                            )}

                            {/* Electronic Devices */}
                            {isElectronic && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">MAC Address</label>
                                        <input
                                            type="text"
                                            name="macAddress"
                                            placeholder="WiFi MAC Address"
                                            value={formData.macAddress}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Operating System</label>
                                        <input
                                            type="text"
                                            name="operatingSystem"
                                            placeholder="e.g., iOS 17, Android 14, Windows 11"
                                            value={formData.operatingSystem}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Storage Capacity</label>
                                        <input
                                            type="text"
                                            name="storageCapacity"
                                            placeholder="e.g., 256GB, 512GB, 1TB"
                                            value={formData.storageCapacity}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== PHYSICAL DETAILS ========== */}
                <div>
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        🎨 <span>Physical Details</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Color</label>
                            <input
                                type="text"
                                name="color"
                                placeholder="e.g., Space Black, Midnight, Silver"
                                value={formData.color}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Device Condition</label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
                            >
                                <option value="">Select Condition</option>
                                <option value="New">New</option>
                                <option value="Like New">Like New</option>
                                <option value="Used">Used</option>
                                <option value="Scratched">Scratched</option>
                                <option value="Cracked">Cracked</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                            Custom Markings / Unique Scratches
                        </label>
                        <textarea
                            name="customMarkings"
                            rows="3"
                            placeholder="Describe any unique markings, scratches, stickers, custom cases, or identifying features..."
                            value={formData.customMarkings}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                        />
                    </div>
                </div>

                {/* ========== IMAGE UPLOAD ========== */}
                <div>
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        📸 <span>Supporting Images / Documents</span>
                    </h3>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                            Upload Device Images, Invoice, Ownership Proof *
                        </label>

                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                                id="file-upload"
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-blue-500 transition bg-zinc-900/50"
                            >
                                <div className="text-lg font-medium mb-1">Click or Drag & Drop</div>
                                <div className="text-sm text-gray-500">
                                    Upload up to 3 images (device photos, invoice, purchase receipt)
                                </div>
                            </label>
                        </div>

                        {/* Image Preview */}
                        {preview.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                {preview.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img}
                                            alt={`preview-${index}`}
                                            className="w-full h-32 object-cover rounded-xl border border-zinc-800"
                                        />
                                        <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            #{index + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ========== SUBMIT BUTTON ========== */}
                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={loading || !userAcc}
                        className="w-full py-4 font-semibold text-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition shadow-lg"
                    >
                        {loading
                            ? "⏳ Minting NFT on Hoodi..."
                            : !userAcc
                                ? "🔒 Connect Wallet First"
                                : "🎫 Mint Ownership NFT"}
                    </button>

                    {!userAcc && (
                        <p className="text-center text-yellow-500 text-sm">
                            ⚠️ Please connect your MetaMask wallet to register items
                        </p>
                    )}

                    {userAcc && !loading && (
                        <p className="text-center text-gray-500 text-sm">
                            💡 Make sure you have enough ETH for gas fees on Hoodi
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default RegisterItem;