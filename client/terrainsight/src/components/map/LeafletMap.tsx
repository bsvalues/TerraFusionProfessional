import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property, MapLayer } from '@/shared/types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

// Create custom marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'selected-marker'
});

interface LeafletMapProps {
  properties: Property[];
  layers: MapLayer[];
  center: [number, number];
  zoom: number;
  selectedProperties: Property[];
  onSelectProperty: (property: Property) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  properties,
  layers,
  center,
  zoom,
  selectedProperties,
  onSelectProperty
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  
  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      mapInstanceRef.current = map;
      
      // Add base layers
      const baseLayers: { [key: string]: L.TileLayer } = {};
      const baseLayerControl = L.control.layers({}, {}).addTo(map);
      
      layers.filter(layer => layer.type === 'base').forEach(layer => {
        if (layer.id === 'osm') {
          const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          });
          baseLayers[layer.name] = osmLayer;
          if (layer.checked) {
            osmLayer.addTo(map);
          }
          baseLayerControl.addBaseLayer(osmLayer, layer.name);
        } else if (layer.id === 'satellite') {
          const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          });
          baseLayers[layer.name] = satelliteLayer;
          if (layer.checked) {
            satelliteLayer.addTo(map);
          }
          baseLayerControl.addBaseLayer(satelliteLayer, layer.name);
        }
      });
      
      // Add CSS styles
      if (!document.getElementById('leaflet-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'leaflet-custom-styles';
        style.innerHTML = `
          .selected-marker {
            filter: hue-rotate(120deg) saturate(1.5) drop-shadow(0 0 5px #0066ff);
            z-index: 1000 !important;
            transform: scale(1.2);
          }
          .property-popup .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          }
          .property-popup .leaflet-popup-content {
            margin: 12px 16px;
            min-width: 200px;
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Update map view when center or zoom changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);
  
  // Add or update property markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    const currentMarkerIds = new Set<string>();
    
    // Add or update markers
    properties.forEach(property => {
      if (!property.coordinates) return;
      
      currentMarkerIds.add(property.id);
      
      // Check if marker already exists
      if (markersRef.current[property.id]) {
        // Update existing marker if needed (position, popup, etc)
        const marker = markersRef.current[property.id];
        marker.setLatLng([property.coordinates[0], property.coordinates[1]]);
        
        // Update icon if selection status changed
        const isSelected = selectedProperties.some(p => p.id === property.id);
        marker.setIcon(isSelected ? selectedIcon : defaultIcon);
      } else {
        // Create new marker
        const isSelected = selectedProperties.some(p => p.id === property.id);
        const marker = L.marker([property.coordinates[0], property.coordinates[1]], {
          icon: isSelected ? selectedIcon : defaultIcon
        });
        
        // Add popup with property info
        const popupContent = document.createElement('div');
        popupContent.className = 'property-popup-content';
        popupContent.innerHTML = `
          <div class="space-y-2">
            <h3 class="font-medium text-base">${property.address}</h3>
            <div class="flex gap-1 flex-wrap" id="property-badges-${property.id}"></div>
            <div class="flex gap-2 mt-2" id="property-buttons-${property.id}"></div>
          </div>
        `;
        
        marker.bindPopup(popupContent, { className: 'property-popup' });
        
        // Add click handler
        marker.on('click', () => {
          onSelectProperty(property);
        });
        
        // Add marker to map and store reference
        marker.addTo(map);
        markersRef.current[property.id] = marker;
        
        // Handle popup open to render React components inside
        marker.on('popupopen', () => {
          const badgesContainer = document.getElementById(`property-badges-${property.id}`);
          const buttonsContainer = document.getElementById(`property-buttons-${property.id}`);
          
          if (badgesContainer) {
            // Clear existing content
            badgesContainer.innerHTML = '';
            
            // Add badges
            if (property.value) {
              const valueSpan = document.createElement('span');
              valueSpan.className = 'inline-flex items-center rounded-full border border-transparent bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white';
              valueSpan.textContent = formatCurrency(property.value);
              badgesContainer.appendChild(valueSpan);
            }
            
            const sqftSpan = document.createElement('span');
            sqftSpan.className = 'inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground';
            sqftSpan.textContent = `${property.squareFeet} sqft`;
            badgesContainer.appendChild(sqftSpan);
            
            if (property.yearBuilt) {
              const yearSpan = document.createElement('span');
              yearSpan.className = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground';
              yearSpan.textContent = `Built ${property.yearBuilt}`;
              badgesContainer.appendChild(yearSpan);
            }
          }
          
          if (buttonsContainer) {
            // Clear existing content
            buttonsContainer.innerHTML = '';
            
            // Add details button
            const detailsButton = document.createElement('button');
            detailsButton.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 flex-1';
            detailsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 h-4 w-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Details';
            
            detailsButton.onclick = (e) => {
              e.stopPropagation();
              onSelectProperty(property);
            };
            
            buttonsContainer.appendChild(detailsButton);
          }
        });
      }
    });
    
    // Remove markers that are no longer in the properties array
    Object.keys(markersRef.current).forEach(id => {
      if (!currentMarkerIds.has(id) && markersRef.current[id]) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    
  }, [properties, selectedProperties, onSelectProperty]);
  
  return (
    <div className="h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default LeafletMap;