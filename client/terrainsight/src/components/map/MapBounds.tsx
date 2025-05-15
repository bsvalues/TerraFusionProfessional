import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapBoundsProps {
  bounds: [number, number][] | L.LatLngBounds;
  padding?: number | [number, number];
}

/**
 * Component to automatically set the bounds of a Leaflet map
 * Used inside a MapContainer to adjust the view based on markers
 */
export function MapBounds({ bounds, padding = 0.1 }: MapBoundsProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!bounds) return;
    
    if (bounds instanceof L.LatLngBounds) {
      map.fitBounds(bounds, { padding: padding as L.PointTuple });
    } else if (Array.isArray(bounds) && bounds.length > 0) {
      // Convert coordinates array to LatLngBounds
      const latLngs = bounds.map(coords => L.latLng(coords[0], coords[1]));
      const boundsObj = L.latLngBounds(latLngs);
      
      if (boundsObj.isValid()) {
        map.fitBounds(boundsObj, { 
          padding: Array.isArray(padding) 
            ? padding as L.PointTuple 
            : [padding as number, padding as number] 
        });
      } else {
        // If bounds are invalid, center on the first coordinate
        const center = L.latLng(bounds[0][0], bounds[0][1]);
        map.setView(center, 12);
      }
    }
  }, [map, bounds, padding]);
  
  return null;
}