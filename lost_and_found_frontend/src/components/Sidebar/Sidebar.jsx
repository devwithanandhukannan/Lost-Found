// src/components/Sidebar/Sidebar.jsx
import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, userAcc, onLogout, isMobile }) => {
  const menuItems = [
    {
      id: 'my-products',
      label: 'My Products',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
     {
      id: 'report-missing',
      label: 'Report Missing',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'missing',
      label: 'My Missing Products',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4v.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'all-missing',
      label: 'All Missing Products',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4v.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'register',
      label: 'Register Product',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const handleMenuClick = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-gray-200 z-50 flex flex-col lg:relative lg:left-auto lg:top-auto lg:bottom-auto transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
              LF
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Lost & Found</h2>
              <p className="text-xs text-gray-600">Blockchain App</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 rounded px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Wallet Status & Footer */}
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Connected Wallet */}
          <div className="rounded bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Connected Wallet</p>
            {userAcc ? (
              <>
                <p className="text-xs font-mono text-black truncate">
                  {userAcc.slice(0, 10)}...{userAcc.slice(-8)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Connected
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-600">No wallet connected</p>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5m0 0l-5-5m5 5H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>

          {/* Powered By */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Powered by</p>
            <p className="text-xs font-bold text-black">KNZLE</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;