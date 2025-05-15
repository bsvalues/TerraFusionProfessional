/**
 * Property Data Adapter
 * 
 * This service loads and transforms property data from the processed
 * CSV files and makes it available to components.
 */

import { Property } from '@shared/schema';

// Define PropertyWithOptionalFields for compatibility with MapComponent and other UI components
type PropertyWithOptionalFields = Omit<Property, 'propertyType'> & {
  propertyType?: string | null;
  lastVisitDate?: Date | null;
  qualityScore?: number | null;
  schoolDistrict?: string | null;
  floodZone?: string | null;
  coordinates?: [number, number];
  pricePerSqFt?: number;
  attributes?: Record<string, any>;
  historicalValues?: any;
  sourceId?: string | number | null;
};

/**
 * Property Data Adapter Service
 */
class PropertyDataAdapter {
  private properties: Property[] = [];
  private propertyMap: Map<string, Property> = new Map();
  private propertySalesMap: Map<string, any[]> = new Map();
  private propertyHistoryMap: Map<string, any[]> = new Map();
  private propertyPermitsMap: Map<string, any[]> = new Map();
  private initialized = false;
  
  /**
   * Initialize the adapter by loading all data files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('Loading property data from shared directory...');
      
      // Load properties data
      const propertiesResponse = await fetch('/shared/data/properties.json');
      if (!propertiesResponse.ok) {
        console.error(`Failed to load properties: ${propertiesResponse.status} ${propertiesResponse.statusText}`);
        throw new Error(`Failed to load properties: ${propertiesResponse.status} ${propertiesResponse.statusText}`);
      }
      
      const properties = await propertiesResponse.json();
      console.log(`Retrieved ${properties.length} properties from the server`);
      
      // Transform property data to match the expected Property type
      this.properties = this.transformProperties(properties);
      
      // Create a map for quick property lookup
      this.propertyMap = new Map(
        this.properties.map(property => [property.id.toString(), property])
      );
      
      // Load sales data
      try {
        const salesResponse = await fetch('/shared/data/sales.json');
        if (!salesResponse.ok) {
          throw new Error(`Failed to load sales: ${salesResponse.status} ${salesResponse.statusText}`);
        }
        
        const salesData = await salesResponse.json();
        
        // Create a map of property ID to sales
        this.propertySalesMap = new Map(
          salesData.map((item: any) => [item.propertyId.toString(), item.sales])
        );
        console.log(`Loaded sales data for ${this.propertySalesMap.size} properties`);
      } catch (error) {
        console.warn('Could not load sales data:', error);
      }
      
      // Load historical values data
      try {
        const historyResponse = await fetch('/shared/data/historical.json');
        if (!historyResponse.ok) {
          throw new Error(`Failed to load history: ${historyResponse.status} ${historyResponse.statusText}`);
        }
        
        const historyData = await historyResponse.json();
        
        // Create a map of property ID to historical values
        this.propertyHistoryMap = new Map(
          historyData.map((item: any) => [item.propertyId.toString(), item.valueHistory])
        );
        console.log(`Loaded historical data for ${this.propertyHistoryMap.size} properties`);
      } catch (error) {
        console.warn('Could not load historical data:', error);
      }
      
      // Load permits data
      try {
        const permitsResponse = await fetch('/shared/data/permits.json');
        if (!permitsResponse.ok) {
          throw new Error(`Failed to load permits: ${permitsResponse.status} ${permitsResponse.statusText}`);
        }
        
        const permitsData = await permitsResponse.json();
        
        // Create a map of property ID to permits
        this.propertyPermitsMap = new Map(
          permitsData.map((item: any) => [item.propertyId.toString(), item.permits])
        );
        console.log(`Loaded permits data for ${this.propertyPermitsMap.size} properties`);
      } catch (error) {
        console.warn('Could not load permits data:', error);
      }
      
      this.initialized = true;
      console.log(`Successfully loaded ${this.properties.length} properties`);
    } catch (error) {
      console.error('Error initializing property data adapter:', error);
      throw error;
    }
  }
  
  /**
   * Transform raw property data to match the expected Property type
   */
  private transformProperties(rawProperties: any[]): Property[] {
    return rawProperties.map(prop => {
      // Convert string ID to number if needed
      const id = typeof prop.id === 'string' ? parseInt(prop.id, 10) : prop.id;
      
      return {
        id,
        parcelId: prop.parcelId || '',
        address: prop.address || '',
        owner: prop.owner || null,
        value: prop.value ? prop.value.toString() : null,
        estimatedValue: prop.estimatedValue ? (typeof prop.estimatedValue === 'string' ? prop.estimatedValue : prop.estimatedValue.toString()) : null,
        salePrice: prop.salePrice || null,
        squareFeet: prop.squareFeet ? parseInt(prop.squareFeet, 10) : 0,
        yearBuilt: prop.yearBuilt ? parseInt(prop.yearBuilt, 10) : null,
        bedrooms: prop.bedrooms ? parseInt(prop.bedrooms, 10) : null,
        bathrooms: prop.bathrooms ? parseFloat(prop.bathrooms) : null,
        propertyType: prop.propertyType || null,
        zoning: prop.zoning || null,
        latitude: prop.latitude ? String(prop.latitude) : null,
        longitude: prop.longitude ? String(prop.longitude) : null,
        lastSaleDate: prop.lastSaleDate || null,
        taxAssessment: prop.taxAssessment || null,
        lotSize: prop.lotSize ? parseInt(prop.lotSize, 10) : null,
        lastVisitDate: prop.lastVisitDate || null, // Optional field
        qualityScore: prop.qualityScore || null,
        neighborhood: prop.neighborhood || null,
        schoolDistrict: prop.schoolDistrict || null,
        floodZone: prop.floodZone || false,
        landValue: prop.landValue || null,
        zillowId: prop.zillowId || null,
        // Include coordinates in the expected format for GIS components
        coordinates: prop.latitude && prop.longitude ? 
          {
            latitude: typeof prop.latitude === 'string' ? parseFloat(prop.latitude) : prop.latitude,
            longitude: typeof prop.longitude === 'string' ? parseFloat(prop.longitude) : prop.longitude
          } : null,
        // Add any other fields needed to match the Property interface
        attributes: {
          legalDescription: prop.legalDescription || null
        },
        historicalValues: null, // Will be populated later
        // Fields that may be expected by legacy code
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }
  
  /**
   * Convert a Property to PropertyWithOptionalFields
   */
  private toPropertyWithOptionalFields(property: Property): PropertyWithOptionalFields {
    const { propertyType, ...rest } = property;
    return {
      ...rest,
      propertyType: propertyType,
      // Add calculated or derived fields
      coordinates: property.latitude && property.longitude 
        ? [Number(property.latitude), Number(property.longitude)] 
        : undefined,
      pricePerSqFt: property.value && property.squareFeet
        ? parseFloat(property.value.replace(/[^0-9.-]+/g, '')) / property.squareFeet
        : undefined,
    };
  }
  
  /**
   * Convert a PropertyWithOptionalFields to Property (for backwards compatibility)
   * This adds default values for missing fields
   */
  private toProperty(property: PropertyWithOptionalFields): Property {
    // Extract any missing required properties and provide defaults
    const propWithDefaults = {
      lastVisitDate: null,
      qualityScore: null,
      schoolDistrict: null,
      floodZone: false, // Use boolean false as the default for floodZone
      ...property,
      // Ensure propertyType is not undefined
      propertyType: property.propertyType || null
    };
    
    return propWithDefaults as Property;
  }

  /**
   * Get all properties (initializing if needed)
   */
  async getAllProperties(): Promise<Property[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.properties;
  }
  
  /**
   * Get all properties as PropertyWithOptionalFields (initializing if needed)
   */
  async getAllPropertiesWithOptionalFields(): Promise<PropertyWithOptionalFields[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.properties.map(this.toPropertyWithOptionalFields);
  }
  
  /**
   * Get a property by ID (initializing if needed)
   */
  async getPropertyById(id: string | number): Promise<Property | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.propertyMap.get(id.toString());
  }
  
  /**
   * Get filtered properties
   */
  async getFilteredProperties(filters: any): Promise<Property[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    let filteredProperties = [...this.properties];
    
    // Apply filters
    if (filters.neighborhood) {
      filteredProperties = filteredProperties.filter(p => 
        p.neighborhood && p.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())
      );
    }
    
    if (filters.minYearBuilt) {
      filteredProperties = filteredProperties.filter(p => 
        p.yearBuilt && p.yearBuilt >= filters.minYearBuilt
      );
    }
    
    if (filters.maxYearBuilt) {
      filteredProperties = filteredProperties.filter(p => 
        p.yearBuilt && p.yearBuilt <= filters.maxYearBuilt
      );
    }
    
    if (filters.minValue) {
      filteredProperties = filteredProperties.filter(p => {
        const value = p.value ? parseFloat(p.value.replace(/[^0-9.-]+/g, '')) : 0;
        return value >= filters.minValue;
      });
    }
    
    if (filters.maxValue) {
      filteredProperties = filteredProperties.filter(p => {
        const value = p.value ? parseFloat(p.value.replace(/[^0-9.-]+/g, '')) : 0;
        return value <= filters.maxValue;
      });
    }
    
    if (filters.minSquareFeet) {
      filteredProperties = filteredProperties.filter(p => 
        p.squareFeet && p.squareFeet >= filters.minSquareFeet
      );
    }
    
    if (filters.maxSquareFeet) {
      filteredProperties = filteredProperties.filter(p => 
        p.squareFeet && p.squareFeet <= filters.maxSquareFeet
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
      
      filteredProperties.sort((a, b) => {
        switch (filters.sortBy) {
          case 'address':
            return sortOrder * ((a.address || '').localeCompare(b.address || ''));
          case 'value':
            const valueA = a.value ? parseFloat(a.value.replace(/[^0-9.-]+/g, '')) : 0;
            const valueB = b.value ? parseFloat(b.value.replace(/[^0-9.-]+/g, '')) : 0;
            return sortOrder * (valueA - valueB);
          case 'yearBuilt':
            const yearA = a.yearBuilt || 0;
            const yearB = b.yearBuilt || 0;
            return sortOrder * (yearA - yearB);
          case 'squareFeet':
            const sqftA = a.squareFeet || 0;
            const sqftB = b.squareFeet || 0;
            return sortOrder * (sqftA - sqftB);
          default:
            return 0;
        }
      });
    }
    
    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0;
      filteredProperties = filteredProperties.slice(offset, offset + filters.limit);
    }
    
    return filteredProperties;
  }
  
  /**
   * Search properties by text
   */
  async searchProperties(query: string): Promise<Property[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!query) return [];
    
    const searchText = query.toLowerCase();
    
    return this.properties.filter(property => {
      // Search in address
      if (property.address && property.address.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // Search in parcel ID
      if (property.parcelId && property.parcelId.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // Search in owner
      if (property.owner && property.owner.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // Search in neighborhood
      if (property.neighborhood && property.neighborhood.toLowerCase().includes(searchText)) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Find similar properties
   */
  async findSimilarProperties(referencePropertyId: string | number, limit: number = 5): Promise<PropertyWithOptionalFields[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const referenceProperty = this.propertyMap.get(referencePropertyId.toString());
    if (!referenceProperty) {
      throw new Error(`Reference property with ID ${referencePropertyId} not found`);
    }
    
    // Calculate similarity scores for each property
    const propertiesWithScores = this.properties
      .filter(p => p.id !== referenceProperty.id) // Exclude the reference property
      .map(property => {
        // Calculate a similarity score based on various factors
        let score = 0;
        
        // Similar property type is very important
        if (property.propertyType === referenceProperty.propertyType) {
          score += 30;
        }
        
        // Similar size
        if (property.squareFeet && referenceProperty.squareFeet) {
          const sizeDiff = Math.abs(property.squareFeet - referenceProperty.squareFeet);
          const sizeScore = Math.max(0, 20 - (sizeDiff / 100));
          score += sizeScore;
        }
        
        // Similar year built
        if (property.yearBuilt && referenceProperty.yearBuilt) {
          const yearDiff = Math.abs(property.yearBuilt - referenceProperty.yearBuilt);
          const yearScore = Math.max(0, 15 - yearDiff);
          score += yearScore;
        }
        
        // Similar neighborhood
        if (property.neighborhood === referenceProperty.neighborhood) {
          score += 20;
        }
        
        // Geographic proximity
        if (property.latitude && property.longitude && 
            referenceProperty.latitude && referenceProperty.longitude) {
          // Ensure latitude and longitude are numbers for the calculation
          const lat1 = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
          const lon1 = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
          const lat2 = typeof referenceProperty.latitude === 'string' ? parseFloat(referenceProperty.latitude) : referenceProperty.latitude;
          const lon2 = typeof referenceProperty.longitude === 'string' ? parseFloat(referenceProperty.longitude) : referenceProperty.longitude;
          
          const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
          const proximityScore = Math.max(0, 25 - (distance * 5)); // Decrease score with distance
          score += proximityScore;
        }
        
        return { property, score };
      });
    
    // Sort by similarity score (descending) and take the top matches
    // Convert Property objects to PropertyWithOptionalFields for consistency
    return propertiesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => this.toPropertyWithOptionalFields(item.property));
  }
  
  /**
   * Get properties within a geographic region
   */
  async getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const [south, west, north, east] = bounds;
    
    return this.properties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      
      // Handle latitude and longitude being either number or string
      const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
      const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });
  }
  
  /**
   * Get sales history for a property
   */
  async getPropertySalesHistory(propertyId: string | number): Promise<any[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.propertySalesMap.get(propertyId.toString()) || [];
  }
  
  /**
   * Get value history for a property
   */
  async getPropertyValueHistory(propertyId: string | number): Promise<any[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.propertyHistoryMap.get(propertyId.toString()) || [];
  }
  
  /**
   * Get permits for a property
   */
  async getPropertyPermits(propertyId: string | number): Promise<any[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.propertyPermitsMap.get(propertyId.toString()) || [];
  }
  
  /**
   * Calculate distance between two geographic points using the Haversine formula
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export a singleton instance
export const propertyDataAdapter = new PropertyDataAdapter();