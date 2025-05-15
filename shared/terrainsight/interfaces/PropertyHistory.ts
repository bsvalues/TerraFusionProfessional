/**
 * Property History Interfaces
 * 
 * Defines standard interfaces for property value history tracking
 */

/**
 * Historical property value with metadata
 */
export interface HistoricalValue {
  /** The property value at the time */
  value: number;
  
  /** Source of the valuation (e.g., "Assessment", "Market", "Sale") */
  source?: string;
  
  /** Any notes about this valuation point */
  notes?: string;
  
  /** Timestamp when this valuation was recorded */
  timestamp?: string;
  
  /** Confidence level of this valuation (0-100) */
  confidence?: number;
}

/**
 * Historical property value record by year
 */
export interface PropertyHistoryRecord {
  /** Dictionary of years to historical values */
  [year: string]: HistoricalValue;
}

/**
 * Property history change record
 */
export interface PropertyHistoryChange {
  /** Property ID */
  propertyId: string | number;
  
  /** Year of the change */
  year: string;
  
  /** Previous value, if any */
  previousValue?: HistoricalValue | null;
  
  /** New value */
  newValue: HistoricalValue;
  
  /** User or system that made the change */
  author: string;
  
  /** Timestamp of the change */
  timestamp: string;
  
  /** Status of the change operation (success, failed, skipped) */
  status?: string;
  
  /** Reason for status, especially for failures or skipped operations */
  reason?: string;
}

/**
 * Value trend record for a property
 */
export interface PropertyValueTrend {
  /** Property ID */
  propertyId: string | number;
  
  /** Property parcel ID */
  parcelId: string;
  
  /** Property address */
  address: string;
  
  /** Start year of the trend */
  startYear: string;
  
  /** End year of the trend */
  endYear: string;
  
  /** Value at the start year */
  startValue: number;
  
  /** Value at the end year */
  endValue: number;
  
  /** Absolute change in value */
  absoluteChange: number;
  
  /** Percentage change in value */
  percentageChange: number;
  
  /** Annual growth rate (compound) */
  annualGrowthRate: number;
}

/**
 * Historical value point with year and value for charting
 */
export interface HistoricalValuePoint {
  /** Year as string (e.g., "2023") */
  year: string;
  
  /** Value for that year */
  value: number;
}

/**
 * Property value history series with metadata
 */
export interface PropertyValueHistory {
  /** Property ID */
  propertyId: string | number;
  
  /** Series of historical values by year */
  values: HistoricalValuePoint[];
  
  /** Current value */
  currentValue: number;
  
  /** Annual growth rate */
  annualGrowthRate?: number;
  
  /** Overall percentage change */
  totalPercentageChange?: number;
  
  /** Years with data available */
  yearsAvailable: string[];
  
  /** Metadata about the history */
  metadata?: {
    /** Main source of this data */
    primarySource?: string;
    
    /** When this history was last updated */
    lastUpdated?: string;
    
    /** How many interpolated (estimated) values exist */
    interpolatedCount?: number;
  };
}

/**
 * Property trend data for heat map visualization
 */
export interface PropertyTrendData {
  /** Property ID */
  propertyId: string | number;
  
  /** Property parcel ID */
  parcelId: string;
  
  /** Property address */
  address: string;
  
  /** Property geographic coordinates */
  latitude: number;
  longitude: number;
  
  /** Current property value */
  currentValue: number;
  
  /** Value change in percentage (year over year) */
  valueChangePercent: number;
  
  /** Absolute value change */
  valueChangeAbsolute: number;
  
  /** Annual growth rate */
  annualGrowthRate: number;
  
  /** Comparison to neighborhood average (higher or lower in percentage) */
  neighborhoodComparison?: number;
  
  /** Year of analysis - the "current" year for this trend */
  analysisYear: string;
  
  /** Reference year - the "previous" year for calculating change */
  referenceYear: string;
}