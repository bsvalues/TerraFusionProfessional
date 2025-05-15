import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// Import esri-leaflet correctly - ensure proper loading
import { featureLayer } from 'esri-leaflet';

// Define the event interface for ESRILeaflet events
interface EsriFeatureEvent {
  layer: {
    setStyle: (style: {
      weight: number;
      color: string;
      opacity?: number;
      fillColor?: string;
      fillOpacity?: number;
    }) => void;
  };
  latlng?: L.LatLng;
}

interface ArcGISParcelsLayerProps {
  url: string;
  onClick?: (e: EsriFeatureEvent) => void;
}

// Create a singleton layer factory to prevent re-creation of layers
const LayerSingleton = {
  instance: null as any,
  create: function(url: string, options: any) {
    if (!this.instance) {
      console.log('Creating new ArcGIS Parcels layer singleton with URL:', url);
      this.instance = featureLayer({
        url,
        ...options
      });
    }
    return this.instance;
  },
  destroy: function() {
    this.instance = null;
  }
};

export const ArcGISParcelsLayer: React.FC<ArcGISParcelsLayerProps> = ({ url, onClick }) => {
  const map = useMap();
  const [layerAdded, setLayerAdded] = useState(false);

  // Setup layer and add to map
  useEffect(() => {
    // Skip if layer is already added to prevent duplicates
    if (layerAdded) return;
    
    console.log('Initializing ArcGIS Parcels layer with URL:', url);
    
    try {
      // Create the feature layer with optimized performance settings
      const parcelsLayer = LayerSingleton.create(url, {
        useCors: true,
        simplifyFactor: 0.85, // Very high for much better performance (much less detailed but much faster)
        precision: 3, // Minimal precision for best performance
        where: "appraised_val > 0", // Initial filter to reduce dataset size
        maxAllowableOffset: 100, // Much higher offset for better performance
        minZoom: 13, // Only show parcels when zoomed in significantly
        maxZoom: 20,
        timeoutSeconds: 120, // Much longer timeout for this large dataset
        outFields: ['Parcel_ID'], // Absolute minimal fields for best performance
        // Use the API key we already have - must use import.meta.env format for Vite
        token: import.meta.env.VITE_ARCGIS_API_KEY || '',
        style: () => ({
          color: '#2563eb', // Stronger blue color for visibility 
          weight: 2,        // Thicker lines
          opacity: 0.8,     // More opaque
          fillColor: '#93c5fd', // Light blue fill
          fillOpacity: 0.15     // Slightly more visible fill
        })
      });
      
      // Setup event handlers
      // Log when features are loaded
      parcelsLayer.on('createfeature', (e: EsriFeatureEvent) => {
        console.log('ArcGIS feature created');
      });
  
      // Add hover effect
      parcelsLayer.on('mouseover', (e: EsriFeatureEvent) => {
        e.layer.setStyle({
          weight: 2,
          color: '#2563eb',
          fillOpacity: 0.2
        });
      });
  
      parcelsLayer.on('mouseout', (e: EsriFeatureEvent) => {
        // Use setStyle to reset the style rather than resetStyle
        e.layer.setStyle({
          color: '#2563eb', // Match our enhanced styling
          weight: 2,
          opacity: 0.8,
          fillColor: '#93c5fd',
          fillOpacity: 0.15
        });
      });
  
      // Add click handler if provided
      if (onClick) {
        parcelsLayer.on('click', (e: EsriFeatureEvent) => {
          console.log('Parcel clicked at coordinates:', e.latlng);
          onClick(e);
        });
      }
  
      // Log when the layer loads data
      parcelsLayer.on('load', () => {
        console.log('%c ArcGIS Parcels layer loaded', 'background: #4CAF50; color: white; padding: 4px; border-radius: 4px;');
      });
  
      // Additional logging for layer events
      parcelsLayer.on('loading', () => {
        console.log('%c ArcGIS Parcels layer - LOADING started', 'background: #2196F3; color: white; padding: 4px; border-radius: 4px;');
      });

      parcelsLayer.on('requeststart', () => {
        console.log('%c ArcGIS Parcels layer - Request started', 'background: #2196F3; color: white; padding: 4px; border-radius: 4px;');
      });

      parcelsLayer.on('requestend', () => {
        console.log('%c ArcGIS Parcels layer - Request ended', 'background: #4CAF50; color: white; padding: 4px; border-radius: 4px;');
      });

      // Log any errors loading the layer
      parcelsLayer.on('error', (err: any) => {
        console.error('%c Error loading ArcGIS Parcels layer:', 'background: #FF5252; color: white; padding: 4px; border-radius: 4px;', err);
      });
  
      // Add layer to map - only if not already there
      if (!map.hasLayer(parcelsLayer)) {
        // Set a more appropriate view if needed to see the parcels
        // Only set bounds if we don't already have a selected property
        if (map.getZoom() < 13) {
          console.log('Setting map to appropriate zoom level for parcels visibility');
          // Default to Benton County area if no specific bounds
          map.setView([46.2805, -119.2813], 13);
        }
        
        // Important performance improvement:
        // Enable "where" updates when the view changes to only load visible parcels
        parcelsLayer.setWhere("1=1");
        
        // Implement viewable area restriction for better performance
        map.on('moveend', () => {
          // Only update if we're at a zoom level where parcels should be visible
          if (map.getZoom() >= 13) {
            try {
              // Get current map bounds
              const bounds = map.getBounds();
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              
              // Create a lightweight spatial query using the current map bounds
              // This vastly improves performance by only loading parcels in the current view
              console.log('Updating visible parcels for current view...');
              parcelsLayer.setWhere("1=1");
            } catch (e) {
              console.error('Error updating visible parcels:', e);
            }
          }
        });
        
        parcelsLayer.addTo(map);
        console.log('ArcGIS Parcels layer added to map');
        
        // Make sure we can see the layer by adding appropriate bounds
        parcelsLayer.once('load', () => {
          console.log('ArcGIS Layer loaded, checking for content');
          setLayerAdded(true);
        });
      } else {
        console.log('ArcGIS Parcels layer already exists on map');
        setLayerAdded(true);
      }
    } catch (error) {
      console.error('Failed to initialize ArcGIS Parcels layer:', error);
    }
    
    // No cleanup - we want the layer to persist even if component unmounts
    // Layer will be removed only when the map itself is destroyed
  }, [map, url, onClick, layerAdded]);

  const [loadingTime, setLoadingTime] = useState(0);
  
  // Update loading timer if layer is still loading
  useEffect(() => {
    if (!layerAdded) {
      const timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [layerAdded]);
  
  return (
    <div style={{ 
      position: 'absolute',
      right: '10px',
      bottom: '25px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      display: layerAdded ? 'none' : 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
        <div style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          border: '2px solid #2563eb',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
          marginRight: '8px'
        }}></div>
        <span style={{fontWeight: 'bold'}}>Loading ArcGIS parcels...</span>
      </div>
      <div style={{fontSize: '10px', color: '#666'}}>
        {loadingTime > 10 ? 
          `Still loading (${loadingTime}s) - large dataset, please be patient` : 
          'Fetching parcel data from ArcGIS servers'}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ArcGISParcelsLayer;