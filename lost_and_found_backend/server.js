import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import ipfsRoutes from "./routes/ipfsRoutes.js";
import itemsRoutes from "./routes/itemRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(cookieParser());
/*
 CORS FIX
 Allow frontend (Vite runs on 5173)
*/
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// handle preflight manually
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection
connectDB();

// Debug route logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/user', userRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/items", itemsRoutes);
// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running properly",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    success: false,
    message: err.message,
  });
});

const PORT =5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});