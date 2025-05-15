import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { BarChart3 } from 'lucide-react';
import NeighborhoodDemographicOverlay from './NeighborhoodDemographicOverlay';

interface DemographicOverlayControlProps {
  className?: string;
  isVisible?: boolean;
  onToggle?: () => void;
}

export const DemographicOverlayControl: React.FC<DemographicOverlayControlProps> = ({
  className,
  isVisible,
  onToggle
}) => {
  const [internalShowOverlay, setInternalShowOverlay] = useState(false);
  
  // Use either provided state (controlled) or internal state (uncontrolled)
  const showOverlay = isVisible !== undefined ? isVisible : internalShowOverlay;

  const toggleOverlay = () => {
    if (onToggle) {
      // Controlled mode - parent handles state
      onToggle();
    } else {
      // Uncontrolled mode - we handle state
      setInternalShowOverlay(prev => !prev);
    }
  };

  return (
    <>
      <Tooltip
        content="Demographic Overlay"
      >
        <Button
          variant={showOverlay ? "default" : "outline"}
          size="sm"
          className={className}
          onClick={toggleOverlay}
          aria-label="Toggle Demographic Overlay"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </Tooltip>

      <NeighborhoodDemographicOverlay 
        visible={showOverlay} 
        onClose={() => {
          if (onToggle) {
            // Controlled mode - use parent's toggle function
            onToggle();
          } else {
            // Uncontrolled mode - use our internal state
            setInternalShowOverlay(false);
          }
        }}
      />
    </>
  );
};

export default DemographicOverlayControl;