import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PropertyTypeFilterProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
  disabled?: boolean;
}

// Define the property types
const PROPERTY_TYPES = [
  { id: 'residential', label: 'Residential', description: 'Single-family homes, condos, apartments' },
  { id: 'commercial', label: 'Commercial', description: 'Office buildings, retail spaces, restaurants' },
  { id: 'industrial', label: 'Industrial', description: 'Warehouses, manufacturing facilities' },
  { id: 'agricultural', label: 'Agricultural', description: 'Farm land, ranches, orchards' }
];

export const PropertyTypeFilter: React.FC<PropertyTypeFilterProps> = ({ 
  selectedTypes, 
  onChange, 
  disabled = false 
}) => {
  // Handle checkbox change
  const handleChange = (typeId: string, checked: boolean) => {
    if (checked) {
      // Add the type if it's checked
      onChange([...selectedTypes, typeId]);
    } else {
      // Remove the type if it's unchecked
      onChange(selectedTypes.filter(id => id !== typeId));
    }
  };
  
  return (
    <div className="space-y-3" data-testid="property-type-filter">
      <div className="font-medium text-sm">Property Type</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PROPERTY_TYPES.map(({ id, label, description }) => (
          <div key={id} className="flex items-start space-x-2">
            <Checkbox
              id={`property-type-${id}`}
              checked={selectedTypes.includes(id)}
              onCheckedChange={(checked) => 
                handleChange(id, checked as boolean)
              }
              disabled={disabled}
              aria-label={`${label} property type`}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`property-type-${id}`}
                className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}
              >
                {label}
              </Label>
              <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyTypeFilter;