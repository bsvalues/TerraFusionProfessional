import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { Property } from '@shared/schema';
import { MapLegend } from './MapLegend';
import CustomMapControls from './CustomMapControls';
import { AccessiblePropertyMarker } from './AccessiblePropertyMarker';
import GeoJSONLayerComponent from './GeoJSONLayerComponent';
import { overlayLayerSources, basemapSources } from './layerSources';

// Define MapLayerState type for layer management
export interface MapLayerState {
  id: string;
  name: string;
  enabled: boolean;
}

// Define PropertyWithOptionalFields type for properties with optional fields
type PropertyWithOptionalFields = Omit<Property, 'propertyType'> & {
  propertyType?: string | null;
  lastVisitDate?: Date | null;
  qualityScore?: number | null;
  schoolDistrict?: string | null;
  floodZone?: string | null;
  coordinates?: [number, number];
  pricePerSqFt?: number;
  attributes?: Record<string, any>;
  historicalValues?: any;
  sourceId?: string | number | null;
};

// Helper function to convert Property to PropertyWithOptionalFields
const toPropertyWithOptionalFields = (property: Property): PropertyWithOptionalFields => {
  return {
    ...property,
    propertyType: property.propertyType,
    coordinates: property.latitude && property.longitude ? [Number(property.latitude), Number(property.longitude)] : undefined
  };
};

// Define the ArcGIS service endpoints based on the documentation
const ARCGIS_SERVICES = {
  imagery: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
};

interface MapComponentProps {
  properties: PropertyWithOptionalFields[];
  center?: [number, number];
  zoom?: number;
  onPropertySelect: (property: PropertyWithOptionalFields) => void;
  selectedProperty?: PropertyWithOptionalFields | null;
  baseLayers?: any[];
  viewableLayers?: any[];
  analysisLayers?: any[];
}

// PropertyMarkers component to handle property display
const PropertyMarkers: React.FC<{
  properties: PropertyWithOptionalFields[];
  onPropertySelect: (property: PropertyWithOptionalFields) => void;
  selectedProperty?: PropertyWithOptionalFields | null;
}> = ({ properties, onPropertySelect, selectedProperty }) => {
  const map = useMap();
  
  // Create markers for properties
  useEffect(() => {
    // Create a feature group to hold all the property markers
    const markerGroup = L.featureGroup().addTo(map);
    
    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return;
      
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Determine if this property is selected
      const isSelected = selectedProperty?.id === property.id;
      
      // Create custom icon for property
      const markerIcon = L.divIcon({
        className: `property-marker ${isSelected ? 'property-selected' : ''}`,
        html: `<div class="marker-content" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${isSelected ? '#2563eb' : '#4b5563'}">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      
      // Create marker
      const marker = L.marker([lat, lng], { 
        icon: markerIcon,
        keyboard: true,
        title: property.address || 'Property',
        alt: `Property at ${property.address || 'unknown address'}`
      });
      
      // Add popup with property info
      marker.bindPopup(`
        <div class="property-popup">
          <h3>${property.address || 'Property'}</h3>
          <p>Parcel ID: ${property.parcelId}</p>
          <p>Value: ${property.value || 'Not available'}</p>
          <p>Owner: ${property.owner || 'Not available'}</p>
          ${property.squareFeet ? `<p>Size: ${property.squareFeet} sqft</p>` : ''}
          ${property.yearBuilt ? `<p>Built: ${property.yearBuilt}</p>` : ''}
          <button class="view-details-btn">View Details</button>
        </div>
      `);
      
      // Add click handler
      marker.on('click', () => {
        onPropertySelect({
          ...property,
          propertyType: property.propertyType || null
        });
      });
      
      // Add marker to group
      markerGroup.addLayer(marker);
    });
    
    // If we have a selected property, make sure it's visible
    if (selectedProperty?.latitude && selectedProperty?.longitude) {
      const lat = Number(selectedProperty.latitude);
      const lng = Number(selectedProperty.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 16);
      }
    }
    
    // Clean up function
    return () => {
      map.removeLayer(markerGroup);
    };
  }, [map, properties, selectedProperty, onPropertySelect]);
  
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  properties,
  center = [46.2805, -119.2813], // Benton County, WA default center
  zoom = 11, // Default zoom level 
  onPropertySelect,
  selectedProperty,
  baseLayers,
  viewableLayers,
  analysisLayers
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<string>('imagery');

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ 
        height: '100%', 
        width: '100%',
        zIndex: 0 // Ensure proper stacking
      }}
      ref={mapRef}
    >
      {/* Layer Controls - Minimalist Apple-inspired design */}
      <LayersControl position="topright">
        {/* Base Layers */}
        <LayersControl.BaseLayer 
          checked={activeBasemap === 'imagery'} 
          name="Imagery"
        >
          <TileLayer
            url={ARCGIS_SERVICES.imagery}
            attribution="Imagery © ESRI"
            eventHandlers={{
              add: () => setActiveBasemap('imagery')
            }}
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer 
          checked={activeBasemap === 'streets'} 
          name="Streets"
        >
          <TileLayer
            url={ARCGIS_SERVICES.streets}
            attribution="Street Map © ESRI"
            eventHandlers={{
              add: () => setActiveBasemap('streets')
            }}
          />
        </LayersControl.BaseLayer>
        
        {/* Overlay Layers */}
        <LayersControl.Overlay checked name="Properties">
          <FeatureGroup>
            <PropertyMarkers 
              properties={properties}
              onPropertySelect={onPropertySelect}
              selectedProperty={selectedProperty}
            />
          </FeatureGroup>
        </LayersControl.Overlay>
        
        {/* GeoJSON Layers for Benton County */}
        {overlayLayerSources.map(layer => (
          <LayersControl.Overlay key={layer.id} name={layer.name}>
            <FeatureGroup>
              <GeoJSONLayerComponent 
                id={layer.id}
                url={layer.url}
                attribution={layer.attribution}
                opacity={layer.opacity}
                style={layer.options?.style}
                onClick={(e: L.LeafletMouseEvent) => {
                  console.log(`Layer ${layer.id} feature clicked:`, e);
                }}
              />
            </FeatureGroup>
          </LayersControl.Overlay>
        ))}
      </LayersControl>
      
      {/* Custom Map Controls - Enhanced for Apple style */}
      <CustomMapControls 
        defaultCenter={[46.2805, -119.2813]}
        defaultZoom={11}
      />
      
      <MapLegend />
      
      {/* Accessible Property Markers (can be used for screen readers) */}
      {properties.map((property) => (
        property.latitude && property.longitude ? (
          <AccessiblePropertyMarker
            key={property.id}
            property={{
              ...property,
              propertyType: property.propertyType || null
            }}
            coordinates={[Number(property.latitude), Number(property.longitude)]}
            isSelected={selectedProperty?.id === property.id}
            onClick={onPropertySelect}
          />
        ) : null
      ))}
    </MapContainer>
  );
};

export default MapComponent;