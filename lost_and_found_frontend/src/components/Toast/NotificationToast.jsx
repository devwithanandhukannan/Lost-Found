import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationToast = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, notification.duration || 4000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (notification.type) {
      case 'success':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none">
            <path d="M9 12.5L11 14.5L15 10.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64149 19.6871 1.81442 19.9905C1.98735 20.2939 2.23672 20.5467 2.53771 20.7239C2.83869 20.901 3.18079 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.901 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none">
            <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-white',
          icon: 'text-green-600',
          border: 'border-green-200',
          titleColor: 'text-black',
          messageColor: 'text-gray-600',
          progress: 'bg-green-500',
        };
      case 'error':
        return {
          bg: 'bg-white',
          icon: 'text-red-600',
          border: 'border-red-200',
          titleColor: 'text-black',
          messageColor: 'text-gray-600',
          progress: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-white',
          icon: 'text-amber-600',
          border: 'border-amber-200',
          titleColor: 'text-black',
          messageColor: 'text-gray-600',
          progress: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-white',
          icon: 'text-blue-600',
          border: 'border-blue-200',
          titleColor: 'text-black',
          messageColor: 'text-gray-600',
          progress: 'bg-blue-500',
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
      className="pointer-events-auto"
    >
      <div className={`${styles.bg} border ${styles.border} rounded-lg shadow-lg p-4 backdrop-blur-sm relative overflow-hidden`}>
        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: notification.duration || 4, ease: 'linear' }}
          className={`absolute bottom-0 left-0 right-0 h-1 ${styles.progress} origin-left`}
        />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className={`text-sm font-semibold ${styles.titleColor} mb-0.5`}>
                {notification.title}
              </p>
            )}
            {notification.message && (
              <p className={`text-sm ${styles.messageColor} line-clamp-2`}>
                {notification.message}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationToast;
