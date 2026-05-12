import { ethers } from 'ethers';
import abi from './contractABI.js';
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

const statusMap = {
  0: 'Active',
  1: 'Lost',
  2: 'Found',
  3: 'Returned'
};

export const registerItem = async (itemName, ipfsCID) => {
  console.log(`Registering item: ${itemName}, IPFS CID: ${ipfsCID}`);
  
  // High-level call: automatically estimates gas and signs with wallet
  const tx = await contract.registerItem(itemName, ipfsCID);
  const receipt = await tx.wait();
  
  console.log("NFT minted! Transaction confirmed:", receipt.hash);
  
  let itemId = null;
  // Use the contract's own interface to parse logs - cleaner than creating a new Interface instance
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "ItemRegistered") {
        itemId = parsed.args[0].toString(); // itemId is the first argument in the event
        console.log("NFT Token ID discovered from logs:", itemId);
        break;
      }
    } catch (e) {
      // Not an event from our contract or doesn't match ABI
    }
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: Number(receipt.blockNumber),
    itemId,
    message: "Item registered and NFT minted successfully!"
  };
};

export const getItem = async (itemId) => {
  try {
    const id = BigInt(itemId); // Use BigInt for uint256 compatibility
    
    if (id < 0n) { // Fixed: Allow ID 0
      throw new Error('Invalid item ID: ' + itemId);
    }

    // Call the getter from the smart contract
    const item = await contract.getItem(id);
    
    // Safety check: If the owner is the zero address, the item doesn't exist
    if (item[1] === ethers.ZeroAddress) {
        return null; 
    }
      console.log(item);
      
    return {
      itemId: item[0].toString(),
      owner: item[1],
      itemName: item[2],
      ipfsCID: item[3],
      status: statusMap[Number(item[4])] || 'Unknown',
      statusCode: Number(item[4]),
      finder: item[5],
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${item[3]}` // Using a faster gateway than ipfs.io if preferred
    };
    
  } catch (error) {
    console.error("Error fetching item:", error);
    // Rethrow with more context if needed
    throw error;
  }
}

export const markAsLost = async (itemId) => {
    const tx = await contract.markAsLost(itemId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, status: 'Lost' };
};

export const reportFound = async (itemId) => {
    const tx = await contract.reportFound(itemId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, status: 'Found' };
};

export const confirmReturn = async (itemId) => {
    const tx = await contract.confirmReturn(itemId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, status: 'Returned' };
};