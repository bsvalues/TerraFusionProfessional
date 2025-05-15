import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification, NotificationType } from '@/contexts/NotificationContext';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
  autoClose?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getBorder = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'border-l-emerald-500';
    case 'error':
      return 'border-l-destructive';
    case 'warning':
      return 'border-l-amber-500';
    case 'info':
    default:
      return 'border-l-blue-500';
  }
};

const Toast: React.FC<ToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  position = 'top-right',
  className
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);
  
  const icon = getIcon(notification.type);
  const borderClass = getBorder(notification.type);
  
  // Animate exit
  const handleClose = () => {
    setIsExiting(true);
    
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };
  
  // Timer for auto-close
  useEffect(() => {
    if (autoClose && notification.duration) {
      // Set up progress bar animation
      const interval = setInterval(() => {
        const elapsedTime = 20; // Update every 20ms
        const progress = (prevWidth: number) => {
          const newWidth = prevWidth - (elapsedTime / notification.duration!) * 100;
          return newWidth < 0 ? 0 : newWidth;
        };
        
        setProgressWidth(progress);
      }, 20);
      
      // Set up timeout for auto-close
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
    
    return undefined;
  }, [notification, autoClose, handleClose]);
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  return (
    <div 
      className={cn(
        'fixed max-w-sm w-full bg-card shadow-lg rounded-lg border-l-4 overflow-hidden',
        positionClasses[position],
        borderClass,
        isExiting ? 'animate-toast-exit' : 'animate-toast-enter',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="relative">
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-3">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{notification.title}</h3>
            <div className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </div>
            
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium text-primary hover:underline"
                type="button"
              >
                {notification.action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground"
            aria-label="Close"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {autoClose && notification.duration && (
          <div className="h-1 bg-muted">
            <div
              className={cn(
                'h-full',
                notification.type === 'success' ? 'bg-emerald-500' :
                notification.type === 'error' ? 'bg-destructive' :
                notification.type === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              )}
              style={{ width: `${progressWidth}%`, transition: 'width 20ms linear' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;