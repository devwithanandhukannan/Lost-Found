
import express from 'express';
import { registerItem, getItem, markItemLost, reportItemFound, confirmItemReturned} from '../controller/blockchainController.js';
const router = express.Router();

router.post('/register-item', registerItem);
router.get('/get-item/:itemId', getItem);
router.patch('/item/:itemId/lost', markItemLost);
router.patch('/item/:itemId/found', reportItemFound);
router.patch('/item/:itemId/returned', confirmItemReturned);
export default router;