// ETL transformation rules and optimization suggestions seed data
import { 
  InsertEtlTransformationRule, 
  InsertEtlOptimizationSuggestion,
  InsertEtlJob,
  InsertEtlBatchJob,
  InsertEtlAlert
} from "@shared/schema";

// ETL transformation rules for property data processing
export const transformationRulesSeedData: InsertEtlTransformationRule[] = [
  {
    name: "Address Standardization",
    description: "Standardize address formats to USPS standards",
    dataType: "text",
    transformationCode: `
    function standardizeAddress(address) {
      if (!address) return null;
      
      // Convert to uppercase
      let result = address.toUpperCase();
      
      // Standardize common abbreviations
      const replacements = {
        ' STREET': ' ST',
        ' AVENUE': ' AVE',
        ' BOULEVARD': ' BLVD',
        ' DRIVE': ' DR',
        ' ROAD': ' RD',
        ' LANE': ' LN',
        ' COURT': ' CT',
        ' CIRCLE': ' CIR',
        ' HIGHWAY': ' HWY',
        ' PARKWAY': ' PKWY',
        ' NORTH': ' N',
        ' SOUTH': ' S',
        ' EAST': ' E',
        ' WEST': ' W',
        ' APT': ' #',
        ' APARTMENT': ' #',
        ' UNIT': ' #'
      };
      
      for (const [search, replace] of Object.entries(replacements)) {
        result = result.replace(new RegExp(search, 'gi'), replace);
      }
      
      return result;
    }`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Parse Numeric Value",
    description: "Converts strings with currency symbols and commas to numeric values",
    dataType: "number",
    transformationCode: `
    function parseNumericValue(value) {
      if (value === null || value === undefined) return null;
      
      // Handle number inputs
      if (typeof value === 'number') return value;
      
      // Convert to string if not already
      const strValue = String(value);
      
      // Remove currency symbols, commas, and spaces
      const cleanValue = strValue.replace(/[$,\\s]/g, '');
      
      // Parse to float
      const numValue = parseFloat(cleanValue);
      
      // Return null if not a valid number
      return isNaN(numValue) ? null : numValue;
    }`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Date Standardization",
    description: "Standardize dates to ISO format (YYYY-MM-DD)",
    dataType: "date",
    transformationCode: `
    function standardizeDate(date) {
      if (!date) return null;
      
      let parsed;
      
      // If already a Date object
      if (date instanceof Date) {
        parsed = date;
      } else {
        // Try to parse the string date
        parsed = new Date(date);
      }
      
      // Check if valid date
      if (isNaN(parsed.getTime())) {
        return null;
      }
      
      // Format as YYYY-MM-DD
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      
      return \`\${year}-\${month}-\${day}\`;
    }`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Coordinates Validation",
    description: "Validate and format geographic coordinates to [longitude, latitude] array",
    dataType: "object",
    transformationCode: `
    function validateCoordinates(coords) {
      // If already in correct format
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords;
        
        // Check if values are in valid ranges
        if (typeof lng === 'number' && typeof lat === 'number' &&
            lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          return coords;
        }
      }
      
      // If string with comma separation, convert to array
      if (typeof coords === 'string') {
        const parts = coords.split(',').map(p => parseFloat(p.trim()));
        
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) &&
            parts[0] >= -180 && parts[0] <= 180 && parts[1] >= -90 && parts[1] <= 90) {
          return [parts[0], parts[1]];
        }
      }
      
      // If separate lat/lng properties
      if (coords && typeof coords === 'object') {
        const lat = parseFloat(coords.latitude || coords.lat);
        const lng = parseFloat(coords.longitude || coords.lng);
        
        if (!isNaN(lat) && !isNaN(lng) &&
            lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          return [lng, lat];
        }
      }
      
      // Default to null if invalid
      return null;
    }`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Missing Value Replacement",
    description: "Replace missing values with defaults based on data type",
    dataType: "text",
    transformationCode: `
    function replaceMissingValues(value, dataType, defaultValue) {
      if (value === null || value === undefined || value === '') {
        switch (dataType) {
          case 'text':
            return defaultValue || 'Unknown';
          case 'number':
            return defaultValue !== undefined ? defaultValue : 0;
          case 'date':
            return defaultValue || null;
          case 'boolean':
            return defaultValue !== undefined ? defaultValue : false;
          case 'object':
            return defaultValue || null;
          default:
            return defaultValue || null;
        }
      }
      return value;
    }`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ETL optimization suggestions for data processing
export const optimizationSuggestionsSeedData: InsertEtlOptimizationSuggestion[] = [
  {
    jobId: "1",
    title: "Optimize ArcGIS Data Extraction",
    description: "Reduce the number of API calls by implementing pagination and filtering at the source",
    impactArea: "performance",
    potentialSavings: "30% reduction in processing time",
    implementationComplexity: "medium",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    jobId: "2",
    title: "Parallel Processing for Batch Imports",
    description: "Implement parallel processing for large CSV imports to improve throughput",
    impactArea: "throughput",
    potentialSavings: "45% reduction in processing time",
    implementationComplexity: "high",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    jobId: "3",
    title: "Data Validation Pre-filter",
    description: "Add pre-validation filters to reduce downstream errors and reprocessing",
    impactArea: "quality",
    potentialSavings: "60% reduction in validation errors",
    implementationComplexity: "low",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ETL jobs seed data
export const etlJobsSeedData: InsertEtlJob[] = [
  {
    name: "Daily Property Data Import",
    description: "Imports property data from Benton County database daily",
    sourceId: "1", // References Benton County Property Database
    targetId: "5", // References Local PostGIS Database
    transformationIds: JSON.stringify([1, 2, 3]),
    schedule: "0 1 * * *", // Runs at 1am daily
    lastRun: new Date(Date.now() - 86400000), // 24 hours ago
    nextRun: new Date(Date.now() + 86400000), // 24 hours from now
    status: "completed",
    runCount: 365,
    averageDuration: 450, // seconds
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Weekly Washington GIS Update",
    description: "Updates geospatial data from Washington State GIS portal",
    sourceId: "2", // References Washington State GIS Portal
    targetId: "5", // References Local PostGIS Database
    transformationIds: JSON.stringify([1, 4]),
    schedule: "0 3 * * 1", // Runs at 3am on Mondays
    lastRun: new Date(Date.now() - 604800000), // 7 days ago
    nextRun: new Date(Date.now() + 604800000), // 7 days from now
    status: "completed",
    runCount: 52,
    averageDuration: 1200, // seconds
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Monthly Census Data Aggregation",
    description: "Aggregates demographic data from Census Bureau",
    sourceId: "3", // References Census Bureau API
    targetId: "5", // References Local PostGIS Database
    transformationIds: JSON.stringify([2, 5]),
    schedule: "0 2 1 * *", // Runs at 2am on 1st day of each month
    lastRun: new Date(Date.now() - 2592000000), // 30 days ago
    nextRun: new Date(Date.now() + 2592000000), // 30 days from now
    status: "completed",
    runCount: 12,
    averageDuration: 900, // seconds
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ETL batch jobs seed data
export const etlBatchJobsSeedData: InsertEtlBatchJob[] = [
  {
    name: "Q2 2023 Property Value Update",
    description: "Quarterly update of all property values for Q2 2023",
    status: "completed",
    progress: 100,
    totalRecords: 45897,
    processedRecords: 45897,
    failedRecords: 23,
    startTime: new Date(Date.now() - 7776000000), // 90 days ago
    endTime: new Date(Date.now() - 7772400000), // 89 days and 20 hours ago
    source: "Benton County Assessor's Office",
    destination: "SpatialEst Database",
    createdAt: new Date(Date.now() - 7776000000),
    updatedAt: new Date(Date.now() - 7772400000)
  },
  {
    name: "Historical Sales Data Import",
    description: "One-time import of 10 years of historical sales data",
    status: "completed",
    progress: 100,
    totalRecords: 158633,
    processedRecords: 158633,
    failedRecords: 412,
    startTime: new Date(Date.now() - 5184000000), // 60 days ago
    endTime: new Date(Date.now() - 5155200000), // 59 days and 16 hours ago
    source: "Historical Property Sales CSV",
    destination: "SpatialEst Database",
    createdAt: new Date(Date.now() - 5184000000),
    updatedAt: new Date(Date.now() - 5155200000)
  },
  {
    name: "New Construction Properties Import",
    description: "Import of newly constructed properties in Benton County",
    status: "running",
    progress: 67,
    totalRecords: 3142,
    processedRecords: 2105,
    failedRecords: 18,
    startTime: new Date(Date.now() - 86400000), // 1 day ago
    endTime: null,
    source: "Benton County Building Permits Database",
    destination: "SpatialEst Database",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 3600000) // 1 hour ago
  }
];

// ETL alerts seed data
export const etlAlertsSeedData: InsertEtlAlert[] = [
  {
    jobId: "1",
    title: "High Error Rate Detected",
    description: "Error rate exceeded threshold of 5% during address normalization",
    severity: "high",
    status: "open",
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    resolvedAt: null,
    resolvedBy: null,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  },
  {
    jobId: "2",
    title: "API Rate Limit Warning",
    description: "Washington State GIS API rate limit at 85% of maximum",
    severity: "medium",
    status: "resolved",
    timestamp: new Date(Date.now() - 604800000), // 7 days ago
    resolvedAt: new Date(Date.now() - 518400000), // 6 days ago
    resolvedBy: "admin",
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 518400000)
  },
  {
    jobId: "3",
    title: "Data Quality Warning",
    description: "30% of imported census values have missing demographic information",
    severity: "medium",
    status: "open",
    timestamp: new Date(Date.now() - 2592000000), // 30 days ago
    resolvedAt: null,
    resolvedBy: null,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date(Date.now() - 2592000000)
  }
];