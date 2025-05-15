import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { motion } from 'framer-motion';

interface TourGuideButtonProps {
  onClick: () => void;
  className?: string;
  pulsing?: boolean;
}

/**
 * A button component that triggers a guided tour of the application
 */
export const TourGuideButton: React.FC<TourGuideButtonProps> = ({ 
  onClick, 
  className = '',
  pulsing = false
}) => {
  return (
    <Tooltip 
      content="Start guided tour"
      placement="bottom"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative ${className}`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="text-white hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Start guided tour"
        >
          <HelpCircle size={20} />
        </Button>
        
        {pulsing && (
          <motion.div
            initial={{ opacity: 0.7, scale: 0.9 }}
            animate={{ 
              opacity: [0.7, 0.4, 0.7], 
              scale: [0.9, 1.2, 0.9] 
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="absolute inset-0 rounded-full bg-white/20 -z-10"
          />
        )}
      </motion.div>
    </Tooltip>
  );
};

export default TourGuideButton;