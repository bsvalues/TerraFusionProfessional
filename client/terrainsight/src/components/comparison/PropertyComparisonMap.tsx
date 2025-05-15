import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// Fix Leaflet marker icon issue in React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for base property
const baseIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'base-property-marker'
});

// Map bounds adjustment component
function MapBoundsAdjuster({ properties }: { properties: Property[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (properties.length > 0) {
      const validCoordinates = properties
        .filter(p => p.coordinates || (p.latitude && p.longitude))
        .map(p => p.coordinates || [p.latitude!, p.longitude!] as [number, number]);
      
      if (validCoordinates.length > 0) {
        const bounds = L.latLngBounds(validCoordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [properties, map]);
  
  return null;
}

interface PropertyComparisonMapProps {
  baseProperty: Property;
  comparisonProperties: Property[];
}

export function PropertyComparisonMap({
  baseProperty,
  comparisonProperties
}: PropertyComparisonMapProps) {
  const allProperties = [baseProperty, ...comparisonProperties];
  
  // Determine center coordinates
  const getPropertyCoordinates = (property: Property): [number, number] | null => {
    if (property.coordinates) {
      return property.coordinates;
    }
    
    if (property.latitude && property.longitude) {
      return [property.latitude, property.longitude];
    }
    
    return null;
  };
  
  const baseCoordinates = getPropertyCoordinates(baseProperty);
  const defaultCenter: [number, number] = baseCoordinates || [46.2, -119.137]; // Default to Benton County, WA
  
  // Extract property value as a number for formatting
  const getPropertyValue = (property: Property): number => {
    if (!property.value) return 0;
    
    return typeof property.value === 'string'
      ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
      : property.value;
  };
  
  return (
    <Card className="overflow-hidden">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ width: '100%', height: '400px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {allProperties.map(property => {
          const coordinates = getPropertyCoordinates(property);
          if (!coordinates) return null;
          
          const isBase = property.id === baseProperty.id;
          
          return (
            <Marker 
              key={property.id} 
              position={coordinates}
              icon={isBase ? baseIcon : defaultIcon}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-medium mb-1">{property.address}</div>
                  <div className="text-sm">
                    {formatCurrency(getPropertyValue(property))}
                    {property.squareFeet && 
                      ` • ${property.squareFeet.toLocaleString()} sq ft`
                    }
                    {property.yearBuilt && 
                      ` • Built ${property.yearBuilt}`
                    }
                  </div>
                  {isBase && (
                    <div className="text-xs mt-1 text-primary font-medium">Base Property</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapBoundsAdjuster properties={allProperties} />
      </MapContainer>
    </Card>
  );
}