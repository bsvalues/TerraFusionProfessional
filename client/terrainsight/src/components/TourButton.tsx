import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { useTour } from '@/contexts/TourContext';

interface TourButtonProps extends ButtonProps {
  showTooltip?: boolean;
  tooltipContent?: string;
}

export const TourButton: React.FC<TourButtonProps> = ({
  showTooltip = false,
  tooltipContent = 'Start tour',
  ...props
}) => {
  const { startTour, hasSeenTour } = useTour();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startTour();
  };

  const button = (
    <Button 
      onClick={handleClick}
      variant={props.variant || 'ghost'} 
      size={props.size} 
      className={props.className}
    >
      {props.children || <HelpCircle className={props.size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />}
    </Button>
  );

  if (showTooltip) {
    return (
      <Tooltip content={tooltipContent}>
        {button}
      </Tooltip>
    );
  }

  return button;
};