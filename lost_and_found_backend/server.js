import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ipfsRoutes from './routes/ipfsRoutes.js';
import blockchainRoutes from './routes/blockchainRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/ipfs', ipfsRoutes);
app.use('/api/blockchain', blockchainRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});