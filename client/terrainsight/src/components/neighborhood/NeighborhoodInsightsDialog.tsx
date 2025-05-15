import React from 'react';
import { Property } from '@/shared/types';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pin, MapPin } from 'lucide-react';
import NeighborhoodInsights from './NeighborhoodInsights';

interface NeighborhoodInsightsDialogProps {
  property: Property;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function NeighborhoodInsightsDialog({ 
  property,
  trigger,
  children
}: NeighborhoodInsightsDialogProps) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <MapPin className="h-4 w-4" />
            Neighborhood Insights
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none max-h-[90vh] overflow-y-auto">
        <NeighborhoodInsights 
          property={property} 
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default NeighborhoodInsightsDialog;