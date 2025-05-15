import { Property } from '@shared/schema';

/**
 * Status of a property data connector
 */
export type PropertyDataConnectorStatus = 'active' | 'inactive' | 'error';

/**
 * Metadata for a property data connector
 */
export interface PropertyDataConnectorMetadata {
  // Unique identifier for this data source
  id: string;
  
  // Display name for this data source
  name: string;
  
  // Description of this data source
  description: string;
  
  // Current status of this data source
  status: PropertyDataConnectorStatus;
  
  // Last time this data source was updated
  lastUpdated: Date;
  
  // Error message if status is 'error'
  error?: string;
}

/**
 * Abstract base class for property data connectors
 */
export abstract class PropertyDataConnector {
  // Metadata for this data connector
  abstract metadata: PropertyDataConnectorMetadata;
  
  /**
   * Fetch all properties from this data source
   */
  abstract fetchProperties(): Promise<Property[]>;
  
  /**
   * Fetch a specific property by ID from this data source
   */
  abstract fetchPropertyById(id: string): Promise<Property | null>;
  
  /**
   * Search for properties matching criteria in this data source
   */
  abstract searchProperties(searchCriteria: Partial<Property>): Promise<Property[]>;
  
  /**
   * Check if this connector can handle a specific data source
   */
  abstract canHandle(sourceId: string): boolean;
}