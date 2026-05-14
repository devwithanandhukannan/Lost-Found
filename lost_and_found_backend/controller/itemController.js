import Item from "../models/Item.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const registerItems = async (req, res) => {
  try {
    const {
      itemId,
      itemName,
      category,
      description,
      brand,
      model,
      serialNumber,
      imei,
      macAddress,
      operatingSystem,
      storageCapacity,
      color,
      condition,
      customMarkings,
      imageCID,
      metadataCID,
      txHash,
      blockNumber,
      walletAddress
    } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({
        success: false,
        message: "Item name and category are required"
      });
    }

    const item = await Item.create({
      user: req.user._id,
      itemId,
      itemName,
      category,
      description,
      brand,
      model,
      serialNumber,
      imei,
      macAddress,
      operatingSystem,
      storageCapacity,
      color,
      condition,
      customMarkings,
      imageCID,
      metadataCID,
      txHash,
      blockNumber,
      walletAddress
    });

    res.status(201).json({
      success: true,
      message: "Item registered successfully",
      item
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getUserItems = async (req, res) => {
  try {
    const items = await Item.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findOne({ itemId });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    item.status = "Lost";
    await item.save();

    res.json({
      success: true,
      message: "Item marked as lost"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getLostItems = async (req, res) => {
  try {
    const items = await Item.find({ status: "Lost" }).select(
      "itemId itemName category color imageCID status"
    );

    res.json({
      success: true,
      items
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const reportFoundItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      finderName,
      finderPhone,
      finderEmail,
      finderWallet,
      message
    } = req.body;

    const item = await Item.findOne({ itemId }).populate("user");
    console.log(item);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    item.status = "Found";
    item.finderWallet = finderWallet;

    await item.save();

    await Notification.create({
      itemId: item._id,
      ownerId: item.user._id,
      finderName,
      phone:finderPhone,
      email:finderEmail,
      wallet:finderWallet,
      message
    });

    res.json({
      success: true,
      message: "Owner notified successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const confirmReturned = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findOne({ itemId });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    item.status = "Returned";

    await item.save();

    res.json({
      success: true,
      message: "Item returned successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getNotifications = async (req, res) => {

  try {
    const userId = req.user._id;
    console.log('userid:', userId);
    
    const notifications = await Notification.find({ ownerId: userId }).populate('itemId').sort({ createdAt: -1 });
    console.log(notifications);
    
    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const markItemLost = async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { itemId: req.params.itemId },
      { status: "Lost" },
      { new: true }
    );

    res.json({
      success: true,
      message: "Item marked as lost",
      item
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
