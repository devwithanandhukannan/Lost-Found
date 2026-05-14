// src/components/Dashboard.jsx
import React, { useState } from "react";
import ViewItem from "../pages/ViewItem";
import MakeLost from "../pages/MakeLost";
import RegisterItem from "../pages/RegisterItem";
import { connectMetaMaskLogic } from "../src/walletUtils.js";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("register");

  const {
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
    contractABI,
  } = connectMetaMaskLogic();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">Lost & Found NFT</h1>
          <span className="px-3 py-1 text-xs font-medium bg-white/10 rounded-lg">Hoodi Testnet</span>
        </div>

        <div>
          {!userAcc ? (
            <button
              onClick={connectMetaMask}
              className="px-6 py-3 font-semibold text-black bg-white rounded-xl hover:bg-gray-200 transition"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="font-mono text-sm">
                  {userAcc.slice(0, 6)}...{userAcc.slice(-4)}
                </span>
                <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {allAccounts.map((acc, i) => (
                    <div
                      key={acc}
                      onClick={() => switchAccount(acc)}
                      className={`flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-zinc-800 transition ${
                        acc === userAcc ? "bg-blue-600" : ""
                      }`}
                    >
                      <span className="text-sm">Account {i + 1}</span>
                      <span className="font-mono text-xs">
                        {acc.slice(0, 10)}...{acc.slice(-8)}
                      </span>
                    </div>
                  ))}
                  <div
                    onClick={disconnectWallet}
                    className="px-4 py-3 text-center text-red-500 font-medium border-t border-zinc-800 hover:bg-red-950/30 cursor-pointer transition"
                  >
                    Disconnect
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl w-fit mb-10">
          <button
            onClick={() => setActiveTab("register")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "register"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Register Item
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "view" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            View Items
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "status" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Update Status
          </button>
        </div>

        {/* Content */}
        <div className="min-h-screen">
          {activeTab === "register" && userAcc && (
            <RegisterItem
              userAcc={userAcc}
              walletClient={walletClient}
              publicClient={publicClient}
              contractAddress={contractAddress}
              contractABI={contractABI}
            />
          )}

          {activeTab === "view" && userAcc && (
            <ViewItem
              userAcc={userAcc}
              publicClient={publicClient}
              contractAddress={contractAddress}
              contractABI={contractABI}
            />
          )}

          {activeTab === "status" && userAcc && (
            <MakeLost
              userAcc={userAcc}
              walletClient={walletClient}
              publicClient={publicClient}
              contractAddress={contractAddress}
              contractABI={contractABI}
            />
          )}

          {!userAcc && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="text-6xl mb-6">🔒</div>
              <h3 className="text-2xl font-semibold mb-3">Connect your wallet to continue</h3>
              <p className="text-gray-500 max-w-md">
                Please connect MetaMask to register lost items, view your items, or update status.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}