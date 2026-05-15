import express from "express";
import { registerItems, getItemByQr, getUserItems, updateItemStatus, markItemLost, getLostItems, getNotifications, reportFoundItem, confirmReturned } from "../controller/itemController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/register", protect, registerItems);
router.get("/my-items", protect, getUserItems);
router.put("/status/:itemId", updateItemStatus);
router.get("/lost-items", getLostItems);
router.post("/report-found/:itemId", reportFoundItem);
router.put("/confirm-return/:itemId", confirmReturned);
router.get("/notifications", protect, getNotifications);
router.put("/status/:itemId/lost", protect, markItemLost);
router.get("/findItem/:itemId", getItemByQr);

export default router;