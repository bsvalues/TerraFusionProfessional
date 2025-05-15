import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Background component with light patterns for sections
 */
export const ContentBackdrop: React.FC<{
  children?: ReactNode;
  variant?: 'default' | 'subtle' | 'none' | 'glass';
  className?: string;
}> = ({ children, variant = 'default', className }) => {
  // Define different background patterns based on variant
  const getBackgroundPattern = () => {
    switch (variant) {
      case 'default':
        return 'bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm rounded-lg';
      case 'subtle':
        return 'bg-transparent';
      case 'glass':
        return 'bg-white/80 backdrop-blur-md border border-blue-50 shadow-[0_10px_20px_rgba(120,149,253,0.1)] rounded-xl';
      case 'none':
        return '';
      default:
        return 'bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm rounded-lg';
    }
  };

  return (
    <div
      className={cn(
        getBackgroundPattern(),
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Animated floating card component similar to landing page
 */
export const FloatingCard: React.FC<{
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down';
  duration?: number;
  icon?: React.ReactNode;
  title?: string;
  iconColor?: string;
}> = ({ 
  children, 
  className, 
  delay = 0, 
  direction = 'up', 
  duration = 4, 
  icon, 
  title,
  iconColor = 'blue'
}) => {
  return (
    <motion.div 
      className={cn(
        "bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-[0_10px_20px_rgba(120,149,253,0.2)] border border-blue-50",
        className
      )}
      animate={{ y: direction === 'up' ? [0, -10, 0] : [0, 10, 0] }}
      transition={{ 
        duration: duration, 
        repeat: Infinity, 
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay
      }}
    >
      {(icon || title) && (
        <div className="flex items-center mb-2">
          {icon && (
            <div className={`p-2 bg-${iconColor}-100 rounded-lg mr-3`}>
              <div className={`h-5 w-5 text-${iconColor}-600`}>{icon}</div>
            </div>
          )}
          {title && <h3 className={`text-${iconColor}-900 font-medium`}>{title}</h3>}
        </div>
      )}
      {children}
    </motion.div>
  );
};

/**
 * Animated gradient section divider
 */
export const GradientDivider: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn("relative h-px w-full my-8", className)}>
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        initial={{ opacity: 0, width: "0%" }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ duration: 1.5 }}
      />
    </div>
  );
};

/**
 * Adaptive background for the entire application with creative elements
 */
export const AdaptiveBackground: React.FC<{
  children: ReactNode;
  className?: string;
  simplified?: boolean;
}> = ({ children, className, simplified = false }) => {
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-b from-[#f8faff] to-[#e6eeff] text-[#111827] relative overflow-hidden',
        className
      )}
    >
      {/* Dynamic Background Elements - similar to landing page but subtler */}
      {!simplified && (
        <>
          {/* Background base */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4ff] via-white to-[#f0f4ff] z-0" />
          
          {/* Glowing orbs - subtle version */}
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-400 rounded-full blur-[120px] opacity-10 z-0" />
          <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] bg-purple-300 rounded-full blur-[100px] opacity-10 z-0" />
          
          {/* Radial gradient for depth effect */}
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.9)_100%)]" />
          
          {/* Animated Lines - subtler version */}
          <div className="absolute inset-0 z-0 opacity-10">
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(96, 165, 250, 0)" />
                  <stop offset="50%" stopColor="rgba(96, 165, 250, 0.3)" />
                  <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 0,100 Q 250,180 500,100 T 1000,100"
                stroke="url(#line-gradient)"
                strokeWidth={1}
                fill="transparent"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <motion.path
                d="M 0,200 Q 250,280 500,200 T 1000,200"
                stroke="url(#line-gradient)"
                strokeWidth={1}
                fill="transparent"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.7 }}
              />
            </svg>
          </div>
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};