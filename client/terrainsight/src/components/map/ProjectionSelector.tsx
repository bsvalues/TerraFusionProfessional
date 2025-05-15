import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'proj4leaflet';
import proj4 from 'proj4';

interface ProjectionSelectorProps {
  crs?: 'EPSG:4326' | 'EPSG:2927' | 'ESRI:102749';
}

/**
 * Component that handles coordinate system projections for the map
 * It sets up the appropriate CRS (Coordinate Reference System) for Leaflet
 */
const ProjectionSelector: React.FC<ProjectionSelectorProps> = ({ 
  crs = 'EPSG:4326' // Default to WGS84 (standard latitude/longitude)
}) => {
  const map = useMap();
  
  useEffect(() => {
    // Define projections if using proj4leaflet
    if (crs === 'EPSG:2927' || crs === 'ESRI:102749') {
      // Since we can't change the CRS of a Leaflet map after it's initialized,
      // we'll need to apply transformations to our data points instead
      console.log(`Map projection support: Using ${crs} for data transformations`);
    }
    
    // Display the current projection in development mode
    // Add a control to show current coordinates on mouse move
    const coordsControl = new L.Control({ position: 'bottomleft' });
    
    coordsControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'projection-info leaflet-control leaflet-bar');
      div.innerHTML = `
        <div class="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
          <div><strong>CRS:</strong> ${crs}</div>
          <div class="coords"></div>
        </div>
      `;
      return div;
    };
    
    coordsControl.addTo(map);
    
    // Display coordinates on mouse move
    const updateCoords = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // If using Washington State Plane, also show converted coordinates
      let statePlaneCoords = '';
      if (crs === 'EPSG:2927' || crs === 'ESRI:102749') {
        try {
          // Convert from WGS84 to State Plane
          const [easting, northing] = proj4(
            'EPSG:4326', 
            'EPSG:2927', 
            [lng, lat]
          );
          statePlaneCoords = `<div>State Plane: ${Math.round(easting)}, ${Math.round(northing)}</div>`;
        } catch (error) {
          console.error('Error converting coordinates:', error);
        }
      }
      
      const coordsDiv = document.querySelector('.projection-info .coords');
      if (coordsDiv) {
        coordsDiv.innerHTML = `
          <div>Lat, Lng: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
          ${statePlaneCoords}
        `;
      }
    };
    
    map.on('mousemove', updateCoords);
    
    // Clean up event listener
    return () => {
      map.off('mousemove', updateCoords);
      map.removeControl(coordsControl);
    };
  }, [map, crs]);
  
  // This component doesn't render any visible elements directly
  return null;
};

export default ProjectionSelector;