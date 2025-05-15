import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Maximize, Minimize, Compass, MapPin, X, MapIcon } from 'lucide-react';

interface MiniMapProps {
  className?: string;
  width?: number;
  height?: number;
  zoomOffset?: number;
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

export const MiniMap: React.FC<MiniMapProps> = ({
  className,
  width = 200,
  height = 150,
  zoomOffset = 3,
  position = 'bottomright'
}) => {
  const mainMap = useMap();
  const [miniMapInstance, setMiniMapInstance] = useState<L.Map | null>(null);
  const [viewportRect, setViewportRect] = useState<L.Rectangle | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  
  // Determine position classes
  const positionClasses = {
    'topleft': 'top-4 left-4',
    'topright': 'top-4 right-4',
    'bottomleft': 'bottom-4 left-4',
    'bottomright': 'bottom-4 right-4'
  };
  
  // Initialize mini-map
  useEffect(() => {
    if (!containerRef.current || miniMapInstance) return;
    
    // Create mini-map instance
    const miniMap = L.map(containerRef.current, {
      attributionControl: false,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false
    });
    
    // Add tile layer - same as main map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 2
    }).addTo(miniMap);
    
    // Set initial view based on main map
    const center = mainMap.getCenter();
    const zoom = Math.max(mainMap.getZoom() - zoomOffset, 0);
    miniMap.setView(center, zoom);
    
    // Create initial viewport rectangle
    const bounds = mainMap.getBounds();
    const rect = L.rectangle(bounds, {
      color: '#3b82f6',
      weight: 2,
      opacity: 0.8,
      fillColor: '#93c5fd',
      fillOpacity: 0.2,
      interactive: true
    }).addTo(miniMap);
    
    setMiniMapInstance(miniMap);
    setViewportRect(rect);
    
    // Add click handler to mini-map
    miniMap.on('click', (e) => {
      // Center main map on clicked location
      mainMap.setView(e.latlng, mainMap.getZoom());
    });
    
    // Cleanup on unmount
    return () => {
      miniMap.remove();
      setMiniMapInstance(null);
      setViewportRect(null);
    };
  }, [mainMap, zoomOffset]);
  
  // Update mini-map when main map moves
  useEffect(() => {
    if (!miniMapInstance || !viewportRect) return;
    
    const updateViewportRect = () => {
      const bounds = mainMap.getBounds();
      viewportRect.setBounds(bounds);
      
      // Center mini-map if viewport is near the edge
      const miniMapBounds = miniMapInstance.getBounds();
      if (!miniMapBounds.contains(bounds)) {
        miniMapInstance.setView(mainMap.getCenter());
      }
    };
    
    // Update mini-map when main map changes
    mainMap.on('moveend', updateViewportRect);
    mainMap.on('zoomend', updateViewportRect);
    
    // Initialize
    updateViewportRect();
    
    return () => {
      mainMap.off('moveend', updateViewportRect);
      mainMap.off('zoomend', updateViewportRect);
    };
  }, [mainMap, miniMapInstance, viewportRect]);
  
  // Add drag handlers to viewport rectangle
  useEffect(() => {
    if (!mainMap || !miniMapInstance || !viewportRect) return;
    
    const onMouseDown = (e: MouseEvent) => {
      // Check if the click is on the viewport rectangle
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('leaflet-interactive')) {
        e.preventDefault();
        isDraggingRef.current = true;
        
        // Record the initial position
        const startX = e.clientX;
        const startY = e.clientY;
        const startCenter = mainMap.getCenter();
        
        const onMouseMove = (moveEvent: MouseEvent) => {
          if (!isDraggingRef.current) return;
          
          // Calculate the offset in pixels
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          
          // Convert pixel offset to LatLng offset
          // At this point we know miniMapInstance exists because of the check at the top of useEffect
          const containerPoint = miniMapInstance.getSize();
          if (containerPoint) {
            const bounds = miniMapInstance.getBounds();
            if (bounds) {
              const latPerPixel = (bounds.getNorth() - bounds.getSouth()) / containerPoint.y;
              const lngPerPixel = (bounds.getEast() - bounds.getWest()) / containerPoint.x;
              
              // Move the main map (reverse the Y movement)
              const newLat = startCenter.lat - deltaY * latPerPixel;
              const newLng = startCenter.lng + deltaX * lngPerPixel;
              mainMap.setView([newLat, newLng], mainMap.getZoom());
            }
          }
        };
        
        const onMouseUp = () => {
          isDraggingRef.current = false;
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    };
    
    document.addEventListener('mousedown', onMouseDown);
    
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [mainMap, miniMapInstance, viewportRect]);
  
  // Add keyboard shortcut for toggling mini-map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n') {
        setIsVisible(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Predefined views
  const navigateToCountyView = () => {
    // This is an example for Benton County
    mainMap.fitBounds([
      [46.1, -119.8], // Southwest corner
      [46.4, -119.0]  // Northeast corner
    ]);
  };
  
  const navigateToNeighborhoodView = () => {
    // This is an example for South Richland
    mainMap.fitBounds([
      [46.25, -119.3], // Southwest corner
      [46.3, -119.25]  // Northeast corner
    ]);
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "absolute z-10 bg-white p-2",
          position === 'topleft' && "top-4 left-[210px]",
          position === 'topright' && "top-4 right-[210px]",
          position === 'bottomleft' && "bottom-4 left-[210px]",
          position === 'bottomright' && "bottom-4 right-[210px]"
        )}
        onClick={() => setIsVisible(prev => !prev)}
        aria-label="Toggle Mini-Map"
      >
        {isVisible ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>
      
      <Card
        className={cn(
          "absolute z-9 rounded-md overflow-hidden",
          positionClasses[position],
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
          className
        )}
        style={{ width: `${width}px`, height: `${height + 40}px` }}
        data-testid="mini-map-container"
      >
        <div 
          ref={containerRef}
          className="w-full"
          style={{ height: `${height}px` }}
          data-testid="mini-map-click-handler"
        ></div>
        
        <CardContent className="p-2 flex justify-between items-center bg-card">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={navigateToCountyView}
              aria-label="County View"
              title="County View"
            >
              <Compass className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={navigateToNeighborhoodView}
              aria-label="Neighborhood View"
              title="Neighborhood View"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 p-1"
            onClick={() => setIsVisible(false)}
            aria-label="Close Mini-Map"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default MiniMap;