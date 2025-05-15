import React from 'react';
import { Button } from '@/components/ui/button';
import { PropertyFilterState } from '@/contexts/PropertyFilterContext';
import { Tooltip } from '@/components/ui/custom-tooltip';

export interface QuickFilter {
  id: string;
  name: string;
  description: string;
  filter: Partial<PropertyFilterState>;
}

interface QuickFilterButtonProps {
  filter: QuickFilter;
  onClick: (filter: Partial<PropertyFilterState>) => void;
  disabled?: boolean;
  variant?: 'outline' | 'secondary' | 'ghost';
  active?: boolean;
}

export const QuickFilterButton: React.FC<QuickFilterButtonProps> = ({
  filter,
  onClick,
  disabled = false,
  variant = 'outline',
  active = false
}) => {
  const handleClick = () => {
    onClick(filter.filter);
  };
  
  return (
    <Tooltip
      content={filter.description}
      delay={300}
    >
      <Button
        variant={active ? 'default' : variant}
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className={active ? 'font-semibold' : 'font-normal'}
        aria-pressed={active}
      >
        {filter.name}
      </Button>
    </Tooltip>
  );
};

export default QuickFilterButton;