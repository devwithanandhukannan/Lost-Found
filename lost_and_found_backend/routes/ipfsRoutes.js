import express from 'express';
import uploadMiddleware from '../middleware/upload.js'
import * as ipfsController from '../controller/ipfsController.js';

const router = express.Router();    

router.post(
  "/upload",
  uploadMiddleware.single("file"),
  ipfsController.uploadFileToIPFS
);
router.post('/metadata', ipfsController.uploadMetadataToIPFS);

export default router;
