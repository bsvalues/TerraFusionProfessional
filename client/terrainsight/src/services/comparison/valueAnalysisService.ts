import { Property } from '@shared/schema';
import { findComparableProperties, ComparablePropertyResult } from './comparablesService';

/**
 * Possible valuation status of a property
 */
export type ValuationStatus = 'undervalued' | 'overvalued' | 'fair-value';

/**
 * Result of property value analysis
 */
export interface PropertyValueAnalysis {
  // Basic property information
  property: Property;
  
  // Valuation status
  valuationStatus: ValuationStatus;
  
  // Value metrics
  pricePerSquareFoot: number;
  neighborhoodAveragePricePerSquareFoot: number;
  percentageDifference: number; // Compared to neighborhood average
  
  // Comparable properties used in analysis
  comparableProperties: ComparablePropertyResult[];
  
  // Optional price adjustments and recommendations
  suggestedValue?: number;
  valueRangeMin?: number;
  valueRangeMax?: number;
}

/**
 * Analyze a property's value compared to similar properties
 * 
 * @param property The property to analyze
 * @param allProperties Array of all available properties (for finding comparables)
 * @param numComparables Number of comparable properties to use in analysis (default: 5)
 * @returns Property value analysis results
 */
export function analyzePropertyValue(
  property: Property,
  allProperties: Property[],
  numComparables: number = 5
): PropertyValueAnalysis {
  // Find comparable properties
  const comparables = findComparableProperties(property, allProperties, {}, numComparables);
  
  // Calculate price per square foot
  let pricePerSquareFoot = 0;
  if (property.value && property.squareFeet && property.squareFeet > 0) {
    pricePerSquareFoot = parseFloat(property.value) / property.squareFeet;
  }
  
  // Calculate neighborhood average price per square foot
  const neighborhoodProperties = allProperties.filter(p => 
    p.id !== property.id && 
    p.neighborhood === property.neighborhood &&
    p.value && 
    p.squareFeet && 
    p.squareFeet > 0
  );
  
  let neighborhoodAveragePricePerSquareFoot = 0;
  if (neighborhoodProperties.length > 0) {
    const total = neighborhoodProperties.reduce((sum, p) => {
      if (p.value && p.squareFeet && p.squareFeet > 0) {
        return sum + (parseFloat(p.value) / p.squareFeet);
      }
      return sum;
    }, 0);
    neighborhoodAveragePricePerSquareFoot = total / neighborhoodProperties.length;
  } else if (comparables.length > 0) {
    // If no neighborhood properties, use comparables instead
    const compsWithPricePerSqFt = comparables.filter(c => 
      c.property.value && 
      c.property.squareFeet && 
      c.property.squareFeet > 0
    );
    
    if (compsWithPricePerSqFt.length > 0) {
      const total = compsWithPricePerSqFt.reduce((sum, c) => {
        if (c.property.value && c.property.squareFeet && c.property.squareFeet > 0) {
          return sum + (parseFloat(c.property.value) / c.property.squareFeet);
        }
        return sum;
      }, 0);
      neighborhoodAveragePricePerSquareFoot = total / compsWithPricePerSqFt.length;
    }
  }
  
  // Calculate percentage difference from neighborhood average
  let percentageDifference = 0;
  if (neighborhoodAveragePricePerSquareFoot > 0) {
    percentageDifference = ((pricePerSquareFoot - neighborhoodAveragePricePerSquareFoot) / 
                          neighborhoodAveragePricePerSquareFoot) * 100;
  }
  
  // Determine valuation status
  let valuationStatus: ValuationStatus = 'fair-value';
  if (percentageDifference < -10) {
    valuationStatus = 'undervalued';
  } else if (percentageDifference > 10) {
    valuationStatus = 'overvalued';
  }
  
  // Calculate suggested value and range
  let suggestedValue: number | undefined;
  let valueRangeMin: number | undefined;
  let valueRangeMax: number | undefined;
  
  if (property.squareFeet && neighborhoodAveragePricePerSquareFoot > 0) {
    // Base suggested value on neighborhood average price per square foot
    suggestedValue = property.squareFeet * neighborhoodAveragePricePerSquareFoot;
    
    // Set range to ±5% of suggested value
    valueRangeMin = suggestedValue * 0.95;
    valueRangeMax = suggestedValue * 1.05;
  }
  
  return {
    property,
    valuationStatus,
    pricePerSquareFoot,
    neighborhoodAveragePricePerSquareFoot,
    percentageDifference,
    comparableProperties: comparables,
    suggestedValue,
    valueRangeMin,
    valueRangeMax
  };
}