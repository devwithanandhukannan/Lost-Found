// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ViewItem from './ViewItem';
import MakeLost from './MakeLost';
import RegisterItem from './RegisterItem';
import MyItems from './MyItems';
import Notifications from './Notifications';
import { connectMetaMaskLogic } from '../src/walletUtils.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import NotificationToast from '../components/Toast/NotificationToast.jsx';
import { useNotification } from '../hooks/useNotification';
import LostItems from './LostItems.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('my-products');
  const [reportFoundItemId, setReportFoundItemId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { notifications, addNotification, removeNotification } = useNotification();

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

  // Handle query parameters for report-found action
  useEffect(() => {
    const action = searchParams.get('action');
    const itemId = searchParams.get('itemId');
    
    if (action === 'report-found' && itemId) {
      setActiveTab('report-missing');
      setReportFoundItemId(itemId);
      // Clean up the URL
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto close sidebar on resize to desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const handleConnectWallet = async () => {
    try {
      await connectMetaMask();
      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: 'Successfully connected to MetaMask',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: error.message || 'Failed to connect wallet',
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowAccountDropdown(false);
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected',
    });
  };

  const handleSwitchAccount = (account) => {
    switchAccount(account);
    setShowAccountDropdown(false);
    addNotification({
      type: 'success',
      title: 'Account Switched',
      message: `Switched to ${account.slice(0, 6)}...${account.slice(-4)}`,
    });
  };

  const handleLogout = () => {
    disconnectWallet();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSidebarOpen(false);
    navigate('/login');
    addNotification({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been logged out successfully',
    });
  };

  const getPageTitle = () => {
    const titles = {
      'report-missing': 'Report Missing Item',
      'my-products': 'My Products',
      'all-missing': 'All Missing Items',
      'missing': 'Missing Products',
      'notifications': 'Notifications',
      'register': 'Register New Product',
      'status': 'Update Status',
    };
    return titles[activeTab] || 'Dashboard';
  };

  const getPageDescription = () => {
    const descriptions = {
      'report-missing': 'Report an item as lost and notify the community',
      'my-products': 'All your registered items',
      'missing': 'Items reported as lost',
      'all-missing': 'All items reported as lost by the community',
      'notifications': 'Found item reports',
      'register': 'Mint NFT ownership proof',
      'status': 'Manage item status',
    };
    return descriptions[activeTab] || 'Manage your blockchain items';
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Toast Notifications */}
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />

      {/* Sidebar - visible on desktop, toggleable on mobile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        userAcc={userAcc}
        onLogout={handleLogout}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200"
              >
                {sidebarOpen ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-black tracking-tight truncate">
                  {getPageTitle()}
                </h1>
                <p className="hidden sm:block text-sm text-gray-500 mt-1">
                  {getPageDescription()}
                </p>
              </div>
            </div>

            {/* Right Section - Wallet */}
            <div className="flex-shrink-0">
              {!userAcc ? (
                <button
                  onClick={handleConnectWallet}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-800 active:bg-gray-900 transition-all duration-200 shadow-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="1" fill="currentColor" />
                    <circle cx="15" cy="9" r="1" fill="currentColor" />
                  </svg>
                  <span className="hidden sm:inline">Connect</span>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-sm text-black hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 whitespace-nowrap"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="font-mono text-xs sm:text-sm hidden sm:inline">
                      {userAcc.slice(0, 6)}...{userAcc.slice(-4)}
                    </span>
                    <span className="font-mono text-xs sm:hidden">
                      {userAcc.slice(0, 4)}...
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        showAccountDropdown ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showAccountDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowAccountDropdown(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, y: -12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -12, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Connected Accounts
                            </span>
                          </div>

                          <div className="max-h-64 overflow-y-auto">
                            {allAccounts.map((acc, i) => (
                              <button
                                key={acc}
                                onClick={() => handleSwitchAccount(acc)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-0 ${
                                  acc === userAcc
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex flex-col items-start gap-1">
                                  <span className="font-medium">Account {i + 1}</span>
                                  <span className="text-xs font-mono text-gray-500">
                                    {acc.slice(0, 10)}...{acc.slice(-8)}
                                  </span>
                                </div>
                                {acc === userAcc && (
                                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>

                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleDisconnect}
                              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5m0 0l-5-5m5 5H9" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span>Disconnect Wallet</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {!userAcc ? (
            <div className="flex flex-col items-center justify-center px-4 py-24 lg:py-32 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-8"
              >
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h2 className="text-2xl sm:text-3xl font-semibold text-black mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-base text-gray-600 max-w-md mb-8 leading-relaxed">
                  Connect your MetaMask wallet to access your dashboard and manage your lost and found items securely on the blockchain.
                </p>
                
              </motion.div>
            </div>
          ) : (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'my-products' && (
                    <MyItems
                      userAcc={userAcc}
                      publicClient={publicClient}
                      contractAddress={contractAddress}
                      contractABI={contractABI}
                      addNotification={addNotification}
                    />
                  )}

                  {activeTab === 'missing' && (
                    <ViewItem
                      userAcc={userAcc}
                      publicClient={publicClient}
                      contractAddress={contractAddress}
                      contractABI={contractABI}
                      addNotification={addNotification}
                    />
                  )}

                  {activeTab === 'report-missing' && (
                    <MakeLost
                      userAcc={userAcc}
                      walletClient={walletClient}
                      publicClient={publicClient}
                      contractAddress={contractAddress}
                      contractABI={contractABI}
                      addNotification={addNotification}
                      initialItemId={reportFoundItemId}
                    />
                  )}

                  {activeTab === 'notifications' && (
                    <Notifications
                      addNotification={addNotification}
                    />
                  )}
                  {activeTab === 'all-missing' && (
                    <LostItems/>
                  )}

                  {activeTab === 'register' && (
                    <RegisterItem
                      userAcc={userAcc}
                      walletClient={walletClient}
                      publicClient={publicClient}
                      contractAddress={contractAddress}
                      contractABI={contractABI}
                      addNotification={addNotification}
                    />
                  )}

                  {activeTab === 'status' && (
                    <MakeLost
                      userAcc={userAcc}
                      walletClient={walletClient}
                      publicClient={publicClient}
                      contractAddress={contractAddress}
                      contractABI={contractABI}
                      addNotification={addNotification}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}