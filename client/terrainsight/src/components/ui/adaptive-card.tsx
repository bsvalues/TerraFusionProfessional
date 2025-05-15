import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';

type CardProps = React.ComponentPropsWithoutRef<typeof Card>;

/**
 * AdaptiveCard adapts card styling based on application mode
 * - In standalone mode, uses enhanced shadow and border styling
 * - In integrated mode, uses more subtle styling to blend with parent systems
 */
export const AdaptiveCard: React.FC<CardProps> = ({ 
  children, 
  className,
  ...props
}) => {
  const { isIntegrated, config } = useAppMode();
  
  const cardClasses = cn(
    className,
    isIntegrated && 'shadow-sm border-gray-100',
    !isIntegrated && 'shadow-md hover:shadow-lg transition-shadow'
  );
  
  return (
    <Card className={cardClasses} {...props}>
      {children}
    </Card>
  );
};