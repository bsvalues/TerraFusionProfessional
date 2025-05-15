import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: number | string;
  title: string;
  time: string;
  user?: string;
  icon?: React.ReactNode;
  status?: 'pending' | 'completed' | 'failed';
  detailsLink?: string;
}

interface InteractiveActivityCardProps {
  item: ActivityItem;
  onClick?: () => void;
  className?: string;
}

export const InteractiveActivityCard: React.FC<InteractiveActivityCardProps> = ({
  item,
  onClick,
  className
}) => {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (item.detailsLink) {
      navigate(item.detailsLink);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -2, 
        backgroundColor: 'rgba(249, 250, 251, 1)',
        transition: { duration: 0.2 }
      }}
      className={cn(
        "flex items-start p-4 border-b last:border-0 transition-all cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {item.icon && (
        <div className="mr-3 flex-shrink-0">
          {item.icon}
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            
            <div className="flex items-center mt-1">
              <p className="text-xs text-gray-500">{item.time}</p>
              
              {item.user && (
                <>
                  <span className="mx-1 text-gray-300">•</span>
                  <p className="text-xs text-gray-500">By {item.user}</p>
                </>
              )}
              
              {item.status && (
                <>
                  <span className="mx-1 text-gray-300">•</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    statusColors[item.status]
                  )}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {(onClick || item.detailsLink) && (
            <motion.div 
              className="text-primary rounded-full p-1.5 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }}
            >
              <ArrowRight className="h-3 w-3" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};