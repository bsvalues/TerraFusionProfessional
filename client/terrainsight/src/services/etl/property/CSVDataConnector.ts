import { Property } from '@shared/schema';
import { PropertyDataConnector, PropertyDataConnectorMetadata } from './PropertyDataConnector';

/**
 * Connector for CSV data
 */
export class CSVDataConnector extends PropertyDataConnector {
  metadata: PropertyDataConnectorMetadata = {
    id: 'csv',
    name: 'CSV Import',
    description: 'Property data from CSV imports',
    status: 'active',
    lastUpdated: new Date()
  };
  
  // Store loaded properties from CSV
  private properties: Property[] = [];
  
  /**
   * Set properties loaded from CSV
   */
  setProperties(properties: Property[]): void {
    this.properties = properties.map(p => ({
      ...p,
      sourceId: 'csv'
    }));
    this.metadata.lastUpdated = new Date();
  }
  
  /**
   * Clear all loaded properties
   */
  clearProperties(): void {
    this.properties = [];
    this.metadata.lastUpdated = new Date();
  }
  
  /**
   * Get the count of loaded properties
   */
  getPropertyCount(): number {
    return this.properties.length;
  }
  
  /**
   * Fetch all properties from CSV data
   */
  async fetchProperties(): Promise<Property[]> {
    return this.properties;
  }

  /**
   * Fetch a specific property by ID from CSV data
   */
  async fetchPropertyById(id: string): Promise<Property | null> {
    const property = this.properties.find(p => 
      p.id.toString() === id || p.parcelId === id
    );
    
    return property || null;
  }

  /**
   * Search for properties matching criteria in CSV data
   */
  async searchProperties(searchCriteria: Partial<Property>): Promise<Property[]> {
    // If no criteria, return all properties
    if (Object.keys(searchCriteria).length === 0) {
      return this.properties;
    }
    
    // Filter properties that match all criteria
    return this.properties.filter(property => {
      // Check each search criteria
      return Object.entries(searchCriteria).every(([key, value]) => {
        // Skip undefined or null values
        if (value === undefined || value === null) {
          return true;
        }
        
        // @ts-ignore - We're checking dynamically
        const propertyValue = property[key];
        
        // If property doesn't have this field, it doesn't match
        if (propertyValue === undefined || propertyValue === null) {
          return false;
        }
        
        // Compare based on value type
        if (typeof value === 'string' && typeof propertyValue === 'string') {
          return propertyValue.toLowerCase().includes(value.toLowerCase());
        }
        
        // For other types, check exact equality
        return propertyValue === value;
      });
    });
  }

  /**
   * Check if this connector can handle a specific data source
   */
  canHandle(sourceId: string): boolean {
    return sourceId === 'csv';
  }
}

// Export a singleton instance
export const csvDataConnector = new CSVDataConnector();