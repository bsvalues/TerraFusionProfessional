import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap, FeatureGroup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { Property } from '@shared/schema';
import { 
  Search, 
  Layers, 
  Map, 
  FileText, 
  ChevronUp, 
  ChevronDown, 
  BarChart2, 
  Sliders, 
  Filter, 
  X, 
  ArrowUpRight,
  TrendingUp,
  Building2,
  DollarSign,
  Home
} from 'lucide-react';
import GeoJSONLayerComponent from './GeoJSONLayerComponent';
import { overlayLayerSources, basemapSources } from './layerSources';
import { formatCurrency } from '@/lib/utils';
import { PropertyWithOptionalFields } from './PropertySelectionContext';

// Define MapLayerState type for layer management
export interface MapLayerState {
  id: string;
  name: string;
  enabled: boolean;
}

// Define the ArcGIS service endpoints based on the documentation
const ARCGIS_SERVICES = {
  imagery: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  light: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
};

interface EnhancedMapComponentProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onPropertySelect: (property: PropertyWithOptionalFields) => void;
  selectedProperty?: Property | null;
  baseLayers?: MapLayerState[];
  viewableLayers?: MapLayerState[];
  analysisLayers?: MapLayerState[];
}

// Custom Map Controls
const MapControls: React.FC = () => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  
  const handleLocate = () => {
    setIsLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
    
    map.once('locationfound', () => {
      setIsLocating(false);
    });
    
    map.once('locationerror', () => {
      setIsLocating(false);
      console.error('Location error');
    });
  };
  
  return (
    <div className="apple-map-controls">
      <div className="apple-zoom-control">
        <button 
          onClick={() => map.zoomIn()} 
          className="apple-control-button apple-zoom-in"
          aria-label="Zoom in"
        >
          <ChevronUp size={16} />
        </button>
        <button 
          onClick={() => map.zoomOut()} 
          className="apple-control-button apple-zoom-out"
          aria-label="Zoom out"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      
      <div className="apple-location-control">
        <button 
          onClick={handleLocate} 
          className={`apple-control-button ${isLocating ? 'locating' : ''}`}
          disabled={isLocating}
          aria-label="Find my location"
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

// Property Markers Component
const PropertyMarkers: React.FC<{
  properties: Property[];
  onPropertySelect: (property: PropertyWithOptionalFields) => void;
  selectedProperty?: Property | null;
}> = ({ properties, onPropertySelect, selectedProperty }) => {
  const map = useMap();
  
  useEffect(() => {
    const markerGroup = L.featureGroup().addTo(map);
    
    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return;
      
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const isSelected = selectedProperty?.id === property.id;
      
      // Create custom icon for property
      const markerIcon = L.divIcon({
        className: 'apple-marker-icon',
        html: `<div style="
          background-color: ${isSelected ? '#0066CC' : property.propertyType === 'commercial' ? '#FF9500' : '#34C759'};
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
      
      const marker = L.marker([lat, lng], { 
        icon: markerIcon,
        keyboard: true,
        title: property.address || 'Property',
        alt: `Property at ${property.address || 'unknown address'}`
      });
      
      marker.on('click', () => {
        onPropertySelect({
          ...property,
          propertyType: property.propertyType || null
        });
      });
      
      markerGroup.addLayer(marker);
    });
    
    // Fit bounds if we have properties and no selected property
    if (properties.length > 0 && !selectedProperty) {
      map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
    }
    
    // If we have a selected property, make sure it's visible
    if (selectedProperty?.latitude && selectedProperty?.longitude) {
      const lat = Number(selectedProperty.latitude);
      const lng = Number(selectedProperty.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        map.flyTo([lat, lng], 16, {
          animate: true,
          duration: 1,
        });
      }
    }
    
    return () => {
      map.removeLayer(markerGroup);
    };
  }, [map, properties, selectedProperty, onPropertySelect]);
  
  return null;
};

// Map Legend Component
const MapLegend: React.FC = () => {
  return (
    <div className="map-legend">
      <div className="map-legend-title">
        <Layers size={14} />
        Property Legend
      </div>
      
      <div className="heat-map-legend">
        <div className="map-legend-item">
          <div className="map-legend-color category-residential"></div>
          <div className="map-legend-label">Residential</div>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-color category-commercial"></div>
          <div className="map-legend-label">Commercial</div>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-color category-agricultural"></div>
          <div className="map-legend-label">Agricultural</div>
        </div>
        
        <div className="map-legend-footer">
          Data Source: Benton County GIS, 2024
        </div>
      </div>
    </div>
  );
};

// Property Info Card Component
const PropertyInfoCard: React.FC<{
  property: Property;
  onClose: () => void;
  onViewDetails: (property: Property) => void;
}> = ({ property, onClose, onViewDetails }) => {
  return (
    <div className="property-info-card">
      <div className="property-info-header">
        <h3 className="property-info-title">{property.address}</h3>
        <button className="property-info-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      
      <div className="property-info-grid">
        <div className="property-info-item">
          <div className="property-info-label">Parcel ID</div>
          <div className="property-info-value">{property.parcelId}</div>
        </div>
        <div className="property-info-item">
          <div className="property-info-label">Value</div>
          <div className="property-info-value">
            {property.value ? formatCurrency(Number(property.value)) : 'Not available'}
          </div>
        </div>
        <div className="property-info-item">
          <div className="property-info-label">Square Feet</div>
          <div className="property-info-value">{property.squareFeet.toLocaleString()}</div>
        </div>
        <div className="property-info-item">
          <div className="property-info-label">Year Built</div>
          <div className="property-info-value">{property.yearBuilt || 'Unknown'}</div>
        </div>
      </div>
      
      <div className="property-info-footer">
        <button 
          className="property-info-button secondary"
          onClick={onClose}
        >
          Close
        </button>
        <button 
          className="property-info-button primary"
          onClick={() => onViewDetails(property)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

// Map Toolbar Component
const MapToolbar: React.FC<{
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}> = ({ activeLayer, onLayerChange }) => {
  return (
    <div className="map-toolbar">
      <button 
        className={`toolbar-button ${activeLayer === 'parcels' ? 'active' : ''}`}
        onClick={() => onLayerChange('parcels')}
      >
        <Home size={14} />
        Parcels
      </button>
      <button 
        className={`toolbar-button ${activeLayer === 'values' ? 'active' : ''}`}
        onClick={() => onLayerChange('values')}
      >
        <DollarSign size={14} />
        Values
      </button>
      <button 
        className={`toolbar-button ${activeLayer === 'trends' ? 'active' : ''}`}
        onClick={() => onLayerChange('trends')}
      >
        <TrendingUp size={14} />
        Trends
      </button>
      <button 
        className={`toolbar-button ${activeLayer === 'analytics' ? 'active' : ''}`}
        onClick={() => onLayerChange('analytics')}
      >
        <BarChart2 size={14} />
        Analytics
      </button>
    </div>
  );
};

// Map Search Component
const MapSearch: React.FC<{
  onSearch: (query: string) => void;
}> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  return (
    <div className="map-search-container">
      <form onSubmit={handleSearch}>
        <input 
          type="text"
          className="map-search-input"
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="map-search-icon" size={16} />
      </form>
    </div>
  );
};

// Layer Panel Component
const LayerPanel: React.FC<{
  baseLayers: MapLayerState[];
  viewableLayers: MapLayerState[];
  analysisLayers: MapLayerState[];
  onBaseLayerToggle: (id: string) => void;
  onViewableLayerToggle: (id: string) => void;
  onAnalysisLayerToggle: (id: string) => void;
}> = ({
  baseLayers,
  viewableLayers,
  analysisLayers,
  onBaseLayerToggle,
  onViewableLayerToggle,
  onAnalysisLayerToggle
}) => {
  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3 className="layer-panel-title">Map Layers</h3>
      </div>
      
      <div className="layer-panel-content">
        <div className="layer-group">
          <h4 className="layer-group-title">Base Maps</h4>
          {baseLayers.map(layer => (
            <div key={layer.id} className="layer-item">
              <input
                type="radio"
                name="baseLayer"
                id={`base-${layer.id}`}
                checked={layer.enabled}
                onChange={() => onBaseLayerToggle(layer.id)}
                className="layer-checkbox"
              />
              <label htmlFor={`base-${layer.id}`} className="layer-label">
                {layer.name}
              </label>
            </div>
          ))}
        </div>
        
        <div className="layer-group">
          <h4 className="layer-group-title">GIS Layers</h4>
          {viewableLayers.map(layer => (
            <div key={layer.id} className="layer-item">
              <input
                type="checkbox"
                id={`view-${layer.id}`}
                checked={layer.enabled}
                onChange={() => onViewableLayerToggle(layer.id)}
                className="layer-checkbox"
              />
              <label htmlFor={`view-${layer.id}`} className="layer-label">
                {layer.name}
              </label>
            </div>
          ))}
        </div>
        
        <div className="layer-group">
          <h4 className="layer-group-title">Analysis</h4>
          {analysisLayers.map(layer => (
            <div key={layer.id} className="layer-item">
              <input
                type="checkbox"
                id={`analysis-${layer.id}`}
                checked={layer.enabled}
                onChange={() => onAnalysisLayerToggle(layer.id)}
                className="layer-checkbox"
              />
              <label htmlFor={`analysis-${layer.id}`} className="layer-label">
                {layer.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// KPI Bar Component
const KPIBar: React.FC = () => {
  return (
    <div className="map-kpi-bar">
      <div className="kpi-card">
        <div className="kpi-title">Average Value</div>
        <div className="kpi-value">$324,500</div>
        <div className="kpi-trend up">
          <ArrowUpRight size={12} className="kpi-trend-icon" />
          2.3% from last year
        </div>
      </div>
      
      <div className="kpi-card">
        <div className="kpi-title">Property Count</div>
        <div className="kpi-value">8,432</div>
        <div className="kpi-trend up">
          <ArrowUpRight size={12} className="kpi-trend-icon" />
          156 new properties
        </div>
      </div>
      
      <div className="kpi-card">
        <div className="kpi-title">Market Growth</div>
        <div className="kpi-value">+5.2%</div>
        <div className="kpi-trend up">
          <ArrowUpRight size={12} className="kpi-trend-icon" />
          0.8% above county avg
        </div>
      </div>
    </div>
  );
};

// Main Enhanced Map Component
export const EnhancedMapComponent: React.FC<EnhancedMapComponentProps> = ({
  properties,
  center = [46.20, -119.35], // Benton County, WA default center based on real data
  zoom = 10, // Default zoom level - wider to show more properties
  onPropertySelect,
  selectedProperty,
  baseLayers: initialBaseLayers,
  viewableLayers: initialViewableLayers,
  analysisLayers: initialAnalysisLayers
}) => {
  // Define default layers if not provided
  const defaultBaseLayers: MapLayerState[] = [
    { id: 'imagery', name: 'Satellite', enabled: false },
    { id: 'streets', name: 'Streets', enabled: true },
    { id: 'topo', name: 'Topographic', enabled: false },
    { id: 'light', name: 'Light', enabled: false },
  ];
  
  // Create default viewable layers with IDs matching overlayLayerSources
  const defaultViewableLayers: MapLayerState[] = overlayLayerSources.map(src => ({
    id: src.id,
    name: src.name,
    enabled: src.id === 'parcels' // Only parcels enabled by default
  }));
  
  const defaultAnalysisLayers: MapLayerState[] = [
    { id: 'value-heatmap', name: 'Value Heatmap', enabled: false },
    { id: 'market-trends', name: 'Market Trends', enabled: false },
    { id: 'property-clusters', name: 'Property Clusters', enabled: false },
    { id: 'neighborhood-analytics', name: 'Neighborhood Analysis', enabled: false },
  ];
  
  const [baseLayers, setBaseLayers] = useState(initialBaseLayers || defaultBaseLayers);
  const [viewableLayers, setViewableLayers] = useState(initialViewableLayers || defaultViewableLayers);
  const [analysisLayers, setAnalysisLayers] = useState(initialAnalysisLayers || defaultAnalysisLayers);
  
  const [activeToolbar, setActiveToolbar] = useState('parcels');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  
  // Handle base layer toggle - only one can be active at a time
  const handleBaseLayerToggle = (id: string) => {
    setBaseLayers(
      baseLayers.map((layer) => ({
        ...layer,
        enabled: layer.id === id,
      }))
    );
  };
  
  // Handle viewable layer toggle - multiple can be active
  const handleViewableLayerToggle = (id: string) => {
    console.log(`Toggling layer: ${id}`);
    setViewableLayers(
      viewableLayers.map((layer) => {
        const newState = layer.id === id ? !layer.enabled : layer.enabled;
        if (layer.id === id) {
          console.log(`Layer ${layer.id} toggled from ${layer.enabled} to ${newState}`);
        }
        return {
          ...layer,
          enabled: newState,
        };
      })
    );
  };
  
  // Handle analysis layer toggle - multiple can be active
  const handleAnalysisLayerToggle = (id: string) => {
    setAnalysisLayers(
      analysisLayers.map((layer) => ({
        ...layer,
        enabled: layer.id === id ? !layer.enabled : layer.enabled,
      }))
    );
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implementation of search logic would go here
    console.log('Searching for:', query);
  };
  
  // Get the active base layer
  const activeBaseLayer = baseLayers.find((layer) => layer.enabled);
  
  // Track layer changes with useEffect
  useEffect(() => {
    console.log('Active viewable layers:', viewableLayers.filter(l => l.enabled).map(l => l.id));
  }, [viewableLayers]);
  
  return (
    <div className="map-container apple-inspired">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false}
        className="apple-map-container"
      >
        {/* Base Layer */}
        {activeBaseLayer?.id === 'imagery' && (
          <TileLayer
            url={ARCGIS_SERVICES.imagery}
            attribution="Esri World Imagery"
          />
        )}
        
        {activeBaseLayer?.id === 'streets' && (
          <TileLayer
            url={ARCGIS_SERVICES.streets}
            attribution="Esri World Street Map"
          />
        )}
        
        {activeBaseLayer?.id === 'topo' && (
          <TileLayer
            url={ARCGIS_SERVICES.topo}
            attribution="Esri World Topo Map"
          />
        )}
        
        {activeBaseLayer?.id === 'light' && (
          <TileLayer
            url={ARCGIS_SERVICES.light}
            attribution="CartoDB"
          />
        )}
        
        {/* GeoJSON Layers */}
        {/* Track layer changes with useEffect outside JSX */}
        
        {viewableLayers
          .filter((layer) => layer.enabled)
          .map((layer) => {
            const overlayLayer = overlayLayerSources.find((src) => src.id === layer.id);
            console.log(`Looking for layer ${layer.id}:`, overlayLayer ? 'Found' : 'Not found');
            if (!overlayLayer) return null;
            
            return (
              <GeoJSONLayerComponent
                key={overlayLayer.id}
                id={overlayLayer.id}
                url={overlayLayer.url}
                attribution={overlayLayer.attribution}
                opacity={overlayLayer.opacity}
                style={overlayLayer.options?.style}
                onClick={(e: any) => {
                  // Handle clicks on GeoJSON layers
                  const layer = e.target || {};
                  const feature = layer.feature || {};
                  const featureProps = feature.properties || {};
                  
                  // Check if there's a matched property from our algorithm
                  if (featureProps.matchedProperty) {
                    onPropertySelect(featureProps.matchedProperty);
                  } else if (onPropertySelect) {
                    // If no match but we have ID, name, etc. in the GeoJSON properties, create a minimal property
                    if (featureProps.id || featureProps.parcelId) {
                      // Use type assertion to handle dynamic property creation
                      const propertyData = {
                        id: featureProps.id || -1,
                        parcelId: featureProps.parcelId || `unknown-${Math.random().toString(36).slice(2, 7)}`,
                        address: featureProps.address || 'Unknown Address',
                        owner: featureProps.owner || null,
                        value: featureProps.value ? String(featureProps.value) : null,
                        estimatedValue: featureProps.estimatedValue || null,
                        salePrice: featureProps.salePrice || null,
                        squareFeet: featureProps.squareFeet || 0,
                        yearBuilt: featureProps.yearBuilt || null,
                        bedrooms: featureProps.bedrooms || null,
                        bathrooms: featureProps.bathrooms || null,
                        propertyType: featureProps.propertyType || null,
                        zoning: featureProps.zoning || null,
                        taxAssessment: featureProps.taxAssessment || null,
                        lotSize: featureProps.lotSize || null,
                        latitude: e.latlng?.lat ? String(e.latlng.lat) : null,
                        longitude: e.latlng?.lng ? String(e.latlng.lng) : null,
                        coordinates: e.latlng ? { lat: e.latlng.lat, lng: e.latlng.lng } : null,
                        lastSaleDate: featureProps.lastSaleDate || null,
                        landValue: featureProps.landValue || null,
                        neighborhood: featureProps.neighborhood || null,
                        pricePerSqFt: featureProps.pricePerSqFt || null,
                        attributes: featureProps.attributes || null,
                        historicalValues: featureProps.historicalValues || null,
                        sourceId: featureProps.sourceId || null,
                        zillowId: featureProps.zillowId || null
                      };
                      
                      onPropertySelect(propertyData as PropertyWithOptionalFields);
                    }
                  }
                }}
              />
            );
          })}
        
        {/* Property Markers */}
        <PropertyMarkers
          properties={properties}
          onPropertySelect={onPropertySelect}
          selectedProperty={selectedProperty}
        />
        
        {/* Map Controls */}
        <MapControls />
      </MapContainer>
      
      {/* UI Components Outside of Map */}
      {/* Map Toolbar */}
      <MapToolbar
        activeLayer={activeToolbar}
        onLayerChange={setActiveToolbar}
      />
      
      {/* Search Component */}
      <MapSearch onSearch={handleSearch} />
      
      {/* Layer Panel Toggle */}
      <button
        className="layer-toggle-button apple-style-control"
        onClick={() => setShowLayerPanel(!showLayerPanel)}
        aria-label={showLayerPanel ? 'Hide layers' : 'Show layers'}
      >
        <Layers size={16} />
      </button>
      
      {/* Layer Panel (conditionally rendered) */}
      {showLayerPanel && (
        <LayerPanel
          baseLayers={baseLayers}
          viewableLayers={viewableLayers}
          analysisLayers={analysisLayers}
          onBaseLayerToggle={handleBaseLayerToggle}
          onViewableLayerToggle={handleViewableLayerToggle}
          onAnalysisLayerToggle={handleAnalysisLayerToggle}
        />
      )}
      
      {/* Selected Property Info Card */}
      {selectedProperty && (
        <PropertyInfoCard
          property={selectedProperty}
          onClose={() => onPropertySelect({ ...selectedProperty, id: -1 })} // Hack to deselect property
          onViewDetails={() => console.log('View details for:', selectedProperty)}
        />
      )}
      
      {/* KPI Bar */}
      <KPIBar />
      
      {/* Map Legend */}
      <MapLegend />
    </div>
  );
};

export default EnhancedMapComponent;