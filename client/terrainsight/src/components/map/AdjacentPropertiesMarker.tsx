import React, { useState, useEffect, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@shared/schema';
import { useAppMode } from '@/contexts/AppModeContext';
import { 
  findAdjacentProperties, 
  AdjacentPropertyResult 
} from '@/services/comparison/adjacentPropertiesService';
import AdjacentPropertiesPopup from './AdjacentPropertiesPopup';
import { MapPin, Home, Building, Map, Warehouse, Tractor } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AdjacentPropertiesMarkerProps {
  property: Property;
  properties: Property[];
  isSelected?: boolean;
  onPropertySelect: (property: Property) => void;
  maxAdjacentProperties?: number;
  maxDistanceKm?: number;
}

/**
 * A specialized marker component that shows adjacent properties in its popup
 */
export const AdjacentPropertiesMarker: React.FC<AdjacentPropertiesMarkerProps> = ({
  property,
  properties,
  isSelected = false,
  onPropertySelect,
  maxAdjacentProperties = 5,
  maxDistanceKm = 0.5
}) => {
  const { mode } = useAppMode();
  const isStandalone = mode === 'standalone';
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const [adjacentProperties, setAdjacentProperties] = useState<AdjacentPropertyResult[]>([]);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  // Create marker icon based on property type
  const getMarkerIcon = () => {
    const propertyType = property.propertyType?.toLowerCase() || 'unknown';
    const isSelected = showPopup;
    
    let IconComponent = Home;
    let primaryColor = isSelected ? '#f43f5e' : '#3b82f6'; // red-500 : blue-500
    let secondaryColor = '#ffffff';
    
    // Choose icon based on property type
    switch (propertyType) {
      case 'commercial':
        IconComponent = Building;
        primaryColor = isSelected ? '#f43f5e' : '#8b5cf6'; // purple-500
        break;
      case 'industrial':
        IconComponent = Warehouse;
        primaryColor = isSelected ? '#f43f5e' : '#f59e0b'; // amber-500
        break;
      case 'agricultural':
        IconComponent = Tractor;
        primaryColor = isSelected ? '#f43f5e' : '#10b981'; // emerald-500
        break;
      case 'vacant':
        IconComponent = Map;
        primaryColor = isSelected ? '#f43f5e' : '#6b7280'; // gray-500
        break;
      default:
        IconComponent = Home;
        break;
    }
    
    // Create an HTML element for the icon
    const iconHtml = `
      <div class="relative p-1">
        <div class="absolute inset-0 rounded-full bg-${isSelected ? 'red' : 'blue'}-500 opacity-20 animate-pulse"></div>
        <div style="background-color: ${primaryColor}; color: ${secondaryColor}" class="flex items-center justify-center rounded-full w-6 h-6 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${IconComponent({}).props.children}
          </svg>
        </div>
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      className: 'property-marker-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Find adjacent properties when marker is clicked
  const findNearbyProperties = () => {
    const adjacent = findAdjacentProperties(property, properties, {
      maxDistanceKm,
      maxResults: maxAdjacentProperties,
      excludeSameOwner: true
    });
    
    setAdjacentProperties(adjacent);
  };

  // Handle marker click
  const handleMarkerClick = () => {
    // Find adjacent properties if not already loaded
    if (adjacentProperties.length === 0) {
      findNearbyProperties();
    }
    
    setShowPopup(true);
  };

  // Handle popup close
  const handlePopupClose = () => {
    setShowPopup(false);
  };

  // Ensure marker and popup position are correct
  useEffect(() => {
    if (markerRef.current && property.latitude && property.longitude) {
      markerRef.current.setLatLng([property.latitude, property.longitude]);
    }
  }, [property.latitude, property.longitude]);

  // If property doesn't have coordinates, don't render anything
  if (!property.latitude || !property.longitude) {
    return null;
  }

  return (
    <Marker
      position={[property.latitude, property.longitude]}
      icon={getMarkerIcon()}
      ref={markerRef}
      eventHandlers={{
        click: handleMarkerClick
      }}
    >
      {showPopup && (
        <Popup 
          className="adjacent-properties-popup"
          onClose={handlePopupClose}
          closeButton={true}
          autoClose={false}
          closeOnEscapeKey={true}
          closeOnClick={false}
        >
          <div className="p-1.5">
            <div className="font-medium text-base">{property.address}</div>
            <div className="flex justify-between items-center text-sm mt-1">
              <div>{formatCurrency(property.value || 0)}</div>
              {property.propertyType && (
                <div className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                  {property.propertyType}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              {property.squareFeet && `${property.squareFeet.toLocaleString()} sqft • `}
              {property.yearBuilt && `Built ${property.yearBuilt} • `}
              {property.bedrooms && property.bathrooms && 
                `${property.bedrooms} bed / ${property.bathrooms} bath`}
            </div>
            
            <div className="mt-3 border-t border-gray-200 pt-2">
              <AdjacentPropertiesPopup 
                adjacentProperties={adjacentProperties}
                onPropertySelect={onPropertySelect}
              />
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  );
};

export default AdjacentPropertiesMarker;