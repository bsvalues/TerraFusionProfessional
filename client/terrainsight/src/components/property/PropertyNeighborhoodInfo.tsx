import React from 'react';
import { Property } from '@/shared/types';
import { NeighborhoodPopover } from '../neighborhood/NeighborhoodPopover';
import { Button } from '@/components/ui/button';
import { MapPin, Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeighborhoodInsightsDialog } from '../neighborhood/NeighborhoodInsightsDialog';

interface PropertyNeighborhoodInfoProps {
  property: Property;
  variant?: 'button' | 'badge' | 'inline' | 'card';
  className?: string;
}

/**
 * Component that provides neighborhood information access for a property
 * Can be displayed in various formats based on the variant prop
 */
export function PropertyNeighborhoodInfo({
  property,
  variant = 'button',
  className = ''
}: PropertyNeighborhoodInfoProps) {
  // For badge or minimal variants
  if (variant === 'badge') {
    return (
      <NeighborhoodPopover property={property}>
        <Badge 
          variant="outline" 
          className={`cursor-pointer hover:bg-accent flex items-center gap-1 ${className}`}
        >
          <MapPin className="h-3 w-3" />
          Neighborhood
        </Badge>
      </NeighborhoodPopover>
    );
  }

  // For inline display (typically in a property card or table)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center ${className}`}>
        <NeighborhoodPopover property={property}>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 p-1 h-auto">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">Neighborhood Info</span>
          </Button>
        </NeighborhoodPopover>
      </div>
    );
  }

  // For card display (more detailed)
  if (variant === 'card') {
    return (
      <Card className={`shadow-sm ${className}`}>
        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Map className="h-4 w-4 text-primary" />
              Neighborhood
            </h3>
            <NeighborhoodInsightsDialog property={property}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                View Details
              </Button>
            </NeighborhoodInsightsDialog>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Click to explore neighborhood statistics and demographics for this property.
          </p>
          <div className="flex justify-end">
            <NeighborhoodPopover property={property}>
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />
                Quick View
              </Button>
            </NeighborhoodPopover>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default is button variant
  return (
    <NeighborhoodPopover property={property}>
      <Button 
        variant="outline" 
        size="sm" 
        className={`gap-1 ${className}`}
      >
        <MapPin className="h-4 w-4" />
        Neighborhood Insights
      </Button>
    </NeighborhoodPopover>
  );
}

export default PropertyNeighborhoodInfo;