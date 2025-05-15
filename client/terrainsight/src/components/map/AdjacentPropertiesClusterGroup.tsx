import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Property } from '@/shared/schema';
import { formatCurrency } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';
import { getAppMode } from '@/config/appMode';
import { 
  findAdjacentProperties,
  AdjacentPropertyResult 
} from '@/services/comparison/adjacentPropertiesService';
import { standardizeCoordinates } from '@/utils/coordinateTransformer';

// Import extended CSS for custom cluster styling
import './marker-cluster-custom.css';

// Interface for the cluster functionality
interface MarkerClusterOptions {
  chunkedLoading?: boolean;
  spiderfyOnMaxZoom?: boolean;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  maxClusterRadius?: number;
  iconCreateFunction?: (cluster: any) => L.DivIcon;
  animate?: boolean;
  animateAddingMarkers?: boolean;
  disableClusteringAtZoom?: number;
}

// Extend the Leaflet namespace
declare global {
  interface Window {
    L: typeof L & {
      markerClusterGroup(options?: MarkerClusterOptions): any;
    }
  }
}

// When using types from a module augmentation, we need to declare this
declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    chunkedLoading?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    iconCreateFunction?: (cluster: any) => L.DivIcon;
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

interface AdjacentPropertiesClusterGroupProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  selectedProperty?: Property | null;
  maxAdjacentProperties?: number;
  maxDistanceKm?: number;
}

const AdjacentPropertiesClusterGroup: React.FC<AdjacentPropertiesClusterGroupProps> = ({
  properties,
  onPropertySelect,
  selectedProperty,
  maxAdjacentProperties = 5,
  maxDistanceKm = 0.5
}) => {
  const map = useMap();
  const { isStandalone } = useAppMode();
  const mode = getAppMode(); // Get mode string from config
  const [showAdjacentProperties, setShowAdjacentProperties] = useState<boolean>(false);
  
  // Interface for the cluster
  interface Cluster {
    getChildCount(): number;
    getAllChildMarkers(): any[];
  }
  
  // Function to create custom cluster icon
  const createClusterCustomIcon = function(cluster: Cluster) {
    const childCount = cluster.getChildCount();
    
    // Determine icon size and class based on marker count
    let size = 'small';
    let additionalClass = '';
    
    if (childCount > 50) {
      size = 'large';
      additionalClass = 'cluster-large';
    } else if (childCount > 20) {
      size = 'medium';
      additionalClass = 'cluster-medium';
    } else {
      additionalClass = 'cluster-small';
    }
    
    // Calculate average property value for the cluster
    const markers = cluster.getAllChildMarkers();
    let totalValue = 0;
    let validValueCount = 0;
    
    markers.forEach((marker: any) => {
      // Access property from the custom property we added to the marker
      const property = marker.property as Property;
      if (property && property.value) {
        // Extract numeric value from string like '$350,000'
        const numericValue = parseInt(property.value.toString().replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numericValue)) {
          totalValue += numericValue;
          validValueCount++;
        }
      }
    });
    
    const avgValue = validValueCount > 0 ? Math.round(totalValue / validValueCount) : 0;
    const formattedAvgValue = avgValue > 0 ? formatCurrency(avgValue) : '';
    
    // Create HTML for cluster icon
    const html = `
      <div class="marker-cluster marker-cluster-${size} ${additionalClass}">
        <div class="marker-cluster-inner">
          <span class="marker-cluster-count">${childCount}</span>
          ${formattedAvgValue ? `<span class="marker-cluster-value">${formattedAvgValue}</span>` : ''}
        </div>
      </div>
    `;
    
    return L.divIcon({
      html: html,
      className: `custom-marker-cluster custom-marker-cluster-${size}`,
      iconSize: L.point(40, 40)
    });
  };

  useEffect(() => {
    // Clean up previous clusters
    map.eachLayer(layer => {
      if ((layer as any)._leaflet_id && (layer as any)._markerCluster) {
        map.removeLayer(layer);
      }
    });
    
    // Create new cluster group with custom options
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 80, // Adjust for desired clustering density
      iconCreateFunction: createClusterCustomIcon,
      // Animation options
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 18, // At max zoom, disable clustering
    });
    
    // Add markers for each property
    properties.forEach(property => {
      // Skip properties without coordinates
      if (!property.latitude || !property.longitude) return;
      
      // Convert string coordinates to numbers and check they're in a reasonable range
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      // Skip properties with invalid coordinates
      if (isNaN(lat) || isNaN(lng)) return;
      
      // No additional filtering here - we're now correcting the coordinates 
      // in the MapComponent before they reach this component
      
      // Create marker for this property
      const isSelected = selectedProperty && selectedProperty.id === property.id;
      
      // Custom marker icon based on property type
      const iconUrl = getMarkerIconForProperty(property, isSelected || false);
      const markerIcon = L.icon({
        iconUrl,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        className: `property-marker-enhanced ${isSelected ? 'marker-selected' : ''}`
      });
      
      // Create and configure the marker
      const marker = L.marker([lat, lng], {
        icon: markerIcon,
      }) as L.Marker;
      
      // Store the property data on the marker instance directly
      (marker as any).property = property;
      
      marker.on('click', () => {
        // Get adjacent properties when marker is clicked
        const adjacentProperties = findAdjacentProperties(property, properties, {
          maxDistanceKm,
          maxResults: maxAdjacentProperties,
          excludeSameOwner: true
        });
        
        // Create custom popup content with adjacent properties info
        const popupContent = document.createElement('div');
        popupContent.className = 'property-popup-enhanced';
        
        // Main property info
        const propertyInfo = document.createElement('div');
        propertyInfo.className = 'property-info';
        propertyInfo.innerHTML = `
          <div class="font-medium mb-1">${property.address}</div>
          <div class="text-sm">
            ${formatCurrency(property.value || 0)}
            ${property.squareFeet ? ` • ${property.squareFeet.toLocaleString()} sq ft` : ''}
            ${property.yearBuilt ? ` • Built ${property.yearBuilt}` : ''}
          </div>
        `;
        
        // Add details button
        const detailsButton = document.createElement('button');
        detailsButton.className = 'details-button mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center';
        detailsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> View Details';
        detailsButton.onclick = (e) => {
          e.stopPropagation();
          marker.closePopup();
          onPropertySelect(property);
        };
        propertyInfo.appendChild(detailsButton);
        
        popupContent.appendChild(propertyInfo);
        
        // Add separator
        if (adjacentProperties.length > 0) {
          const separator = document.createElement('hr');
          separator.className = 'my-2 border-t border-gray-200';
          popupContent.appendChild(separator);
          
          // Adjacent properties section
          const adjacentTitle = document.createElement('div');
          adjacentTitle.className = 'text-sm font-medium flex items-center mb-1';
          adjacentTitle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
            Adjacent Properties (${adjacentProperties.length})
          `;
          popupContent.appendChild(adjacentTitle);
          
          // Create list of adjacent properties
          const adjacentList = document.createElement('div');
          adjacentList.className = 'adjacent-properties-list max-h-32 overflow-y-auto';
          
          adjacentProperties.forEach((result, index) => {
            const { property: adjProperty, distanceKm, direction } = result;
            
            const adjacentItem = document.createElement('div');
            adjacentItem.className = 'adjacent-property-item py-1 text-xs border-b border-gray-100 cursor-pointer hover:bg-gray-50';
            if (index === adjacentProperties.length - 1) {
              adjacentItem.classList.remove('border-b');
            }
            
            adjacentItem.innerHTML = `
              <div class="font-medium">${adjProperty.address}</div>
              <div class="flex justify-between mt-0.5">
                <span>${formatCurrency(adjProperty.value || 0)}</span>
                <span class="bg-blue-100 text-blue-800 px-1 rounded-full text-xs">${formatDistance(distanceKm)} ${direction || ''}</span>
              </div>
            `;
            
            adjacentItem.onclick = (e) => {
              e.stopPropagation();
              marker.closePopup();
              onPropertySelect(adjProperty);
            };
            
            adjacentList.appendChild(adjacentItem);
          });
          
          popupContent.appendChild(adjacentList);
        }
        
        // Set popup content and open it
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'adjacent-properties-popup'
        }).openPopup();
      });
      
      // Add basic tooltip
      marker.bindTooltip(`
        <div class="property-tooltip">
          <div class="font-medium">${property.address}</div>
          <div>${property.value || 'No value'}</div>
        </div>
      `, { 
        direction: 'top',
        offset: [0, -15],
        opacity: 0.9,
        className: 'property-tooltip'
      });
      
      // Add marker to cluster group
      clusterGroup.addLayer(marker);
    });
    
    // Add the cluster group to the map
    map.addLayer(clusterGroup);
    
    // Clean up on unmount
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [properties, map, onPropertySelect, selectedProperty, maxAdjacentProperties, maxDistanceKm]);
  
  // Helper to get icon based on property type
  function getMarkerIconForProperty(property: Property, isSelected: boolean): string {
    const baseUrl = '/markers/';
    const type = property.propertyType?.toLowerCase() || 'unknown';
    
    // Base markers by property type
    const iconMap: {[key: string]: string} = {
      'residential': baseUrl + 'house.svg',
      'commercial': baseUrl + 'commercial.svg',
      'industrial': baseUrl + 'industrial.svg',
      'agricultural': baseUrl + 'farm.svg',
      'vacant': baseUrl + 'vacant.svg',
      'unknown': baseUrl + 'property.svg'
    };
    
    // Use default if type not in mapping
    const iconPath = iconMap[type] || iconMap.unknown;
    
    // Use our SVG files for marker icons
    return iconPath;
  }
  
  // Format distance for display
  function formatDistance(distanceKm: number): string {
    if (distanceKm < 0.1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  }
  
  // This component doesn't render any visible elements directly
  return null;
};

export default AdjacentPropertiesClusterGroup;