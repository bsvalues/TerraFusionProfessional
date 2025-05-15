/**
 * Property History Service
 * 
 * Provides functionality for tracking and analyzing property value history over time
 */

import { db } from '../db';
import { properties } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { 
  HistoricalValue, 
  PropertyHistoryRecord, 
  PropertyHistoryChange,
  PropertyValueTrend,
  PropertyValueHistory,
  HistoricalValuePoint,
  PropertyTrendData
} from '../../shared/interfaces/PropertyHistory';
import { Property } from '../../shared/schema';
import { auditPropertyChange, AuditAction, AuditEntityType } from '../../shared/agent/AuditLogger';

/**
 * Property History Service class
 */
export class PropertyHistoryService {
  /**
   * Get historical values for a property
   * 
   * @param propertyId Property ID
   * @returns Dictionary of years to historical values
   */
  async getPropertyHistory(propertyId: number | string): Promise<PropertyHistoryRecord> {
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId)
    });
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    if (!property.historicalValues) {
      return {}; // No historical values
    }
    
    // Parse the historical values if needed
    let historyRecord: PropertyHistoryRecord;
    if (typeof property.historicalValues === 'string') {
      historyRecord = JSON.parse(property.historicalValues);
    } else {
      historyRecord = property.historicalValues as unknown as PropertyHistoryRecord;
    }
    
    return historyRecord;
  }
  
  /**
   * Update a property's historical value for a specific year
   * 
   * @param propertyId Property ID
   * @param year Year (e.g., "2023")
   * @param value Historical value data
   * @param author User or system making the change
   * @returns Updated historical record
   */
  async updatePropertyHistoricalValue(
    propertyId: number | string, 
    year: string, 
    value: HistoricalValue, 
    author: string
  ): Promise<PropertyHistoryChange> {
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
    
    // Get existing property
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, numericId)
    });
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get existing historical values or create empty object
    let historyRecord: PropertyHistoryRecord = {};
    if (property.historicalValues) {
      if (typeof property.historicalValues === 'string') {
        historyRecord = JSON.parse(property.historicalValues);
      } else {
        historyRecord = property.historicalValues as unknown as PropertyHistoryRecord;
      }
    }
    
    // Save previous value for audit
    const previousValue = historyRecord[year] || null;
    
    // Update the historical value for the year
    historyRecord[year] = value;
    
    // Update the property record
    await db.update(properties)
      .set({ historicalValues: historyRecord })
      .where(eq(properties.id, numericId));
    
    // Create change record
    const change: PropertyHistoryChange = {
      propertyId,
      year,
      previousValue,
      newValue: value,
      author,
      timestamp: new Date().toISOString()
    };
    
    // Audit this change
    await auditPropertyChange(
      author,
      AuditAction.UPDATE,
      typeof propertyId === 'string' ? propertyId : propertyId.toString(),
      { year, value: previousValue },
      { year, value },
      { 
        changeType: 'historical_value',
        year
      }
    );
    
    return change;
  }
  
  /**
   * Delete a historical value for a specific year
   * 
   * @param propertyId Property ID
   * @param year Year to delete
   * @param author User or system making the change
   * @returns Success flag
   */
  async deletePropertyHistoricalValue(
    propertyId: number | string, 
    year: string, 
    author: string
  ): Promise<boolean> {
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
    
    // Get existing property
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, numericId)
    });
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get existing historical values
    if (!property.historicalValues) {
      return false; // Nothing to delete
    }
    
    let historyRecord: PropertyHistoryRecord;
    if (typeof property.historicalValues === 'string') {
      historyRecord = JSON.parse(property.historicalValues);
    } else {
      historyRecord = property.historicalValues as unknown as PropertyHistoryRecord;
    }
    
    // Check if year exists
    if (!historyRecord[year]) {
      return false; // Nothing to delete
    }
    
    // Save previous value for audit
    const previousValue = historyRecord[year];
    
    // Delete the year
    delete historyRecord[year];
    
    // Update the property record
    await db.update(properties)
      .set({ historicalValues: historyRecord })
      .where(eq(properties.id, numericId));
    
    // Audit this deletion
    await auditPropertyChange(
      author,
      AuditAction.DELETE,
      typeof propertyId === 'string' ? propertyId : propertyId.toString(),
      { year, value: previousValue },
      null,
      { 
        changeType: 'historical_value',
        year
      }
    );
    
    return true;
  }
  
  /**
   * Import bulk historical values for a property
   * 
   * @param propertyId Property ID
   * @param historyRecord Dictionary of years to historical values
   * @param author User or system making the change
   * @param overwrite Whether to overwrite existing values
   * @returns Success flag
   */
  async importPropertyHistory(
    propertyId: number | string, 
    historyRecord: PropertyHistoryRecord, 
    author: string,
    overwrite: boolean = false
  ): Promise<boolean> {
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
    
    // Get existing property
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, numericId)
    });
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get existing historical values or create empty object
    let existingHistory: PropertyHistoryRecord = {};
    if (property.historicalValues) {
      if (typeof property.historicalValues === 'string') {
        existingHistory = JSON.parse(property.historicalValues);
      } else {
        existingHistory = property.historicalValues as unknown as PropertyHistoryRecord;
      }
    }
    
    // Save previous state for audit
    const previousState = { ...existingHistory };
    
    // Merge histories
    let updatedHistory: PropertyHistoryRecord;
    if (overwrite) {
      // Replace entire history
      updatedHistory = { ...historyRecord };
    } else {
      // Merge, keeping existing values unless overwritten
      updatedHistory = { ...existingHistory };
      
      // Only add years that don't exist
      for (const [year, value] of Object.entries(historyRecord)) {
        if (!updatedHistory[year]) {
          updatedHistory[year] = value;
        }
      }
    }
    
    // Update the property record
    await db.update(properties)
      .set({ historicalValues: updatedHistory })
      .where(eq(properties.id, numericId));
    
    // Audit this bulk import
    await auditPropertyChange(
      author,
      AuditAction.IMPORT,
      typeof propertyId === 'string' ? propertyId : propertyId.toString(),
      previousState,
      updatedHistory,
      { 
        changeType: 'historical_values_import',
        yearsImported: Object.keys(historyRecord).length,
        overwrite
      }
    );
    
    return true;
  }
  
  /**
   * Calculate value trends for a property over a specified period
   * 
   * @param propertyId Property ID
   * @param startYear Start year (e.g., "2020")
   * @param endYear End year (e.g., "2023")
   * @returns Value trend analysis
   */
  async calculatePropertyValueTrend(
    propertyId: number | string,
    startYear: string,
    endYear: string
  ): Promise<PropertyValueTrend | null> {
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
    
    // Get property
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, numericId)
    });
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get historical values
    let historyRecord: PropertyHistoryRecord = {};
    if (property.historicalValues) {
      if (typeof property.historicalValues === 'string') {
        historyRecord = JSON.parse(property.historicalValues);
      } else {
        historyRecord = property.historicalValues as unknown as PropertyHistoryRecord;
      }
    }
    
    // Check if we have values for both years
    if (!historyRecord[startYear] || !historyRecord[endYear]) {
      return null; // Cannot calculate trend
    }
    
    const startValue = historyRecord[startYear].value;
    const endValue = historyRecord[endYear].value;
    
    // Calculate changes
    const absoluteChange = endValue - startValue;
    const percentageChange = (absoluteChange / startValue) * 100;
    
    // Calculate compound annual growth rate
    const yearDiff = parseInt(endYear) - parseInt(startYear);
    const annualGrowthRate = yearDiff > 0 
      ? (Math.pow(endValue / startValue, 1 / yearDiff) - 1) * 100 
      : 0;
    
    return {
      propertyId,
      parcelId: property.parcelId,
      address: property.address,
      startYear,
      endYear,
      startValue,
      endValue,
      absoluteChange,
      percentageChange,
      annualGrowthRate
    };
  }
  
  /**
   * Get formatted property value history for visualization
   * 
   * @param propertyId Property ID
   * @returns Formatted property value history
   */
  async getFormattedPropertyHistory(propertyId: number | string): Promise<PropertyValueHistory | null> {
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
    
    // Get property
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, numericId)
    });
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get historical values
    let historyRecord: PropertyHistoryRecord = {};
    if (property.historicalValues) {
      if (typeof property.historicalValues === 'string') {
        historyRecord = JSON.parse(property.historicalValues);
      } else {
        historyRecord = property.historicalValues as unknown as PropertyHistoryRecord;
      }
    }
    
    // Check if we have any historical values
    if (Object.keys(historyRecord).length === 0) {
      return null; // No history available
    }
    
    // Sort years chronologically
    const years = Object.keys(historyRecord).sort();
    
    // Convert to value points
    const values: HistoricalValuePoint[] = years.map(year => ({
      year,
      value: historyRecord[year].value
    }));
    
    // Get current value (from property or most recent historical value)
    const currentValue = property.value 
      ? parseFloat(property.value) 
      : historyRecord[years[years.length - 1]].value;
    
    // Calculate growth rate if we have at least 2 years
    let annualGrowthRate: number | undefined;
    let totalPercentageChange: number | undefined;
    
    if (years.length >= 2) {
      const firstYear = years[0];
      const lastYear = years[years.length - 1];
      const firstValue = historyRecord[firstYear].value;
      const lastValue = historyRecord[lastYear].value;
      
      const yearDiff = parseInt(lastYear) - parseInt(firstYear);
      
      if (yearDiff > 0) {
        annualGrowthRate = (Math.pow(lastValue / firstValue, 1 / yearDiff) - 1) * 100;
        totalPercentageChange = ((lastValue - firstValue) / firstValue) * 100;
      }
    }
    
    // Count interpolated values (if confidence < 100)
    const interpolatedCount = Object.values(historyRecord).filter(
      v => v.confidence !== undefined && v.confidence < 100
    ).length;
    
    // Determine primary source
    const sourceCounts: Record<string, number> = {};
    Object.values(historyRecord).forEach(v => {
      if (v.source) {
        sourceCounts[v.source] = (sourceCounts[v.source] || 0) + 1;
      }
    });
    
    // Find most common source
    let primarySource: string | undefined;
    let maxCount = 0;
    
    for (const [source, count] of Object.entries(sourceCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primarySource = source;
      }
    }
    
    return {
      propertyId,
      values,
      currentValue,
      annualGrowthRate,
      totalPercentageChange,
      yearsAvailable: years,
      metadata: {
        primarySource,
        lastUpdated: new Date().toISOString(),
        interpolatedCount: interpolatedCount > 0 ? interpolatedCount : undefined
      }
    };
  }
  
  /**
   * Fill missing years in a property's history using linear interpolation
   * 
   * @param propertyId Property ID
   * @param author User or system making the change
   * @returns Success flag and number of years filled
   */
  async fillMissingHistoricalYears(
    propertyId: number | string,
    author: string
  ): Promise<{ success: boolean; yearsFilled: number }> {
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
    
    // Get property history
    const historyRecord = await this.getPropertyHistory(numericId);
    
    // Check if we have at least 2 years to interpolate between
    const years = Object.keys(historyRecord).map(year => parseInt(year, 10)).sort((a, b) => a - b);
    
    if (years.length < 2) {
      return { success: false, yearsFilled: 0 }; // Not enough data points
    }
    
    // Previous state for audit
    const previousState = { ...historyRecord };
    
    // Track filled years
    let yearsFilled = 0;
    
    // Go through each pair of consecutive years
    for (let i = 0; i < years.length - 1; i++) {
      const startYear = years[i];
      const endYear = years[i + 1];
      const yearGap = endYear - startYear;
      
      // Skip if consecutive years
      if (yearGap <= 1) {
        continue;
      }
      
      const startValue = historyRecord[startYear.toString()].value;
      const endValue = historyRecord[endYear.toString()].value;
      const valueIncrement = (endValue - startValue) / yearGap;
      
      // Fill in the missing years
      for (let year = startYear + 1; year < endYear; year++) {
        const yearStr = year.toString();
        const interpolatedValue = startValue + valueIncrement * (year - startYear);
        
        historyRecord[yearStr] = {
          value: Math.round(interpolatedValue * 100) / 100, // Round to 2 decimal places
          source: 'Interpolated',
          notes: 'Automatically filled using linear interpolation',
          timestamp: new Date().toISOString(),
          confidence: 75 // Lower confidence for interpolated values
        };
        
        yearsFilled++;
      }
    }
    
    if (yearsFilled > 0) {
      // Update the property record
      await db.update(properties)
        .set({ historicalValues: historyRecord })
        .where(eq(properties.id, numericId));
      
      // Audit this interpolation
      await auditPropertyChange(
        author,
        AuditAction.UPDATE,
        typeof propertyId === 'string' ? propertyId : propertyId.toString(),
        previousState,
        historyRecord,
        { 
          changeType: 'historical_values_interpolation',
          yearsFilled
        }
      );
    }
    
    return { success: yearsFilled > 0, yearsFilled };
  }

  /**
   * Get value trends for all properties for heat map visualization
   * 
   * @param analysisYear Current year for analysis (e.g., "2023")
   * @param referenceYear Previous year for comparison (e.g., "2022")
   * @returns Array of property trend data
   */
  async getAllPropertyValueTrends(
    analysisYear: string = '2023',
    referenceYear: string = '2022'
  ): Promise<PropertyTrendData[]> {
    // Query all properties with their location data
    const allProperties = await db.query.properties.findMany();
    
    if (!allProperties.length) {
      return [];
    }
    
    const trends: PropertyTrendData[] = [];
    
    // Process each property
    for (const property of allProperties) {
      try {
        // Skip properties without coordinates
        if (!property.latitude || !property.longitude) {
          continue;
        }
        
        // Get or calculate historical values
        let historyRecord: PropertyHistoryRecord = {};
        if (property.historicalValues) {
          if (typeof property.historicalValues === 'string') {
            historyRecord = JSON.parse(property.historicalValues);
          } else {
            historyRecord = property.historicalValues as unknown as PropertyHistoryRecord;
          }
        }
        
        // Skip if we don't have values for both years
        if (!historyRecord[analysisYear] || !historyRecord[referenceYear]) {
          continue;
        }
        
        const currentValue = historyRecord[analysisYear].value;
        const previousValue = historyRecord[referenceYear].value;
        
        // Skip if values are invalid
        if (currentValue <= 0 || previousValue <= 0) {
          continue;
        }
        
        // Calculate changes
        const valueChangeAbsolute = currentValue - previousValue;
        const valueChangePercent = (valueChangeAbsolute / previousValue) * 100;
        
        // Calculate annual growth rate
        const yearDiff = parseInt(analysisYear) - parseInt(referenceYear);
        const annualGrowthRate = yearDiff > 0 
          ? (Math.pow(currentValue / previousValue, 1 / yearDiff) - 1) * 100 
          : valueChangePercent;
        
        // Format the property trend data
        trends.push({
          propertyId: property.id,
          parcelId: property.parcelId,
          address: property.address,
          latitude: Number(property.latitude),
          longitude: Number(property.longitude),
          currentValue,
          valueChangePercent,
          valueChangeAbsolute,
          annualGrowthRate,
          analysisYear,
          referenceYear
        });
      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
        // Continue with next property
      }
    }
    
    return trends;
  }
}

// Create singleton instance
export const propertyHistoryService = new PropertyHistoryService();