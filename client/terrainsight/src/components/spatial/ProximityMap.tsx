import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Property } from '@shared/schema';
import { POI, POIType } from '@/services/spatial/proximityAnalysisService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Define default icons for POI types
import { Home, Trees, School, Hospital, ShoppingCart, Train, MapPin, Coffee, Film, Book, Church } from 'lucide-react';

// Fix default icon references
let DefaultIcon = L.Icon.Default;
DefaultIcon.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow
});
L.Icon.Default.prototype.options.iconSize = [25, 41];
L.Icon.Default.prototype.options.iconAnchor = [12, 41];
L.Icon.Default.prototype.options.popupAnchor = [1, -34];
L.Icon.Default.prototype.options.shadowSize = [41, 41];

// POI type color mapping
const poiTypeColorMap: Record<POIType, string> = {
  [POIType.Park]: '#4CAF50', // Green
  [POIType.School]: '#2196F3', // Blue
  [POIType.Hospital]: '#F44336', // Red
  [POIType.ShoppingCenter]: '#9C27B0', // Purple
  [POIType.PublicTransit]: '#FF9800', // Orange
  [POIType.Highway]: '#795548', // Brown
  [POIType.Restaurant]: '#E91E63', // Pink
  [POIType.Entertainment]: '#673AB7', // Deep Purple
  [POIType.Church]: '#607D8B', // Blue Gray
  [POIType.Library]: '#009688'  // Teal
};

// POI type icon mapping
const getIconComponent = (poiType: POIType): React.ReactNode => {
  const color = poiTypeColorMap[poiType] || '#000000';
  const style = { color, width: '1em', height: '1em' };

  switch (poiType) {
    case POIType.Park:
      return <Trees style={style} />;
    case POIType.School:
      return <School style={style} />;
    case POIType.Hospital:
      return <Hospital style={style} />;
    case POIType.ShoppingCenter:
      return <ShoppingCart style={style} />;
    case POIType.PublicTransit:
      return <Train style={style} />;
    case POIType.Highway:
      return <MapPin style={style} />;
    case POIType.Restaurant:
      return <Coffee style={style} />;
    case POIType.Entertainment:
      return <Film style={style} />;
    case POIType.Library:
      return <Book style={style} />;
    case POIType.Church:
      return <Church style={style} />;
    default:
      return <MapPin style={style} />;
  }
};

// Custom marker icon for POIs
const createPOIIcon = (poiType: POIType): L.DivIcon => {
  const color = poiTypeColorMap[poiType] || '#000000';
  
  return L.divIcon({
    className: 'custom-poi-icon',
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);"
    ></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Component to update the map view when selectedProperty changes
function MapViewController({ coordinates }: { coordinates: [number, number] | undefined }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length === 2) {
      map.setView(coordinates as [number, number], map.getZoom());
    }
  }, [coordinates, map]);
  
  return null;
}

export interface ProximityMapProps {
  property: Property;
  pois: (POI & { distance: number })[];
  radius?: number;
  showRadius?: boolean;
  className?: string;
}

export function ProximityMap({
  property,
  pois,
  radius = 1000,
  showRadius = true,
  className = ""
}: ProximityMapProps) {
  // Default center if property has no coordinates
  const defaultCenter: [number, number] = [47.6062, -122.3321]; // Seattle
  
  // Use property coordinates or default
  const center = property.coordinates && 
                 Array.isArray(property.coordinates) && 
                 property.coordinates.length === 2 
    ? property.coordinates as [number, number]
    : defaultCenter;
  
  return (
    <div data-testid="proximity-map" className={`h-[400px] w-full overflow-hidden rounded-md ${className}`}>
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Update view when property changes */}
        <MapViewController coordinates={property.coordinates as [number, number] | undefined} />
        
        {/* Property marker */}
        {property.coordinates && (
          <Marker
            position={property.coordinates as [number, number]}
            icon={L.divIcon({
              className: 'custom-property-icon',
              html: `<div style="
                background-color: #FF5252;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 6px rgba(0,0,0,0.4);"
              ></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="p-1">
                <p className="font-semibold">{property.address}</p>
                <p className="text-sm text-gray-600">{property.propertyType}</p>
                {property.value && (
                  <p className="text-sm font-medium">Value: {
                    typeof property.value === 'string' 
                      ? property.value 
                      : `$${property.value.toLocaleString()}`
                  }</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Influence radius circle */}
        {showRadius && property.coordinates && (
          <Circle
            center={property.coordinates as [number, number]}
            radius={radius}
            pathOptions={{
              color: '#3388ff',
              fillColor: '#3388ff',
              fillOpacity: 0.1,
              weight: 1,
              dashArray: '5, 5'
            }}
          />
        )}
        
        {/* POI markers */}
        {pois.map(poi => (
          <Marker
            key={poi.id}
            position={poi.coordinates as [number, number]}
            icon={createPOIIcon(poi.type)}
          >
            <Popup>
              <div className="p-1">
                <div className="flex items-center gap-1 mb-1">
                  <span className="flex items-center justify-center w-5 h-5">
                    {getIconComponent(poi.type)}
                  </span>
                  <span className="font-semibold">{poi.name}</span>
                </div>
                <p className="text-xs text-gray-600 capitalize">{poi.type.replace('_', ' ')}</p>
                <p className="text-xs">Distance: {poi.distance.toFixed(0)}m</p>
                
                {/* Show attributes if available */}
                {poi.attributes && Object.keys(poi.attributes).length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    {Object.entries(poi.attributes).map(([key, value]) => {
                      // Skip arrays or objects for display simplification
                      if (typeof value === 'object') return null;
                      
                      return (
                        <p key={key} className="text-xs">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>: {value}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}