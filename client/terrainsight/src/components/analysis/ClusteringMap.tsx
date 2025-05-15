import React, { useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Marker, 
  Popup, 
  LayersControl 
} from 'react-leaflet';
import { Property } from '../../shared/schema';
import { PropertyCluster } from '../../services/spatialClusteringService';
import { formatCurrency, cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MapBounds } from '../map/MapBounds';
import L from 'leaflet';
import { Info } from 'lucide-react';

// Default marker icon (we'll use this for all property types for now)
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Property type icons (using the same default icon for now)
const PROPERTY_ICONS: Record<string, L.Icon> = {
  'residential': defaultIcon,
  'commercial': defaultIcon,
  'industrial': defaultIcon,
  'farm': defaultIcon,
  'vacant': defaultIcon,
  'default': defaultIcon
};

export interface ClusteringMapProps {
  clusters: PropertyCluster[];
  onClusterSelect: (cluster: PropertyCluster) => void;
  onPropertySelect: (property: Property) => void;
  selectedCluster: PropertyCluster | null;
  selectedProperty: Property | null;
  className?: string;
}

export function ClusteringMap({
  clusters,
  onClusterSelect,
  onPropertySelect,
  selectedCluster,
  selectedProperty,
  className
}: ClusteringMapProps) {
  // Calculate map bounds based on all properties in all clusters
  const mapBounds = useMemo(() => {
    const coordinates: [number, number][] = [];
    
    clusters.forEach(cluster => {
      cluster.properties.forEach(property => {
        if (property.latitude && property.longitude) {
          coordinates.push([Number(property.latitude), Number(property.longitude)]);
        }
      });
    });
    
    return coordinates.length > 0 ? coordinates : undefined;
  }, [clusters]);
  
  // Get icon for property based on type
  const getPropertyIcon = (property: Property): L.Icon => {
    const type = property.propertyType?.toLowerCase() || 'default';
    return PROPERTY_ICONS[type] || PROPERTY_ICONS.default;
  };
  
  return (
    <MapContainer
      className={cn("w-full h-full min-h-[400px] rounded-md", className)}
      zoom={12}
      center={[40.7128, -74.006]} // Default center, will be updated by MapBounds
      style={{ height: '100%', width: '100%' }}
    >
      {/* Map bounds component to adjust view */}
      {mapBounds && <MapBounds bounds={mapBounds} padding={[20, 20]} />}
      
      {/* Base map layers */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      {/* Cluster centroids */}
      {clusters.map(cluster => (
        <CircleMarker
          key={`cluster-${cluster.id}`}
          center={cluster.centroid}
          radius={selectedCluster?.id === cluster.id ? 12 : 10}
          pathOptions={{
            fillColor: cluster.color,
            fillOpacity: 0.7,
            color: 'white',
            weight: 2,
            opacity: 0.8
          }}
          eventHandlers={{
            click: () => onClusterSelect(cluster)
          }}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-semibold text-base mb-1">Cluster {cluster.id + 1}</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">Properties:</span>
                <span>{cluster.statistics.propertyCount}</span>
                
                <span className="text-muted-foreground">Avg. Value:</span>
                <span>{formatCurrency(cluster.statistics.avgValue)}</span>
                
                <span className="text-muted-foreground">Avg. Sq Ft:</span>
                <span>{Math.round(cluster.statistics.avgSquareFeet).toLocaleString()}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => onClusterSelect(cluster)}
              >
                View Cluster Details
              </Button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      
      {/* Property markers (only shown when a cluster is selected) */}
      {selectedCluster && selectedCluster.properties.map(property => {
        if (!property.latitude || !property.longitude) return null;
        
        const isSelected = selectedProperty?.id === property.id;
        const icon = getPropertyIcon(property);
        
        return (
          <Marker
            key={`property-${property.id}`}
            position={[Number(property.latitude), Number(property.longitude)]}
            icon={icon}
            opacity={isSelected ? 1 : 0.7}
            eventHandlers={{
              click: () => onPropertySelect(property)
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="flex items-center gap-1 mb-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs capitalize"
                    style={{ background: `${selectedCluster.color}20`, borderColor: selectedCluster.color }}
                  >
                    {property.propertyType || 'Unknown'}
                  </Badge>
                  <h3 className="font-semibold text-sm">{property.address}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Parcel ID:</span>
                  <span>{property.parcelId}</span>
                  
                  <span className="text-muted-foreground">Value:</span>
                  <span>{property.value}</span>
                  
                  {property.squareFeet && (
                    <>
                      <span className="text-muted-foreground">Sq Ft:</span>
                      <span>{property.squareFeet.toLocaleString()}</span>
                    </>
                  )}
                  
                  {property.yearBuilt && (
                    <>
                      <span className="text-muted-foreground">Year Built:</span>
                      <span>{property.yearBuilt}</span>
                    </>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => onPropertySelect(property)}
                >
                  Property Details
                </Button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}