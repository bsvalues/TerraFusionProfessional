import React, { useState, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { LatLngLiteral } from 'leaflet';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CoordinateDisplayProps {
  showDecimal?: boolean; // Whether to show decimal degrees (default) or degrees/minutes/seconds
  className?: string;
}

// Utility to convert decimal degrees to degrees/minutes/seconds
const decimalToDMS = (coordinate: number, isLatitude: boolean): string => {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLatitude
    ? coordinate >= 0 ? 'N' : 'S'
    : coordinate >= 0 ? 'E' : 'W';

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
};

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({
  showDecimal = true,
  className = ''
}) => {
  const map = useMap();
  const [position, setPosition] = useState<LatLngLiteral | null>(null);
  const [displayCoordinates, setDisplayCoordinates] = useState(true);
  const [formatDecimal, setFormatDecimal] = useState(showDecimal);

  // Track mouse movement to update coordinates
  useMapEvents({
    mousemove: (e) => {
      setPosition(e.latlng);
    },
    mouseout: () => {
      // Optionally, stop showing coordinates when mouse leaves map
      // setPosition(null);
    }
  });

  // Get map center when position isn't available (touch devices)
  useEffect(() => {
    if (!position) {
      const center = map.getCenter();
      setPosition({ lat: center.lat, lng: center.lng });
    }
  }, [map, position]);

  // Format coordinates based on selected display format
  const formatCoordinates = (): string => {
    if (!position) return 'No coordinates available';
    
    if (formatDecimal) {
      // Decimal format (e.g., 46.2804, -119.2752)
      return `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
    } else {
      // DMS format (e.g., 46° 16' 49" N, 119° 16' 30" W)
      const latDMS = decimalToDMS(position.lat, true);
      const lngDMS = decimalToDMS(position.lng, false);
      return `${latDMS}, ${lngDMS}`;
    }
  };

  const handleCopyCoordinates = () => {
    if (position) {
      navigator.clipboard.writeText(formatCoordinates())
        .then(() => {
          toast({
            title: "Coordinates copied",
            description: "The coordinates have been copied to your clipboard.",
            duration: 2000,
          });
        })
        .catch(err => {
          console.error('Could not copy coordinates: ', err);
        });
    }
  };

  const toggleCoordinateDisplay = () => {
    setDisplayCoordinates(!displayCoordinates);
  };

  const toggleCoordinateFormat = () => {
    setFormatDecimal(!formatDecimal);
  };

  if (!displayCoordinates) {
    return (
      <div className={`absolute left-3 bottom-16 z-[1000] ${className}`}>
        <Button 
          variant="secondary" 
          size="sm" 
          className="bg-white bg-opacity-90 hover:bg-opacity-100"
          onClick={toggleCoordinateDisplay}
          aria-label="Show coordinates"
        >
          <Eye size={14} className="mr-1" />
          <span className="text-xs">Show Coordinates</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`absolute left-3 bottom-16 z-[1000] ${className}`}>
      <div className="bg-white bg-opacity-90 p-2 rounded-lg shadow-md border border-gray-300 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-700">Map Coordinates</h3>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={handleCopyCoordinates}
              aria-label="Copy coordinates"
            >
              <Copy size={12} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={toggleCoordinateDisplay}
              aria-label="Hide coordinates"
            >
              <EyeOff size={12} />
            </Button>
          </div>
        </div>
        
        <div className="text-xs font-mono bg-gray-100 p-1 rounded select-all" role="status" aria-live="polite">
          {formatCoordinates()}
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="format-toggle" 
            checked={formatDecimal}
            onCheckedChange={toggleCoordinateFormat}
            aria-label="Toggle coordinate format"
          />
          <Label htmlFor="format-toggle" className="text-xs text-gray-700 cursor-pointer">
            {formatDecimal ? 'Decimal' : 'DMS'}
          </Label>
        </div>
      </div>
    </div>
  );
};

export default CoordinateDisplay;