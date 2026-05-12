import * as ipfsService from '../services/ipfsService.js';
import fs from 'fs';

export const uploadFileToIPFS =
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success: false,

          message:
            "No file uploaded",

        });

      }

      const filePath =
        req.file.path;

      const result =
        await ipfsService.uploadToIPFS(
          filePath
        );

      return res.status(200).json({

        success: true,

        message:
          "File uploaded successfully",

        cid: result.cid,

        ipfsUrl:
          result.ipfsUrl,

      });

    } catch (error) {

      console.error(
        "❌ Upload Controller Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.message,

      });
    }
  };

export const uploadMetadataToIPFS = async (req, res) => {

  try {
    const {itemName,description,category,brand,model,color,condition,customMarkings, imageCID} = req.body;
    if (!itemName) {
      return res.status(400).json({
        success: false,
        message: "itemName is required"
      });
    }
    const metadata = {
      itemName,
      description: description || "Lost Item",
      category: category || "General",
      deviceInformation: {
        brand: brand || "Unknown",
        model: model || "Unknown",
      },
      physicalDetails: {
        color: color || "Unknown",
        condition: condition || "Unknown",
        customMarkings:
          customMarkings || "None",
      },
      imageCID: imageCID || null,
      timestamp: new Date().toISOString(),
    };
    const result = await ipfsService.uploadMetadataToIPFS(metadata);
    return res.status(200).json({
      success: true,
      message:"Metadata uploaded to IPFS",
      cid: result.cid,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Metadata error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Only upload these SAFE public fields to IPFS:

// itemName
// description
// category
// brand
// model
// color
// condition
// customMarkings

// Do NOT upload these publicly:

// IMEI
// Serial Number
// MAC Address
// Storage Capacity
// Operating System
// Owner Details
// Invoice Files