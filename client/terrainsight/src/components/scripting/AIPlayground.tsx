import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ResultVisualizer from './ResultVisualizer';
import { 
  Play, 
  XCircle, 
  FileIcon, 
  BookIcon, 
  Loader2, 
  AlertTriangle,
  Sparkles,
  Network,
  Map,
  MapPin,
  DollarSign,
  ChevronRight,
  MessageCircle,
  LineChart,
  BarChart,
  ShieldCheck
} from 'lucide-react';
import { Property } from '@shared/schema';
import ScriptExecutionEngine, { ScriptResult } from './ScriptExecutionEngine';
import { etlPipelineManager } from '../../services/etl';

// Mock sample data for property analysis when ETL data is not available
const getSampleTransformedData = () => {
  return {
    propertyValuesByNeighborhood: {
      "Downtown": { count: 35, avgValue: 420000, minValue: 320000, maxValue: 650000 },
      "Southside": { count: 42, avgValue: 385000, minValue: 290000, maxValue: 520000 },
      "Westview": { count: 28, avgValue: 450000, minValue: 350000, maxValue: 720000 },
      "Northvale": { count: 31, avgValue: 410000, minValue: 310000, maxValue: 590000 }
    },
    propertyTypeDistribution: {
      "Single Family": 65,
      "Multi-Family": 15,
      "Commercial": 12,
      "Vacant Land": 8
    },
    yearBuiltDistribution: {
      "Before 1950": 12,
      "1950-1975": 24,
      "1976-2000": 38,
      "After 2000": 26
    },
    avgPricePerSqFt: 185.42
  };
};

// Connection to the ETL pipeline for accessing processed data
const getTransformedDataFromETL = (jobId: string = 'property-data-etl') => {
  try {
    // Try to get job runs from etlPipelineManager instead
    const allJobRuns = etlPipelineManager.getAllJobRuns();
    
    // Filter by jobId if needed and sort to get the latest run
    const jobRuns = allJobRuns.filter(run => run.jobId.toString() === jobId);
    const latestRun = jobRuns.length > 0 
      ? jobRuns.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0]
      : null;
    
    if (latestRun && 'result' in latestRun) {
      return (latestRun as any).result;
    }
    
    // Return sample data if no actual ETL data is available
    return getSampleTransformedData();
  } catch (error) {
    console.warn("Error getting transformed data from ETL:", error);
    // Return sample data as fallback
    return getSampleTransformedData();
  }
};

// Sample/Template scripts that users can select from
const SCRIPT_TEMPLATES: Record<string, string> = {
  'property-value-analysis': `// Property Value Analysis
// Analyze property values based on location and attributes

// Function to calculate average property value per square foot
function calculateAvgPricePerSqFt(properties) {
  let validProperties = properties.filter(p => 
    p.value && p.squareFeet && p.squareFeet > 0
  );
  
  if (validProperties.length === 0) return 0;
  
  let totalValue = 0;
  
  validProperties.forEach(property => {
    const value = parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
    totalValue += value / property.squareFeet;
  });
  
  return totalValue / validProperties.length;
}

// Function to find highest value properties
function findTopValueProperties(properties, count = 5) {
  return properties
    .filter(p => p.value)
    .sort((a, b) => {
      const valueA = parseFloat(a.value.replace(/[^0-9.-]+/g, ''));
      const valueB = parseFloat(b.value.replace(/[^0-9.-]+/g, ''));
      return valueB - valueA;
    })
    .slice(0, count);
}

// Run analysis and return results
const avgPricePerSqFt = calculateAvgPricePerSqFt(properties);
const topProperties = findTopValueProperties(properties);

// Return results to be displayed
return {
  avgPricePerSqFt: avgPricePerSqFt.toFixed(2),
  topProperties: topProperties.map(p => ({
    id: p.id,
    address: p.address,
    value: p.value
  }))
};`,

  'neighborhood-clustering': `// Neighborhood Clustering
// Group properties by neighborhood and analyze clusters

// Function to group properties by neighborhood
function groupByNeighborhood(properties) {
  const neighborhoods = {};
  
  properties.forEach(property => {
    if (!property.neighborhood) return;
    
    if (!neighborhoods[property.neighborhood]) {
      neighborhoods[property.neighborhood] = [];
    }
    
    neighborhoods[property.neighborhood].push(property);
  });
  
  return neighborhoods;
}

// Calculate stats for each neighborhood
function calculateNeighborhoodStats(neighborhoods) {
  const stats = {};
  
  Object.entries(neighborhoods).forEach(([name, props]) => {
    const properties = props as Property[];
    
    // Calculate average value
    const validProperties = properties.filter(p => p.value);
    let totalValue = 0;
    
    validProperties.forEach(property => {
      totalValue += parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
    });
    
    const avgValue = validProperties.length > 0 
      ? totalValue / validProperties.length 
      : 0;
    
    // Calculate other stats
    stats[name] = {
      count: properties.length,
      avgValue: avgValue.toFixed(2),
      minValue: validProperties.length > 0 
        ? Math.min(...validProperties.map(p => 
            parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
          )).toFixed(2) 
        : '0',
      maxValue: validProperties.length > 0 
        ? Math.max(...validProperties.map(p => 
            parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
          )).toFixed(2) 
        : '0'
    };
  });
  
  return stats;
}

// Run analysis
const neighborhoodGroups = groupByNeighborhood(properties);
const neighborhoodStats = calculateNeighborhoodStats(neighborhoodGroups);

// Return results
return {
  neighborhoodStats,
  neighborhoodCount: Object.keys(neighborhoodGroups).length
};`,

  'geospatial-hotspot': `// Geospatial Hotspot Analysis
// Identify property value hotspots based on geographic proximity

// Helper function to convert property values to numbers
function getPropertyValue(property) {
  if (!property.value) return 0;
  return parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
}

// Calculate distance between two points (simple Euclidean distance)
function calculateDistance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(
    Math.pow(lat1 - lat2, 2) + 
    Math.pow(lng1 - lng2, 2)
  );
}

// Find properties within a certain distance of each other
function findNearbyProperties(properties, maxDistance = 0.01) {
  const propertiesWithCoords = properties.filter(
    p => p.latitude && p.longitude
  );
  
  const clusters = [];
  
  // For each property, find neighbors within maxDistance
  propertiesWithCoords.forEach(property => {
    const neighbors = propertiesWithCoords.filter(p => {
      if (p.id === property.id) return false;
      
      const distance = calculateDistance(
        property.latitude, 
        property.longitude,
        p.latitude,
        p.longitude
      );
      
      return distance <= maxDistance;
    });
    
    if (neighbors.length >= 3) {
      clusters.push({
        center: property,
        neighbors,
        avgValue: [...neighbors, property]
          .map(getPropertyValue)
          .reduce((sum, val) => sum + val, 0) / (neighbors.length + 1)
      });
    }
  });
  
  // Sort clusters by average value
  clusters.sort((a, b) => b.avgValue - a.avgValue);
  
  return clusters.slice(0, 5); // Return top 5 clusters
}

// Run analysis
const hotspotClusters = findNearbyProperties(properties);

// Return results
return {
  hotspotCount: hotspotClusters.length,
  hotspots: hotspotClusters.map(cluster => ({
    centerProperty: {
      id: cluster.center.id,
      address: cluster.center.address,
      value: cluster.center.value
    },
    neighborCount: cluster.neighbors.length,
    avgValue: cluster.avgValue.toFixed(2)
  }))
};`,

  'time-series-analysis': `// Time Series Analysis
// Analyze property value changes over time

// Helper function to parse property values
function parseValue(valueStr) {
  if (!valueStr) return 0;
  return parseFloat(valueStr.replace(/[^0-9.-]+/g, ''));
}

// Group properties by year
function groupPropertiesByYear(properties) {
  const yearGroups = {};
  
  properties.forEach(property => {
    if (!property.yearAssessed) return;
    
    const year = property.yearAssessed.toString();
    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }
    
    yearGroups[year].push(property);
  });
  
  return yearGroups;
}

// Calculate average value for each year group
function calculateYearlyAverages(yearGroups) {
  const yearlyStats = {};
  
  Object.entries(yearGroups).forEach(([year, props]) => {
    const properties = props as any[];
    const validProperties = properties.filter(p => p.value);
    
    if (validProperties.length === 0) {
      yearlyStats[year] = { avg: 0, count: 0, min: 0, max: 0 };
      return;
    }
    
    const values = validProperties.map(p => parseValue(p.value));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    yearlyStats[year] = {
      avg: avg.toFixed(2),
      count: validProperties.length,
      min: min.toFixed(2),
      max: max.toFixed(2)
    };
  });
  
  return yearlyStats;
}

// Calculate year-over-year changes
function calculateYearOverYearChanges(yearlyStats) {
  const years = Object.keys(yearlyStats).sort();
  const changes = {};
  
  for (let i = 1; i < years.length; i++) {
    const currentYear = years[i];
    const previousYear = years[i-1];
    
    const currentAvg = parseFloat(yearlyStats[currentYear].avg);
    const previousAvg = parseFloat(yearlyStats[previousYear].avg);
    
    if (previousAvg === 0) continue;
    
    const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;
    changes[currentYear] = percentChange.toFixed(2);
  }
  
  return changes;
}

// Run analysis
const yearGroups = groupPropertiesByYear(properties);
const yearlyStats = calculateYearlyAverages(yearGroups);
const yearOverYearChanges = calculateYearOverYearChanges(yearlyStats);

// Find years with highest and lowest growth
const yearChanges = Object.entries(yearOverYearChanges)
  .map(([year, change]) => ({ year, change: parseFloat(change as string) }));

const highestGrowth = yearChanges.length > 0 
  ? yearChanges.sort((a, b) => b.change - a.change)[0]
  : null;
  
const lowestGrowth = yearChanges.length > 0 
  ? yearChanges.sort((a, b) => a.change - b.change)[0]
  : null;

// Return results
return {
  yearlyStats,
  yearOverYearChanges,
  highestGrowth,
  lowestGrowth,
  totalYears: Object.keys(yearlyStats).length
};`,

  'property-type-comparison': `// Property Type Comparison
// Compare statistics across different property types

// Helper function to parse property values
function parseValue(valueStr) {
  if (!valueStr) return 0;
  return parseFloat(valueStr.replace(/[^0-9.-]+/g, ''));
}

// Group properties by type
function groupPropertiesByType(properties) {
  const typeGroups = {};
  
  properties.forEach(property => {
    if (!property.propertyType) {
      if (!typeGroups['Unknown']) {
        typeGroups['Unknown'] = [];
      }
      typeGroups['Unknown'].push(property);
      return;
    }
    
    if (!typeGroups[property.propertyType]) {
      typeGroups[property.propertyType] = [];
    }
    
    typeGroups[property.propertyType].push(property);
  });
  
  return typeGroups;
}

// Calculate statistics for each property type
function calculateTypeStatistics(typeGroups) {
  const typeStats = {};
  
  Object.entries(typeGroups).forEach(([type, props]) => {
    const properties = props as any[];
    const validProperties = properties.filter(p => p.value);
    
    if (validProperties.length === 0) {
      typeStats[type] = { 
        avgValue: 0, 
        count: 0, 
        minValue: 0, 
        maxValue: 0,
        avgSqFt: 0,
        valuePerSqFt: 0
      };
      return;
    }
    
    const values = validProperties.map(p => parseValue(p.value));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate square footage stats
    const propertiesWithSqFt = validProperties.filter(p => p.squareFeet && p.squareFeet > 0);
    let avgSqFt = 0;
    let valuePerSqFt = 0;
    
    if (propertiesWithSqFt.length > 0) {
      const totalSqFt = propertiesWithSqFt.reduce((acc, p) => acc + p.squareFeet, 0);
      avgSqFt = totalSqFt / propertiesWithSqFt.length;
      
      const totalValuePerSqFt = propertiesWithSqFt.reduce((acc, p) => {
        return acc + (parseValue(p.value) / p.squareFeet);
      }, 0);
      
      valuePerSqFt = totalValuePerSqFt / propertiesWithSqFt.length;
    }
    
    typeStats[type] = {
      avgValue: avg.toFixed(2),
      count: validProperties.length,
      minValue: min.toFixed(2),
      maxValue: max.toFixed(2),
      avgSqFt: avgSqFt.toFixed(2),
      valuePerSqFt: valuePerSqFt.toFixed(2)
    };
  });
  
  return typeStats;
}

// Run analysis
const typeGroups = groupPropertiesByType(properties);
const typeStats = calculateTypeStatistics(typeGroups);

// Calculate distribution percentages
const totalProperties = properties.length;
const typeDistribution = {};

Object.entries(typeGroups).forEach(([type, props]) => {
  const count = (props as any[]).length;
  const percentage = (count / totalProperties) * 100;
  typeDistribution[type] = percentage.toFixed(2);
});

// Find highest and lowest value property types
const sortedByValue = Object.entries(typeStats)
  .filter(([_, stats]) => parseFloat((stats as any).avgValue) > 0)
  .sort((a, b) => parseFloat((b[1] as any).avgValue) - parseFloat((a[1] as any).avgValue));

const highestValueType = sortedByValue.length > 0 ? sortedByValue[0][0] : null;
const lowestValueType = sortedByValue.length > 0 ? sortedByValue[sortedByValue.length - 1][0] : null;

// Return results
return {
  typeStats,
  typeDistribution,
  highestValueType,
  lowestValueType,
  totalTypes: Object.keys(typeGroups).length
};`,

  'location-based-analysis': `// Location-based Analysis
// Analyze property characteristics based on location (ZIP codes, neighborhoods)

// Helper function to parse property values
function parseValue(valueStr) {
  if (!valueStr) return 0;
  return parseFloat(valueStr.replace(/[^0-9.-]+/g, ''));
}

// Group properties by location (ZIP code or neighborhood)
function groupPropertiesByLocation(properties, locationField = 'zipCode') {
  const locationGroups = {};
  
  properties.forEach(property => {
    // Use the specified location field, fall back to 'location' or 'area'
    const locationValue = property[locationField] || 
                         property.location || 
                         property.neighborhood ||
                         property.area ||
                         'Unknown';
    
    if (!locationGroups[locationValue]) {
      locationGroups[locationValue] = [];
    }
    
    locationGroups[locationValue].push(property);
  });
  
  return locationGroups;
}

// Calculate statistics for each location
function calculateLocationStatistics(locationGroups) {
  const locationStats = {};
  
  Object.entries(locationGroups).forEach(([location, props]) => {
    const properties = props as any[];
    const validProperties = properties.filter(p => p.value);
    
    if (validProperties.length === 0) {
      locationStats[location] = { 
        avgValue: 0, 
        count: 0, 
        minValue: 0, 
        maxValue: 0,
        avgAge: 0,
        propertyTypes: {}
      };
      return;
    }
    
    const values = validProperties.map(p => parseValue(p.value));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate average property age
    const currentYear = new Date().getFullYear();
    const propertiesWithYearBuilt = properties.filter(p => p.yearBuilt && p.yearBuilt > 0);
    let avgAge = 0;
    
    if (propertiesWithYearBuilt.length > 0) {
      const totalAge = propertiesWithYearBuilt.reduce((acc, p) => acc + (currentYear - p.yearBuilt), 0);
      avgAge = totalAge / propertiesWithYearBuilt.length;
    }
    
    // Count property types in this location
    const propertyTypes = {};
    properties.forEach(property => {
      const type = property.propertyType || 'Unknown';
      propertyTypes[type] = (propertyTypes[type] || 0) + 1;
    });
    
    locationStats[location] = {
      avgValue: avg.toFixed(2),
      count: validProperties.length,
      minValue: min.toFixed(2),
      maxValue: max.toFixed(2),
      avgAge: avgAge.toFixed(1),
      propertyTypes
    };
  });
  
  return locationStats;
}

// Run analysis
const locationGroups = groupPropertiesByLocation(properties, 'neighborhood');
const locationStats = calculateLocationStatistics(locationGroups);

// Find highest and lowest value locations
const sortedByValue = Object.entries(locationStats)
  .filter(([_, stats]) => parseFloat((stats as any).avgValue) > 0)
  .sort((a, b) => parseFloat((b[1] as any).avgValue) - parseFloat((a[1] as any).avgValue));

const highestValueLocation = sortedByValue.length > 0 ? sortedByValue[0][0] : null;
const lowestValueLocation = sortedByValue.length > 0 ? sortedByValue[sortedByValue.length - 1][0] : null;

// Find locations with most and least properties
const sortedByCount = Object.entries(locationStats)
  .sort((a, b) => (b[1] as any).count - (a[1] as any).count);

const mostPropertiesLocation = sortedByCount.length > 0 ? sortedByCount[0][0] : null;
const leastPropertiesLocation = sortedByCount.length > 0 ? sortedByCount[sortedByCount.length - 1][0] : null;

// Return results
return {
  locationStats,
  highestValueLocation,
  lowestValueLocation,
  mostPropertiesLocation,
  leastPropertiesLocation,
  totalLocations: Object.keys(locationGroups).length
};`,

  'data-quality-assessment': `// Data Quality Assessment
// Evaluate the quality and completeness of property data

// Count missing values for each field
function countMissingValues(properties) {
  if (!properties || properties.length === 0) return {};
  
  const missingCounts = {};
  const totalCount = properties.length;
  
  // Get all property fields from the first property
  const sampleProperty = properties[0];
  const fields = Object.keys(sampleProperty);
  
  // Initialize missing counts for each field
  fields.forEach(field => {
    missingCounts[field] = 0;
  });
  
  // Count missing values for each field
  properties.forEach(property => {
    fields.forEach(field => {
      if (property[field] === null || 
          property[field] === undefined || 
          property[field] === '' || 
          (typeof property[field] === 'string' && property[field].trim() === '')) {
        missingCounts[field]++;
      }
    });
  });
  
  // Convert counts to percentages
  const missingPercentages = {};
  fields.forEach(field => {
    missingPercentages[field] = ((missingCounts[field] / totalCount) * 100).toFixed(2);
  });
  
  return missingPercentages;
}

// Check for potential outliers in numeric fields
function checkForOutliers(properties) {
  const numericFields = ['squareFeet', 'bedrooms', 'bathrooms', 'acres', 'yearBuilt'];
  const outliers = {};
  
  numericFields.forEach(field => {
    // Get values for this field, filtering out missing values
    const values = properties
      .map(p => typeof p[field] === 'string' ? parseFloat(p[field]) : p[field])
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length === 0) {
      outliers[field] = { count: 0, percentage: '0.00' };
      return;
    }
    
    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Count values more than 3 standard deviations from the mean
    const outlierCount = values.filter(v => Math.abs(v - mean) > 3 * stdDev).length;
    const outlierPercentage = ((outlierCount / values.length) * 100).toFixed(2);
    
    outliers[field] = { 
      count: outlierCount, 
      percentage: outlierPercentage
    };
  });
  
  return outliers;
}

// Check for duplicate properties
function checkForDuplicates(properties) {
  // Create sets to track potential duplicates
  const addressSet = new Set();
  const parcelIdSet = new Set();
  const duplicates = {
    byAddress: {
      count: 0,
      percentage: '0.00'
    },
    byParcelId: {
      count: 0,
      percentage: '0.00'
    }
  };
  
  properties.forEach(property => {
    // Check for duplicate addresses
    if (property.address) {
      const normalizedAddress = property.address.toLowerCase().trim();
      if (addressSet.has(normalizedAddress)) {
        duplicates.byAddress.count++;
      } else {
        addressSet.add(normalizedAddress);
      }
    }
    
    // Check for duplicate parcel IDs
    if (property.parcelId) {
      if (parcelIdSet.has(property.parcelId)) {
        duplicates.byParcelId.count++;
      } else {
        parcelIdSet.add(property.parcelId);
      }
    }
  });
  
  // Calculate percentages
  const totalCount = properties.length;
  duplicates.byAddress.percentage = ((duplicates.byAddress.count / totalCount) * 100).toFixed(2);
  duplicates.byParcelId.percentage = ((duplicates.byParcelId.count / totalCount) * 100).toFixed(2);
  
  return duplicates;
}

// Run analysis
const missingValuePercentages = countMissingValues(properties);
const potentialOutliers = checkForOutliers(properties);
const duplicateProperties = checkForDuplicates(properties);

// Calculate overall data quality score (simple average of completeness scores)
let totalCompleteness = 0;
let fieldCount = 0;

Object.values(missingValuePercentages).forEach(percentage => {
  totalCompleteness += 100 - parseFloat(percentage as string);
  fieldCount++;
});

const overallQualityScore = (totalCompleteness / fieldCount).toFixed(2);

// Identify fields with highest missing data
const fieldsWithMissingData = Object.entries(missingValuePercentages)
  .sort((a, b) => parseFloat(b[1] as string) - parseFloat(a[1] as string))
  .slice(0, 5)
  .map(([field, percentage]) => ({ field, percentage }));

// Return results
return {
  overallQualityScore,
  fieldsWithMissingData,
  missingValuePercentages,
  potentialOutliers,
  duplicateProperties
};`,

  'comparative-market-analysis': `// Comparative Market Analysis
// Analyze property values in relation to comparable properties

// Helper function to parse property values
function parseValue(valueStr) {
  if (!valueStr) return 0;
  return parseFloat(valueStr.replace(/[^0-9.-]+/g, ''));
}

// Function to find comparable properties based on characteristics
function findComparableProperties(targetProperty, allProperties, options = {}) {
  if (!targetProperty) {
    // If no target property specified, use the first property as target
    targetProperty = allProperties[0];
  }
  
  // Default options
  const {
    maxDistance = 1, // in miles
    squareFeetTolerance = 0.2, // 20% tolerance
    propertyTypesFilter = [],
    maxComparables = 10
  } = options;
  
  // Helper function to calculate distance between properties (simple approximation)
  function calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 9999;
    
    const toRadians = (degree) => degree * (Math.PI / 180);
    const R = 3958.8; // Earth radius in miles
    
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Extract target property data
  const targetLat = parseFloat(targetProperty.latitude);
  const targetLng = parseFloat(targetProperty.longitude);
  const targetSqFt = parseFloat(targetProperty.squareFeet) || 0;
  const targetType = targetProperty.propertyType;
  const targetValue = parseValue(targetProperty.value);
  
  // Filter for comparable properties
  const comparables = allProperties
    .filter(property => {
      // Skip the target property itself
      if (property.id === targetProperty.id) return false;
      
      // Filter by property type if specified
      if (propertyTypesFilter.length > 0 && 
          !propertyTypesFilter.includes(property.propertyType)) {
        return false;
      }
      
      // Check distance
      const distance = calculateDistance(
        targetLat, targetLng, 
        parseFloat(property.latitude), 
        parseFloat(property.longitude)
      );
      
      if (distance > maxDistance) return false;
      
      // Check square footage tolerance
      if (targetSqFt > 0 && property.squareFeet) {
        const sqFt = parseFloat(property.squareFeet);
        if (sqFt <= 0) return false;
        
        const sqFtDiff = Math.abs(sqFt - targetSqFt) / targetSqFt;
        if (sqFtDiff > squareFeetTolerance) return false;
      }
      
      return true;
    })
    .map(property => {
      const propValue = parseValue(property.value);
      const distance = calculateDistance(
        targetLat, targetLng, 
        parseFloat(property.latitude), 
        parseFloat(property.longitude)
      );
      
      return {
        id: property.id,
        parcelId: property.parcelId,
        address: property.address,
        value: propValue,
        distance: distance.toFixed(2),
        squareFeet: property.squareFeet,
        pricePerSqFt: property.squareFeet ? (propValue / parseFloat(property.squareFeet)).toFixed(2) : 'N/A',
        propertyType: property.propertyType,
        yearBuilt: property.yearBuilt
      };
    })
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    .slice(0, maxComparables);
  
  return {
    targetProperty: {
      id: targetProperty.id,
      parcelId: targetProperty.parcelId,
      address: targetProperty.address,
      value: targetValue,
      squareFeet: targetSqFt,
      pricePerSqFt: targetSqFt ? (targetValue / targetSqFt).toFixed(2) : 'N/A',
      propertyType: targetType,
      yearBuilt: targetProperty.yearBuilt
    },
    comparables
  };
}

// Calculate market analysis statistics
function calculateMarketAnalysis(targetProperty, comparables) {
  if (!comparables || comparables.length === 0) {
    return {
      avgValue: 0,
      medianValue: 0,
      minValue: 0,
      maxValue: 0,
      avgPricePerSqFt: 0,
      valuePercentile: 0,
      recommendedValueRange: {
        low: 0,
        high: 0
      }
    };
  }
  
  // Calculate basic statistics
  const values = comparables.map(p => p.value).filter(v => v > 0);
  const pricesPerSqFt = comparables
    .map(p => p.pricePerSqFt !== 'N/A' ? parseFloat(p.pricePerSqFt) : null)
    .filter(v => v !== null && v > 0);
  
  // Sort values for percentile calculation
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate statistics
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const avgPricePerSqFt = pricesPerSqFt.length > 0 
    ? pricesPerSqFt.reduce((sum, val) => sum + val, 0) / pricesPerSqFt.length 
    : 0;
  
  // Calculate where the target property's value falls in the percentile range
  const targetValue = targetProperty.value;
  let valuePercentile = 0;
  
  if (targetValue > 0) {
    // Find position in sorted array
    const position = sortedValues.findIndex(v => v >= targetValue);
    if (position >= 0) {
      valuePercentile = (position / sortedValues.length * 100).toFixed(1);
    } else {
      valuePercentile = 100; // Higher than all comparables
    }
  }
  
  // Calculate recommended value range based on comps
  const stdDev = calculateStandardDeviation(values);
  const recommendedValueRange = {
    low: Math.max(minValue, avgValue - stdDev).toFixed(2),
    high: Math.min(maxValue, avgValue + stdDev).toFixed(2)
  };
  
  return {
    avgValue: avgValue.toFixed(2),
    medianValue: medianValue.toFixed(2),
    minValue: minValue.toFixed(2),
    maxValue: maxValue.toFixed(2),
    avgPricePerSqFt: avgPricePerSqFt.toFixed(2),
    valuePercentile,
    recommendedValueRange
  };
}

// Helper function to calculate standard deviation
function calculateStandardDeviation(values) {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

// Run the analysis
// Find a property to use as target - typically we'd let the user select one,
// but for this example we'll use one with good data
const potentialTargets = properties.filter(p => 
  p.value && p.squareFeet && p.latitude && p.longitude
);

const targetProperty = potentialTargets.length > 0 ? potentialTargets[0] : properties[0];

// Find comparables
const { targetProperty: target, comparables } = findComparableProperties(
  targetProperty, 
  properties,
  {
    maxDistance: 2,
    squareFeetTolerance: 0.25,
    maxComparables: 8
  }
);

// Calculate market analysis
const marketAnalysis = calculateMarketAnalysis(target, comparables);

// Return results
return {
  targetProperty: target,
  comparables,
  marketAnalysis,
  comparableCount: comparables.length
};`
};

interface AIPlaygroundProps {
  properties: Property[];
  onScriptResult?: (result: any) => void;
}

const AIPlayground: React.FC<AIPlaygroundProps> = ({ 
  properties,
  onScriptResult 
}) => {
  const { toast } = useToast();
  const [leftTab, setLeftTab] = useState('ai');
  const [rightTab, setRightTab] = useState('editor');
  const [script, setScript] = useState(SCRIPT_TEMPLATES['property-value-analysis']);
  const [scriptResult, setScriptResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [codeExplanation, setCodeExplanation] = useState<string | null>(null);
  const [openAIConfigured, setOpenAIConfigured] = useState(false);
  const editorRef = useRef<any>(null);

  // Handle editor initialization
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  // Load a template script
  const loadTemplate = (templateKey: string) => {
    if (SCRIPT_TEMPLATES[templateKey]) {
      setScript(SCRIPT_TEMPLATES[templateKey]);
      setRightTab('editor');
      toast({
        title: "Template Loaded",
        description: `Successfully loaded "${templateKey}" template.`
      });
    }
  };

  // Initialize the script execution engine
  const [scriptEngine] = useState<ScriptExecutionEngine>(() => {
    return new ScriptExecutionEngine();
  });
  
  // Get transformed data from ETL pipeline
  const [transformedData, setTransformedData] = useState<Record<string, any> | undefined>();
  
  // Load transformed data when component mounts
  useEffect(() => {
    const etlData = getTransformedDataFromETL();
    setTransformedData(etlData);
    
    // Check if OpenAI API is configured
    fetch('/api/config')
      .then(response => response.json())
      .then(data => {
        setOpenAIConfigured(!!data.hasOpenAIKey);
      })
      .catch(err => {
        console.error('Error checking OpenAI configuration:', err);
        setOpenAIConfigured(false);
      });
  }, []);
  
  // Function to generate code from natural language
  const generateCodeFromNaturalLanguage = useCallback(async () => {
    if (!naturalLanguageInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a natural language description of what you want to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingCode(true);
    setError(null);
    setCodeExplanation(null);
    
    try {
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          naturalLanguage: naturalLanguageInput,
          context: {
            properties: true,
            transformedData: !!transformedData,
            dataStructures: `Property fields: id, address, value, squareFeet, yearBuilt, landValue, coordinates, neighborhood, propertyType, etc.`
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code from natural language');
      }
      
      const result = await response.json();
      
      // Update the script with the generated code
      setScript(result.code);
      
      // Store the explanation
      setCodeExplanation(result.explanation);
      
      // Switch to editor tab to show the generated code
      setRightTab('editor');
      
      toast({
        title: "Code Generated",
        description: "Successfully generated code from your description. Review and run it."
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({
        title: "Code Generation Error",
        description: "Failed to generate code. Please check your input or try again later.",
        variant: "destructive"
      });
      console.error('Error generating code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  }, [naturalLanguageInput, transformedData, toast]);
  
  // Execute the current script
  const executeScript = useCallback(() => {
    setIsExecuting(true);
    setError(null);
    setScriptResult(null);

    try {
      // Create a context with properties and other helper objects
      const context = {
        properties,
        transformedData,
        utils: {
          formatCurrency: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          }
        }
      };

      // Execute the script using our execution engine
      const result = scriptEngine.executeScript(script, context);
      
      if (result.success) {
        setScriptResult(result.output);
        if (onScriptResult) {
          onScriptResult(result.output);
        }
        
        setRightTab('result');
        toast({
          title: "Script Executed",
          description: `Script executed successfully in ${result.executionTime}ms. View the results tab for details.`
        });
      } else {
        setError(result.error || "Unknown error occurred");
        toast({
          title: "Script Error",
          description: "An error occurred while executing the script. Check the console for details.",
          variant: "destructive"
        });
        console.error("Script execution error:", result.error, result.logs);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({
        title: "Script Error",
        description: "An error occurred while executing the script. Check the console for details.",
        variant: "destructive"
      });
      console.error("Script execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  }, [script, properties, transformedData, scriptEngine, onScriptResult, toast]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground rounded-full p-1.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Playground</h2>
            <p className="text-sm text-muted-foreground">Analyze your property data with AI-assisted scripting</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={executeScript}
          disabled={isExecuting}
          className="gap-1.5"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Execute
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 grid grid-cols-12 h-full overflow-hidden">
        {/* Left panel - AI & Templates */}
        <div className="col-span-4 border-r overflow-y-auto">
          <Tabs value={leftTab} onValueChange={setLeftTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4 grid w-[calc(100%-2rem)] grid-cols-2">
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileIcon className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-auto">
              <TabsContent value="ai" className="p-4 m-0 h-full">
                <div className="space-y-4">
                  {!openAIConfigured && (
                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800">
                      <div className="flex items-start">
                        <div className="mr-2">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">OpenAI API Key Required</h4>
                          <p className="text-sm">
                            To use AI capabilities, please configure your OpenAI API key in the server environment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="nlPrompt" className="text-base font-medium mb-2 block">
                      What would you like to analyze?
                    </Label>
                    <div className="grid gap-2">
                      <Textarea
                        id="nlPrompt"
                        placeholder="Describe what you want to analyze in plain English. For example: 'Show me the average property values by neighborhood and identify any outliers'"
                        className="min-h-[120px] text-base"
                        value={naturalLanguageInput}
                        onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      />
                      <Button
                        onClick={generateCodeFromNaturalLanguage}
                        disabled={isGeneratingCode || !openAIConfigured}
                        className="w-full"
                      >
                        {isGeneratingCode ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Code...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Script
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {codeExplanation && (
                    <div className="bg-muted p-4 rounded-md mt-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Explanation
                      </h4>
                      <div className="text-sm whitespace-pre-line">{codeExplanation}</div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
                      <div className="flex items-start">
                        <div className="mr-2">
                          <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Error</h4>
                          <p className="text-sm">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="p-4 m-0 h-full">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Select a template to quickly get started with common analysis patterns.
                  </div>
                  {Object.entries(SCRIPT_TEMPLATES).map(([key, _]) => (
                    <Card 
                      key={key} 
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-border" 
                      onClick={() => loadTemplate(key)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-base flex items-center">
                          {key === 'property-value-analysis' && <DollarSign className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'neighborhood-clustering' && <Network className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'geospatial-hotspot' && <Map className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'time-series-analysis' && <LineChart className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'property-type-comparison' && <BarChart className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'location-based-analysis' && <MapPin className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'data-quality-assessment' && <ShieldCheck className="h-4 w-4 mr-2 text-primary" />}
                          {key === 'comparative-market-analysis' && <Network className="h-4 w-4 mr-2 text-primary" />}
                          {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </CardTitle>
                        <CardDescription>
                          {key === 'property-value-analysis' && 'Analyze property values and find top valued properties.'}
                          {key === 'neighborhood-clustering' && 'Group properties by neighborhood and calculate statistics.'}
                          {key === 'geospatial-hotspot' && 'Identify property value hotspots based on geographic proximity.'}
                          {key === 'time-series-analysis' && 'Track property value changes over time and identify trends.'}
                          {key === 'property-type-comparison' && 'Compare statistical data between different property types.'}
                          {key === 'location-based-analysis' && 'Analyze property characteristics by geographic location.'}
                          {key === 'data-quality-assessment' && 'Evaluate completeness and quality of your property data.'}
                          {key === 'comparative-market-analysis' && 'Compare properties to similar nearby properties to determine market value.'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Right panel - Editor & Result split */}
        <div className="col-span-8 flex flex-col h-full">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col h-full">
            <div className="border-b px-4">
              <TabsList className="mt-2 mb-0">
                <TabsTrigger value="editor">
                  <CodeIcon className="h-4 w-4 mr-2" />
                  Script Editor
                </TabsTrigger>
                <TabsTrigger value="result">
                  <BarChartIcon className="h-4 w-4 mr-2" />
                  Results
                </TabsTrigger>
                <TabsTrigger value="docs">
                  <BookIcon className="h-4 w-4 mr-2" />
                  Documentation
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 p-0 m-0 border-none overflow-hidden">
              <div className="h-full border-none">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  defaultValue={script}
                  value={script}
                  onChange={(value) => setScript(value || '')}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    tabSize: 2,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    cursorStyle: 'line',
                  }}
                  theme="vs-dark"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="flex-1 p-0 m-0 overflow-auto">
              {!scriptResult ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="bg-muted rounded-full p-3 mb-4">
                    <BarChartIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No results yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Write a script in the editor and click "Execute" to see your analysis results here.
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <ResultVisualizer data={scriptResult} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="docs" className="flex-1 p-0 m-0 overflow-auto">
              <div className="p-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted">
                    <CardTitle>Scripting Documentation</CardTitle>
                    <CardDescription>
                      Learn how to use the AI playground to analyze property data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Available Data</h3>
                      <p className="text-muted-foreground mb-4">
                        Your script has access to the following variables:
                      </p>
                      <div className="space-y-2">
                        <div className="bg-muted p-3 rounded-md">
                          <code className="text-sm font-semibold">properties</code>
                          <p className="text-sm text-muted-foreground mt-1">
                            An array of property objects containing details like address, value, coordinates, etc.
                          </p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <code className="text-sm font-semibold">transformedData</code>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pre-processed data from the ETL pipeline, if available.
                          </p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <code className="text-sm font-semibold">utils</code>
                          <p className="text-sm text-muted-foreground mt-1">
                            Helper functions like <code>formatCurrency()</code> for formatting values.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Writing Scripts</h3>
                      <p className="text-muted-foreground mb-4">
                        Your script should return a JavaScript object with the analysis results, which will be displayed in the Results tab.
                      </p>
                      <div className="bg-muted p-3 rounded-md">
                        <pre className="text-sm whitespace-pre-wrap">
{`// Example script structure
// Analyze property data
const result = {
  summary: {
    totalProperties: properties.length,
    averageValue: calculateAverageValue(properties)
  },
  topProperties: findTopProperties(properties, 5)
};

// Return the result object
return result;`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">AI Assistant</h3>
                      <p className="text-muted-foreground">
                        Use the AI Assistant tab to generate scripts automatically by describing what you want to analyze in plain English. The AI will generate JavaScript code that you can run, modify, or use as a starting point.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  );
}

export default AIPlayground;