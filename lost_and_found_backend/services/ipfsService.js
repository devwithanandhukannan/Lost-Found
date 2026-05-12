import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

// ================= ENV VARIABLES =================
const PINATA_API_KEY =process.env.PINATA_API_KEY;

const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

// ================= FILE UPLOAD =================

export const uploadToIPFS = async (filePath) => {
console.log("PINATA_API_KEY:",PINATA_API_KEY);

console.log("PINATA_SECRET_API_KEY:",PINATA_SECRET_API_KEY);
  try {
    // Validate file
    if (!filePath ||!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    console.log("📖 Reading file...");

    // Read file
    const fileData =fs.readFileSync(filePath);
    console.log("📦 File size:",(fileData.length / 1024).toFixed(2),"KB");
    console.log("⏳ Uploading to Pinata...");
    const formData = new FormData();
    formData.append("file",fileData,"upload.bin");

    // Upload to Pinata
    const response =
      await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,{
          maxBodyLength: Infinity,
          headers: {...formData.getHeaders(),
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key:PINATA_SECRET_API_KEY,
          },
        }
      );

    const cid =response.data.IpfsHash;
    console.log("✅ Upload success!");
    console.log("🌐 CID:",cid);

    // Delete local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Local file deleted");
    }

    return {
      cid,
      ipfsUrl:`https://ipfs.io/ipfs/${cid}`,
      pinataUrl:`https://gateway.pinata.cloud/ipfs/${cid}`,
    };

  } catch (error) {
    console.error("❌ Pinata Upload Error:", error.message);

    // Detailed API error
    if (error.response) {
      console.error("API Status:",error.response.status);
      console.error("API Error:",error.response.data);
    }

    // Delete local file if exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.log("Cleanup failed");
      }
    }
    throw new Error(
      `IPFS upload failed: ${error.message}`
    );
  }
};

// ================= METADATA UPLOAD =================

export const uploadMetadataToIPFS =
  async (metadata) => {
    try {
      if (!metadata) {throw new Error("Metadata is required");}
      console.log("📤 Uploading metadata...");
      const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinJSONToIPFS",
          metadata,{
            headers: {
              pinata_api_key:PINATA_API_KEY,
              pinata_secret_api_key:PINATA_SECRET_API_KEY,
              "Content-Type":"application/json",
            },
          }
        );

      const cid =response.data.IpfsHash;
      console.log("✅ Metadata uploaded!");
      console.log("🌐 Metadata CID:",cid);
      return {
        cid,
        metadata,
        ipfsUrl:`https://ipfs.io/ipfs/${cid}`,
        pinataUrl:`https://gateway.pinata.cloud/ipfs/${cid}`,
      };
    } catch (error) {
      console.error("❌ Metadata Upload Error:",error.message);
      if (error.response) {
        console.error("API Status:",error.response.status);
        console.error("API Error:",error.response.data);
      }
      throw new Error(`Metadata upload failed: ${error.message}`);
    }
  };