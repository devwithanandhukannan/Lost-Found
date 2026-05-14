// src/pages/RegisterItem.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { uploadToIPFS, uploadMetadataToIPFS } from "../api/blockchainApi.js";

const RegisterItem = ({
    userAcc,
    walletClient,
    publicClient,
    contractAddress,
    contractABI,
    addNotification,
}) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 3) {
            addNotification({
                type: 'warning',
                title: 'Too Many Images',
                message: 'Maximum 3 images allowed'
            });
            return;
        }

        setFormData({ ...formData, images: files });

        const imageUrls = files
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => URL.createObjectURL(file));

        setPreview(imageUrls);
    };

    const isMobile = formData.category === "Mobile";
    const isElectronic = ["Mobile", "Laptop", "Tablet"].includes(formData.category);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!userAcc || !walletClient || !publicClient) {
            addNotification({
                type: 'error',
                title: 'Wallet Not Connected',
                message: 'Please connect MetaMask first'
            });
            return;
        }

        if (!formData.itemName.trim()) {
            addNotification({
                type: 'error',
                title: 'Item Name Required',
                message: 'Please enter an item name'
            });
            return;
        }

        if (formData.images.length === 0) {
            addNotification({
                type: 'error',
                title: 'Images Required',
                message: 'Upload at least 1 image'
            });
            return;
        }

        setLoading(true);

        try {
            addNotification({
                type: 'info',
                title: 'Uploading',
                message: 'Uploading images to IPFS...'
            });

            const uploadedImages = [];
            for (const file of formData.images) {
                const uploadRes = await uploadToIPFS(file);
                if (!uploadRes.success) throw new Error(uploadRes.message);
                uploadedImages.push(uploadRes.cid);
            }

            addNotification({
                type: 'info',
                title: 'Uploading',
                message: 'Uploading metadata...'
            });

            const metadata = {
                itemName: formData.itemName,
                category: formData.category,
                imageCID: uploadedImages,
                owner: userAcc,
                timestamp: new Date().toISOString(),
            };

            const metadataRes = await uploadMetadataToIPFS(metadata);
            if (!metadataRes.success) throw new Error("Metadata upload failed");

            const metadataCID = metadataRes.cid;

            addNotification({
                type: 'info',
                title: 'Blockchain',
                message: 'Confirm transaction in MetaMask...'
            });

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

            addNotification({
                type: 'info',
                title: 'Saving',
                message: 'Saving to database...'
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

            const dbRes = await fetch("http://localhost:5001/api/items/register", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dbPayload)
            });

            const dbData = await dbRes.json();
            if (!dbRes.ok) throw new Error(dbData.message || "Database save failed");

            addNotification({
                type: 'success',
                title: 'Item Registered',
                message: `Successfully registered item #${itemId}`
            });

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
            setStep(1);

        } catch (err) {
            console.error(err);
            addNotification({
                type: 'error',
                title: 'Registration Failed',
                message: err.message || 'Something went wrong'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-black">Register New Product</h2>
                <p className="text-gray-600 mt-2">Mint an NFT to prove ownership on the blockchain</p>
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-2 mb-12">
                {[1, 2, 3].map((s) => (
                    <motion.div
                        key={s}
                        className={`flex-1 h-2 rounded-full ${
                            s <= step ? 'bg-black' : 'bg-gray-200'
                        }`}
                        initial={false}
                        animate={{ backgroundColor: s <= step ? '#000000' : '#e5e5e5' }}
                    />
                ))}
            </div>

            <form onSubmit={handleRegister} className="space-y-8">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 bg-white border border-gray-200 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-black">Basic Information</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    name="itemName"
                                    required
                                    placeholder="e.g., iPhone 15 Pro Max"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Mobile">Mobile Phone</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Tablet">Tablet</option>
                                    <option value="Document">Document</option>
                                    <option value="Accessory">Accessory</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    placeholder="Describe your item in detail..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Device Details */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 bg-white border border-gray-200 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-black">Device Details</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    placeholder="e.g., Apple"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Model
                                </label>
                                <input
                                    type="text"
                                    name="model"
                                    placeholder="e.g., iPhone 15"
                                    value={formData.model}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Color
                                </label>
                                <input
                                    type="text"
                                    name="color"
                                    placeholder="e.g., Space Black"
                                    value={formData.color}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Condition
                                </label>
                                <select
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="">Select</option>
                                    <option value="New">New</option>
                                    <option value="Like New">Like New</option>
                                    <option value="Used">Used</option>
                                    <option value="Scratched">Scratched</option>
                                </select>
                            </div>

                            {isMobile && (
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        IMEI
                                    </label>
                                    <input
                                        type="text"
                                        name="imei"
                                        placeholder="15-digit IMEI"
                                        value={formData.imei}
                                        onChange={handleChange}
                                        maxLength="15"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Serial Number
                                </label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    placeholder="Device serial"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-2.5 border border-gray-300 text-black rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Images */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 bg-white border border-gray-200 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-black">Upload Images</h3>

                        <div className="space-y-4">
                            <label className="block">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-gray-500 text-sm mt-1">Up to 3 images (JPG, PNG)</p>
                                </div>
                            </label>

                            {preview.length > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                    {preview.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={img}
                                                alt={`preview-${idx}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <span className="absolute top-1 right-1 bg-black text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-6 py-2.5 border border-gray-300 text-black rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Registering...' : 'Register Item'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </form>
        </div>
    );
};

export default RegisterItem;