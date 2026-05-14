// src/utils/walletUtils.js
import { useState } from 'react';
import { createWalletClient, createPublicClient, custom, parseAbi } from 'viem';
import { hoodi } from 'viem/chains';
import { contractABI } from '../contractABI.js'; // Adjust path if needed

const contractAddress = '0x0769304eA14C77933b1252BD33AB54D8FBD2B7E6';

export function connectMetaMaskLogic() {
  const [userAcc, setUserAcc] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [walletClient, setWalletClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      alert('MetaMask not installed. Please install MetaMask extension.');
      return;
    }

    try {
      const wallet = createWalletClient({
        chain: hoodi,
        transport: custom(window.ethereum)
      });

      const publicCli = createPublicClient({
        chain: hoodi,
        transport: custom(window.ethereum)
      });

      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      const addresses = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });

      if (addresses.length === 0) {
        alert('No accounts found. Please connect in MetaMask.');
        return;
      }

      setAllAccounts(addresses);
      setUserAcc(addresses[0]);
      setWalletClient(wallet);
      setPublicClient(publicCli);
      setShowAccountDropdown(false);

      // Account & Network Listeners
      window.ethereum.on('accountsChanged', (newAddresses) => {
        if (newAddresses.length === 0) {
          disconnectWallet();
        } else {
          setAllAccounts(newAddresses);
          setUserAcc(newAddresses[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (err) {
      console.error('MetaMask connection error:', err);
      alert('Failed to connect MetaMask. See console for details.');
    }
  };

  const switchAccount = (account) => {
    setUserAcc(account);
    setShowAccountDropdown(false);
  };

  const disconnectWallet = () => {
    setUserAcc("");
    setAllAccounts([]);
    setWalletClient(null);
    setPublicClient(null);
    setShowAccountDropdown(false);
  };

  return {
    userAcc,
    allAccounts,
    showAccountDropdown,
    setShowAccountDropdown,
    connectMetaMask,
    switchAccount,
    disconnectWallet,
    walletClient,
    publicClient,
    contractAddress,
    contractABI
  };
}