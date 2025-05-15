import React from 'react';
import { Property } from '../../shared/schema';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface FindSimilarPropertiesButtonProps {
  property: Property;
  count?: number;
  onFindSimilar: (property: Property, count: number) => void;
  className?: string;
}

export const FindSimilarPropertiesButton: React.FC<FindSimilarPropertiesButtonProps> = ({
  property,
  count = 5,
  onFindSimilar,
  className
}) => {
  return (
    <Button 
      className={`w-full ${className}`}
      onClick={() => onFindSimilar(property, count)}
    >
      <Search className="mr-2 h-4 w-4" />
      Find {count} Similar Properties
    </Button>
  );
};