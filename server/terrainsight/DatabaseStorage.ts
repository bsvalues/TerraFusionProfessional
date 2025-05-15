import { 
  users,
  properties,
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty,
  type NeighborhoodTimeline,
  type NeighborhoodTimelineDataPoint
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, or, like, between, gte, lte, desc, asc, sql } from "drizzle-orm";

// Type conversion utilities
/**
 * Safely converts a value to a string
 * @param value Any value to convert to string
 * @returns String representation of the value
 */
function toSafeString(value: any): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

/**
 * Safely converts a string to a number
 * @param value String value to convert to number
 * @returns Number or null if conversion fails
 */
function toSafeNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Ensures numeric values are properly converted to strings for the database
 * @param property Property object or partial property
 * @returns Property with numeric values converted to strings where needed
 */
function formatPropertyForDb<T extends Record<string, any>>(property: T): T {
  const formatted = { ...property } as T;
  
  // Convert coordinate values to strings if they're numeric
  if (property.latitude !== undefined && typeof property.latitude === 'number') {
    (formatted as any).latitude = toSafeString(property.latitude);
  }
  
  if (property.longitude !== undefined && typeof property.longitude === 'number') {
    (formatted as any).longitude = toSafeString(property.longitude);
  }
  
  // Handle other numeric values that might need to be strings in database
  if (property.value !== undefined && typeof property.value === 'number') {
    (formatted as any).value = toSafeString(property.value);
  }
  
  if (property.estimatedValue !== undefined && typeof property.estimatedValue === 'number') {
    (formatted as any).estimatedValue = toSafeString(property.estimatedValue);
  }
  
  if (property.salePrice !== undefined && typeof property.salePrice === 'number') {
    (formatted as any).salePrice = toSafeString(property.salePrice);
  }
  
  return formatted;
}

/**
 * DatabaseStorage implementation using Drizzle ORM
 * This class provides persistent storage for application data in PostgreSQL
 */
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Neighborhood timeline operations
  async getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
    // Get all unique neighborhoods
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
    const propertiesInNeighborhood = await this.getPropertiesByFilter({ neighborhood: neighborhoodId });
    
    if (propertiesInNeighborhood.length === 0) {
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
      let transactionCount = 0;
      
      // Process each property's historical values
      for (const property of propertiesInNeighborhood) {
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
              transactionCount++;
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
    // Query database for unique neighborhoods
    const neighborhoodsResult = await db
      .select({ neighborhood: properties.neighborhood })
      .from(properties)
      .where(sql`${properties.neighborhood} IS NOT NULL`)
      .groupBy(properties.neighborhood);
    
    // Process and return results
    return neighborhoodsResult
      .filter(n => n.neighborhood !== null && n.neighborhood !== '')
      .map(n => ({
        id: n.neighborhood!,
        name: this.getNeighborhoodName(n.neighborhood!)
      }));
  }

  // Property operations
  async getProperties(filter?: { [key: string]: any }): Promise<Property[]> {
    let query = db.select().from(properties);
    
    if (filter) {
      const conditions = Object.entries(filter).map(([key, value]) => {
        // Handle each filter type appropriately
        const column = properties[key as keyof typeof properties];
        if (column) {
          return eq(column as any, value);
        }
        return undefined;
      }).filter(Boolean) as any[];
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }

  async getPropertyById(id: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    
    return property || undefined;
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
    // Start with base query
    let query = db.select().from(properties);
    const conditions = [];
    
    // Add filter conditions
    if (filters.neighborhood) {
      conditions.push(eq(properties.neighborhood, filters.neighborhood));
    }
    
    if (filters.minYearBuilt && filters.maxYearBuilt) {
      conditions.push(between(properties.yearBuilt, filters.minYearBuilt, filters.maxYearBuilt));
    } else if (filters.minYearBuilt) {
      conditions.push(gte(properties.yearBuilt, filters.minYearBuilt));
    } else if (filters.maxYearBuilt) {
      conditions.push(lte(properties.yearBuilt, filters.maxYearBuilt));
    }
    
    if (filters.minSquareFeet && filters.maxSquareFeet) {
      conditions.push(between(properties.squareFeet, filters.minSquareFeet, filters.maxSquareFeet));
    } else if (filters.minSquareFeet) {
      conditions.push(gte(properties.squareFeet, filters.minSquareFeet));
    } else if (filters.maxSquareFeet) {
      conditions.push(lte(properties.squareFeet, filters.maxSquareFeet));
    }
    
    if (filters.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    if (filters.sortBy) {
      const column = properties[filters.sortBy as keyof typeof properties];
      if (column) {
        if (filters.sortOrder === 'desc') {
          query = query.orderBy(desc(column));
        } else {
          query = query.orderBy(asc(column));
        }
      }
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]> {
    // [minLng, minLat, maxLng, maxLat]
    const [minLng, minLat, maxLng, maxLat] = bounds;
    
    // Handle different format of coordinates in database
    // For string coordinates, convert the bound values to strings for comparison
    const minLngStr = toSafeString(minLng);
    const minLatStr = toSafeString(minLat);
    const maxLngStr = toSafeString(maxLng);
    const maxLatStr = toSafeString(maxLat);
    
    try {
      // Build complex query to handle both string and numeric coordinate values
      // This accommodates the potential mixed types in the database
      const result = await db
        .select()
        .from(properties)
        .where(
          sql`(
            (
              ${properties.longitude} >= ${minLngStr} AND
              ${properties.longitude} <= ${maxLngStr} AND
              ${properties.latitude} >= ${minLatStr} AND
              ${properties.latitude} <= ${maxLatStr}
            )
            OR
            (
              CASE WHEN ${properties.coordinates} IS NOT NULL THEN
                (${properties.coordinates}->>'longitude')::float >= ${minLng} AND
                (${properties.coordinates}->>'longitude')::float <= ${maxLng} AND
                (${properties.coordinates}->>'latitude')::float >= ${minLat} AND
                (${properties.coordinates}->>'latitude')::float <= ${maxLat}
              ELSE FALSE
              END
            )
          )`
        );
      
      return result;
    } catch (error) {
      console.error('Error querying properties in region:', error);
      
      // Fallback to simpler query if the complex one fails
      return await db
        .select()
        .from(properties)
        .where(
          and(
            gte(properties.longitude, minLngStr),
            lte(properties.longitude, maxLngStr),
            gte(properties.latitude, minLatStr),
            lte(properties.latitude, maxLatStr)
          )
        );
    }
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    // Convert numeric coordinate values to strings for database compatibility
    const formattedProperty = formatPropertyForDb(property);
    
    const [newProperty] = await db
      .insert(properties)
      .values(formattedProperty)
      .returning();
    
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined> {
    // Convert numeric coordinate values to strings for database compatibility
    const formattedProperty = formatPropertyForDb(property);
    
    const [updatedProperty] = await db
      .update(properties)
      .set(formattedProperty)
      .where(eq(properties.id, id))
      .returning();
    
    return updatedProperty || undefined;
  }

  async bulkImportProperties(propertiesToImport: InsertProperty[]): Promise<{ success: boolean; count: number; errors?: any[] }> {
    try {
      // Convert numeric coordinate values to strings for each property
      const formattedProperties = propertiesToImport.map(prop => formatPropertyForDb(prop));
      
      const result = await db
        .insert(properties)
        .values(formattedProperties)
        .returning();
      
      return {
        success: true,
        count: result.length
      };
    } catch (error) {
      console.error('Error during bulk import:', error);
      return {
        success: false,
        count: 0,
        errors: [error]
      };
    }
  }

  async searchProperties(searchText: string): Promise<Property[]> {
    // Perform a case-insensitive search across multiple fields
    return await db
      .select()
      .from(properties)
      .where(
        or(
          like(properties.address, `%${searchText}%`),
          like(properties.owner, `%${searchText}%`),
          like(properties.parcelId, `%${searchText}%`),
          like(properties.neighborhood, `%${searchText}%`)
        )
      )
      .limit(50); // Limit results for performance
  }

  // Helper methods
  private getNeighborhoodName(id: string): string {
    // Format neighborhood ID to make it more readable
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

  // Implement stub methods for interfaces required by IStorage but not relevant for this implementation
  async getIncomeHotelMotels() { return []; }
  async getIncomeHotelMotelById() { return undefined; }
  async createIncomeHotelMotel() { throw new Error("Not implemented"); }
  async updateIncomeHotelMotel() { return undefined; }
  async deleteIncomeHotelMotel() { return false; }
  
  async getIncomeHotelMotelDetails() { return []; }
  async getIncomeHotelMotelDetailByType() { return undefined; }
  async createIncomeHotelMotelDetail() { throw new Error("Not implemented"); }
  async updateIncomeHotelMotelDetail() { return undefined; }
  async deleteIncomeHotelMotelDetail() { return false; }
  
  async getIncomeLeaseUps() { return []; }
  async getIncomeLeaseUpById() { return undefined; }
  async createIncomeLeaseUp() { throw new Error("Not implemented"); }
  async updateIncomeLeaseUp() { return undefined; }
  async deleteIncomeLeaseUp() { return false; }
  
  async getIncomeLeaseUpMonthListings() { return []; }
  async getIncomeLeaseUpMonthListingById() { return undefined; }
  async createIncomeLeaseUpMonthListing() { throw new Error("Not implemented"); }
  async updateIncomeLeaseUpMonthListing() { return undefined; }
  async deleteIncomeLeaseUpMonthListing() { return false; }

  // ETL data source operations
  async getEtlDataSources() { return []; }
  async getEtlDataSourceById() { return undefined; }
  async createEtlDataSource() { throw new Error("Not implemented"); }
  async updateEtlDataSource() { return undefined; }
  async deleteEtlDataSource() { return false; }
  
  // ETL transformation rule operations
  async getEtlTransformationRules() { return []; }
  async getEtlTransformationRuleById() { return undefined; }
  async createEtlTransformationRule() { throw new Error("Not implemented"); }
  async updateEtlTransformationRule() { return undefined; }
  async deleteEtlTransformationRule() { return false; }
  
  // ETL job operations
  async getEtlJobs() { return []; }
  async getEtlJobById() { return undefined; }
  async createEtlJob() { throw new Error("Not implemented"); }
  async updateEtlJob() { return undefined; }
  async deleteEtlJob() { return false; }
  
  // ETL optimization suggestion operations
  async getEtlOptimizationSuggestions() { return []; }
  async getEtlOptimizationSuggestionsByJobId() { return []; }
  async getEtlOptimizationSuggestionById() { return undefined; }
  async createEtlOptimizationSuggestion() { throw new Error("Not implemented"); }
  async updateEtlOptimizationSuggestion() { return undefined; }
  async deleteEtlOptimizationSuggestion() { return false; }
  
  // ETL batch job operations
  async getEtlBatchJobs() { return []; }
  async getEtlBatchJobById() { return undefined; }
  async createEtlBatchJob() { throw new Error("Not implemented"); }
  async updateEtlBatchJob() { return undefined; }
  async deleteEtlBatchJob() { return false; }
  
  // ETL alert operations
  async getEtlAlerts() { return []; }
  async getEtlAlertsByJobId() { return []; }
  async getEtlAlertById() { return undefined; }
  async createEtlAlert() { throw new Error("Not implemented"); }
  async updateEtlAlert() { return undefined; }
  async deleteEtlAlert() { return false; }
}