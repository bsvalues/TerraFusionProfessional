/**
 * Zillow Data Connector
 * 
 * This service provides functionality to connect to the Zillow API via RapidAPI
 * and retrieve property data for use in the ETL pipeline.
 */

import { DataSource } from './ETLTypes';
import { etlPipelineManager } from './ETLPipelineManager';
import { dataConnector } from './DataConnector';

// API configuration
const RAPIDAPI_HOST = 'realty-in-us.p.rapidapi.com';
// The API key is retrieved from environment variables for security

interface ZillowPropertyData {
  id: string; 
  zpid: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  };
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  homeType: string;
  yearBuilt: number;
  lotSize: number;
  latitude: number;
  longitude: number;
  zestimate?: number;
  description?: string;
  schools?: any[];
  images?: string[];
  propertyTaxes?: number;
  [key: string]: any; // For other properties returned by the API
}

interface ZillowSearchParams {
  location?: string;
  price_min?: number;
  price_max?: number;
  beds_min?: number;
  baths_min?: number;
  home_types?: string;
  searchType?: 'forsale' | 'forrent';
  page?: number;
}

/**
 * Interface for similar homes parameters
 */
interface SimilarHomesParams {
  property_id: string;
}

/**
 * Interface for similar rental homes parameters
 */
interface SimilarRentalHomesParams {
  property_id: string;
  postal_code: string;
}

/**
 * Interface for mortgage rate parameters
 */
interface MortgageRateParams {
  creditScore: string; // excellent, good, fair, poor
  points?: string; // all, zero
  loanPurpose?: string; // purchase, refinance
  loanTypes?: string; // conventional, fha, va, usda
  loanPercent?: string; // loan to value ratio (e.g., "80")
  propertyPrice: string; // property price (e.g., "250000")
  zip: string; // zip code
}

/**
 * ZillowDataConnector class for handling Zillow API interactions
 */
class ZillowDataConnector {
  private dataSourceId: string | null = null;
  
  constructor() {
    // Register Zillow as a data source when initialized
    this.registerZillowDataSource();
  }
  
  /**
   * Register Zillow as a data source in the ETL system
   */
  async registerZillowDataSource(): Promise<void> {
    try {
      // Check if API key is available
      const isApiAvailable = await this.isZillowApiAvailable();
      if (!isApiAvailable) {
        console.error('Zillow API key is not set on the server. Please configure the RAPIDAPI_KEY environment variable.');
        return;
      }
      
      // Register the data source with the ETL data connector
      const dataSource = dataConnector.registerDataSource({
        name: 'Zillow Property Data',
        description: 'Property data from Zillow via RapidAPI',
        type: 'api',
        connectionDetails: {
          baseUrl: '/api/zillow', // Use our proxy endpoint
          authType: 'none', // No auth needed for our proxy
          headers: {
            'Content-Type': 'application/json'
          }
        }
      });
      
      this.dataSourceId = dataSource.id;
      console.log('Zillow data source registered with ID:', this.dataSourceId);
    } catch (error) {
      console.error('Failed to register Zillow data source:', error);
    }
  }
  
  /**
   * Get the Zillow data source ID
   */
  getDataSourceId(): string | null {
    return this.dataSourceId;
  }
  
  /**
   * Check if the Zillow API is available
   */
  async isZillowApiAvailable(): Promise<boolean> {
    try {
      const configResponse = await fetch('/api/config');
      const config = await configResponse.json();
      return !!config.hasRapidApiKey;
    } catch (error) {
      console.error('Error checking Zillow API availability:', error);
      return false;
    }
  }
  
  /**
   * Get property data by Zillow Property ID (zpid)
   */
  async getPropertyById(zpid: string): Promise<ZillowPropertyData | null> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isZillowApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Zillow API key is not configured on the server');
        return null;
      }
      
      // Use our secure proxy endpoint instead of making a direct API call
      const response = await fetch('/api/zillow/property-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ zpid })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformPropertyData(data);
    } catch (error) {
      console.error('Error fetching property data from Zillow:', error);
      return null;
    }
  }
  
  /**
   * Search for properties with the given parameters
   */
  async searchProperties(params: ZillowSearchParams): Promise<ZillowPropertyData[]> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isZillowApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Zillow API key is not configured on the server');
        return [];
      }
      
      // Use our secure proxy endpoint instead of making a direct API call
      const response = await fetch('/api/zillow/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }
      
      return data.results.map((item: any) => this.transformPropertyData(item));
    } catch (error) {
      console.error('Error searching properties from Zillow:', error);
      return [];
    }
  }
  
  /**
   * Get detailed information about schools near a property
   */
  async getPropertySchools(zpid: string): Promise<any[]> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isZillowApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Zillow API key is not configured on the server');
        return [];
      }
      
      // Use the same property data endpoint but request school-specific data
      const response = await fetch('/api/zillow/property-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ zpid, data: 'schools' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.schools || [];
    } catch (error) {
      console.error('Error fetching school data from Zillow:', error);
      return [];
    }
  }
  
  /**
   * Create an ETL job to import data from Zillow
   */
  async createZillowImportJob(location: string, targetDataSourceId: string, jobName?: string): Promise<string | null> {
    try {
      if (!this.dataSourceId) {
        throw new Error('Zillow data source not registered');
      }
      
      // Create a job to import data from Zillow to the target data source
      const job = etlPipelineManager.createJob({
        name: jobName || `Zillow Import - ${location}`,
        description: `Import property data for ${location} from Zillow API`,
        sourceId: this.dataSourceId,
        targetId: targetDataSourceId,
        transformationRules: [], // Will be populated by default transformation rules
      });
      
      console.log('Created Zillow import job:', job.id);
      return job.id;
    } catch (error) {
      console.error('Error creating Zillow import job:', error);
      return null;
    }
  }
  
  /**
   * Get similar homes for a property
   */
  async getSimilarHomes(params: SimilarHomesParams): Promise<any[]> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isZillowApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Zillow API key is not configured on the server');
        return [];
      }
      
      // Use our secure proxy endpoint for similar homes
      const response = await fetch('/api/zillow/similar-homes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.homes || !Array.isArray(data.homes)) {
        return [];
      }
      
      return data.homes.map((item: any) => this.transformPropertyData(item));
    } catch (error) {
      console.error('Error fetching similar homes from Zillow:', error);
      return [];
    }
  }
  
  /**
   * Get similar rental homes for a property
   */
  async getSimilarRentalHomes(params: SimilarRentalHomesParams): Promise<any[]> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isZillowApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Zillow API key is not configured on the server');
        return [];
      }
      
      // Use our secure proxy endpoint for similar rental homes
      const response = await fetch('/api/zillow/similar-rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.homes || !Array.isArray(data.homes)) {
        return [];
      }
      
      return data.homes.map((item: any) => this.transformPropertyData(item));
    } catch (error) {
      console.error('Error fetching similar rental homes from Zillow:', error);
      return [];
    }
  }
  
  /**
   * Check mortgage rates for a property
   */
  async checkMortgageRates(params: MortgageRateParams): Promise<any> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isZillowApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Zillow API key is not configured on the server');
        return null;
      }
      
      // Use our secure proxy endpoint for mortgage rates
      const response = await fetch('/api/zillow/mortgage-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking mortgage rates from Zillow:', error);
      return null;
    }
  }
  
  /**
   * Transform raw Zillow API data into a standardized format
   */
  private transformPropertyData(rawData: any): ZillowPropertyData {
    // Extract and normalize data from the API response
    // This will vary based on endpoint response format
    const property: ZillowPropertyData = {
      id: rawData.zpid || '',
      zpid: rawData.zpid || '',
      address: {
        streetAddress: rawData.address?.streetAddress || rawData.streetAddress || '',
        city: rawData.address?.city || rawData.city || '',
        state: rawData.address?.state || rawData.state || '',
        zipcode: rawData.address?.zipcode || rawData.zipcode || ''
      },
      price: rawData.price || rawData.zestimate || 0,
      bedrooms: rawData.bedrooms || 0,
      bathrooms: rawData.bathrooms || 0,
      livingArea: rawData.livingArea || rawData.livingAreaSqFt || 0,
      homeType: rawData.homeType || '',
      yearBuilt: rawData.yearBuilt || 0,
      lotSize: rawData.lotSize || rawData.lotSizeSqFt || 0,
      latitude: rawData.latitude || 0,
      longitude: rawData.longitude || 0,
      zestimate: rawData.zestimate || 0,
      description: rawData.description || '',
      propertyTaxes: rawData.propertyTaxes || 0
    };
    
    // Include any additional fields present in the raw data
    return property;
  }
  

}

// Export singleton instance
export const zillowDataConnector = new ZillowDataConnector();