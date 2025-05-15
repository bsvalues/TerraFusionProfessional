import React from 'react';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface AppModeIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppModeIndicator: React.FC<AppModeIndicatorProps> = ({ 
  size = 'md',
  className 
}) => {
  const { isStandalone, config } = useAppMode();
  
  // Determine styles based on size
  const getStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      case 'md':
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        getStyles(),
        "rounded-full border-green-200 bg-green-50 text-green-800 hover:bg-green-50 hover:text-green-800 flex items-center gap-1",
        className
      )}
    >
      <CheckCircle className="h-3 w-3 fill-green-500 text-white" />
      <span>Standalone Mode</span>
    </Badge>
  );
};