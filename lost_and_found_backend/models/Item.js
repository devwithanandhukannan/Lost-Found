import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemId: {
      type: Number,
      required: true,
      unique: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    itemName: String,
    category: String,
    description: String,
    brand: String,
    model: String,

    serialNumber: String,
    imei: String,
    macAddress: String,
    operatingSystem: String,
    storageCapacity: String,

    color: String,
    condition: String,
    customMarkings: String,

    imageCID: [String],
    metadataCID: String,

    walletAddress: String,

    txHash: String,
    blockNumber: Number,

    status: {
      type: String,
      enum: ["Active", "Lost", "Found", "Returned"],
      default: "Active"
    },

    finderWallet: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);