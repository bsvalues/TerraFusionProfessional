import React from 'react';
import { Property } from '@/shared/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MapPinIcon, Info, Compass, Home, Building, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NeighborhoodInsightsDialog from './NeighborhoodInsightsDialog';
import { useNeighborhood } from './NeighborhoodContext';

interface NeighborhoodPopoverProps {
  property: Property;
  children: React.ReactNode;
}

export function NeighborhoodPopover({ property, children }: NeighborhoodPopoverProps) {
  const { loadNeighborhoodData, currentNeighborhoodData, isLoading } = useNeighborhood();
  const [open, setOpen] = React.useState(false);

  // Load neighborhood data when popover opens
  React.useEffect(() => {
    if (open && !currentNeighborhoodData) {
      loadNeighborhoodData(property).catch(console.error);
    }
  }, [open, property, currentNeighborhoodData, loadNeighborhoodData]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        {isLoading ? (
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <p>Loading neighborhood data...</p>
            </div>
          </Card>
        ) : currentNeighborhoodData ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Compass className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium text-base">{currentNeighborhoodData.name}</h3>
                </div>
                <Badge variant="outline">{currentNeighborhoodData.overview.type}</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {currentNeighborhoodData.overview.description}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-sm">
                  <Home className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{currentNeighborhoodData.housing.medianHomeValue}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{currentNeighborhoodData.demographics.population.toLocaleString()} residents</span>
                </div>
              </div>
              
              <div className="bg-muted px-3 py-2 rounded-md flex items-center justify-between">
                <span className="text-sm font-medium">Neighborhood Rating</span>
                <Badge className="ml-2">
                  {currentNeighborhoodData.overview.ratings.overall}/100
                </Badge>
              </div>
              
              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Data updated {new Date().toLocaleDateString()}
                </span>
                
                <NeighborhoodInsightsDialog property={property}>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <Info className="h-3 w-3" />
                    Full Details
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </NeighborhoodInsightsDialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">No neighborhood data available</p>
          </Card>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NeighborhoodPopover;