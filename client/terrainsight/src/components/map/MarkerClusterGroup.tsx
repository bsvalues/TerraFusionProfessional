import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Property } from '@/shared/schema';
import { createRoot } from 'react-dom/client';
import { AccessiblePropertyMarker } from './AccessiblePropertyMarker';

// Extend leaflet typings to include MarkerClusterGroup
declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    chunkedLoading?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    disableClusteringAtZoom?: number;
  }

  class MarkerCluster {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
  }

  class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayers(layers: L.Layer[]): this;
    clearLayers(): this;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}

interface MarkerClusterGroupProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  selectedProperty?: Property | null;
}

export const MarkerClusterGroup: React.FC<MarkerClusterGroupProps> = ({
  properties,
  onPropertySelect,
  selectedProperty
}) => {
  const map = useMap();

  useEffect(() => {
    // Create a new marker cluster group
    const markerCluster = L.markerClusterGroup();

    // Add markers for each property
    properties.forEach(property => {
      if (property.latitude && property.longitude) {
        const marker = L.marker([
          parseFloat(property.latitude.toString()), 
          parseFloat(property.longitude.toString())
        ]);

        marker.on('click', () => onPropertySelect(property));
        markerCluster.addLayer(marker);
      }
    });

    // Add the marker cluster to the map
    map.addLayer(markerCluster);

    // Cleanup on unmount
    return () => {
      map.removeLayer(markerCluster);
    };
  }, [properties, onPropertySelect, map]);

  return null;
};