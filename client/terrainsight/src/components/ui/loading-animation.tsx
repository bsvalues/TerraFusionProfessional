import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Database, FileText, Filter, BarChart2 } from 'lucide-react';

export type AnimationType = 
  | 'default' 
  | 'data-loading' 
  | 'extracting' 
  | 'transforming' 
  | 'loading' 
  | 'filtering' 
  | 'analyzing';

interface LoadingAnimationProps {
  type?: AnimationType;
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  loop?: boolean;
  customColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
}

/**
 * Component that displays playful loading animations for different ETL operations
 */
export function LoadingAnimation({
  type = 'default',
  text,
  className,
  size = 'md',
  showText = true,
  loop = true,
  customColors
}: LoadingAnimationProps) {
  const sizeClass = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const containerClass = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  const getMessage = (): string => {
    if (text) return text;
    
    switch (type) {
      case 'data-loading':
        return 'Loading data...';
      case 'extracting':
        return 'Extracting data...';
      case 'transforming':
        return 'Transforming data...';
      case 'loading':
        return 'Loading...';
      case 'filtering':
        return 'Filtering records...';
      case 'analyzing':
        return 'Analyzing data...';
      default:
        return 'Processing...';
    }
  };

  const renderAnimation = () => {
    // Set default animation props
    const infinite = loop ? { repeat: Infinity } : {};
    const colors = {
      primary: customColors?.primary || 'currentColor',
      secondary: customColors?.secondary || 'currentColor',
      background: customColors?.background || 'transparent'
    };
    
    switch (type) {
      case 'data-loading':
        return (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ...infinite, ease: "easeInOut" }}
            className="relative"
          >
            <Database className={sizeClass[size]} />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 1, ...infinite, ease: "easeOut" }}
            >
              <div className="h-1 w-1 rounded-full bg-primary"></div>
            </motion.div>
          </motion.div>
        );
        
      case 'extracting':
        return (
          <motion.div className="relative">
            <FileText className={sizeClass[size]} />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-primary"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 2, ...infinite, ease: "easeInOut" }}
              style={{ opacity: 0.3 }}
            />
          </motion.div>
        );
        
      case 'transforming':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ...infinite, ease: "linear" }}
          >
            <RefreshCw className={sizeClass[size]} />
          </motion.div>
        );
        
      case 'filtering':
        return (
          <div className="relative">
            <Filter className={sizeClass[size]} />
            <motion.div
              className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ...infinite, ease: "easeInOut" }}
            />
          </div>
        );
        
      case 'analyzing':
        return (
          <div className="relative">
            <BarChart2 className={sizeClass[size]} />
            <motion.div className="absolute bottom-0 left-0 w-full flex justify-between items-end">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-t-sm mx-[1px]"
                  initial={{ height: 0 }}
                  animate={{ height: [0, 10 * i, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    ...infinite, 
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </div>
        );
      
      case 'loading':
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, ...infinite, ease: "linear" }}
          >
            <Loader2 className={sizeClass[size]} />
          </motion.div>
        );
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", containerClass[size], className)}>
      {renderAnimation()}
      {showText && <p className={cn("text-center font-medium", textSizeClass[size])}>{getMessage()}</p>}
    </div>
  );
}