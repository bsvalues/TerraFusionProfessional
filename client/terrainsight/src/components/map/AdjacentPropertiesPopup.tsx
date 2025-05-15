import React from 'react';
import { Property } from '@shared/schema';
import { formatCurrency, parseNumericValue } from '@/lib/utils';
import { 
  AdjacentPropertyResult, 
  formatDistance 
} from '@/services/comparison/adjacentPropertiesService';
import { Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';

interface AdjacentPropertiesPopupProps {
  adjacentProperties: AdjacentPropertyResult[];
  onPropertySelect: (property: Property) => void;
  className?: string;
}

/**
 * A popup component that displays adjacent properties with comparison information
 */
export const AdjacentPropertiesPopup: React.FC<AdjacentPropertiesPopupProps> = ({
  adjacentProperties,
  onPropertySelect,
  className
}) => {
  const { mode } = useAppMode();
  const isStandalone = mode === 'standalone';

  // If no adjacent properties, show a message
  if (!adjacentProperties.length) {
    return (
      <div className={cn(
        "p-2 text-sm", 
        isStandalone ? "text-gray-700" : "text-gray-500",
        className
      )}>
        No adjacent properties found
      </div>
    );
  }

  // Helper function to extract numeric value from property value
  const getNumericValue = (property: Property): number => {
    if (!property.value) return 0;
    return parseNumericValue(property.value);
  };

  return (
    <div className={cn(
      "w-full max-w-xs overflow-hidden rounded",
      isStandalone ? "bg-white text-gray-800" : "bg-gray-900 text-gray-200",
      className
    )}>
      <div className={cn(
        "px-3 py-2 font-medium text-sm flex items-center",
        isStandalone ? "bg-gray-100" : "bg-gray-800"
      )}>
        <Compass className="h-4 w-4 mr-1.5" />
        Adjacent Properties
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
        {adjacentProperties.map((result) => {
          const { property, distanceKm, direction } = result;
          
          return (
            <div 
              key={property.id} 
              className={cn(
                "p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm transition-colors",
                isStandalone ? "hover:bg-gray-100" : "hover:bg-gray-800"
              )}
              onClick={() => onPropertySelect(property)}
            >
              <div className="font-medium">{property.address}</div>
              
              <div className="grid grid-cols-2 gap-x-2 mt-1 text-xs">
                <div className={isStandalone ? "text-gray-600" : "text-gray-400"}>
                  {formatCurrency(getNumericValue(property))}
                </div>
                <div className="flex items-center justify-end">
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs",
                    isStandalone ? "bg-blue-100 text-blue-700" : "bg-blue-900 text-blue-300"
                  )}>
                    {formatDistance(distanceKm)} {direction && `${direction}`}
                  </span>
                </div>
              </div>

              {property.squareFeet && (
                <div className="text-xs mt-0.5">
                  <span className={isStandalone ? "text-gray-500" : "text-gray-400"}>
                    {property.squareFeet.toLocaleString()} sqft
                    {property.yearBuilt && ` • Built ${property.yearBuilt}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className={cn(
        "px-3 py-1.5 text-xs flex justify-between",
        isStandalone ? "bg-gray-50" : "bg-gray-800"
      )}>
        <span>Showing {adjacentProperties.length} adjacent properties</span>
        <button 
          className={cn(
            "inline-flex items-center font-medium",
            isStandalone ? "text-blue-600 hover:text-blue-800" : "text-blue-400 hover:text-blue-300"
          )}
          onClick={(e) => {
            e.stopPropagation();
            // Navigate to a comparison page or open comparison dialog
            // This would be implemented based on the app's navigation structure
          }}
        >
          Compare All
          <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default AdjacentPropertiesPopup;