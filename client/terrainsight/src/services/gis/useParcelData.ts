import { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { GISDataset } from '@/shared/types';

interface UseParcelDataResult {
  properties: Property[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and transform parcel data from GeoJSON files
 * 
 * @returns Object containing properties array, loading state, and error if any
 */
export function useParcelData(): UseParcelDataResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Function to fetch GeoJSON parcel data
    async function fetchParcelData() {
      try {
        setLoading(true);

        // Fetch parcel data from server endpoint
        const response = await fetch(`/api/gis/datasets/${GISDataset.PARCELS_AND_ASSESS}/geojson`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch parcel data: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data || !data.features || !Array.isArray(data.features)) {
          throw new Error('Invalid GeoJSON data format');
        }

        // Transform GeoJSON features to Property objects
        const transformedProperties = data.features
          .filter((feature: any) => {
            // Filter out features without geometry or properties
            return feature?.geometry && feature?.properties;
          })
          .map((feature: any) => {
            const { properties: featureProps, geometry } = feature;

            // Calculate centroid for polygon features to use as marker point
            let lat = null;
            let lng = null;

            if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
              // For Point geometries, use the direct coordinates
              [lng, lat] = geometry.coordinates;
            } else if (
              (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') && 
              Array.isArray(geometry.coordinates)
            ) {
              // For Polygon geometries, calculate the centroid
              // Take first coordinate set for simplicity in case of MultiPolygon
              const coords = geometry.type === 'Polygon' 
                ? geometry.coordinates[0] 
                : geometry.coordinates[0][0];
              
              if (Array.isArray(coords)) {
                // Simple centroid calculation
                let sumLng = 0;
                let sumLat = 0;
                let validCoords = 0;

                for (const coord of coords) {
                  if (Array.isArray(coord) && coord.length >= 2) {
                    sumLng += coord[0];
                    sumLat += coord[1];
                    validCoords++;
                  }
                }

                if (validCoords > 0) {
                  lng = sumLng / validCoords;
                  lat = sumLat / validCoords;
                }
              }
            }

            // Map GeoJSON properties to our Property schema
            // Using null or defaults for missing fields
            const randomId = Math.floor(Math.random() * 1000000);
            const propertyObject = {
              id: randomId,
              parcelId: featureProps.AIN || featureProps.PARCELID || `parcel-${randomId}`,
              address: featureProps.SITUS || featureProps.ADDRESS || 'Unknown Address',
              squareFeet: Number(featureProps.BUILDINGS_SQFT || featureProps.SQFT || 0),
              owner: featureProps.OWNER || null,
              value: String(featureProps.TOTAL_VALU || featureProps.MARKET_VALUE || null),
              salePrice: null,
              yearBuilt: featureProps.YEAR_BUILT ? Number(featureProps.YEAR_BUILT) : null,
              landValue: null,
              coordinates: null,
              latitude: lat ? String(lat) : null,
              longitude: lng ? String(lng) : null,
              neighborhood: null,
              propertyType: featureProps.LANDUSE || featureProps.PROP_TYPE || null,
              bedrooms: featureProps.BEDROOMS ? Number(featureProps.BEDROOMS) : null,
              bathrooms: featureProps.BATHROOMS ? Number(featureProps.BATHROOMS) : null,
              lotSize: featureProps.LOT_SIZE ? Number(featureProps.LOT_SIZE) : null,
              zoning: null,
              lastSaleDate: null,
              taxAssessment: null,
              pricePerSqFt: null,
              attributes: null,
              historicalValues: null,
              sourceId: null,
              zillowId: null,
              estimatedValue: null
            };
            
            return propertyObject as unknown as Property;
          })
          .filter((prop: Property) => {
            // Filter out properties without coordinates
            return prop.latitude != null && prop.longitude != null;
          });

        setProperties(transformedProperties);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching parcel data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }

    fetchParcelData();
  }, []);

  return { properties, loading, error };
}

export default useParcelData;