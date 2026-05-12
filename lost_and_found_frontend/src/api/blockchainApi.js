const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const registerItem = async (itemName, ipfsCID) => {
  const response = await fetch(`${API_BASE_URL}/blockchain/register-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemName, ipfsCID })
  });

  if (!response.ok) {
    throw new Error('Failed to register item');
  }

  return await response.json();
};

export const getItem = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/blockchain/item/${itemId}`);

  if (!response.ok) {
    throw new Error('Failed to get item');
  }

  const data = await response.json();
  
  // ✅ Return data directly, not data.data
  return data;
};

export const markAsLost = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/blockchain/mark-lost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId })
  });

  if (!response.ok) {
    throw new Error('Failed to mark as lost');
  }

  return await response.json();
};

export const reportFound = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/blockchain/report-found`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId })
  });

  if (!response.ok) {
    throw new Error('Failed to report found');
  }

  return await response.json();
};

export const confirmReturn = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/blockchain/confirm-return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId })
  });

  if (!response.ok) {
    throw new Error('Failed to confirm return');
  }

  return await response.json();
};

export const getContractInfo = async () => {
  const response = await fetch(`${API_BASE_URL}/blockchain/contract-info`);

  if (!response.ok) {
    throw new Error('Failed to get contract info');
  }

  return await response.json();
};

export const uploadToIPFS = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/ipfs/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS');
  }

  return await response.json();
};

export const uploadMetadataToIPFS = async (metadata) => {
  const response = await fetch(`${API_BASE_URL}/ipfs/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw new Error('Failed to upload metadata');
  }

  return await response.json();
};