import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import L from 'leaflet';
import { Property } from '@shared/schema';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Apple-style clean, elegant popup style
const popupOptions = {
  className: 'apple-style-popup',
  closeButton: false,
  maxWidth: 240
};

interface PropertyWithOptionalFields extends Property {
  propertyType: string | null;
}

// Layer state interface
interface MapLayerState {
  id: string;
  name: string;
  enabled: boolean;
}

interface LayerStates {
  baseLayers: MapLayerState[];
  viewableLayers: MapLayerState[];
  analysisLayers: MapLayerState[];
}

interface SimpleMapComponentProps {
  properties: Property[];
  onPropertySelect: (property: PropertyWithOptionalFields) => void;
  selectedProperty?: Property | null;
  layerStates?: LayerStates;
}

// Map Layer component to handle layer toggling
const MapLayers: React.FC<{layerStates?: LayerStates}> = ({ layerStates }) => {
  if (!layerStates) return null;
  
  // Find enabled base layer
  const activeBaseLayer = layerStates.baseLayers.find(layer => layer.enabled);
  const enabledViewableLayers = layerStates.viewableLayers.filter(layer => layer.enabled);
  
  return (
    <>
      {/* Base Layer */}
      {activeBaseLayer?.id === 'street' && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri World Street Map"
        />
      )}
      
      {activeBaseLayer?.id === 'satellite' && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri World Imagery"
        />
      )}
      
      {activeBaseLayer?.id === 'topo' && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri World Topo Map"
        />
      )}

      {/* Viewable Layers */}
      {enabledViewableLayers.find(layer => layer.id === 'parcels') && (
        <TileLayer
          url="https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels/FeatureServer/tile/{z}/{y}/{x}"
          attribution="&copy; Benton County GIS"
          opacity={0.7}
          zIndex={5}
        />
      )}
    </>
  );
};

// Custom map controls component with zoom and locate
const AppleMapControls: React.FC = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  
  const handleLocateMe = () => {
    setLocating(true);
    
    map.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true
    });
    
    const onLocationFound = (e: L.LocationEvent) => {
      // Create a pulsing circle at the location
      const radius = e.accuracy;
      
      // Remove old location circles if any
      map.eachLayer((layer) => {
        if (layer instanceof L.Circle && layer.options.className === 'user-location-circle') {
          map.removeLayer(layer);
        }
      });
      
      // Add location marker with pulsing effect
      L.circle(e.latlng, {
        radius: radius,
        color: '#0066CC',
        fillColor: 'rgba(0, 102, 204, 0.2)',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.5,
        className: 'user-location-circle'
      }).addTo(map);
      
      setLocating(false);
    };
    
    const onLocationError = () => {
      setLocating(false);
    };
    
    // Clean up previous listeners first
    map.off('locationfound', onLocationFound);
    map.off('locationerror', onLocationError);
    
    // Register new listeners
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
  };
  
  return (
    <div className="apple-map-controls">
      <div className="apple-zoom-control">
        <button 
          onClick={() => map.zoomIn()} 
          className="apple-control-button apple-zoom-in"
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button 
          onClick={() => map.zoomOut()} 
          className="apple-control-button apple-zoom-out"
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      
      <div className="apple-location-control">
        <button 
          onClick={handleLocateMe} 
          className={`apple-control-button apple-locate-button ${locating ? 'locating' : ''}`}
          disabled={locating}
          aria-label="Locate me"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <circle cx="12" cy="12" r="8"></circle>
            <line x1="12" y1="2" x2="12" y2="4"></line>
            <line x1="12" y1="20" x2="12" y2="22"></line>
            <line x1="20" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="12" x2="4" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Center on selected property component with smooth animation
const CenterMapOnProperty: React.FC<{property: Property | null | undefined}> = ({ property }) => {
  const map = useMap();
  
  useEffect(() => {
    if (property?.latitude && property?.longitude) {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Use flyTo for smoother animation
        map.flyTo([lat, lng], 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [property, map]);
  
  return null;
};

export const SimpleMapComponent: React.FC<SimpleMapComponentProps> = ({
  properties,
  onPropertySelect,
  selectedProperty,
  layerStates
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Define center for Benton County, WA
  const bentonCountyCenter: [number, number] = [46.2503, -119.2537]; 
  const defaultZoom = 11;

  return (
    <div 
      ref={mapContainerRef}
      className="map-container apple-inspired"
    >
      <MapContainer
        center={bentonCountyCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false} // Remove default zoom control for clean UI
        attributionControl={false} // Hide attribution for cleaner UI
        fadeAnimation={true}
        markerZoomAnimation={true}
        className="apple-map-container"
      >
        {/* Apple-inspired map layers */}
        <MapLayers layerStates={layerStates} />
        
        {/* Property Markers */}
        {properties.map((property) => {
          if (!property.latitude || !property.longitude) return null;
          
          const lat = Number(property.latitude);
          const lng = Number(property.longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null;
          
          const isSelected = selectedProperty?.id === property.id;
          
          // Create a custom marker icon based on selection state
          const markerIcon = L.divIcon({
            className: 'apple-marker-icon',
            html: `<div style="
              background-color: ${isSelected ? '#0066CC' : '#FF3B30'};
              width: 14px;
              height: 14px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 1px 6px rgba(0,0,0,0.3);
              transform: ${isSelected ? 'scale(1.4)' : 'scale(1)'};
              transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          
          return (
            <Marker
              key={property.id}
              position={[lat, lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  onPropertySelect({
                    ...property,
                    propertyType: property.propertyType || null
                  });
                },
              }}
            >
              <Popup closeButton={false} className="apple-style-popup">
                <div style={{ 
                  fontSize: '14px', 
                  width: '220px',
                  padding: '4px 0'
                }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px', 
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    {property.address || 'Property'}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    fontSize: '13px',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Parcel ID</p>
                      <p style={{ margin: '0', fontWeight: '500' }}>{property.parcelId}</p>
                    </div>
                    {property.value && (
                      <div>
                        <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Value</p>
                        <p style={{ margin: '0', fontWeight: '500' }}>${Number(property.value).toLocaleString()}</p>
                      </div>
                    )}
                    {property.squareFeet && (
                      <div>
                        <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Size</p>
                        <p style={{ margin: '0', fontWeight: '500' }}>{property.squareFeet.toLocaleString()} sqft</p>
                      </div>
                    )}
                    {property.yearBuilt && (
                      <div>
                        <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Built</p>
                        <p style={{ margin: '0', fontWeight: '500' }}>{property.yearBuilt}</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onPropertySelect({
                      ...property,
                      propertyType: property.propertyType || null
                    })}
                    style={{
                      backgroundColor: '#0066CC',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'center',
                      width: '100%',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Center on selected property */}
        <CenterMapOnProperty property={selectedProperty} />
        
        {/* Custom Apple-style map controls */}
        <AppleMapControls />
      </MapContainer>
    </div>
  );
};

export default SimpleMapComponent;