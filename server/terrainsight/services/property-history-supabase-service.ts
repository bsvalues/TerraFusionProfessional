/**
 * Property History Supabase Service
 * 
 * Service for managing property history data in Supabase.
 * Provides methods for CRUD operations on property history records.
 */

import { supabase, isSupabaseConfigured } from './supabase-client';
import { 
  HistoricalValue, 
  PropertyHistoryRecord, 
  PropertyHistoryChange,
  PropertyValueTrend,
  PropertyValueHistory
} from '../../shared/interfaces/PropertyHistory';
import { auditSystemAction, AuditAction } from '../../shared/agent/AuditLogger';

// Constants
const PROPERTY_HISTORY_TABLE = 'property_history_records';

/**
 * PropertyHistorySupabaseService
 * 
 * Service class for handling property history data in Supabase
 */
export class PropertyHistorySupabaseService {
  /**
   * Check if Supabase is available for use
   */
  private checkSupabaseAvailability(): boolean {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured for property history operations');
      return false;
    }
    
    // Even if Supabase is configured, we'll still provide graceful handling
    // since the tables may not exist yet
    return true;
  }
  
  /**
   * Handle database errors gracefully
   * @param error Error from Supabase operation
   * @returns true if the error is related to missing tables
   */
  private isMissingTableError(error: any): boolean {
    if (!error) return false;
    
    // Check for specific PostgreSQL error code for "relation does not exist"
    if (error.code === '42P01') {
      console.warn('Supabase table not found. Please create the required tables.');
      return true;
    }
    
    // Check for other indicators of table-related issues
    if (error.message && (
      error.message.includes('does not exist') ||
      error.message.includes('no such table')
    )) {
      console.warn('Supabase table not found. Please create the required tables.');
      return true;
    }
    
    return false;
  }
  
  /**
   * Get property history from Supabase
   * 
   * @param propertyId Property ID
   * @returns Promise resolving to property history record or empty object
   */
  async getPropertyHistory(propertyId: number | string): Promise<PropertyHistoryRecord> {
    if (!this.checkSupabaseAvailability()) {
      // Return an empty object if Supabase is not configured
      return {};
    }
    
    try {
      // Query property history records for this property
      const { data, error } = await supabase!
        .from(PROPERTY_HISTORY_TABLE)
        .select('year, value, source, notes, confidence, timestamp')
        .eq('property_id', propertyId)
        .order('year', { ascending: true });
      
      if (error) {
        // If the error is just that the table doesn't exist, return empty data
        if (this.isMissingTableError(error)) {
          console.warn(`The property_history_records table doesn't exist in Supabase yet.`);
          return {};
        }
        throw error;
      }
      
      // Convert database records to PropertyHistoryRecord format
      const historyRecord: PropertyHistoryRecord = {};
      
      if (data && data.length > 0) {
        data.forEach((record: any) => {
          historyRecord[record.year] = {
            value: record.value,
            source: record.source || undefined,
            notes: record.notes || undefined,
            confidence: record.confidence || undefined,
            timestamp: record.timestamp
          };
        });
      }
      
      return historyRecord;
    } catch (error) {
      console.error('Error fetching property history from Supabase:', error);
      await auditSystemAction(
        'SUPABASE',
        AuditAction.READ,
        { 
          action: 'get_property_history',
          propertyId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      
      return {};
    }
  }
  
  /**
   * Update property historical value for a specific year
   * 
   * @param propertyId Property ID
   * @param year Year (e.g., "2023")
   * @param value Historical value data
   * @param author User or system making the change
   * @returns Promise resolving to change record
   */
  async updatePropertyHistoricalValue(
    propertyId: number | string,
    year: string,
    value: HistoricalValue,
    author: string
  ): Promise<PropertyHistoryChange> {
    if (!this.checkSupabaseAvailability()) {
      throw new Error('Supabase not configured for property history operations');
    }
    
    try {
      // Check if record already exists for this property/year
      const { data: existingData, error: checkError } = await supabase!
        .from(PROPERTY_HISTORY_TABLE)
        .select('value, source, notes, confidence')
        .eq('property_id', propertyId)
        .eq('year', year)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        // If the error is just that the table doesn't exist, simulate no existing data
        if (this.isMissingTableError(checkError)) {
          console.warn(`The property_history_records table doesn't exist in Supabase yet.`);
          // Continue with no previous value
        } else {
          throw checkError;
        }
      }
      
      const previousValue = existingData ? {
        value: existingData.value,
        source: existingData.source || undefined,
        notes: existingData.notes || undefined,
        confidence: existingData.confidence || undefined
      } : null;
      
      // Prepare record for upsert
      const record = {
        property_id: propertyId,
        year,
        value: value.value,
        source: value.source,
        notes: value.notes,
        confidence: value.confidence,
        timestamp: value.timestamp || new Date().toISOString(),
        updated_by: author,
        updated_at: new Date().toISOString()
      };
      
      // Update or insert the record
      const { error: upsertError } = await supabase!
        .from(PROPERTY_HISTORY_TABLE)
        .upsert(record, { onConflict: 'property_id,year' });
      
      if (upsertError) {
        // Check if this is just a missing table error
        if (this.isMissingTableError(upsertError)) {
          console.warn(`Cannot update property history: table doesn't exist in Supabase yet.`);
          
          // Return a simulated change record since we can't actually save the data
          return {
            propertyId,
            year,
            previousValue: null,
            newValue: value,
            author,
            timestamp: new Date().toISOString(),
            status: 'failed',
            reason: 'Table does not exist in Supabase'
          };
        }
        
        throw upsertError;
      }
      
      // Create change record
      const change: PropertyHistoryChange = {
        propertyId,
        year,
        previousValue,
        newValue: value,
        author,
        timestamp: new Date().toISOString()
      };
      
      // Record the change in the audit log
      await auditSystemAction(
        'SUPABASE',
        AuditAction.UPDATE,
        { 
          action: 'update_property_historical_value',
          propertyId,
          year,
          change
        }
      );
      
      return change;
    } catch (error) {
      console.error('Error updating property historical value in Supabase:', error);
      await auditSystemAction(
        'SUPABASE',
        AuditAction.UPDATE,
        { 
          action: 'update_property_historical_value',
          propertyId,
          year,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Delete a historical value for a specific year
   * 
   * @param propertyId Property ID
   * @param year Year to delete
   * @param author User or system making the change
   * @returns Promise resolving to success flag
   */
  async deletePropertyHistoricalValue(
    propertyId: number | string,
    year: string,
    author: string
  ): Promise<boolean> {
    if (!this.checkSupabaseAvailability()) {
      throw new Error('Supabase not configured for property history operations');
    }
    
    try {
      // First get the current value to record in audit log
      const { data: existingData, error: checkError } = await supabase!
        .from(PROPERTY_HISTORY_TABLE)
        .select('value, source, notes, confidence, timestamp')
        .eq('property_id', propertyId)
        .eq('year', year)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') { // No rows returned
          return false; // Nothing to delete
        }
        if (this.isMissingTableError(checkError)) {
          console.warn(`The property_history_records table doesn't exist in Supabase yet.`);
          return false; // Can't delete from a non-existent table
        }
        throw checkError;
      }
      
      const previousValue: HistoricalValue = {
        value: existingData.value,
        source: existingData.source || undefined,
        notes: existingData.notes || undefined,
        confidence: existingData.confidence || undefined,
        timestamp: existingData.timestamp
      };
      
      // Delete the record
      const { error: deleteError } = await supabase!
        .from(PROPERTY_HISTORY_TABLE)
        .delete()
        .eq('property_id', propertyId)
        .eq('year', year);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Record the deletion in the audit log
      await auditSystemAction(
        'SUPABASE',
        AuditAction.DELETE,
        { 
          action: 'delete_property_historical_value',
          propertyId,
          year,
          previousValue,
          author
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting property historical value from Supabase:', error);
      await auditSystemAction(
        'SUPABASE',
        AuditAction.DELETE,
        { 
          action: 'delete_property_historical_value',
          propertyId,
          year,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Import bulk historical values for a property
   * 
   * @param propertyId Property ID
   * @param historyRecord Dictionary of years to historical values
   * @param author User or system making the change
   * @param overwrite Whether to overwrite existing values
   * @returns Promise resolving to success flag
   */
  async importPropertyHistory(
    propertyId: number | string,
    historyRecord: PropertyHistoryRecord,
    author: string,
    overwrite: boolean = false
  ): Promise<boolean> {
    if (!this.checkSupabaseAvailability()) {
      throw new Error('Supabase not configured for property history operations');
    }
    
    if (Object.keys(historyRecord).length === 0) {
      return false; // Nothing to import
    }
    
    try {
      // Get existing history if not overwriting
      let existingHistory: PropertyHistoryRecord = {};
      
      if (!overwrite) {
        existingHistory = await this.getPropertyHistory(propertyId);
      }
      
      // Prepare records for upsert
      const records = Object.entries(historyRecord).map(([year, value]) => {
        // Skip if exists and not overwriting
        if (!overwrite && existingHistory[year]) {
          return null;
        }
        
        return {
          property_id: propertyId,
          year,
          value: value.value,
          source: value.source,
          notes: value.notes,
          confidence: value.confidence,
          timestamp: value.timestamp || new Date().toISOString(),
          updated_by: author,
          updated_at: new Date().toISOString()
        };
      }).filter(record => record !== null) as any[];
      
      if (records.length === 0) {
        return true; // Nothing to import after filtering
      }
      
      // Perform the batch upsert
      const { error } = await supabase!
        .from(PROPERTY_HISTORY_TABLE)
        .upsert(records, { onConflict: 'property_id,year' });
      
      if (error) {
        // Check if this is just a missing table error
        if (this.isMissingTableError(error)) {
          console.warn(`Cannot import property history: table doesn't exist in Supabase yet.`);
          // Return success but log the issue
          await auditSystemAction(
            'SUPABASE',
            AuditAction.IMPORT,
            { 
              action: 'import_property_history',
              propertyId,
              status: 'skipped',
              reason: 'Table does not exist in Supabase',
              recordCount: records.length
            }
          );
          return true;
        }
        throw error;
      }
      
      // Record the import in the audit log
      await auditSystemAction(
        'SUPABASE',
        AuditAction.IMPORT,
        { 
          action: 'import_property_history',
          propertyId,
          recordCount: records.length,
          overwrite,
          author
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error importing property history to Supabase:', error);
      await auditSystemAction(
        'SUPABASE',
        AuditAction.IMPORT,
        { 
          action: 'import_property_history',
          propertyId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Calculate value trends for a property over a specified period
   * 
   * @param propertyId Property ID
   * @param startYear Start year (e.g., "2020")
   * @param endYear End year (e.g., "2023") 
   * @returns Promise resolving to value trend analysis
   */
  async calculatePropertyValueTrend(
    propertyId: number | string,
    startYear: string,
    endYear: string
  ): Promise<PropertyValueTrend | null> {
    // Get the property history
    const historyRecord = await this.getPropertyHistory(propertyId);
    
    // Check if we have data for the start and end years
    if (!historyRecord[startYear] || !historyRecord[endYear]) {
      return null;
    }
    
    // Calculate trend metrics
    const startValue = historyRecord[startYear].value;
    const endValue = historyRecord[endYear].value;
    const absoluteChange = endValue - startValue;
    const percentageChange = (absoluteChange / startValue) * 100;
    
    // Calculate compound annual growth rate
    const yearDiff = parseInt(endYear) - parseInt(startYear);
    const annualGrowthRate = yearDiff > 0 
      ? (Math.pow((endValue / startValue), 1 / yearDiff) - 1) * 100
      : 0;
    
    // Get property details (we'll mock these for now)
    const propertyDetails = await this.getPropertyBasicInfo(propertyId);
    
    // Return the trend analysis
    return {
      propertyId,
      parcelId: propertyDetails?.parcelId || 'unknown',
      address: propertyDetails?.address || 'unknown',
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
   * @returns Promise resolving to formatted property value history
   */
  async getFormattedPropertyHistory(propertyId: number | string): Promise<PropertyValueHistory | null> {
    // Get the property history
    const historyRecord = await this.getPropertyHistory(propertyId);
    
    // If no history data, return null
    if (Object.keys(historyRecord).length === 0) {
      return null;
    }
    
    // Format the data for visualization
    const years = Object.keys(historyRecord).sort();
    const values = years.map(year => ({
      year,
      value: historyRecord[year].value
    }));
    
    // Calculate metrics
    const startYear = years[0];
    const endYear = years[years.length - 1];
    const startValue = historyRecord[startYear].value;
    const currentValue = historyRecord[endYear].value;
    const totalPercentageChange = ((currentValue - startValue) / startValue) * 100;
    
    // Calculate compound annual growth rate if we have multiple years
    let annualGrowthRate: number | undefined;
    if (years.length > 1) {
      const yearDiff = parseInt(endYear) - parseInt(startYear);
      annualGrowthRate = yearDiff > 0 
        ? (Math.pow((currentValue / startValue), 1 / yearDiff) - 1) * 100
        : undefined;
    }
    
    // Determine how many values are interpolated/estimated
    const interpolatedCount = Object.values(historyRecord).filter(
      value => value.source === 'Interpolation' || value.source === 'Estimate'
    ).length;
    
    // Determine primary data source
    const sources = new Set<string>();
    Object.values(historyRecord).forEach(value => {
      if (value.source) sources.add(value.source);
    });
    const primarySource = sources.size === 1 
      ? Array.from(sources)[0]
      : sources.size > 1 
        ? 'Multiple Sources' 
        : 'Unknown';
    
    // Get the latest timestamp
    const lastUpdated = Object.values(historyRecord)
      .map(value => value.timestamp || '')
      .sort()
      .pop();
    
    // Return formatted history
    return {
      propertyId,
      values,
      currentValue,
      annualGrowthRate,
      totalPercentageChange,
      yearsAvailable: years,
      metadata: {
        primarySource,
        lastUpdated,
        interpolatedCount: interpolatedCount
      }
    };
  }
  
  /**
   * Fill missing years in a property's history using linear interpolation
   * 
   * @param propertyId Property ID
   * @param author User or system making the change
   * @returns Promise resolving to success flag and number of years filled
   */
  async fillMissingHistoricalYears(
    propertyId: number | string,
    author: string
  ): Promise<{ success: boolean; yearsFilled: number }> {
    if (!this.checkSupabaseAvailability()) {
      throw new Error('Supabase not configured for property history operations');
    }
    
    try {
      // Get the current history
      const historyRecord = await this.getPropertyHistory(propertyId);
      
      if (Object.keys(historyRecord).length < 2) {
        // Need at least two points for interpolation
        return { success: false, yearsFilled: 0 };
      }
      
      // Sort years numerically
      const years = Object.keys(historyRecord).map(Number).sort((a, b) => a - b);
      
      // Find gaps
      const gaps: number[][] = [];
      for (let i = 0; i < years.length - 1; i++) {
        const currentYear = years[i];
        const nextYear = years[i + 1];
        
        if (nextYear - currentYear > 1) {
          // Gap exists
          const missingYears = [];
          for (let y = currentYear + 1; y < nextYear; y++) {
            missingYears.push(y);
          }
          gaps.push(missingYears);
        }
      }
      
      if (gaps.length === 0) {
        // No gaps to fill
        return { success: false, yearsFilled: 0 };
      }
      
      // Interpolate values for each gap
      const newValues: PropertyHistoryRecord = {};
      let totalFilled = 0;
      
      for (const missingYears of gaps) {
        const startYear = missingYears[0] - 1;
        const endYear = missingYears[missingYears.length - 1] + 1;
        
        const startValue = historyRecord[startYear.toString()].value;
        const endValue = historyRecord[endYear.toString()].value;
        
        const valueRange = endValue - startValue;
        const yearRange = endYear - startYear;
        
        for (const year of missingYears) {
          const yearPosition = year - startYear;
          const interpolatedValue = startValue + (valueRange * (yearPosition / yearRange));
          
          newValues[year.toString()] = {
            value: Math.round(interpolatedValue * 100) / 100, // Round to 2 decimal places
            source: 'Interpolation',
            notes: 'Interpolated value',
            confidence: 75,
            timestamp: new Date().toISOString()
          };
          
          totalFilled++;
        }
      }
      
      // Import the interpolated values
      if (totalFilled > 0) {
        await this.importPropertyHistory(propertyId, newValues, author, false);
      }
      
      // Record the operation in the audit log
      await auditSystemAction(
        'SUPABASE',
        AuditAction.UPDATE,
        { 
          action: 'fill_missing_historical_years',
          propertyId,
          yearsFilled: totalFilled,
          author
        }
      );
      
      return { success: true, yearsFilled: totalFilled };
    } catch (error) {
      console.error('Error filling missing property history years in Supabase:', error);
      await auditSystemAction(
        'SUPABASE',
        AuditAction.UPDATE,
        { 
          action: 'fill_missing_historical_years',
          propertyId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Get basic property information (parcel ID, address)
   * This is a helper method for trend calculations
   * 
   * @param propertyId Property ID
   * @returns Promise resolving to basic property info
   */
  private async getPropertyBasicInfo(propertyId: number | string): Promise<{ parcelId: string; address: string } | null> {
    if (!this.checkSupabaseAvailability()) {
      return null;
    }
    
    try {
      // Query basic property info from properties table
      const { data, error } = await supabase!
        .from('properties')
        .select('parcel_id, address')
        .eq('id', propertyId)
        .single();
      
      if (error) {
        // Return placeholder data if property not found
        return {
          parcelId: `P-${propertyId}`,
          address: `Property #${propertyId}`
        };
      }
      
      return {
        parcelId: data.parcel_id,
        address: data.address
      };
    } catch (error) {
      console.error('Error fetching property info from Supabase:', error);
      
      // Return placeholder data on error
      return {
        parcelId: `P-${propertyId}`,
        address: `Property #${propertyId}`
      };
    }
  }
}

// Export singleton instance
export const propertyHistorySupabaseService = new PropertyHistorySupabaseService();