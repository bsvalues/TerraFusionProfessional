import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary/70', sizeClasses[size])} />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text = 'Loading...',
  className,
  spinnerSize = 'md',
  transparent = false
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn('relative min-h-[100px]', className)}>
      <div className={cn(
        'absolute inset-0 flex flex-col items-center justify-center z-50',
        transparent ? 'bg-background/80' : 'bg-background'
      )}>
        <LoadingSpinner size={spinnerSize} text={text} />
      </div>
      <div className="opacity-0 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText,
  children,
  className,
  disabled = false,
  variant = 'default',
  size = 'default',
  onClick,
  type = 'button'
}) => {
  // We'll reuse the Button component here and handle the loading state
  const { Button } = require('@/components/ui/button');
  
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

interface LoadingPlaceholderProps {
  className?: string;
  lines?: number;
  animate?: boolean;
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
  className,
  lines = 3,
  animate = true
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'h-4 bg-muted rounded-md',
            animate && 'animate-pulse',
            i === 0 && 'w-3/4',
            i === lines - 1 && 'w-1/2'
          )} 
        />
      ))}
    </div>
  );
};

interface LoadingStateProps {
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  spinnerSize?: 'sm' | 'md' | 'lg';
  loadingText?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  spinnerSize = 'md',
  loadingText = 'Loading...',
  minHeight = '200px'
}) => {
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className={cn('flex items-center justify-center', `min-h-[${minHeight}]`)}>
        <LoadingSpinner size={spinnerSize} text={loadingText} />
      </div>
    );
  }
  
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    // Import Alert components
    const { Alert, AlertTitle, AlertDescription } = require('@/components/ui/alert');
    const { AlertTriangle } = require('lucide-react');
    
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'An unexpected error occurred'}
        </AlertDescription>
      </Alert>
    );
  }
  
  return <>{children}</>;
};

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'default';
  text?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  isLoading = false,
  className,
  size = 'default',
  text = 'Refresh'
}) => {
  // Import Button component
  const { Button } = require('@/components/ui/button');
  
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={isLoading}
      className={className}
    >
      <RefreshCw className={cn(
        "h-4 w-4 mr-2",
        isLoading && "animate-spin"
      )} />
      {text}
    </Button>
  );
};

export default {
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  LoadingPlaceholder,
  LoadingState,
  RefreshButton
};