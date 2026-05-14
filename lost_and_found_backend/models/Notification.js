import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  },
  finderName: String,
  phone: String,
  email: String,
  message: String,
  wallet: String,
  status: {
    type: String,
    default: "viewed"
  }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);