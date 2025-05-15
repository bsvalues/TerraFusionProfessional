import React from 'react';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  fullWidth?: boolean;
}

/**
 * ContentContainer that adapts based on application mode
 * Creates a responsive and adaptive container for content
 */
export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className,
  padded = true,
  fullWidth = false,
}) => {
  const { isIntegrated, config } = useAppMode();
  
  const containerClasses = cn(
    'relative',
    padded && 'p-4 sm:p-6',
    !fullWidth && 'max-w-7xl mx-auto',
    // Apply different styling based on app mode
    isIntegrated && 'border-0',
    !isIntegrated && 'rounded-lg',
    className
  );
  
  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};