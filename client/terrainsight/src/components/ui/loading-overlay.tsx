import React from 'react';
import { motion } from 'framer-motion';
import { LoadingAnimation, AnimationType } from './loading-animation';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  type?: AnimationType;
  blur?: boolean;
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showSpinner?: boolean;
}

/**
 * A loading overlay component that can be used to wrap content
 * Shows a loading animation on top of the content when isLoading is true
 */
export function LoadingOverlay({
  isLoading,
  text,
  type = 'default',
  blur = true,
  className,
  children,
  size = 'md',
  showSpinner = true
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            blur ? "backdrop-blur-sm bg-background/60" : "bg-background/80",
            "z-50"
          )}
        >
          {showSpinner && (
            <LoadingAnimation 
              type={type} 
              text={text} 
              size={size}
              showText={!!text}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}