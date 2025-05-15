import React, { useEffect, useState } from 'react';
import { GeoJSON, LayerGroup } from 'react-leaflet';
import { GISDataset } from '@/shared/types';

interface ParcelBoundaryLayerProps {
  enabled: boolean;
}

/**
 * Component for displaying parcel boundaries from GeoJSON data
 */
export const ParcelBoundaryLayer: React.FC<ParcelBoundaryLayerProps> = ({
  enabled
}) => {
  const [parcelData, setParcelData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch GeoJSON data if the layer is enabled
    if (enabled && !parcelData && !loading) {
      fetchParcelBoundaries();
    }
  }, [enabled, parcelData, loading]);

  // Function to fetch parcel boundaries from the server
  const fetchParcelBoundaries = async () => {
    try {
      setLoading(true);
      
      // Fetch the parcel boundaries GeoJSON data
      const response = await fetch(`/api/gis/datasets/${GISDataset.PARCELS}/geojson`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch parcel boundaries: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if data has the expected GeoJSON structure
      if (!data || typeof data !== 'object' || !data.type || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format received from server');
      }
      
      setParcelData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching parcel boundaries:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  };

  // Style function for the GeoJSON features
  const parcelStyle = () => {
    return {
      fillColor: 'transparent',
      weight: 1,
      opacity: 0.7,
      color: '#3388ff',
      fillOpacity: 0.1
    };
  };

  // Show loading or error state when appropriate
  if (!enabled) {
    return null;
  }
  
  if (loading) {
    return (
      <LayerGroup>
        <div className="leaflet-loading-message">
          {/* This div will be relatively positioned in the map */}
          Loading parcel data...
        </div>
      </LayerGroup>
    );
  }
  
  if (error) {
    console.warn('Error in ParcelBoundaryLayer:', error.message);
    return null;
  }
  
  if (!parcelData) {
    return null;
  }

  return (
    <LayerGroup>
      <GeoJSON data={parcelData} style={parcelStyle} />
    </LayerGroup>
  );
};

export default ParcelBoundaryLayer;