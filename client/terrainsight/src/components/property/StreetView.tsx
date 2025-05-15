import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EyeIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extend Window interface to include Google Maps properties
declare global {
  interface Window {
    google: any;
  }
}

interface StreetViewProps {
  latitude: number;
  longitude: number;
  address?: string;
  className?: string;
  height?: string;
}

// Using the environment variable for Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const StreetView: React.FC<StreetViewProps> = ({
  latitude,
  longitude,
  address,
  className = '',
  height = '300px'
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStreetView, setHasStreetView] = useState(true);
  const [showStreetView, setShowStreetView] = useState(false);

  useEffect(() => {
    if (!showStreetView) return;
    
    // Load the Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeStreetView();
        return;
      }

      const googleMapsScript = document.createElement('script');
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      googleMapsScript.onload = () => initializeStreetView();
      document.head.appendChild(googleMapsScript);
    };

    // Initialize the Street View
    const initializeStreetView = () => {
      if (!streetViewRef.current || !window.google) return;

      setIsLoading(true);
      
      const position = new window.google.maps.LatLng(Number(latitude), Number(longitude));
      const streetViewService = new window.google.maps.StreetViewService();
      
      // Check if street view is available at this location
      streetViewService.getPanorama(
        { 
          location: position, 
          radius: 50,  // Search within 50 meters
          preference: window.google.maps.StreetViewPreference.NEAREST
        }, 
        (data: any, status: any) => {
          if (status === window.google.maps.StreetViewStatus.OK && data) {
            // Street view is available, create panorama
            const panorama = new window.google.maps.StreetViewPanorama(
              streetViewRef.current as HTMLElement,
              {
                position: data.location.latLng,
                pov: {
                  heading: 34,
                  pitch: 10
                },
                addressControl: true,
                linksControl: true,
                panControl: true,
                enableCloseButton: false,
                zoomControl: true,
                fullscreenControl: true
              }
            );
            setHasStreetView(true);
          } else {
            // Street view not available for this location
            setHasStreetView(false);
          }
          setIsLoading(false);
        }
      );
    };

    loadGoogleMaps();
    
    // Cleanup function
    return () => {
      // Nothing to clean up
    };
  }, [latitude, longitude, showStreetView]);

  const handleShowStreetView = () => {
    setShowStreetView(true);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      {!showStreetView ? (
        <CardContent className="p-3 text-center">
          <Button 
            onClick={handleShowStreetView} 
            className="w-full"
            variant="outline"
          >
            <EyeIcon className="mr-2 h-4 w-4" /> 
            View Street View
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Show street-level imagery for {address || 'this location'}
          </p>
        </CardContent>
      ) : (
        <div className="relative">
          <div 
            ref={streetViewRef} 
            className="w-full" 
            style={{ height }}
          ></div>
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {!isLoading && !hasStreetView && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4">
              <p className="text-center text-muted-foreground">
                Street view imagery is not available for this location.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowStreetView(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default StreetView;