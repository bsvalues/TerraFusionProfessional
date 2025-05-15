/**
 * Property GIS Mapper Service
 * 
 * This service provides mapping functionality between GIS data from shapefiles
 * and the application's property data structure.
 */

import { InsertProperty, Property } from '../../shared/schema';
import { GISDataset } from './gis-data';
import { storage } from '../storage';

export class PropertyGISMapperService {
  /**
   * Safely parses numeric values from GIS data, with error handling
   * 
   * @param value The value to parse (might be string, number, or undefined)
   * @param defaultValue The default value to return if parsing fails
   * @param transform Optional transform function to apply to the parsed value
   * @returns Parsed and transformed number or defaultValue
   */
  private parseNumericValue<T>(
    value: any, 
    defaultValue: T, 
    transform?: (val: number) => number
  ): number | T {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    try {
      // Handle strings that might have commas or currency symbols
      if (typeof value === 'string') {
        value = value.replace(/[$,]/g, '');
      }
      
      const parsed = Number(value);
      
      if (isNaN(parsed)) {
        return defaultValue;
      }
      
      return transform ? transform(parsed) : parsed;
    } catch (error) {
      console.warn('Error parsing numeric value:', error, 'Original value:', value);
      return defaultValue;
    }
  }
  
  /**
   * Formats a value as currency
   * 
   * @param value The value to format (might be string, number, or undefined)
   * @returns Formatted currency string or null
   */
  private formatCurrencyValue(value: any): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    try {
      // Handle strings that might have commas or currency symbols
      if (typeof value === 'string') {
        value = value.replace(/[$,]/g, '');
      }
      
      const parsed = Number(value);
      
      if (isNaN(parsed)) {
        return null;
      }
      
      return `$${parsed.toLocaleString()}`;
    } catch (error) {
      console.warn('Error formatting currency value:', error, 'Original value:', value);
      return null;
    }
  }

  /**
   * Maps GIS data to application property format
   * 
   * @param gisFeature A feature from the GeoJSON data
   * @returns Mapped property in application format or null if mapping fails
   */
  public mapGisFeatureToProperty(gisFeature: any): Partial<Property> | null {
    try {
      if (!gisFeature || !gisFeature.properties) {
        return null;
      }

      const props = gisFeature.properties;
      let coordinates: [number, number] | null = null;

      // Extract centroid coordinates if available
      // Try multiple possible coordinate field names
      const xCoord = props.CENTROID_X || props.X || props.x || props.LONGITUDE || props.longitude || props.LON || props.lon;
      const yCoord = props.CENTROID_Y || props.Y || props.y || props.LATITUDE || props.latitude || props.LAT || props.lat;
      
      if (xCoord !== undefined && yCoord !== undefined) {
        // GeoJSON standard is [longitude, latitude]
        const parsedX = this.parseNumericValue(xCoord, 0);
        const parsedY = this.parseNumericValue(yCoord, 0);
        
        // Only use the coordinates if they're valid (not 0,0 which is in the ocean)
        if (parsedX !== 0 || parsedY !== 0) {
          coordinates = [parsedX, parsedY];  // [Longitude, Latitude]
        }
      } else if (gisFeature.geometry && gisFeature.geometry.type === 'Point') {
        // GeoJSON coordinates are already in [longitude, latitude] format
        // Make sure we have valid values
        const geomX = this.parseNumericValue(gisFeature.geometry.coordinates[0], 0);
        const geomY = this.parseNumericValue(gisFeature.geometry.coordinates[1], 0);
        
        // Only use coordinates if they're valid
        if (geomX !== 0 || geomY !== 0) {
          coordinates = [geomX, geomY];  // [Longitude, Latitude]
        }
      }

      // Extract latitude and longitude correctly
      // In GeoJSON, coordinates are [longitude, latitude]
      const longitude = coordinates ? coordinates[0] : null;
      const latitude = coordinates ? coordinates[1] : null;
      
      // Get market value and format it using the helper method
      const formattedValue = this.formatCurrencyValue(
        props.MarketValu || props.MARKET_VALUE || props.VALUE || props.value || props.market_val
      );
      
      // Get land value and format it using the helper method
      const formattedLandValue = this.formatCurrencyValue(
        props.LandVal || props.LAND_VALUE || props.land_val || props.LAND_VAL
      );

      // Map GIS properties to application property structure
      return {
        parcelId: props.Parcel_ID || props.geo_id || props.PARCEL_ID || '',
        address: props.situs_addr || props.SITUS_ADDR || '',
        owner: props.owner_name || props.OWNER_NAME || '',
        value: formattedValue,
        estimatedValue: null, // Default to null, can be populated later
        landValue: formattedLandValue,
        coordinates: coordinates,
        latitude: latitude,
        longitude: longitude,
        neighborhood: props.neighborho || props.NEIGHBORHOOD || '',
        propertyType: this.mapPropertyType(props.primary_us || props.PRIMARY_USE || props.prop_type || props.PROP_TYPE || props.use_code || props.USE_CODE),
        squareFeet: this.parseNumericValue(props.land_sqft || props.LAND_SQFT || props.sqft || props.SQFT || props.area || props.AREA, 0), // Default to 0 as it's required
        yearBuilt: this.parseNumericValue(props.year_blt || props.YEAR_BLT || props.yearBuilt || props.YEAR_BUILT || props.yr_blt || props.YR_BLT, null),
        taxAssessment: this.formatCurrencyValue(props.appraised_ || props.APPRAISED_ || props.tax_value || props.TAX_VALUE || props.assessed || props.ASSESSED),
        zoning: props.tax_code_a || props.TAX_CODE_A || props.zoning || props.ZONING || props.zone || props.ZONE || '',
        lotSize: this.parseNumericValue(props.legal_acre || props.LEGAL_ACRE || props.acres || props.ACRES, null, (value) => Math.round(value * 43560)), // Convert acres to sq ft
        attributes: {
          originalGisData: props
        },
        historicalValues: {} // Default empty object for historical values
      };
    } catch (error) {
      console.error('Error mapping GIS feature to property:', error);
      return null;
    }
  }

  /**
   * Maps property type codes to human-readable property types
   * Enhanced to handle various property type field formats
   */
  private mapPropertyType(typeCode: string | undefined): string {
    if (!typeCode) return 'Unknown';
    
    // Normalize the type code (trim, uppercase, remove spaces)
    const normalizedType = typeCode.trim().toUpperCase().replace(/\s+/g, '');
    
    // Map based on common property type codes
    const numericTypeMap: Record<string, string> = {
      '10': 'Single Family',
      '11': 'Single Family',
      '20': 'Multi-Family',
      '30': 'Commercial',
      '40': 'Industrial',
      '50': 'Agriculture',
      '60': 'Vacant Land',
      '70': 'Special Purpose',
      '80': 'Government',
      '83': 'Agricultural',
      '90': 'Utility'
    };
    
    // Map based on text descriptions commonly found in GIS data
    const textTypeMap: Record<string, string> = {
      'SINGLE': 'Single Family',
      'SINGLEFAMILY': 'Single Family',
      'RESIDENTIAL': 'Single Family',
      'SFR': 'Single Family',
      'MULTI': 'Multi-Family',
      'MULTIFAMILY': 'Multi-Family',
      'APARTMENT': 'Multi-Family',
      'DUPLEX': 'Multi-Family',
      'COMMERCIAL': 'Commercial',
      'OFFICE': 'Commercial',
      'RETAIL': 'Commercial',
      'INDUSTRIAL': 'Industrial',
      'WAREHOUSE': 'Industrial',
      'MANUFACTURING': 'Industrial',
      'MFG': 'Industrial',
      'AGRICULTURE': 'Agriculture',
      'AGRICULTURAL': 'Agriculture',
      'FARM': 'Agriculture',
      'AG': 'Agriculture',
      'VACANT': 'Vacant Land',
      'VACANTLAND': 'Vacant Land',
      'UNDEVELOPED': 'Vacant Land',
      'SPECIAL': 'Special Purpose',
      'GOVERNMENT': 'Government',
      'GOV': 'Government',
      'UTILITY': 'Utility'
    };
    
    // First try the numeric map (priority for Benton County data)
    if (numericTypeMap[typeCode]) {
      return numericTypeMap[typeCode];
    }
    
    // Then try the text map with normalized code
    if (textTypeMap[normalizedType]) {
      return textTypeMap[normalizedType];
    }
    
    // Try to find partial matches in the text map
    for (const [key, value] of Object.entries(textTypeMap)) {
      if (normalizedType.includes(key)) {
        return value;
      }
    }
    
    // Default fallback
    return 'Other';
  }

  /**
   * Find a property in the application database using the GIS parcel ID
   * 
   * @param parcelId The parcel ID from GIS data
   * @returns The found property or null
   */
  public async findPropertyByParcelId(parcelId: string): Promise<Property | null> {
    try {
      const properties = await storage.getProperties();
      return properties.find(property => property.parcelId === parcelId) || null;
    } catch (error) {
      console.error(`Error finding property by parcel ID ${parcelId}:`, error);
      return null;
    }
  }

  /**
   * Sync a property from GIS data with the application database
   * 
   * @param gisFeature The GIS feature to sync
   * @returns The synced property ID or null if sync failed
   */
  public async syncPropertyFromGisFeature(gisFeature: any): Promise<number | null> {
    try {
      const mappedProperty = this.mapGisFeatureToProperty(gisFeature);
      if (!mappedProperty || !mappedProperty.parcelId) {
        return null;
      }

      // Check if property already exists in database
      const existingProperty = await this.findPropertyByParcelId(mappedProperty.parcelId);
      
      if (existingProperty) {
        // Update existing property with GIS data
        const updatedProperty = {
          ...existingProperty,
          ...mappedProperty,
          // Preserve certain fields from the existing property
          id: existingProperty.id,
          // Merge attributes
          attributes: {
            ...(existingProperty.attributes as object || {}),
            ...(mappedProperty.attributes as object || {})
          }
        };
        
        await storage.updateProperty(existingProperty.id, updatedProperty);
        return existingProperty.id;
      } else {
        // Create new property from GIS data
        const newProperty = await storage.createProperty(mappedProperty as InsertProperty);
        return newProperty.id;
      }
    } catch (error) {
      console.error('Error syncing property from GIS feature:', error);
      return null;
    }
  }

  /**
   * Perform a batch sync of properties from GIS data
   * 
   * @param dataset The GIS dataset to sync from
   * @param limit Optional limit on number of properties to sync
   * @returns Object with counts of created, updated, and failed properties
   */
  public async batchSyncPropertiesFromGisDataset(
    dataset: GISDataset, 
    limit?: number
  ): Promise<{ created: number; updated: number; failed: number; total: number }> {
    try {
      // Use the loadGeoJSONData function from gis-data.ts instead of gisDataService
      const geojsonData = await import('./gis-data').then(module => module.loadGeoJSONData(dataset.toString()));
      if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
        return { created: 0, updated: 0, failed: 0, total: 0 };
      }

      const features = limit ? geojsonData.features.slice(0, limit) : geojsonData.features;
      let created = 0;
      let updated = 0;
      let failed = 0;

      for (const feature of features) {
        const mappedProperty = this.mapGisFeatureToProperty(feature);
        if (!mappedProperty || !mappedProperty.parcelId) {
          failed++;
          continue;
        }

        const existingProperty = await this.findPropertyByParcelId(mappedProperty.parcelId);
        
        if (existingProperty) {
          // Update existing property
          try {
            const updatedProperty = {
              ...existingProperty,
              ...mappedProperty,
              id: existingProperty.id,
              attributes: {
                ...(existingProperty.attributes as object || {}),
                ...(mappedProperty.attributes as object || {})
              }
            };
            
            await storage.updateProperty(existingProperty.id, updatedProperty);
            updated++;
          } catch (error) {
            console.error(`Error updating property ${mappedProperty.parcelId}:`, error);
            failed++;
          }
        } else {
          // Create new property
          try {
            await storage.createProperty(mappedProperty as InsertProperty);
            created++;
          } catch (error) {
            console.error(`Error creating property ${mappedProperty.parcelId}:`, error);
            failed++;
          }
        }
      }

      return {
        created,
        updated,
        failed,
        total: features.length
      };
    } catch (error) {
      console.error(`Error batch syncing properties from dataset ${dataset}:`, error);
      return { created: 0, updated: 0, failed: 0, total: 0 };
    }
  }
}

// Create a singleton instance
export const propertyGisMapperService = new PropertyGISMapperService();