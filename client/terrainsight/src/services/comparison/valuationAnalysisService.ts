import { Property } from '@shared/schema';
import { calculateSimilarity } from './similarityService';

export interface ValueAnalysisResult {
  property: Property;
  estimatedValue: number;
  confidenceScore: number;
  valueRange: [number, number];
  marketPosition: {
    percentile: number;
    comparison: 'low' | 'average' | 'high';
  };
  metrics: {
    pricePerSqFt: number;
    propertyAge: number;
    valueToLandRatio: number;
  };
  comparableProperties: {
    property: Property;
    similarityScore: number;
    adjustedValue: number;
  }[];
  factors: {
    name: string;
    impact: 'high' | 'medium' | 'low';
    weight: number;
  }[];
}

// Helper function to extract numeric value from property value field
const getValueFromProperty = (property: Property): number => {
  if (!property.value) return 0;
  
  return typeof property.value === 'string'
    ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
    : property.value;
};

/**
 * Performs a detailed valuation analysis of a property by comparing it with similar properties
 * and applying various valuation factors
 */
export function analyzePropertyValue(
  baseProperty: Property,
  allProperties: Property[],
  similarityScores: Record<string | number, number>
): ValueAnalysisResult {
  // Get base property value
  const baseValue = getValueFromProperty(baseProperty);
  
  // Get comparable properties (excluding the base property)
  const comparableProperties = allProperties
    .filter(p => p.id !== baseProperty.id)
    .slice(0, 5)
    .map(property => ({
      property,
      similarityScore: similarityScores[property.id] || calculateSimilarity(baseProperty, property),
      adjustedValue: getValueFromProperty(property)
    }));
  
  // Calculate average value of comparable properties
  const comparableValues = comparableProperties.map(cp => cp.adjustedValue);
  const avgValue = comparableValues.length 
    ? comparableValues.reduce((sum, value) => sum + value, 0) / comparableValues.length
    : baseValue;
  
  // Determine value range
  const minValue = Math.min(...comparableValues, baseValue);
  const maxValue = Math.max(...comparableValues, baseValue);
  
  // Calculate market position percentile
  const allValues = allProperties.map(p => getValueFromProperty(p)).sort((a, b) => a - b);
  const baseValueIndex = allValues.findIndex(v => v >= baseValue);
  const percentile = Math.round((baseValueIndex / allValues.length) * 100);
  
  // Calculate price per square foot
  const pricePerSqFt = baseProperty.squareFeet 
    ? baseValue / baseProperty.squareFeet
    : 0;
  
  // Calculate current year for property age calculation
  const currentYear = new Date().getFullYear();
  
  // Determine property position compared to market (low, average, high)
  let marketComparison: 'low' | 'average' | 'high' = 'average';
  if (percentile < 30) marketComparison = 'low';
  else if (percentile > 70) marketComparison = 'high';
  
  // Calculate confidence score (0-100) - normally this would be more sophisticated
  const confidenceScore = Math.round(
    Math.min(
      85,  // Cap at 85 for this simplified implementation
      // More comparable properties = higher confidence
      50 + (comparableProperties.length * 5) +
      // Higher similarity scores = higher confidence
      (comparableProperties.reduce((sum, cp) => sum + cp.similarityScore, 0) / 
       comparableProperties.length * 20)
    )
  );
  
  // Build the analysis result
  return {
    property: baseProperty,
    estimatedValue: avgValue,
    confidenceScore,
    valueRange: [minValue, maxValue],
    marketPosition: {
      percentile,
      comparison: marketComparison
    },
    metrics: {
      pricePerSqFt,
      propertyAge: baseProperty.yearBuilt ? currentYear - baseProperty.yearBuilt : 0,
      valueToLandRatio: baseProperty.landValue 
        ? baseValue / parseFloat(baseProperty.landValue.replace(/[^0-9.-]+/g, ''))
        : 0
    },
    comparableProperties,
    factors: [
      { name: 'Location', impact: 'high', weight: 0.35 },
      { name: 'Size', impact: 'medium', weight: 0.25 },
      { name: 'Age', impact: 'medium', weight: 0.15 },
      { name: 'Condition', impact: 'medium', weight: 0.15 },
      { name: 'Market Trends', impact: 'low', weight: 0.10 }
    ]
  };
}