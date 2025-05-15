import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InteractiveMetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  linkTo?: string;
  onClick?: () => void;
  className?: string;
  cardColor?: 'primary' | 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'default';
}

export const InteractiveMetricCard: React.FC<InteractiveMetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  linkTo,
  onClick,
  className,
  cardColor = 'default'
}) => {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
      // After running onClick handler, check if we should navigate
      if (linkTo) {
        setTimeout(() => {
          navigate(linkTo);
        }, 300);
      }
    } else if (linkTo) {
      navigate(linkTo);
    }
  };

  const colorClasses = {
    primary: {
      icon: 'bg-primary/10 text-primary',
      trend: {
        up: 'text-primary',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-primary/30 hover:bg-primary/5'
    },
    blue: {
      icon: 'bg-blue-100 text-blue-600',
      trend: {
        up: 'text-blue-600',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-blue-300 hover:bg-blue-50'
    },
    green: {
      icon: 'bg-green-100 text-green-600',
      trend: {
        up: 'text-green-600',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-green-300 hover:bg-green-50'
    },
    purple: {
      icon: 'bg-purple-100 text-purple-600',
      trend: {
        up: 'text-purple-600',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-purple-300 hover:bg-purple-50'
    },
    yellow: {
      icon: 'bg-amber-100 text-amber-600',
      trend: {
        up: 'text-amber-600',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-amber-300 hover:bg-amber-50'
    },
    red: {
      icon: 'bg-red-100 text-red-600',
      trend: {
        up: 'text-green-600',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-red-300 hover:bg-red-50'
    },
    default: {
      icon: 'bg-gray-100 text-gray-700',
      trend: {
        up: 'text-green-600',
        down: 'text-red-500',
        neutral: 'text-gray-500'
      },
      hover: 'hover:border-gray-300 hover:bg-gray-50'
    }
  };

  const trendIcon = trend?.direction === 'up' ? (
    <TrendingUp className="h-3 w-3 mr-1" />
  ) : trend?.direction === 'down' ? (
    <TrendingDown className="h-3 w-3 mr-1" />
  ) : null;

  const trendColor = trend 
    ? colorClasses[cardColor].trend[trend.direction] 
    : '';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "border transition-all duration-200 cursor-pointer overflow-hidden",
          colorClasses[cardColor].hover,
          className
        )}
        onClick={handleClick}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className={cn("p-2 rounded-md", colorClasses[cardColor].icon)}>
              {icon}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4 pt-0 px-4">
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">{value}</div>
            
            {trend && (
              <div className={cn("ml-2 text-xs font-medium flex items-center", trendColor)}>
                {trendIcon}
                {trend.value}
                {trend.label && <span className="ml-1">{trend.label}</span>}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">{description}</p>
            
            {(onClick || linkTo) && (
              <div className="flex items-center text-xs text-primary font-medium">
                <span className="mr-1">Details</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};