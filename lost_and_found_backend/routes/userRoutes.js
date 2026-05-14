import express from 'express';
import { registerUser, loginUser, linkWallet } from '../controller/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/link-wallet', linkWallet);

export default router;