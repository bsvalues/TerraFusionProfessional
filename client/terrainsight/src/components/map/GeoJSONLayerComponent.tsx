import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { mapGeoJSONUrl } from './GeoJSONLayerMapper';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { transformGeoJSON } from '../../utils/coordinateTransform';

// Define props interface for the GeoJSON layer component
interface GeoJSONLayerProps {
  url: string;
  attribution?: string;
  opacity?: number;
  id: string;
  style?: L.PathOptions;
  onClick?: (e: L.LeafletMouseEvent) => void;
}

/**
 * GeoJSON Layer Component
 * Fetches and displays GeoJSON data on the map from either:
 * 1. Local API endpoint (recommended)
 * 2. ArcGIS REST API (requires specific parameters)
 */
const GeoJSONLayerComponent: React.FC<GeoJSONLayerProps> = ({
  url,
  attribution = '',
  opacity = 0.7,
  id,
  style = {
    color: '#4287f5',
    weight: 1,
    fillOpacity: 0.2
  },
  onClick
}) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch property data to match with map features
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      if (id !== 'parcels' && id !== 'parcelsAndAssess') return null;
      
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) return null;
        return response.json() as Promise<Property[]>;
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        return null;
      }
    },
    enabled: id === 'parcels' || id === 'parcelsAndAssess',
    staleTime: 300000, // Cache for 5 minutes
  });

  useEffect(() => {
    let geoJSONLayer: L.GeoJSON | null = null;
    
    // Map the URL to the correct server endpoint format
    const mappedUrl = mapGeoJSONUrl(url);
    console.log(`Fetching GeoJSON data for ${id}...`);
    
    // Determine if this is an ArcGIS REST API URL or a local API URL
    const isArcGisUrl = mappedUrl.includes('arcgis.com');
    
    let fullUrl = mappedUrl;
    
    // For ArcGIS URLs, add the necessary parameters
    if (isArcGisUrl) {
      // We'll prefer our local API endpoints, but if we must use ArcGIS directly,
      // we need to include the proper parameters for Washington State Plane South (WKID: 2927)
      // and request reprojection to WGS84 (WKID: 4326) for Leaflet compatibility
      const queryParams = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        returnGeometry: 'true',
        f: 'geojson',
        resultRecordCount: '1000', // Limit to prevent overwhelming the browser
        outSR: '4326' // Request WGS84 coordinates which Leaflet uses
      });
      
      fullUrl = `${mappedUrl}?${queryParams.toString()}`;
      
      console.warn(`Using direct ArcGIS connection for ${id}. Consider using local API instead.`);
    }
    
    // Fetch the GeoJSON data
    fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch GeoJSON data: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Check if we actually got GeoJSON data
        if (!data || !data.type || !data.features) {
          throw new Error('Invalid GeoJSON data received');
        }
        
        // Check if we need to transform the coordinates from WA State Plane South to WGS84
        let processedData = data;
        
        // Always apply coordinate transformation for GeoJSON data from Benton County
        // The spatialReference in the ArcGIS service is EPSG:2927 (WA State Plane South)
        const needsTransformation = 
          // 1. Direct ArcGIS data (always assume it's in WA State Plane South)
          isArcGisUrl || 
          // 2. Explicit CRS information in the GeoJSON
          (data.crs && data.crs.properties && (
            data.crs.properties.name === 'EPSG:2927' || 
            (data.crs.properties.code && data.crs.properties.code === 2927)
          )) ||
          // 3. Spatial reference object with WKID 2927
          (data.spatialReference && (
            data.spatialReference.wkid === 2927 || 
            data.spatialReference.latestWkid === 2927
          )) ||
          // 4. For parcels and county data, always assume Washington State Plane South
          (id.includes('parcel') || id.includes('county'));
          
        if (needsTransformation) {
          console.log(`Transforming coordinates for ${id} from WA State Plane South to WGS84...`);
          
          // Enable debug mode for important layer types
          const enableDebug = id.includes('parcel') || id.includes('county');
          processedData = transformGeoJSON(data, enableDebug);
          
          // Log the coordinate system information
          if (enableDebug) {
            if (data.spatialReference) {
              console.log(`Original Spatial Reference:`, data.spatialReference);
            }
            if (data.crs) {
              console.log(`Original CRS:`, data.crs);
            }
          }
        }
        
        // Create GeoJSON layer with enhanced options
        geoJSONLayer = L.geoJSON(processedData, {
          style: (feature) => {
            // Allow style to be determined by feature properties
            // This enables styling based on zoning type, value ranges, etc.
            const baseStyle = {...style};
            
            // Apply styling based on zoning or property type if available
            if (feature?.properties?.zoning) {
              const zone = feature.properties.zoning.toLowerCase();
              
              if (zone.includes('resident')) {
                baseStyle.color = '#5856D6'; // Purple for residential
              } else if (zone.includes('commerc')) {
                baseStyle.color = '#FF9500'; // Orange for commercial
              } else if (zone.includes('industr')) {
                baseStyle.color = '#FF2D55'; // Pink for industrial
              } else if (zone.includes('agri')) {
                baseStyle.color = '#4CD964'; // Green for agricultural
              }
            }
            
            return baseStyle;
          },
          // Special handling for Point geometries - convert to circle markers
          pointToLayer: (feature, latlng) => {
            // Create a circle marker based on property values
            let radius = 5; // Default radius
            
            // Make markers for higher value properties larger
            if (feature.properties.TotalMarketValue) {
              const value = parseFloat(feature.properties.TotalMarketValue);
              if (!isNaN(value)) {
                // Logarithmic scale to handle wide range of values
                radius = Math.max(3, Math.min(10, Math.log10(value/1000) * 2));
              }
            }
            
            // Color based on property type/zoning
            let color = '#4287f5'; // Default blue
            if (feature.properties.property_use_desc) {
              const useDesc = feature.properties.property_use_desc.toLowerCase();
              if (useDesc.includes('resident')) {
                color = '#5856D6'; // Purple for residential
              } else if (useDesc.includes('commerc')) {
                color = '#FF9500'; // Orange for commercial
              } else if (useDesc.includes('industr')) {
                color = '#FF2D55'; // Pink for industrial
              } else if (useDesc.includes('agri')) {
                color = '#4CD964'; // Green for agricultural
              }
            }
            
            return L.circleMarker(latlng, {
              radius: radius,
              fillColor: color,
              color: '#fff',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            });
          },
          onEachFeature: (feature, layer) => {
            // Bind popup with feature properties
            if (feature.properties) {
              // Filter out internal fields and format nicely
              const propertyHtml = Object.entries(feature.properties)
                .filter(([key]) => !key.startsWith('__') && !key.startsWith('OBJECTID') && key !== 'SHAPE')
                .slice(0, 10) // Limit to first 10 properties for performance
                .map(([key, value]) => {
                  // Format key from camelCase or snake_case to Title Case
                  const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/^./, str => str.toUpperCase());
                  
                  return `<strong>${formattedKey}:</strong> ${value}`;
                })
                .join('<br>');
              
              // Create a clean, modern popup
              layer.bindPopup(
                `<div class="apple-style-popup">
                  <div style="padding: 5px 0;">${propertyHtml}</div>
                </div>`,
                { className: 'custom-popup' }
              );
            }
            
            // Add hover effect and click handler
            layer.on({
              mouseover: (e) => {
                const target = e.target;
                target.setStyle({
                  weight: 3,
                  color: '#0066CC',
                  fillOpacity: 0.4
                });
                
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                  target.bringToFront();
                }
              },
              mouseout: (e) => {
                geoJSONLayer?.resetStyle(e.target);
              },
              click: (e) => {
                // If this is a parcel layer and we have property data, find the matching property
                if ((id === 'parcels' || id === 'parcelsAndAssess') && properties?.length) {
                  // Get the clicked coordinates
                  const { lat, lng } = e.latlng;
                  
                  // Find the closest property based on coordinates
                  let closestProperty: Property | null = null;
                  let closestDistance = Infinity;
                  
                  properties.forEach(property => {
                    if (property.latitude && property.longitude) {
                      // Parse coordinates, which might be stored as strings
                      const propLat = typeof property.latitude === 'string' 
                        ? parseFloat(property.latitude) 
                        : Number(property.latitude);
                        
                      const propLng = typeof property.longitude === 'string' 
                        ? parseFloat(property.longitude) 
                        : Number(property.longitude);
                      
                      if (!isNaN(propLat) && !isNaN(propLng)) {
                        // Calculate distance using the Haversine formula
                        const distance = map.distance([lat, lng], [propLat, propLng]);
                        
                        if (distance < closestDistance) {
                          closestDistance = distance;
                          closestProperty = property;
                        }
                      }
                    }
                  });
                  
                  // If we found a close property and it's within 500 meters, use it
                  if (closestProperty && closestDistance < 500) {
                    if (onClick) {
                      onClick({
                        ...e,
                        properties: {
                          ...feature.properties,
                          matchedProperty: closestProperty
                        }
                      } as any);
                    }
                    return;
                  }
                }
                
                // Default click handler
                if (onClick) onClick(e);
              }
            });
          }
        }).addTo(map);
        
        // Set layer opacity
        geoJSONLayer.setStyle({ 
          opacity, 
          fillOpacity: opacity * 0.3 
        });
        
        // Add attribution if provided
        if (attribution) {
          map.attributionControl.addAttribution(attribution);
        }
        
        // Try to fit map to layer bounds if it's the first layer
        if (id === 'parcels' || id === 'countyBoundary') {
          try {
            const bounds = geoJSONLayer.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          } catch (e) {
            console.warn('Unable to fit to layer bounds:', e);
          }
        }
        
        setIsLoading(false);
        console.log(`GeoJSON layer (${id}) loaded successfully`);
      })
      .catch(err => {
        console.error(`Error loading GeoJSON layer (${id}):`, err);
        setError(err.message);
        setIsLoading(false);
      });

    // Cleanup function to remove layer when component unmounts
    return () => {
      if (geoJSONLayer) {
        map.removeLayer(geoJSONLayer);
        console.log(`GeoJSON layer (${id}) removed`);
        
        if (attribution) {
          map.attributionControl.removeAttribution(attribution);
        }
      }
    };
  }, [map, url, id, attribution, opacity, style, onClick]);

  // Loading indicator (Apple-style)
  if (isLoading) {
    return (
      <div className="map-loading-indicator">
        <div className="spinner"></div>
        <div className="loading-text">Loading {id} layer...</div>
        <style>{`
          .map-loading-indicator {
            position: absolute;
            right: 16px;
            bottom: 16px;
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 10px 16px;
            border-radius: 12px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            border: 1px solid rgba(0,0,0,0.05);
            animation: fade-in 0.3s ease;
          }
          .spinner {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid rgba(0, 102, 204, 0.3);
            border-top-color: #0066CC;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            font-weight: 500;
            color: #1c1c1e;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Error message (Apple-style)
  if (error) {
    return (
      <div className="map-error-message">
        <div className="error-title">
          Error loading {id} layer
        </div>
        <div className="error-details">
          {error}
        </div>
        <style>{`
          .map-error-message {
            position: absolute;
            right: 16px;
            bottom: 16px;
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 12px 16px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            border: 1px solid rgba(255, 59, 48, 0.2);
            animation: fade-in 0.3s ease;
            max-width: 300px;
          }
          .error-title {
            font-weight: 600;
            font-size: 13px;
            color: #FF3B30;
          }
          .error-details {
            font-size: 12px;
            color: #8e8e93;
          }
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // No visual component after loading
  return null;
};

export default GeoJSONLayerComponent;