import { 
  users, 
  properties, 
  etlDataSources,
  etlTransformationRules,
  etlJobs,
  etlOptimizationSuggestions,
  etlBatchJobs,
  etlAlerts,
  incomeHotelMotel,
  incomeHotelMotelDetail,
  incomeLeaseUp,
  incomeLeaseUpMonthListing,
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty,
  type EtlDataSource,
  type InsertEtlDataSource,
  type EtlTransformationRule,
  type InsertEtlTransformationRule,
  type EtlJob,
  type InsertEtlJob,
  type EtlOptimizationSuggestion,
  type InsertEtlOptimizationSuggestion,
  type EtlBatchJob,
  type InsertEtlBatchJob,
  type EtlAlert,
  type InsertEtlAlert,
  type IncomeHotelMotel,
  type InsertIncomeHotelMotel,
  type IncomeHotelMotelDetail,
  type InsertIncomeHotelMotelDetail,
  type IncomeLeaseUp,
  type InsertIncomeLeaseUp,
  type IncomeLeaseUpMonthListing,
  type InsertIncomeLeaseUpMonthListing,
  type NeighborhoodTimeline,
  type NeighborhoodTimelineDataPoint
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Neighborhood timeline operations
  getNeighborhoodTimelines(years?: number): Promise<NeighborhoodTimeline[]>;
  getNeighborhoodTimeline(neighborhoodId: string, years?: number): Promise<NeighborhoodTimeline | undefined>;
  getAvailableNeighborhoods(): Promise<{ id: string; name: string }[]>;
  
  // Property operations
  getProperties(filter?: { [key: string]: any }): Promise<Property[]>;
  getPropertyById(id: number): Promise<Property | undefined>;
  getPropertiesByFilter(filters: {
    neighborhood?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minValue?: number;
    maxValue?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    propertyType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Property[]>;
  getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  bulkImportProperties(properties: InsertProperty[]): Promise<{ success: boolean; count: number; errors?: any[] }>;
  searchProperties(searchText: string): Promise<Property[]>;
  
  // Income Approach operations
  // Hotel/Motel Income Approach
  getIncomeHotelMotels(): Promise<IncomeHotelMotel[]>;
  getIncomeHotelMotelById(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined>;
  createIncomeHotelMotel(incomeHotelMotel: InsertIncomeHotelMotel): Promise<IncomeHotelMotel>;
  updateIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number, incomeHotelMotel: Partial<InsertIncomeHotelMotel>): Promise<IncomeHotelMotel | undefined>;
  deleteIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number): Promise<boolean>;
  
  // Hotel/Motel Detail
  getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]>;
  getIncomeHotelMotelDetailByType(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined>;
  createIncomeHotelMotelDetail(incomeHotelMotelDetail: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail>;
  updateIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string, incomeHotelMotelDetail: Partial<InsertIncomeHotelMotelDetail>): Promise<IncomeHotelMotelDetail | undefined>;
  deleteIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<boolean>;
  
  // Lease Up
  getIncomeLeaseUps(): Promise<IncomeLeaseUp[]>;
  getIncomeLeaseUpById(id: number): Promise<IncomeLeaseUp | undefined>;
  createIncomeLeaseUp(incomeLeaseUp: InsertIncomeLeaseUp): Promise<IncomeLeaseUp>;
  updateIncomeLeaseUp(id: number, incomeLeaseUp: Partial<InsertIncomeLeaseUp>): Promise<IncomeLeaseUp | undefined>;
  deleteIncomeLeaseUp(id: number): Promise<boolean>;
  
  // Lease Up Month Listing
  getIncomeLeaseUpMonthListings(incomeLeaseUpId: number): Promise<IncomeLeaseUpMonthListing[]>;
  getIncomeLeaseUpMonthListingById(id: number): Promise<IncomeLeaseUpMonthListing | undefined>;
  createIncomeLeaseUpMonthListing(incomeLeaseUpMonthListing: InsertIncomeLeaseUpMonthListing): Promise<IncomeLeaseUpMonthListing>;
  updateIncomeLeaseUpMonthListing(id: number, incomeLeaseUpMonthListing: Partial<InsertIncomeLeaseUpMonthListing>): Promise<IncomeLeaseUpMonthListing | undefined>;
  deleteIncomeLeaseUpMonthListing(id: number): Promise<boolean>;

  // ETL Data Source operations
  getEtlDataSources(): Promise<EtlDataSource[]>;
  getEtlDataSourceById(id: number): Promise<EtlDataSource | undefined>;
  createEtlDataSource(dataSource: InsertEtlDataSource): Promise<EtlDataSource>;
  updateEtlDataSource(id: number, dataSource: Partial<InsertEtlDataSource>): Promise<EtlDataSource | undefined>;
  deleteEtlDataSource(id: number): Promise<boolean>;
  
  // ETL Transformation Rule operations
  getEtlTransformationRules(): Promise<EtlTransformationRule[]>;
  getEtlTransformationRuleById(id: number): Promise<EtlTransformationRule | undefined>;
  createEtlTransformationRule(rule: InsertEtlTransformationRule): Promise<EtlTransformationRule>;
  updateEtlTransformationRule(id: number, rule: Partial<InsertEtlTransformationRule>): Promise<EtlTransformationRule | undefined>;
  deleteEtlTransformationRule(id: number): Promise<boolean>;
  
  // ETL Job operations
  getEtlJobs(): Promise<EtlJob[]>;
  getEtlJobById(id: number): Promise<EtlJob | undefined>;
  createEtlJob(job: InsertEtlJob): Promise<EtlJob>;
  updateEtlJob(id: number, job: Partial<InsertEtlJob>): Promise<EtlJob | undefined>;
  deleteEtlJob(id: number): Promise<boolean>;
  
  // ETL Optimization Suggestion operations
  getEtlOptimizationSuggestions(): Promise<EtlOptimizationSuggestion[]>;
  getEtlOptimizationSuggestionsByJobId(jobId: number): Promise<EtlOptimizationSuggestion[]>;
  getEtlOptimizationSuggestionById(id: number): Promise<EtlOptimizationSuggestion | undefined>;
  createEtlOptimizationSuggestion(suggestion: InsertEtlOptimizationSuggestion): Promise<EtlOptimizationSuggestion>;
  updateEtlOptimizationSuggestion(id: number, suggestion: Partial<InsertEtlOptimizationSuggestion>): Promise<EtlOptimizationSuggestion | undefined>;
  deleteEtlOptimizationSuggestion(id: number): Promise<boolean>;
  
  // ETL Batch Job operations
  getEtlBatchJobs(): Promise<EtlBatchJob[]>;
  getEtlBatchJobById(id: number): Promise<EtlBatchJob | undefined>;
  createEtlBatchJob(batchJob: InsertEtlBatchJob): Promise<EtlBatchJob>;
  updateEtlBatchJob(id: number, batchJob: Partial<InsertEtlBatchJob>): Promise<EtlBatchJob | undefined>;
  deleteEtlBatchJob(id: number): Promise<boolean>;
  
  // ETL Alert operations
  getEtlAlerts(): Promise<EtlAlert[]>;
  getEtlAlertsByJobId(jobId: number): Promise<EtlAlert[]>;
  getEtlAlertById(id: number): Promise<EtlAlert | undefined>;
  createEtlAlert(alert: InsertEtlAlert): Promise<EtlAlert>;
  updateEtlAlert(id: number, alert: Partial<InsertEtlAlert>): Promise<EtlAlert | undefined>;
  deleteEtlAlert(id: number): Promise<boolean>;
  
  // Neighborhood operations
  getAvailableNeighborhoods(): Promise<{id: string, name: string}[]>;
  getNeighborhoodTimelines(years?: number): Promise<NeighborhoodTimeline[]>;
  getNeighborhoodTimeline(id: string, years?: number): Promise<NeighborhoodTimeline | undefined>;
}

// MemStorage class implementation
export class MemStorage implements IStorage {
  private users: Record<number, User>;
  private properties: Record<number, Property>;
  private etlDataSourcesMap: Record<number, EtlDataSource>;
  private etlTransformationRulesMap: Record<number, EtlTransformationRule>;
  private etlJobsMap: Record<number, EtlJob>;
  private etlOptimizationSuggestionsMap: Record<number, EtlOptimizationSuggestion>;
  private etlBatchJobsMap: Record<number, EtlBatchJob>;
  private etlAlertsMap: Record<number, EtlAlert>;
  
  // Income approach storage
  private incomeHotelMotelMap: Record<string, IncomeHotelMotel>;
  private incomeHotelMotelDetailMap: Record<string, IncomeHotelMotelDetail>;
  private incomeLeaseUpMap: Record<number, IncomeLeaseUp>;
  private incomeLeaseUpMonthListingMap: Record<number, IncomeLeaseUpMonthListing>;
  
  private userCurrentId: number;
  private propertyCurrentId: number;
  private etlDataSourceCurrentId: number;
  private etlTransformationRuleCurrentId: number;
  private etlJobCurrentId: number;
  private etlOptimizationSuggestionCurrentId: number;
  private etlBatchJobCurrentId: number;
  private etlAlertCurrentId: number;
  private incomeLeaseUpCurrentId: number;
  private incomeLeaseUpMonthListingCurrentId: number;

  constructor() {
    this.users = {};
    this.properties = {};
    this.etlDataSourcesMap = {};
    this.etlTransformationRulesMap = {};
    this.etlJobsMap = {};
    this.etlOptimizationSuggestionsMap = {};
    this.etlBatchJobsMap = {};
    this.etlAlertsMap = {};
    
    // Initialize income approach maps
    this.incomeHotelMotelMap = {};
    this.incomeHotelMotelDetailMap = {};
    this.incomeLeaseUpMap = {};
    this.incomeLeaseUpMonthListingMap = {};
    
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
    this.etlDataSourceCurrentId = 1;
    this.etlTransformationRuleCurrentId = 1;
    this.etlJobCurrentId = 1;
    this.etlOptimizationSuggestionCurrentId = 1;
    this.etlBatchJobCurrentId = 1;
    this.etlAlertCurrentId = 1;
    this.incomeLeaseUpCurrentId = 1;
    this.incomeLeaseUpMonthListingCurrentId = 1;
    
    // Do not initialize sample data - only use real Benton County data
    // this.initializeSampleProperties();
    this.initializeSampleEtlData(); // Keeping ETL data for functionality
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users[id];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Object.values(this.users).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || 'viewer', 
      email: insertUser.email || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true
    };
    this.users[id] = user;
    return user;
  }
  
  // Neighborhood timeline operations
  async getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
    // Get all unique neighborhoods from properties
    const neighborhoods = await this.getAvailableNeighborhoods();
    
    // Generate timeline data for each neighborhood
    const timelines: NeighborhoodTimeline[] = [];
    
    for (const neighborhood of neighborhoods) {
      const timeline = await this.getNeighborhoodTimeline(neighborhood.id, years);
      if (timeline) {
        timelines.push(timeline);
      }
    }
    
    return timelines;
  }
  
  async getNeighborhoodTimeline(neighborhoodId: string, years: number = 10): Promise<NeighborhoodTimeline | undefined> {
    // Get properties in this neighborhood
    const properties = await this.getPropertiesByFilter({ neighborhood: neighborhoodId });
    
    if (properties.length === 0) {
      return undefined;
    }
    
    // Calculate the current year and start year
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years + 1;
    
    // Initialize data points for each year
    const dataPoints: NeighborhoodTimelineDataPoint[] = [];
    
    // Track the previous year's average value to calculate percent change
    let previousYearAvg = 0;
    
    for (let year = startYear; year <= currentYear; year++) {
      const yearStr = year.toString();
      let totalValue = 0;
      let count = 0;
      let transactionCount = Math.floor(Math.random() * 120) + 50; // Temporary random transactions
      
      // Process each property's historical values
      for (const property of properties) {
        // Check if the property has historical values
        if (property.historicalValues && typeof property.historicalValues === 'object') {
          // Safely cast historicalValues to a Record<string, any>
          const historicalValues = property.historicalValues as Record<string, string | number>;
          const yearlyValue = historicalValues[yearStr];
          
          if (yearlyValue) {
            // If the value is a string, parse it, otherwise use as is
            const numValue = typeof yearlyValue === 'string' 
              ? parseFloat(yearlyValue.replace(/[^0-9.-]+/g, ''))
              : Number(yearlyValue);
            
            if (!isNaN(numValue) && numValue > 0) {
              totalValue += numValue;
              count++;
            }
          }
        }
      }
      
      // Calculate the average value for this year
      const avgValue = count > 0 ? totalValue / count : 0;
      
      // Calculate percent change from previous year
      const percentChange = previousYearAvg > 0 
        ? (avgValue - previousYearAvg) / previousYearAvg 
        : 0;
      
      // Create data point
      dataPoints.push({
        year: yearStr,
        value: Math.round(avgValue),
        percentChange,
        transactionCount
      });
      
      // Update previous year average
      previousYearAvg = avgValue;
    }
    
    // Calculate average value across all years
    const avgValue = dataPoints.reduce((sum, point) => sum + point.value, 0) / dataPoints.length;
    
    // Calculate growth rate
    const growthRate = this.calculateAverageGrowthRate(dataPoints);
    
    return {
      id: neighborhoodId,
      name: this.getNeighborhoodName(neighborhoodId),
      data: dataPoints,
      avgValue,
      growthRate
    };
  }
  
  async getAvailableNeighborhoods(): Promise<{ id: string; name: string }[]> {
    // Get all properties
    const properties = Object.values(this.properties);
    
    // Extract unique neighborhoods
    const neighborhoodSet = new Set<string>();
    properties.forEach(property => {
      if (property.neighborhood) {
        neighborhoodSet.add(property.neighborhood);
      }
    });
    
    // Convert to array of objects
    return Array.from(neighborhoodSet).map(neighborhood => ({
      id: neighborhood,
      name: this.getNeighborhoodName(neighborhood)
    }));
  }
  
  // Helper methods
  private getNeighborhoodName(id: string): string {
    // Format neighborhood ID to make it more readable
    // e.g., "west_richland" -> "West Richland"
    return id
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  
  private calculateAverageGrowthRate(data: NeighborhoodTimelineDataPoint[]): number {
    if (data.length < 2) return 0;
    
    // Calculate total growth over the entire period
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    
    if (firstValue === 0) return 0;
    
    const totalGrowth = (lastValue / firstValue) - 1;
    
    // Calculate average annual growth rate (CAGR)
    const years = data.length - 1;
    const averageAnnualGrowthRate = Math.pow(1 + totalGrowth, 1 / years) - 1;
    
    return averageAnnualGrowthRate;
  }

  // Property operations
  async getProperties(filter?: { [key: string]: any }): Promise<Property[]> {
    let properties = Object.values(this.properties);
    
    if (filter) {
      properties = properties.filter(property => {
        // Check if all filter conditions match
        return Object.entries(filter).every(([key, value]) => {
          return property[key as keyof Property] === value;
        });
      });
    }
    
    return properties;
  }

  async getPropertyById(id: number): Promise<Property | undefined> {
    return this.properties[id];
  }

  async getPropertiesByFilter(filters: {
    neighborhood?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minValue?: number;
    maxValue?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    propertyType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Property[]> {
    let properties = Object.values(this.properties);

    // Apply filters
    if (filters.neighborhood) {
      properties = properties.filter(p => p.neighborhood === filters.neighborhood);
    }

    if (filters.minYearBuilt !== undefined) {
      properties = properties.filter(p => p.yearBuilt && p.yearBuilt >= filters.minYearBuilt!);
    }

    if (filters.maxYearBuilt !== undefined) {
      properties = properties.filter(p => p.yearBuilt && p.yearBuilt <= filters.maxYearBuilt!);
    }

    if (filters.minSquareFeet !== undefined) {
      properties = properties.filter(p => p.squareFeet >= filters.minSquareFeet!);
    }

    if (filters.maxSquareFeet !== undefined) {
      properties = properties.filter(p => p.squareFeet <= filters.maxSquareFeet!);
    }

    if (filters.propertyType) {
      properties = properties.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      properties = properties.filter(p => {
        if (!p.value) return false;
        
        const numValue = parseFloat(p.value.replace(/[^0-9.-]+/g, ''));
        
        if (filters.minValue !== undefined && numValue < filters.minValue) {
          return false;
        }
        
        if (filters.maxValue !== undefined && numValue > filters.maxValue) {
          return false;
        }
        
        return true;
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
      
      properties.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof Property];
        const bValue = b[filters.sortBy as keyof Property];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder * aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder * (aValue - bValue);
        }
        
        if (!aValue && bValue) return sortOrder;
        if (aValue && !bValue) return -sortOrder;
        
        return 0;
      });
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || properties.length;
    
    return properties.slice(offset, offset + limit);
  }

  async getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]> {
    const [south, west, north, east] = bounds;
    
    return Object.values(this.properties).filter(property => {
      if (!property.coordinates) return false;
      
      // Check if coordinates is an array or use latitude/longitude fields
      if (property.coordinates && Array.isArray(property.coordinates)) {
        const [lat, lng] = property.coordinates;
        return lat >= south && lat <= north && lng >= west && lng <= east;
      } else if (property.latitude && property.longitude) {
        return Number(property.latitude) >= south && Number(property.latitude) <= north && 
               Number(property.longitude) >= west && Number(property.longitude) <= east;
      }
      return false;
    });
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const property: Property = { 
      id,
      parcelId: insertProperty.parcelId,
      address: insertProperty.address,
      owner: insertProperty.owner || null,
      value: insertProperty.value || null,
      estimatedValue: insertProperty.estimatedValue || null,
      salePrice: insertProperty.salePrice || null,
      squareFeet: insertProperty.squareFeet,
      yearBuilt: insertProperty.yearBuilt || null,
      landValue: insertProperty.landValue || null,
      coordinates: insertProperty.coordinates || null,
      latitude: insertProperty.latitude || null,
      longitude: insertProperty.longitude || null,
      neighborhood: insertProperty.neighborhood || null,
      propertyType: insertProperty.propertyType || null,
      bedrooms: insertProperty.bedrooms || null,
      bathrooms: insertProperty.bathrooms || null,
      lotSize: insertProperty.lotSize || null,
      zoning: insertProperty.zoning || null,
      lastSaleDate: insertProperty.lastSaleDate || null,
      taxAssessment: insertProperty.taxAssessment || null,
      pricePerSqFt: insertProperty.pricePerSqFt || null,
      attributes: insertProperty.attributes || {},
      historicalValues: insertProperty.historicalValues || {},
      sourceId: insertProperty.sourceId || null,
      zillowId: insertProperty.zillowId || null
    };
    this.properties[id] = property;
    return property;
  }
  
  async updateProperty(id: number, updateData: Partial<Property>): Promise<Property | undefined> {
    if (!this.properties[id]) {
      return undefined;
    }
    
    const property = this.properties[id];
    
    // Update the property with new data
    this.properties[id] = {
      ...property,
      ...updateData,
      // Always keep the original ID
      id: property.id
    };
    
    return this.properties[id];
  }
  
  async bulkImportProperties(properties: (InsertProperty & { _importOptions?: { allowDuplicates?: boolean; updateExisting?: boolean } })[]): Promise<{ success: boolean; count: number; updated?: number; errors?: any[] }> {
    try {
      const errors: any[] = [];
      let successCount = 0;
      let updatedCount = 0;
      
      // Check for duplicate parcel IDs
      const existingParcelIds = new Set(Object.values(this.properties).map(p => p.parcelId));
      const newParcelIds = new Set();
      
      for (const propertyWithOptions of properties) {
        try {
          // Extract import options
          const importOptions = propertyWithOptions._importOptions || {};
          const allowDuplicates = importOptions.allowDuplicates || false;
          const updateExisting = importOptions.updateExisting || false;
          
          // Create a clean property object without the _importOptions
          const { _importOptions, ...property } = propertyWithOptions;
          
          // Validate required fields
          if (!property.parcelId || !property.address || property.squareFeet === undefined) {
            errors.push({
              property,
              error: 'Missing required fields: parcelId, address, or squareFeet'
            });
            continue;
          }
          
          // Check for duplicate parcel IDs within existing properties
          const existingPropertyId = Object.keys(this.properties).find(
            id => this.properties[Number(id)].parcelId === property.parcelId
          );
          
          if (existingParcelIds.has(property.parcelId)) {
            // Handle existing property based on options
            if (updateExisting && existingPropertyId) {
              // Update the existing property
              const existingId = Number(existingPropertyId);
              const existingProperty = this.properties[existingId];
              
              // Merge the properties, keeping the existing ID
              const updatedProperty: Property = {
                ...existingProperty,
                ...property,
                id: existingId
              };
              
              this.properties[existingId] = updatedProperty;
              updatedCount++;
              continue;
            } else if (!allowDuplicates) {
              // Reject duplicate if not allowed
              errors.push({
                property,
                error: `Duplicate parcel ID: ${property.parcelId}`
              });
              continue;
            }
            // If duplicates are allowed and we're not updating, we'll create a new property below
          }
          
          // Check for duplicate parcel IDs within the import batch
          if (newParcelIds.has(property.parcelId) && !allowDuplicates) {
            errors.push({
              property,
              error: `Duplicate parcel ID within import batch: ${property.parcelId}`
            });
            continue;
          }
          
          // Create the property
          await this.createProperty(property);
          newParcelIds.add(property.parcelId);
          successCount++;
        } catch (err) {
          errors.push({
            property: propertyWithOptions,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
      
      return {
        success: successCount > 0 || updatedCount > 0,
        count: successCount,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async searchProperties(searchText: string): Promise<Property[]> {
    if (!searchText) {
      return [];
    }
    
    const searchLower = searchText.toLowerCase();
    
    return Object.values(this.properties).filter(property => {
      const address = property.address.toLowerCase();
      const owner = property.owner?.toLowerCase() || '';
      const parcelId = property.parcelId.toLowerCase();
      const neighborhood = property.neighborhood?.toLowerCase() || '';
      
      return (
        address.includes(searchLower) ||
        owner.includes(searchLower) ||
        parcelId.includes(searchLower) ||
        neighborhood.includes(searchLower)
      );
    });
  }

  // Income approach operations
  // Hotel/Motel
  async getIncomeHotelMotels(): Promise<IncomeHotelMotel[]> {
    return Object.values(this.incomeHotelMotelMap);
  }

  async getIncomeHotelMotelById(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}`;
    return this.incomeHotelMotelMap[key];
  }
  
  // Alias for routes.ts to use
  async getAllIncomeHotelMotels(): Promise<IncomeHotelMotel[]> {
    return this.getIncomeHotelMotels();
  }
  
  // Alias for routes.ts to use
  async getIncomeHotelMotel(incomeYear: string, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> {
    return this.getIncomeHotelMotelById(Number(incomeYear), supNum, incomeId);
  }
  
  // Alias for routes.ts to use
  async insertIncomeHotelMotel(incomeHotelMotel: InsertIncomeHotelMotel): Promise<IncomeHotelMotel> {
    return this.createIncomeHotelMotel(incomeHotelMotel);
  }

  async createIncomeHotelMotel(incomeHotelMotel: InsertIncomeHotelMotel): Promise<IncomeHotelMotel> {
    // Create a composite key for storage
    const key = `${incomeHotelMotel.incomeYear}-${incomeHotelMotel.supNum}-${incomeHotelMotel.incomeId}`;
    
    // Convert or ensure values are strings as required by the schema
    const hotelMotel: IncomeHotelMotel = {
      incomeYear: incomeHotelMotel.incomeYear.toString(),
      supNum: incomeHotelMotel.supNum,
      incomeId: incomeHotelMotel.incomeId,
      sizeInSqft: (incomeHotelMotel.sizeInSqft || "0").toString(),
      averageDailyRoomRate: (incomeHotelMotel.averageDailyRoomRate || "0").toString(),
      numberOfRooms: (incomeHotelMotel.numberOfRooms || "0").toString(),
      numberOfRoomNights: (incomeHotelMotel.numberOfRoomNights || "0").toString(),
      incomeValueReconciled: (incomeHotelMotel.incomeValueReconciled || "0").toString(),
      incomeValuePerRoom: (incomeHotelMotel.incomeValuePerRoom || "0").toString(),
      assessmentValuePerRoom: (incomeHotelMotel.assessmentValuePerRoom || "0").toString(),
      incomeValuePerSqft: (incomeHotelMotel.incomeValuePerSqft || "0").toString(),
      assessmentValuePerSqft: (incomeHotelMotel.assessmentValuePerSqft || "0").toString()
    };
    
    this.incomeHotelMotelMap[key] = hotelMotel;
    return hotelMotel;
  }

  async updateIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number, incomeHotelMotel: Partial<InsertIncomeHotelMotel>): Promise<IncomeHotelMotel | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}`;
    const existingHotelMotel = this.incomeHotelMotelMap[key];
    
    if (!existingHotelMotel) {
      return undefined;
    }
    
    // Update only the provided fields, ensuring string representation for schema compatibility
    const updatedHotelMotel: IncomeHotelMotel = {
      ...existingHotelMotel,
      sizeInSqft: incomeHotelMotel.sizeInSqft !== undefined ? incomeHotelMotel.sizeInSqft.toString() : existingHotelMotel.sizeInSqft,
      averageDailyRoomRate: incomeHotelMotel.averageDailyRoomRate !== undefined ? incomeHotelMotel.averageDailyRoomRate.toString() : existingHotelMotel.averageDailyRoomRate,
      numberOfRooms: incomeHotelMotel.numberOfRooms !== undefined ? incomeHotelMotel.numberOfRooms.toString() : existingHotelMotel.numberOfRooms,
      numberOfRoomNights: incomeHotelMotel.numberOfRoomNights !== undefined ? incomeHotelMotel.numberOfRoomNights.toString() : existingHotelMotel.numberOfRoomNights,
      incomeValueReconciled: incomeHotelMotel.incomeValueReconciled !== undefined ? incomeHotelMotel.incomeValueReconciled.toString() : existingHotelMotel.incomeValueReconciled,
      incomeValuePerRoom: incomeHotelMotel.incomeValuePerRoom !== undefined ? incomeHotelMotel.incomeValuePerRoom.toString() : existingHotelMotel.incomeValuePerRoom,
      assessmentValuePerRoom: incomeHotelMotel.assessmentValuePerRoom !== undefined ? incomeHotelMotel.assessmentValuePerRoom.toString() : existingHotelMotel.assessmentValuePerRoom,
      incomeValuePerSqft: incomeHotelMotel.incomeValuePerSqft !== undefined ? incomeHotelMotel.incomeValuePerSqft.toString() : existingHotelMotel.incomeValuePerSqft,
      assessmentValuePerSqft: incomeHotelMotel.assessmentValuePerSqft !== undefined ? incomeHotelMotel.assessmentValuePerSqft.toString() : existingHotelMotel.assessmentValuePerSqft
    };
    
    this.incomeHotelMotelMap[key] = updatedHotelMotel;
    return updatedHotelMotel;
  }

  async deleteIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number): Promise<boolean> {
    const key = `${incomeYear}-${supNum}-${incomeId}`;
    
    if (this.incomeHotelMotelMap[key]) {
      delete this.incomeHotelMotelMap[key];
      return true;
    }
    
    return false;
  }
  
  // Hotel/Motel Detail
  async getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]> {
    const prefix = `${incomeYear}-${supNum}-${incomeId}-`;
    return Object.entries(this.incomeHotelMotelDetailMap)
      .filter(([key]) => key.startsWith(prefix))
      .map(([, detail]) => detail);
  }
  
  // Alias for routes.ts to use
  async getAllIncomeHotelMotelDetails(): Promise<IncomeHotelMotelDetail[]> {
    return Object.values(this.incomeHotelMotelDetailMap);
  }
  
  // Alias for routes.ts to use
  async getIncomeHotelMotelDetail(incomeYear: string, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined> {
    return this.getIncomeHotelMotelDetailByType(Number(incomeYear), supNum, incomeId, valueType);
  }
  
  // Alias for routes.ts to use
  async insertIncomeHotelMotelDetail(incomeHotelMotelDetail: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail> {
    return this.createIncomeHotelMotelDetail(incomeHotelMotelDetail);
  }

  async getIncomeHotelMotelDetailByType(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    return this.incomeHotelMotelDetailMap[key];
  }

  async createIncomeHotelMotelDetail(incomeHotelMotelDetail: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail> {
    const key = `${incomeHotelMotelDetail.incomeYear}-${incomeHotelMotelDetail.supNum}-${incomeHotelMotelDetail.incomeId}-${incomeHotelMotelDetail.valueType}`;
    
    // Convert numeric fields
    const detail: IncomeHotelMotelDetail = {
      incomeYear: Number(incomeHotelMotelDetail.incomeYear),
      supNum: Number(incomeHotelMotelDetail.supNum),
      incomeId: Number(incomeHotelMotelDetail.incomeId),
      valueType: incomeHotelMotelDetail.valueType,
      roomRevenue: Number(incomeHotelMotelDetail.roomRevenue || 0),
      roomRevenuePct: Number(incomeHotelMotelDetail.roomRevenuePct || 0),
      roomRevenueUpdate: incomeHotelMotelDetail.roomRevenueUpdate || "",
      vacancyCollectionLoss: Number(incomeHotelMotelDetail.vacancyCollectionLoss || 0),
      vacancyCollectionLossPct: Number(incomeHotelMotelDetail.vacancyCollectionLossPct || 0),
      vacancyCollectionLossUpdate: incomeHotelMotelDetail.vacancyCollectionLossUpdate || "",
      foodBeverageIncome: Number(incomeHotelMotelDetail.foodBeverageIncome || 0),
      foodBeverageIncomePct: Number(incomeHotelMotelDetail.foodBeverageIncomePct || 0),
      foodBeverageIncomeUpdate: incomeHotelMotelDetail.foodBeverageIncomeUpdate || "",
      miscIncome: Number(incomeHotelMotelDetail.miscIncome || 0),
      miscIncomePct: Number(incomeHotelMotelDetail.miscIncomePct || 0),
      miscIncomeUpdate: incomeHotelMotelDetail.miscIncomeUpdate || "",
      effectiveGrossIncome: Number(incomeHotelMotelDetail.effectiveGrossIncome || 0),
      effectiveGrossIncomePct: Number(incomeHotelMotelDetail.effectiveGrossIncomePct || 0),
      utilities: Number(incomeHotelMotelDetail.utilities || 0),
      utilitiesPct: Number(incomeHotelMotelDetail.utilitiesPct || 0),
      utilitiesUpdate: incomeHotelMotelDetail.utilitiesUpdate || "",
      maintenanceRepair: Number(incomeHotelMotelDetail.maintenanceRepair || 0),
      maintenanceRepairPct: Number(incomeHotelMotelDetail.maintenanceRepairPct || 0),
      maintenanceRepairUpdate: incomeHotelMotelDetail.maintenanceRepairUpdate || "",
      departmentExpenses: Number(incomeHotelMotelDetail.departmentExpenses || 0),
      departmentExpensesPct: Number(incomeHotelMotelDetail.departmentExpensesPct || 0),
      departmentExpensesUpdate: incomeHotelMotelDetail.departmentExpensesUpdate || "",
      management: Number(incomeHotelMotelDetail.management || 0),
      managementPct: Number(incomeHotelMotelDetail.managementPct || 0),
      managementUpdate: incomeHotelMotelDetail.managementUpdate || "",
      administrative: Number(incomeHotelMotelDetail.administrative || 0),
      administrativePct: Number(incomeHotelMotelDetail.administrativePct || 0),
      administrativeUpdate: incomeHotelMotelDetail.administrativeUpdate || "",
      payroll: Number(incomeHotelMotelDetail.payroll || 0),
      payrollPct: Number(incomeHotelMotelDetail.payrollPct || 0),
      payrollUpdate: incomeHotelMotelDetail.payrollUpdate || "",
      insurance: Number(incomeHotelMotelDetail.insurance || 0),
      insurancePct: Number(incomeHotelMotelDetail.insurancePct || 0),
      insuranceUpdate: incomeHotelMotelDetail.insuranceUpdate || "",
      marketing: Number(incomeHotelMotelDetail.marketing || 0),
      marketingPct: Number(incomeHotelMotelDetail.marketingPct || 0),
      marketingUpdate: incomeHotelMotelDetail.marketingUpdate || "",
      realEstateTax: Number(incomeHotelMotelDetail.realEstateTax || 0),
      realEstateTaxPct: Number(incomeHotelMotelDetail.realEstateTaxPct || 0),
      realEstateTaxUpdate: incomeHotelMotelDetail.realEstateTaxUpdate || "",
      franchiseFee: Number(incomeHotelMotelDetail.franchiseFee || 0),
      franchiseFeePct: Number(incomeHotelMotelDetail.franchiseFeePct || 0),
      franchiseFeeUpdate: incomeHotelMotelDetail.franchiseFeeUpdate || "",
      other: Number(incomeHotelMotelDetail.other || 0),
      otherPct: Number(incomeHotelMotelDetail.otherPct || 0),
      otherUpdate: incomeHotelMotelDetail.otherUpdate || "",
      totalExpenses: Number(incomeHotelMotelDetail.totalExpenses || 0),
      totalExpensesPct: Number(incomeHotelMotelDetail.totalExpensesPct || 0),
      totalExpensesUpdate: incomeHotelMotelDetail.totalExpensesUpdate || "",
      netOperatingIncome: Number(incomeHotelMotelDetail.netOperatingIncome || 0),
      netOperatingIncomePct: Number(incomeHotelMotelDetail.netOperatingIncomePct || 0),
      capRate: Number(incomeHotelMotelDetail.capRate || 0),
      capRateUpdate: incomeHotelMotelDetail.capRateUpdate || "",
      taxRate: Number(incomeHotelMotelDetail.taxRate || 0),
      taxRateUpdate: incomeHotelMotelDetail.taxRateUpdate || "",
      overallCapRate: Number(incomeHotelMotelDetail.overallCapRate || 0),
      incomeValue: Number(incomeHotelMotelDetail.incomeValue || 0),
      personalPropertyValue: Number(incomeHotelMotelDetail.personalPropertyValue || 0),
      personalPropertyValueUpdate: incomeHotelMotelDetail.personalPropertyValueUpdate || "",
      otherValue: Number(incomeHotelMotelDetail.otherValue || 0),
      otherValueUpdate: incomeHotelMotelDetail.otherValueUpdate || "",
      indicatedIncomeValue: Number(incomeHotelMotelDetail.indicatedIncomeValue || 0)
    };
    
    this.incomeHotelMotelDetailMap[key] = detail;
    return detail;
  }

  async updateIncomeHotelMotelDetail(
    incomeYear: number, 
    supNum: number, 
    incomeId: number, 
    valueType: string, 
    incomeHotelMotelDetail: Partial<InsertIncomeHotelMotelDetail>
  ): Promise<IncomeHotelMotelDetail | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    const existingDetail = this.incomeHotelMotelDetailMap[key];
    
    if (!existingDetail) {
      return undefined;
    }
    
    // Only update fields that were passed in
    const updatedDetail: IncomeHotelMotelDetail = { ...existingDetail };
    
    // Process each field that's present in the update
    Object.keys(incomeHotelMotelDetail).forEach(field => {
      const value = incomeHotelMotelDetail[field as keyof InsertIncomeHotelMotelDetail];
      if (value !== undefined) {
        // For numeric fields, convert to number
        if (typeof existingDetail[field as keyof IncomeHotelMotelDetail] === 'number') {
          (updatedDetail as any)[field] = Number(value);
        } else {
          (updatedDetail as any)[field] = value;
        }
      }
    });
    
    this.incomeHotelMotelDetailMap[key] = updatedDetail;
    return updatedDetail;
  }

  async deleteIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<boolean> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    
    if (this.incomeHotelMotelDetailMap[key]) {
      delete this.incomeHotelMotelDetailMap[key];
      return true;
    }
    
    return false;
  }
  
  // Lease Up
  async getIncomeLeaseUps(): Promise<IncomeLeaseUp[]> {
    return Object.values(this.incomeLeaseUpMap);
  }
  
  // Alias for routes.ts to use
  async getAllIncomeLeaseUps(): Promise<IncomeLeaseUp[]> {
    return this.getIncomeLeaseUps();
  }
  
  // Alias for routes.ts to use
  async getIncomeLeaseUp(id: number): Promise<IncomeLeaseUp | undefined> {
    return this.getIncomeLeaseUpById(id);
  }
  
  // Alias for routes.ts to use
  async insertIncomeLeaseUp(incomeLeaseUp: InsertIncomeLeaseUp): Promise<IncomeLeaseUp> {
    return this.createIncomeLeaseUp(incomeLeaseUp);
  }

  async getIncomeLeaseUpById(id: number): Promise<IncomeLeaseUp | undefined> {
    return this.incomeLeaseUpMap[id];
  }

  async createIncomeLeaseUp(incomeLeaseUp: InsertIncomeLeaseUp): Promise<IncomeLeaseUp> {
    const id = this.incomeLeaseUpCurrentId++;
    
    const newLeaseUp: IncomeLeaseUp = {
      incomeLeaseUpId: id,
      incomeYear: Number(incomeLeaseUp.incomeYear),
      supNum: Number(incomeLeaseUp.supNum),
      incomeId: Number(incomeLeaseUp.incomeId),
      frequency: incomeLeaseUp.frequency || "A",
      leaseType: incomeLeaseUp.leaseType || null,
      unitOfMeasure: incomeLeaseUp.unitOfMeasure || null,
      rentLossAreaSqft: incomeLeaseUp.rentLossAreaSqft !== undefined ? Number(incomeLeaseUp.rentLossAreaSqft) : null,
      rentSqft: incomeLeaseUp.rentSqft !== undefined ? Number(incomeLeaseUp.rentSqft) : null,
      rentNumberOfYears: incomeLeaseUp.rentNumberOfYears !== undefined ? Number(incomeLeaseUp.rentNumberOfYears) : null,
      rentTotal: incomeLeaseUp.rentTotal !== undefined ? Number(incomeLeaseUp.rentTotal) : null,
      leasePct: incomeLeaseUp.leasePct !== undefined ? Number(incomeLeaseUp.leasePct) : null,
      leaseTotal: incomeLeaseUp.leaseTotal !== undefined ? Number(incomeLeaseUp.leaseTotal) : null,
      totalFinishOutSqft: incomeLeaseUp.totalFinishOutSqft !== undefined ? Number(incomeLeaseUp.totalFinishOutSqft) : null,
      totalFinishOutTotal: incomeLeaseUp.totalFinishOutTotal !== undefined ? Number(incomeLeaseUp.totalFinishOutTotal) : null,
      discountRate: incomeLeaseUp.discountRate !== undefined ? Number(incomeLeaseUp.discountRate) : null,
      numberOfYears: incomeLeaseUp.numberOfYears !== undefined ? Number(incomeLeaseUp.numberOfYears) : null,
      leaseUpCost: incomeLeaseUp.leaseUpCost !== undefined ? Number(incomeLeaseUp.leaseUpCost) : null,
      leaseUpCostOverride: incomeLeaseUp.leaseUpCostOverride || false,
      netRentableArea: Number(incomeLeaseUp.netRentableArea || 0),
      currentOccupancyPct: Number(incomeLeaseUp.currentOccupancyPct || 100),
      stabilizedOccupancyPct: Number(incomeLeaseUp.stabilizedOccupancyPct || 0),
      stabilizedOccupancy: Number(incomeLeaseUp.stabilizedOccupancy || 0),
      spaceToBeAbsorbed: Number(incomeLeaseUp.spaceToBeAbsorbed || 0),
      absorptionPeriodInMonths: Number(incomeLeaseUp.absorptionPeriodInMonths || 0),
      estimatedAbsorptionPerYear: Number(incomeLeaseUp.estimatedAbsorptionPerYear || 0),
      estimatedAbsorptionPerMonth: Number(incomeLeaseUp.estimatedAbsorptionPerMonth || 0),
      leasingCommissionsPct: Number(incomeLeaseUp.leasingCommissionsPct || 0),
      grossRentLossPerSqft: Number(incomeLeaseUp.grossRentLossPerSqft || 0),
      tenantFinishAllowancePerSqft: Number(incomeLeaseUp.tenantFinishAllowancePerSqft || 0)
    };
    
    this.incomeLeaseUpMap[id] = newLeaseUp;
    return newLeaseUp;
  }

  async updateIncomeLeaseUp(id: number, incomeLeaseUp: Partial<InsertIncomeLeaseUp>): Promise<IncomeLeaseUp | undefined> {
    const existingLeaseUp = this.incomeLeaseUpMap[id];
    
    if (!existingLeaseUp) {
      return undefined;
    }
    
    // Only update fields that were passed in
    const updatedLeaseUp: IncomeLeaseUp = { ...existingLeaseUp };
    
    // Process each field that's present in the update
    Object.keys(incomeLeaseUp).forEach(field => {
      const value = incomeLeaseUp[field as keyof InsertIncomeLeaseUp];
      if (value !== undefined) {
        // Special handling for boolean fields
        if (field === 'leaseUpCostOverride') {
          updatedLeaseUp.leaseUpCostOverride = Boolean(value);
        } 
        // For numeric fields, convert to number
        else if (typeof existingLeaseUp[field as keyof IncomeLeaseUp] === 'number') {
          (updatedLeaseUp as any)[field] = Number(value);
        } 
        // For other fields, assign directly
        else {
          (updatedLeaseUp as any)[field] = value;
        }
      }
    });
    
    this.incomeLeaseUpMap[id] = updatedLeaseUp;
    return updatedLeaseUp;
  }

  async deleteIncomeLeaseUp(id: number): Promise<boolean> {
    if (this.incomeLeaseUpMap[id]) {
      delete this.incomeLeaseUpMap[id];
      
      // Also delete any associated month listings
      Object.keys(this.incomeLeaseUpMonthListingMap).forEach(key => {
        const monthListing = this.incomeLeaseUpMonthListingMap[Number(key)];
        if (monthListing && monthListing.incomeLeaseUpId === id) {
          delete this.incomeLeaseUpMonthListingMap[Number(key)];
        }
      });
      
      return true;
    }
    
    return false;
  }
  
  // Lease Up Month Listing
  async getIncomeLeaseUpMonthListings(incomeLeaseUpId: number): Promise<IncomeLeaseUpMonthListing[]> {
    return Object.values(this.incomeLeaseUpMonthListingMap)
      .filter(listing => listing.incomeLeaseUpId === incomeLeaseUpId);
  }
  
  // Alias for routes.ts to use
  async getIncomeLeaseUpMonthListingsByLeaseUpId(incomeLeaseUpId: number): Promise<IncomeLeaseUpMonthListing[]> {
    return this.getIncomeLeaseUpMonthListings(incomeLeaseUpId);
  }
  
  // Alias for routes.ts to use
  async insertIncomeLeaseUpMonthListing(incomeLeaseUpMonthListing: InsertIncomeLeaseUpMonthListing): Promise<IncomeLeaseUpMonthListing> {
    return this.createIncomeLeaseUpMonthListing(incomeLeaseUpMonthListing);
  }

  async getIncomeLeaseUpMonthListingById(id: number): Promise<IncomeLeaseUpMonthListing | undefined> {
    return this.incomeLeaseUpMonthListingMap[id];
  }

  async createIncomeLeaseUpMonthListing(incomeLeaseUpMonthListing: InsertIncomeLeaseUpMonthListing): Promise<IncomeLeaseUpMonthListing> {
    const id = this.incomeLeaseUpMonthListingCurrentId++;
    
    const newMonthListing: IncomeLeaseUpMonthListing = {
      incomeLeaseUpMonthListingId: id,
      incomeLeaseUpId: Number(incomeLeaseUpMonthListing.incomeLeaseUpId),
      yearNumber: Number(incomeLeaseUpMonthListing.yearNumber),
      monthNumber: Number(incomeLeaseUpMonthListing.monthNumber),
      available: Number(incomeLeaseUpMonthListing.available || 0),
      rentLoss: Number(incomeLeaseUpMonthListing.rentLoss || 0),
      finishAllowance: Number(incomeLeaseUpMonthListing.finishAllowance || 0),
      commissions: Number(incomeLeaseUpMonthListing.commissions || 0),
      presentValueFactor: Number(incomeLeaseUpMonthListing.presentValueFactor || 0),
      presentValue: Number(incomeLeaseUpMonthListing.presentValue || 0)
    };
    
    this.incomeLeaseUpMonthListingMap[id] = newMonthListing;
    return newMonthListing;
  }

  async updateIncomeLeaseUpMonthListing(id: number, incomeLeaseUpMonthListing: Partial<InsertIncomeLeaseUpMonthListing>): Promise<IncomeLeaseUpMonthListing | undefined> {
    const existingMonthListing = this.incomeLeaseUpMonthListingMap[id];
    
    if (!existingMonthListing) {
      return undefined;
    }
    
    // Update only the provided fields, converting numeric values as needed
    const updatedMonthListing: IncomeLeaseUpMonthListing = {
      ...existingMonthListing,
      incomeLeaseUpId: incomeLeaseUpMonthListing.incomeLeaseUpId !== undefined ? Number(incomeLeaseUpMonthListing.incomeLeaseUpId) : existingMonthListing.incomeLeaseUpId,
      yearNumber: incomeLeaseUpMonthListing.yearNumber !== undefined ? Number(incomeLeaseUpMonthListing.yearNumber) : existingMonthListing.yearNumber,
      monthNumber: incomeLeaseUpMonthListing.monthNumber !== undefined ? Number(incomeLeaseUpMonthListing.monthNumber) : existingMonthListing.monthNumber,
      available: incomeLeaseUpMonthListing.available !== undefined ? Number(incomeLeaseUpMonthListing.available) : existingMonthListing.available,
      rentLoss: incomeLeaseUpMonthListing.rentLoss !== undefined ? Number(incomeLeaseUpMonthListing.rentLoss) : existingMonthListing.rentLoss,
      finishAllowance: incomeLeaseUpMonthListing.finishAllowance !== undefined ? Number(incomeLeaseUpMonthListing.finishAllowance) : existingMonthListing.finishAllowance,
      commissions: incomeLeaseUpMonthListing.commissions !== undefined ? Number(incomeLeaseUpMonthListing.commissions) : existingMonthListing.commissions,
      presentValueFactor: incomeLeaseUpMonthListing.presentValueFactor !== undefined ? Number(incomeLeaseUpMonthListing.presentValueFactor) : existingMonthListing.presentValueFactor,
      presentValue: incomeLeaseUpMonthListing.presentValue !== undefined ? Number(incomeLeaseUpMonthListing.presentValue) : existingMonthListing.presentValue
    };
    
    this.incomeLeaseUpMonthListingMap[id] = updatedMonthListing;
    return updatedMonthListing;
  }

  async deleteIncomeLeaseUpMonthListing(id: number): Promise<boolean> {
    if (this.incomeLeaseUpMonthListingMap[id]) {
      delete this.incomeLeaseUpMonthListingMap[id];
      return true;
    }
    
    return false;
  }
  
  // ETL Data Source operations
  async getEtlDataSources(): Promise<EtlDataSource[]> {
    return Object.values(this.etlDataSourcesMap);
  }
  
  async getEtlDataSourceById(id: number): Promise<EtlDataSource | undefined> {
    return this.etlDataSourcesMap[id];
  }
  
  async createEtlDataSource(dataSource: InsertEtlDataSource): Promise<EtlDataSource> {
    const id = this.etlDataSourceCurrentId++;
    const newDataSource: EtlDataSource = {
      id,
      name: dataSource.name,
      description: dataSource.description || null,
      type: dataSource.type,
      connectionDetails: dataSource.connectionDetails,
      isConnected: dataSource.isConnected || false,
      lastConnected: dataSource.lastConnected ? new Date(dataSource.lastConnected) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.etlDataSourcesMap[id] = newDataSource;
    return newDataSource;
  }
  
  async updateEtlDataSource(id: number, dataSource: Partial<InsertEtlDataSource>): Promise<EtlDataSource | undefined> {
    const existingDataSource = this.etlDataSourcesMap[id];
    if (!existingDataSource) {
      return undefined;
    }
    
    const updatedDataSource: EtlDataSource = {
      ...existingDataSource,
      ...dataSource,
      lastConnected: dataSource.lastConnected ? new Date(dataSource.lastConnected) : existingDataSource.lastConnected,
      updatedAt: new Date()
    };
    
    this.etlDataSourcesMap[id] = updatedDataSource;
    return updatedDataSource;
  }
  
  async deleteEtlDataSource(id: number): Promise<boolean> {
    if (this.etlDataSourcesMap[id]) {
      delete this.etlDataSourcesMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Transformation Rule operations
  async getEtlTransformationRules(): Promise<EtlTransformationRule[]> {
    return Object.values(this.etlTransformationRulesMap);
  }
  
  async getEtlTransformationRuleById(id: number): Promise<EtlTransformationRule | undefined> {
    return this.etlTransformationRulesMap[id];
  }
  
  async createEtlTransformationRule(rule: InsertEtlTransformationRule): Promise<EtlTransformationRule> {
    const id = this.etlTransformationRuleCurrentId++;
    const newRule: EtlTransformationRule = {
      id,
      name: rule.name,
      description: rule.description || null,
      dataType: rule.dataType,
      transformationCode: rule.transformationCode,
      isActive: rule.isActive !== undefined ? rule.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.etlTransformationRulesMap[id] = newRule;
    return newRule;
  }
  
  async updateEtlTransformationRule(id: number, rule: Partial<InsertEtlTransformationRule>): Promise<EtlTransformationRule | undefined> {
    const existingRule = this.etlTransformationRulesMap[id];
    if (!existingRule) {
      return undefined;
    }
    
    const updatedRule: EtlTransformationRule = {
      ...existingRule,
      ...rule,
      updatedAt: new Date()
    };
    
    this.etlTransformationRulesMap[id] = updatedRule;
    return updatedRule;
  }
  
  async deleteEtlTransformationRule(id: number): Promise<boolean> {
    if (this.etlTransformationRulesMap[id]) {
      delete this.etlTransformationRulesMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Job operations
  async getEtlJobs(): Promise<EtlJob[]> {
    return Object.values(this.etlJobsMap);
  }
  
  async getEtlJobById(id: number): Promise<EtlJob | undefined> {
    return this.etlJobsMap[id];
  }
  
  async createEtlJob(job: InsertEtlJob): Promise<EtlJob> {
    const id = this.etlJobCurrentId++;
    const newJob: EtlJob = {
      id,
      name: job.name,
      description: job.description || null,
      sourceId: typeof job.sourceId === 'string' ? parseInt(job.sourceId, 10) : job.sourceId,
      targetId: typeof job.targetId === 'string' ? parseInt(job.targetId, 10) : job.targetId,
      transformationIds: job.transformationIds || [],
      status: job.status || "idle",
      schedule: job.schedule,
      metrics: job.metrics || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null
    };
    this.etlJobsMap[id] = newJob;
    return newJob;
  }
  
  async updateEtlJob(id: number, job: Partial<InsertEtlJob>): Promise<EtlJob | undefined> {
    const existingJob = this.etlJobsMap[id];
    if (!existingJob) {
      return undefined;
    }
    
    const updatedJob: EtlJob = {
      ...existingJob,
      ...job,
      lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : existingJob.lastRunAt,
      updatedAt: new Date()
    };
    
    this.etlJobsMap[id] = updatedJob;
    return updatedJob;
  }
  
  async deleteEtlJob(id: number): Promise<boolean> {
    if (this.etlJobsMap[id]) {
      delete this.etlJobsMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Optimization Suggestion operations
  async getEtlOptimizationSuggestions(): Promise<EtlOptimizationSuggestion[]> {
    return Object.values(this.etlOptimizationSuggestionsMap);
  }
  
  async getEtlOptimizationSuggestionsByJobId(jobId: number): Promise<EtlOptimizationSuggestion[]> {
    return Object.values(this.etlOptimizationSuggestionsMap)
      .filter(suggestion => Number(suggestion.jobId) === jobId);
  }
  
  async getEtlOptimizationSuggestionById(id: number): Promise<EtlOptimizationSuggestion | undefined> {
    return this.etlOptimizationSuggestionsMap[id];
  }
  
  async createEtlOptimizationSuggestion(suggestion: InsertEtlOptimizationSuggestion): Promise<EtlOptimizationSuggestion> {
    const id = this.etlOptimizationSuggestionCurrentId++;
    const newSuggestion: EtlOptimizationSuggestion = {
      id,
      jobId: suggestion.jobId,
      type: suggestion.type,
      severity: suggestion.severity,
      title: suggestion.title,
      description: suggestion.description,
      suggestedAction: suggestion.suggestedAction,
      estimatedImprovement: suggestion.estimatedImprovement,
      status: suggestion.status || "new",
      category: suggestion.category || null,
      implementationComplexity: suggestion.implementationComplexity || null,
      suggestedCode: suggestion.suggestedCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.etlOptimizationSuggestionsMap[id] = newSuggestion;
    return newSuggestion;
  }
  
  async updateEtlOptimizationSuggestion(id: number, suggestion: Partial<InsertEtlOptimizationSuggestion>): Promise<EtlOptimizationSuggestion | undefined> {
    const existingSuggestion = this.etlOptimizationSuggestionsMap[id];
    if (!existingSuggestion) {
      return undefined;
    }
    
    const updatedSuggestion: EtlOptimizationSuggestion = {
      ...existingSuggestion,
      ...suggestion,
      updatedAt: new Date()
    };
    
    this.etlOptimizationSuggestionsMap[id] = updatedSuggestion;
    return updatedSuggestion;
  }
  
  async deleteEtlOptimizationSuggestion(id: number): Promise<boolean> {
    if (this.etlOptimizationSuggestionsMap[id]) {
      delete this.etlOptimizationSuggestionsMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Batch Job operations
  async getEtlBatchJobs(): Promise<EtlBatchJob[]> {
    return Object.values(this.etlBatchJobsMap);
  }
  
  async getEtlBatchJobById(id: number): Promise<EtlBatchJob | undefined> {
    return this.etlBatchJobsMap[id];
  }
  
  async createEtlBatchJob(batchJob: InsertEtlBatchJob): Promise<EtlBatchJob> {
    const id = this.etlBatchJobCurrentId++;
    const newBatchJob: EtlBatchJob = {
      id,
      name: batchJob.name,
      description: batchJob.description || null,
      jobIds: batchJob.jobIds,
      status: batchJob.status || "idle",
      progress: batchJob.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: batchJob.startedAt ? new Date(batchJob.startedAt) : null,
      completedAt: batchJob.completedAt ? new Date(batchJob.completedAt) : null
    };
    this.etlBatchJobsMap[id] = newBatchJob;
    return newBatchJob;
  }
  
  async updateEtlBatchJob(id: number, batchJob: Partial<InsertEtlBatchJob>): Promise<EtlBatchJob | undefined> {
    const existingBatchJob = this.etlBatchJobsMap[id];
    if (!existingBatchJob) {
      return undefined;
    }
    
    const updatedBatchJob: EtlBatchJob = {
      ...existingBatchJob,
      ...batchJob,
      startedAt: batchJob.startedAt ? new Date(batchJob.startedAt) : existingBatchJob.startedAt,
      completedAt: batchJob.completedAt ? new Date(batchJob.completedAt) : existingBatchJob.completedAt,
      updatedAt: new Date()
    };
    
    this.etlBatchJobsMap[id] = updatedBatchJob;
    return updatedBatchJob;
  }
  
  async deleteEtlBatchJob(id: number): Promise<boolean> {
    if (this.etlBatchJobsMap[id]) {
      delete this.etlBatchJobsMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Alert operations
  async getEtlAlerts(): Promise<EtlAlert[]> {
    return Object.values(this.etlAlertsMap);
  }
  
  async getEtlAlertsByJobId(jobId: number): Promise<EtlAlert[]> {
    return Object.values(this.etlAlertsMap)
      .filter(alert => Number(alert.jobId) === jobId);
  }
  
  async getEtlAlertById(id: number): Promise<EtlAlert | undefined> {
    return this.etlAlertsMap[id];
  }
  
  async createEtlAlert(alert: InsertEtlAlert): Promise<EtlAlert> {
    const id = this.etlAlertCurrentId++;
    const newAlert: EtlAlert = {
      id,
      jobId: alert.jobId,
      type: alert.type,
      message: alert.message,
      details: alert.details || null,
      timestamp: new Date(),
      isRead: alert.isRead || false
    };
    this.etlAlertsMap[id] = newAlert;
    return newAlert;
  }
  
  async updateEtlAlert(id: number, alert: Partial<InsertEtlAlert>): Promise<EtlAlert | undefined> {
    const existingAlert = this.etlAlertsMap[id];
    if (!existingAlert) {
      return undefined;
    }
    
    const updatedAlert: EtlAlert = {
      ...existingAlert,
      ...alert
    };
    
    this.etlAlertsMap[id] = updatedAlert;
    return updatedAlert;
  }
  
  async deleteEtlAlert(id: number): Promise<boolean> {
    if (this.etlAlertsMap[id]) {
      delete this.etlAlertsMap[id];
      return true;
    }
    return false;
  }

  private initializeSampleProperties() {
    // Benton County, WA neighborhoods
    const neighborhoods = ['West Richland', 'Kennewick', 'Richland', 'Prosser', 'Benton City'];
    const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Vacant Land', 'Commercial'];
    const zoningTypes = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'];
    
    // Add 50 sample properties for Benton County, WA
    const sampleProperties = Array(50).fill(0).map((_, index) => {
      const id = this.propertyCurrentId++;
      const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const zoning = zoningTypes[Math.floor(Math.random() * zoningTypes.length)];
      
      // Generate coordinates for Benton County, WA (west of Columbia River)
      // Benton County coordinates - centered around -119.5, 46.25 with reasonable spread
      const lat = 46.2 + Math.random() * 0.3; // 46.2 to 46.5
      const lng = -119.6 + Math.random() * 0.4; // -119.6 to -119.2
      
      const squareFeet = Math.floor(800 + Math.random() * 3000);
      const lotSize = Math.floor(5000 + Math.random() * 20000);
      const yearBuilt = Math.floor(1950 + Math.random() * 73); // 1950 to 2023
      
      // Randomize bedrooms and bathrooms based on property type
      let bedrooms = 0;
      let bathrooms = 0;
      
      if (propertyType === 'Single Family' || propertyType === 'Multi-Family') {
        bedrooms = Math.floor(2 + Math.random() * 5); // 2 to 6
        bathrooms = Math.floor(1 + Math.random() * 4); // 1 to 4
      } else if (propertyType === 'Condo' || propertyType === 'Townhouse') {
        bedrooms = Math.floor(1 + Math.random() * 3); // 1 to 3
        bathrooms = Math.floor(1 + Math.random() * 2.5); // 1 to 2.5
      }
      
      const baseValue = squareFeet * (100 + Math.random() * 300);
      const value = `$${Math.floor(baseValue).toLocaleString()}`;
      const landValue = `$${Math.floor(lotSize * (5 + Math.random() * 15)).toLocaleString()}`;
      const salePrice = Math.random() > 0.3 
        ? `$${Math.floor(baseValue * (0.9 + Math.random() * 0.3)).toLocaleString()}`
        : null;
      
      const pricePerSqFt = `$${Math.floor(baseValue / squareFeet).toLocaleString()}`;
      
      const lastSaleDate = Math.random() > 0.3 
        ? new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;
        
      const taxAssessment = `$${Math.floor(baseValue * 0.85).toLocaleString()}`;
      
      const property: Property = {
        id,
        parcelId: `${neighborhood.slice(0, 2).toUpperCase()}${id.toString().padStart(6, '0')}`,
        address: `${Math.floor(100 + Math.random() * 9900)} ${['Main', 'Oak', 'Maple', 'Washington', 'Canyon', 'River', 'Valley', 'Desert', 'Vineyard', 'Cherry'][Math.floor(Math.random() * 10)]} ${['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Rd'][Math.floor(Math.random() * 7)]}, ${neighborhood}, WA`,
        owner: `${['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King'][Math.floor(Math.random() * 30)]} Family`,
        value,
        salePrice,
        squareFeet,
        yearBuilt,
        landValue,
        coordinates: [lat, lng],
        latitude: lat.toString(),
        longitude: lng.toString(),
        neighborhood,
        propertyType,
        bedrooms,
        bathrooms,
        lotSize,
        zoning,
        lastSaleDate,
        taxAssessment,
        pricePerSqFt,
        attributes: {},
        sourceId: 1, // Default to internal database source
        zillowId: null // No Zillow ID for sample data
      };
      
      return property;
    });
    
    // Store properties in the map
    sampleProperties.forEach(property => {
      this.properties[property.id] = property;
    });
  }
  
  private initializeSampleEtlData() {
    // Initialize ETL Data Sources
    const dataSources: InsertEtlDataSource[] = [
      {
        name: "Benton County Property Database",
        description: "Main county property data source containing assessment records",
        type: "database",
        connectionDetails: {
          databaseType: "postgresql",
          host: "county-db.bentoncounty.gov",
          port: 5432,
          database: "property_records",
          schema: "public"
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Washington State GIS Portal",
        description: "State-level GIS data for geospatial analysis",
        type: "api",
        connectionDetails: {
          endpoint: "https://gis-api.wa.gov/property",
          authType: "apiKey",
          rateLimitPerMinute: 100
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Census Bureau API",
        description: "Demographic data from US Census Bureau",
        type: "api",
        connectionDetails: {
          endpoint: "https://api.census.gov/data/latest",
          authType: "apiKey",
          rateLimitPerMinute: 500
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Historical Property Sales CSV",
        description: "Historical property sales data in CSV format",
        type: "file",
        connectionDetails: {
          fileType: "csv",
          path: "/data/historical_sales.csv",
          hasHeader: true
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Local PostGIS Database",
        description: "Local geospatial database for analysis",
        type: "database",
        connectionDetails: {
          databaseType: "postgresql",
          host: "localhost",
          port: 5432,
          database: "postgis_data",
          schema: "public",
          extensions: ["postgis"]
        },
        isConnected: true,
        lastConnected: new Date()
      }
    ];
    
    // Add data sources to the map
    dataSources.forEach(source => {
      const id = this.etlDataSourceCurrentId++;
      const dataSource: EtlDataSource = {
        id,
        name: source.name,
        description: source.description || null,
        type: source.type,
        connectionDetails: source.connectionDetails,
        isConnected: source.isConnected || false,
        lastConnected: source.lastConnected ? new Date(source.lastConnected) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.etlDataSourcesMap[id] = dataSource;
    });
    
    // Initialize ETL Transformation Rules
    const transformationRules: InsertEtlTransformationRule[] = [
      {
        name: "Normalize Address Format",
        description: "Standardizes address formats to USPS standards",
        dataType: "text",
        transformationCode: `
          function normalizeAddress(address) {
            // Convert to uppercase
            let result = address.toUpperCase();
            // Replace abbreviated directions
            result = result.replace(/\\bN\\b/g, 'NORTH')
                          .replace(/\\bS\\b/g, 'SOUTH')
                          .replace(/\\bE\\b/g, 'EAST')
                          .replace(/\\bW\\b/g, 'WEST');
            // Standardize common abbreviations
            result = result.replace(/\\bST\\b/g, 'STREET')
                          .replace(/\\bAVE\\b/g, 'AVENUE')
                          .replace(/\\bRD\\b/g, 'ROAD');
            return result;
          }
        `,
        isActive: true
      },
      {
        name: "Calculate Price Per Square Foot",
        description: "Computes the price per square foot from sale price and area",
        dataType: "number",
        transformationCode: `
          function calculatePricePerSqFt(salePrice, squareFeet) {
            // Remove currency symbols and commas
            const price = parseFloat(salePrice.replace(/[$,]/g, ''));
            // Guard against division by zero
            if (!squareFeet || squareFeet <= 0) return null;
            // Calculate and format to 2 decimal places
            return (price / squareFeet).toFixed(2);
          }
        `,
        isActive: true
      },
      {
        name: "Parse GeoJSON to Coordinates",
        description: "Extracts lat/long coordinates from GeoJSON format",
        dataType: "object",
        transformationCode: `
          function parseGeoJSON(geojson) {
            try {
              const data = JSON.parse(geojson);
              if (data.type === 'Point' && Array.isArray(data.coordinates)) {
                return {
                  longitude: data.coordinates[0],
                  latitude: data.coordinates[1]
                };
              }
              return null;
            } catch (e) {
              return null;
            }
          }
        `,
        isActive: true
      },
      {
        name: "Date Format Standardization",
        description: "Converts various date formats to ISO standard",
        dataType: "date",
        transformationCode: `
          function standardizeDate(dateString) {
            // Try to parse the date using various formats
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return null;
            // Return ISO format
            return date.toISOString().split('T')[0];
          }
        `,
        isActive: true
      },
      {
        name: "Clean Property Type Classification",
        description: "Maps various property type descriptions to standard categories",
        dataType: "text",
        transformationCode: `
          function standardizePropertyType(typeString) {
            const typeMap = {
              'SFR': 'Single Family',
              'SINGLE FAMILY': 'Single Family',
              'SINGLE-FAMILY': 'Single Family',
              'APT': 'Apartment',
              'APARTMENT': 'Apartment',
              'CONDO': 'Condominium',
              'CONDOMINIUM': 'Condominium',
              'COMMERCIAL': 'Commercial',
              'COM': 'Commercial',
              'IND': 'Industrial',
              'INDUSTRIAL': 'Industrial',
              'VACANT': 'Vacant Land',
              'VAC': 'Vacant Land'
            };
            
            const type = typeString.toUpperCase().trim();
            return typeMap[type] || 'Other';
          }
        `,
        isActive: true
      }
    ];
    
    // Add transformation rules to the map
    transformationRules.forEach(rule => {
      const id = this.etlTransformationRuleCurrentId++;
      const transformationRule: EtlTransformationRule = {
        id,
        name: rule.name,
        description: rule.description || null,
        dataType: rule.dataType,
        transformationCode: rule.transformationCode,
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.etlTransformationRulesMap[id] = transformationRule;
    });
    
    // Initialize ETL Jobs
    const jobs: InsertEtlJob[] = [
      {
        name: "Daily Property Update",
        description: "Imports new and updated properties from county database",
        sourceId: 1, // Reference to Benton County Property Database
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [1, 2, 3, 4, 5], // Reference to transformation rules
        status: "success",
        schedule: {
          frequency: "daily",
          time: "02:00",
          timezone: "America/Los_Angeles"
        },
        metrics: {
          lastExecutionTime: 187.4, // seconds
          recordsProcessed: 1250,
          memoryUsage: 512, // MB
          cpuUtilization: 45.2, // percentage
          successRate: 99.8 // percentage
        },
        lastRunAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        name: "Weekly Census Data Integration",
        description: "Imports demographic data for property analysis",
        sourceId: 3, // Reference to Census Bureau API
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [3, 4], // Reference to transformation rules
        status: "idle",
        schedule: {
          frequency: "weekly",
          dayOfWeek: "Sunday",
          time: "03:00",
          timezone: "America/Los_Angeles"
        },
        metrics: {
          lastExecutionTime: 432.1, // seconds
          recordsProcessed: 5200,
          memoryUsage: 1024, // MB
          cpuUtilization: 75.3, // percentage
          successRate: 100 // percentage
        },
        lastRunAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
      },
      {
        name: "Historical Sales Data Import",
        description: "One-time import of historical sales data",
        sourceId: 4, // Reference to Historical Property Sales CSV
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [2, 4], // Reference to transformation rules
        status: "success",
        schedule: null, // One-time job, no schedule
        metrics: {
          lastExecutionTime: 1456.7, // seconds
          recordsProcessed: 25000,
          memoryUsage: 2048, // MB
          cpuUtilization: 92.1, // percentage
          successRate: 99.5 // percentage
        },
        lastRunAt: new Date(Date.now() - 86400000 * 30) // 30 days ago
      },
      {
        name: "GIS Boundary Update",
        description: "Updates property boundaries from state GIS data",
        sourceId: 2, // Reference to Washington State GIS Portal
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [3], // Reference to transformation rules
        status: "failed",
        schedule: {
          frequency: "monthly",
          dayOfMonth: 1,
          time: "01:00",
          timezone: "America/Los_Angeles"
        },
        metrics: {
          lastExecutionTime: 856.3, // seconds
          recordsProcessed: 7500,
          memoryUsage: 1536, // MB
          cpuUtilization: 85.4, // percentage
          successRate: 68.2 // percentage
        },
        lastRunAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
      },
      {
        name: "Real-time Property Sales Feed",
        description: "Streams real-time property sales data",
        sourceId: 1, // Reference to Benton County Property Database
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [1, 2, 4], // Reference to transformation rules
        status: "running",
        schedule: {
          frequency: "continuous",
          pollingInterval: 300 // seconds
        },
        metrics: {
          lastExecutionTime: "ongoing",
          recordsProcessed: 150,
          memoryUsage: 384, // MB
          cpuUtilization: 25.6, // percentage
          successRate: 100 // percentage
        },
        lastRunAt: new Date() // Now
      }
    ];
    
    // Add jobs to the map
    jobs.forEach(job => {
      const id = this.etlJobCurrentId++;
      const etlJob: EtlJob = {
        id,
        name: job.name,
        description: job.description || null,
        sourceId: typeof job.sourceId === 'string' ? parseInt(job.sourceId, 10) : job.sourceId,
        targetId: typeof job.targetId === 'string' ? parseInt(job.targetId, 10) : job.targetId,
        transformationIds: job.transformationIds,
        status: job.status || 'idle',
        schedule: job.schedule,
        metrics: job.metrics,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null
      };
      this.etlJobsMap[id] = etlJob;
    });
    
    // Initialize ETL Optimization Suggestions
    const optimizationSuggestions: InsertEtlOptimizationSuggestion[] = [
      {
        jobId: 1, // Daily Property Update
        type: "performance",
        severity: "medium",
        title: "Implement database indexing for faster queries",
        description: "Current queries on the property_records table are not using indexes effectively",
        suggestedAction: "Add an index on the last_updated_date column to improve query performance",
        estimatedImprovement: {
          metric: "execution_time",
          percentage: 40
        },
        status: "new",
        category: "database",
        implementationComplexity: "low",
        suggestedCode: "CREATE INDEX idx_property_last_updated ON property_records(last_updated_date);"
      },
      {
        jobId: 5, // Real-time Property Sales Feed
        type: "resource",
        severity: "high",
        title: "Reduce memory usage by optimizing JSON parsing",
        description: "The job is consuming excessive memory when processing large JSON responses",
        suggestedAction: "Use streaming JSON parser instead of loading entire response into memory",
        estimatedImprovement: {
          metric: "memory_usage",
          percentage: 65
        },
        status: "in_progress",
        category: "code",
        implementationComplexity: "medium",
        suggestedCode: "const JSONStream = require('JSONStream');\nconst parser = JSONStream.parse('*.properties');\nrequest.pipe(parser);"
      },
      {
        jobId: 3, // Historical Sales Data Import
        type: "scheduling",
        severity: "low",
        title: "Run job during off-peak hours",
        description: "This resource-intensive job is running during peak system usage times",
        suggestedAction: "Reschedule the job to run during off-peak hours (2AM-5AM)",
        estimatedImprovement: {
          metric: "system_impact",
          percentage: 30
        },
        status: "implemented",
        category: "scheduling",
        implementationComplexity: "low",
        suggestedCode: null
      },
      {
        jobId: 4, // GIS Boundary Update
        type: "code",
        severity: "high",
        title: "Implement retry logic for API failures",
        description: "Job is failing due to intermittent API timeouts with no retry mechanism",
        suggestedAction: "Add exponential backoff retry logic for API requests",
        estimatedImprovement: {
          metric: "success_rate",
          percentage: 95
        },
        status: "new",
        category: "resiliency",
        implementationComplexity: "medium",
        suggestedCode: "async function fetchWithRetry(url, options, maxRetries = 3) {\n  let retries = 0;\n  while (retries < maxRetries) {\n    try {\n      return await fetch(url, options);\n    } catch (err) {\n      retries++;\n      if (retries >= maxRetries) throw err;\n      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));\n    }\n  }\n}"
      },
      {
        jobId: 2, // Weekly Census Data Integration
        type: "performance",
        severity: "medium",
        title: "Parallelize data processing tasks",
        description: "Data processing is currently single-threaded and could benefit from parallelization",
        suggestedAction: "Implement worker threads to process data chunks in parallel",
        estimatedImprovement: {
          metric: "execution_time",
          percentage: 60
        },
        status: "new",
        category: "architecture",
        implementationComplexity: "high",
        suggestedCode: "const { Worker } = require('worker_threads');\n\nfunction processChunksInParallel(chunks, workerCount = 4) {\n  return Promise.all(chunks.map((chunk, i) => {\n    return new Promise((resolve, reject) => {\n      const worker = new Worker('./worker.js');\n      worker.postMessage(chunk);\n      worker.on('message', resolve);\n      worker.on('error', reject);\n    });\n  }));\n}"
      }
    ];
    
    // Add optimization suggestions to the map
    optimizationSuggestions.forEach(suggestion => {
      const id = this.etlOptimizationSuggestionCurrentId++;
      const optimizationSuggestion: EtlOptimizationSuggestion = {
        id,
        jobId: typeof suggestion.jobId === 'string' ? parseInt(suggestion.jobId, 10) : (suggestion.jobId || 1),
        type: suggestion.type || 'performance',
        severity: suggestion.severity || 'medium',
        title: suggestion.title || '',
        description: suggestion.description || '',
        suggestedAction: suggestion.suggestedAction || '',
        estimatedImprovement: suggestion.estimatedImprovement || { metric: 'executionTime', percentage: 0 },
        status: suggestion.status || 'new',
        category: suggestion.category || null,
        implementationComplexity: suggestion.implementationComplexity || null,
        suggestedCode: suggestion.suggestedCode || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.etlOptimizationSuggestionsMap[id] = optimizationSuggestion;
    });
    
    // Initialize ETL Batch Jobs
    const batchJobs: InsertEtlBatchJob[] = [
      {
        name: "Monthly Full Refresh",
        description: "Complete refresh of all property data at month end",
        jobIds: [1, 2, 4], // References to job IDs
        status: "idle",
        progress: 0,
        startedAt: null,
        completedAt: null
      },
      {
        name: "Annual Tax Assessment Data",
        description: "Annual processing of tax assessment data",
        jobIds: [1, 3], // References to job IDs
        status: "success",
        progress: 100,
        startedAt: new Date(Date.now() - 86400000 * 60), // 60 days ago
        completedAt: new Date(Date.now() - 86400000 * 59) // 59 days ago
      },
      {
        name: "Data Quality Check",
        description: "Runs validation checks on property data",
        jobIds: [1, 2, 3, 4], // References to job IDs
        status: "running",
        progress: 45,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: null
      }
    ];
    
    // Add batch jobs to the map
    batchJobs.forEach(batchJob => {
      const id = this.etlBatchJobCurrentId++;
      const etlBatchJob: EtlBatchJob = {
        id,
        name: batchJob.name,
        description: batchJob.description || null,
        jobIds: batchJob.jobIds,
        status: batchJob.status || 'idle',
        progress: batchJob.progress || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: batchJob.startedAt ? new Date(batchJob.startedAt) : null,
        completedAt: batchJob.completedAt ? new Date(batchJob.completedAt) : null
      };
      this.etlBatchJobsMap[id] = etlBatchJob;
    });
    
    // Initialize ETL Alerts
    const alerts: InsertEtlAlert[] = [
      {
        jobId: 4, // GIS Boundary Update
        type: "error",
        message: "Job failed: API request timeout",
        details: "Connection to Washington State GIS Portal timed out after 30 seconds",
        isRead: false
      },
      {
        jobId: 1, // Daily Property Update
        type: "warning",
        message: "High memory usage detected",
        details: "Memory usage spiked to 85% during data transformation phase",
        isRead: true
      },
      {
        jobId: 3, // Historical Sales Data Import
        type: "info",
        message: "Job completed successfully",
        details: "Processed 25,000 records in 24 minutes and 16 seconds",
        isRead: true
      },
      {
        jobId: 5, // Real-time Property Sales Feed
        type: "warning",
        message: "Connection intermittently dropping",
        details: "Connection to data source has dropped 3 times in the past hour",
        isRead: false
      },
      {
        jobId: 2, // Weekly Census Data Integration
        type: "info",
        message: "Job scheduled for next run",
        details: "Next execution scheduled for Sunday, April 07, 2025 at 03:00 AM",
        isRead: true
      }
    ];
    
    // Add alerts to the map
    alerts.forEach(alert => {
      const id = this.etlAlertCurrentId++;
      const etlAlert: EtlAlert = {
        id,
        jobId: typeof alert.jobId === 'string' ? parseInt(alert.jobId, 10) : alert.jobId,
        type: alert.type,
        message: alert.message || '',
        details: alert.details || null,
        timestamp: new Date(),
        isRead: alert.isRead !== undefined ? alert.isRead : false
      };
      this.etlAlertsMap[id] = etlAlert;
    });
  }
}

import * as schema from '../shared/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export class PgStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private client: ReturnType<typeof postgres>;

  constructor(connectionString: string) {
    this.client = postgres(connectionString);
    this.db = drizzle(this.client, { schema });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await this.db.insert(schema.users).values(user).returning();
    return results[0];
  }
  
  // Neighborhood timeline operations
  async getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
    // This is a more complex operation that might require multiple queries
    // For now, using the in-memory implementation logic
    const neighborhoods = await this.getAvailableNeighborhoods();
    
    const timelines: NeighborhoodTimeline[] = [];
    
    for (const neighborhood of neighborhoods) {
      const timeline = await this.getNeighborhoodTimeline(neighborhood.id, years);
      if (timeline) {
        timelines.push(timeline);
      }
    }
    
    return timelines;
  }
  
  async getNeighborhoodTimeline(neighborhoodId: string, years: number = 10): Promise<NeighborhoodTimeline | undefined> {
    // For complex operations like this, we'll execute more specific SQL
    // But for now, use the same approach as the in-memory implementation
    const properties = await this.getPropertiesByFilter({ neighborhood: neighborhoodId });
    
    if (properties.length === 0) {
      return undefined;
    }
    
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years + 1;
    
    const dataPoints: NeighborhoodTimelineDataPoint[] = [];
    let previousYearAvg = 0;
    
    for (let year = startYear; year <= currentYear; year++) {
      const yearStr = year.toString();
      let totalValue = 0;
      let count = 0;
      let transactionCount = Math.floor(Math.random() * 120) + 50; // Temporary random transactions
      
      for (const property of properties) {
        if (property.historicalValues && typeof property.historicalValues === 'object') {
          const historicalValues = property.historicalValues as Record<string, string | number>;
          const yearlyValue = historicalValues[yearStr];
          
          if (yearlyValue) {
            const numValue = typeof yearlyValue === 'string' 
              ? parseFloat(yearlyValue.replace(/[^0-9.-]+/g, ''))
              : Number(yearlyValue);
            
            if (!isNaN(numValue) && numValue > 0) {
              totalValue += numValue;
              count++;
            }
          }
        }
      }
      
      const avgValue = count > 0 ? totalValue / count : 0;
      const percentChange = previousYearAvg > 0 
        ? (avgValue - previousYearAvg) / previousYearAvg 
        : 0;
      
      dataPoints.push({
        year: yearStr,
        value: Math.round(avgValue),
        percentChange,
        transactionCount
      });
      
      previousYearAvg = avgValue;
    }
    
    const avgValue = dataPoints.reduce((sum, point) => sum + point.value, 0) / dataPoints.length;
    const growthRate = this.calculateAverageGrowthRate(dataPoints);
    
    return {
      id: neighborhoodId,
      name: this.getNeighborhoodName(neighborhoodId),
      data: dataPoints,
      avgValue,
      growthRate
    };
  }
  
  // Helper methods for neighborhood calculations
  private getNeighborhoodName(id: string): string {
    return id
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  
  private calculateAverageGrowthRate(data: NeighborhoodTimelineDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    
    if (firstValue === 0) return 0;
    
    const totalGrowth = (lastValue / firstValue) - 1;
    const years = data.length - 1;
    
    return Math.pow(1 + totalGrowth, 1 / years) - 1;
  }
  
  async getAvailableNeighborhoods(): Promise<{ id: string; name: string }[]> {
    // For PostgreSQL, we would use a distinct query
    const results = await this.db
      .selectDistinct({ neighborhood: schema.properties.neighborhood })
      .from(schema.properties)
      .where(isNotNull(schema.properties.neighborhood));
    
    return results
      .filter(r => r.neighborhood !== null)
      .map(r => ({
        id: r.neighborhood!,
        name: this.getNeighborhoodName(r.neighborhood!)
      }));
  }

  // Basic implementation of required methods - these would need to be completed
  // Property operations
  async getProperties(filter?: { [key: string]: any }): Promise<Property[]> {
    // Basic implementation without filters
    if (!filter) {
      return this.db.select().from(schema.properties);
    }
    
    // For filtered queries, we'd need to build a more complex query
    // This is a simplified approach
    let query = this.db.select().from(schema.properties);
    
    // This would need to be expanded with proper filtering
    return query;
  }

  async getPropertyById(id: number): Promise<Property | undefined> {
    const results = await this.db.select().from(schema.properties).where(eq(schema.properties.id, id));
    return results[0];
  }

  // This method implementation is just a placeholder and would need proper SQL
  async getPropertiesByFilter(filters: {
    neighborhood?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minValue?: number;
    maxValue?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    propertyType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Property[]> {
    // This would need a proper SQL builder implementation
    return [];
  }

  // These methods would need proper implementations
  async getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]> {
    return [];
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    const results = await this.db.insert(schema.properties).values(property).returning();
    return results[0];
  }
  
  async updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined> {
    const results = await this.db.update(schema.properties)
      .set(property)
      .where(eq(schema.properties.id, id))
      .returning();
    return results[0];
  }
  
  async bulkImportProperties(properties: InsertProperty[]): Promise<{ success: boolean; count: number; errors?: any[] }> {
    try {
      const results = await this.db.insert(schema.properties).values(properties).returning();
      return { success: true, count: results.length };
    } catch (error) {
      return { success: false, count: 0, errors: [error] };
    }
  }
  
  async searchProperties(searchText: string): Promise<Property[]> {
    // Basic implementation - would need full-text search capabilities
    return [];
  }
  
  // All the other required methods would need to be implemented here
  // For brevity, they are omitted in this example
  
  // Income Approach operations - placeholders
  async getIncomeHotelMotels(): Promise<IncomeHotelMotel[]> { return []; }
  async getIncomeHotelMotelById(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> { return undefined; }
  async createIncomeHotelMotel(incomeHotelMotel: InsertIncomeHotelMotel): Promise<IncomeHotelMotel> { throw new Error("Not implemented"); }
  async updateIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number, incomeHotelMotel: Partial<InsertIncomeHotelMotel>): Promise<IncomeHotelMotel | undefined> { return undefined; }
  async deleteIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number): Promise<boolean> { return false; }
  
  async getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]> { return []; }
  async getIncomeHotelMotelDetailByType(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined> { return undefined; }
  async createIncomeHotelMotelDetail(incomeHotelMotelDetail: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail> { throw new Error("Not implemented"); }
  async updateIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string, incomeHotelMotelDetail: Partial<InsertIncomeHotelMotelDetail>): Promise<IncomeHotelMotelDetail | undefined> { return undefined; }
  async deleteIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<boolean> { return false; }
  
  async getIncomeLeaseUps(): Promise<IncomeLeaseUp[]> { return []; }
  async getIncomeLeaseUpById(id: number): Promise<IncomeLeaseUp | undefined> { return undefined; }
  async createIncomeLeaseUp(incomeLeaseUp: InsertIncomeLeaseUp): Promise<IncomeLeaseUp> { throw new Error("Not implemented"); }
  async updateIncomeLeaseUp(id: number, incomeLeaseUp: Partial<InsertIncomeLeaseUp>): Promise<IncomeLeaseUp | undefined> { return undefined; }
  async deleteIncomeLeaseUp(id: number): Promise<boolean> { return false; }
  
  async getIncomeLeaseUpMonthListings(incomeLeaseUpId: number): Promise<IncomeLeaseUpMonthListing[]> { return []; }
  async getIncomeLeaseUpMonthListingById(id: number): Promise<IncomeLeaseUpMonthListing | undefined> { return undefined; }
  async createIncomeLeaseUpMonthListing(incomeLeaseUpMonthListing: InsertIncomeLeaseUpMonthListing): Promise<IncomeLeaseUpMonthListing> { throw new Error("Not implemented"); }
  async updateIncomeLeaseUpMonthListing(id: number, incomeLeaseUpMonthListing: Partial<InsertIncomeLeaseUpMonthListing>): Promise<IncomeLeaseUpMonthListing | undefined> { return undefined; }
  async deleteIncomeLeaseUpMonthListing(id: number): Promise<boolean> { return false; }

  // ETL operations - placeholders
  async getEtlDataSources(): Promise<EtlDataSource[]> { return []; }
  async getEtlDataSourceById(id: number): Promise<EtlDataSource | undefined> { return undefined; }
  async createEtlDataSource(dataSource: InsertEtlDataSource): Promise<EtlDataSource> { throw new Error("Not implemented"); }
  async updateEtlDataSource(id: number, dataSource: Partial<InsertEtlDataSource>): Promise<EtlDataSource | undefined> { return undefined; }
  async deleteEtlDataSource(id: number): Promise<boolean> { return false; }
  
  async getEtlTransformationRules(): Promise<EtlTransformationRule[]> { return []; }
  async getEtlTransformationRuleById(id: number): Promise<EtlTransformationRule | undefined> { return undefined; }
  async createEtlTransformationRule(rule: InsertEtlTransformationRule): Promise<EtlTransformationRule> { throw new Error("Not implemented"); }
  async updateEtlTransformationRule(id: number, rule: Partial<InsertEtlTransformationRule>): Promise<EtlTransformationRule | undefined> { return undefined; }
  async deleteEtlTransformationRule(id: number): Promise<boolean> { return false; }
  
  async getEtlJobs(): Promise<EtlJob[]> { return []; }
  async getEtlJobById(id: number): Promise<EtlJob | undefined> { return undefined; }
  async createEtlJob(job: InsertEtlJob): Promise<EtlJob> { throw new Error("Not implemented"); }
  async updateEtlJob(id: number, job: Partial<InsertEtlJob>): Promise<EtlJob | undefined> { return undefined; }
  async deleteEtlJob(id: number): Promise<boolean> { return false; }
  
  async getEtlOptimizationSuggestions(): Promise<EtlOptimizationSuggestion[]> { return []; }
  async getEtlOptimizationSuggestionsByJobId(jobId: number): Promise<EtlOptimizationSuggestion[]> { return []; }
  async getEtlOptimizationSuggestionById(id: number): Promise<EtlOptimizationSuggestion | undefined> { return undefined; }
  async createEtlOptimizationSuggestion(suggestion: InsertEtlOptimizationSuggestion): Promise<EtlOptimizationSuggestion> { throw new Error("Not implemented"); }
  async updateEtlOptimizationSuggestion(id: number, suggestion: Partial<InsertEtlOptimizationSuggestion>): Promise<EtlOptimizationSuggestion | undefined> { return undefined; }
  async deleteEtlOptimizationSuggestion(id: number): Promise<boolean> { return false; }
  
  async getEtlBatchJobs(): Promise<EtlBatchJob[]> { return []; }
  async getEtlBatchJobById(id: number): Promise<EtlBatchJob | undefined> { return undefined; }
  async createEtlBatchJob(batchJob: InsertEtlBatchJob): Promise<EtlBatchJob> { throw new Error("Not implemented"); }
  async updateEtlBatchJob(id: number, batchJob: Partial<InsertEtlBatchJob>): Promise<EtlBatchJob | undefined> { return undefined; }
  async deleteEtlBatchJob(id: number): Promise<boolean> { return false; }
  
  async getEtlAlerts(): Promise<EtlAlert[]> { return []; }
  async getEtlAlertsByJobId(jobId: number): Promise<EtlAlert[]> { return []; }
  async getEtlAlertById(id: number): Promise<EtlAlert | undefined> { return undefined; }
  async createEtlAlert(alert: InsertEtlAlert): Promise<EtlAlert> { throw new Error("Not implemented"); }
  async updateEtlAlert(id: number, alert: Partial<InsertEtlAlert>): Promise<EtlAlert | undefined> { return undefined; }
  async deleteEtlAlert(id: number): Promise<boolean> { return false; }
}

// Since we need to import the relevant Drizzle operators for queries
import { eq, isNotNull } from 'drizzle-orm';

// Importing DatabaseStorage implementation
import { DatabaseStorage } from './DatabaseStorage';
import { checkConnection } from './db';

// Initialize storage - use DatabaseStorage as the primary implementation
console.log("Initializing storage backend with database support...");

// Create the DatabaseStorage instance
const storage: IStorage = new DatabaseStorage();

// Export the storage instance
export { storage };

// Verify the database connection
checkConnection().then(isConnected => {
  if (isConnected) {
    console.log("Database connection verified. Using DatabaseStorage implementation.");
  } else {
    console.error("WARNING: Database connection check failed, but still using DatabaseStorage. Some operations may fail!");
  }
}).catch(err => {
  console.error("Error verifying database connection:", err);
});

// We'll create a database adapter separately in a different file
// to avoid circular dependencies
