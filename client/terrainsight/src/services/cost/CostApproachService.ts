/**
 * CostApproachService.ts
 * 
 * Service for cost approach to property valuation
 * Handles replacement cost calculation, depreciation, and cost-based valuation analysis
 */

/**
 * Construction quality levels
 */
export enum ConstructionQuality {
  POOR = 'poor',
  FAIR = 'fair',
  AVERAGE = 'average',
  GOOD = 'good',
  EXCELLENT = 'excellent'
}

/**
 * Types of depreciation
 */
export enum DepreciationType {
  PHYSICAL = 'physical',
  FUNCTIONAL = 'functional',
  EXTERNAL = 'external'
}

/**
 * Building component information
 */
export interface BuildingComponent {
  type: string;
  value: number;
  effectiveAge: number;
  totalEconomicLife: number;
}

/**
 * Property data required for cost approach analysis
 */
export interface CostApproachProperty {
  id: string;
  parcelId: string;
  address: string;
  propertyType: string;
  squareFeet: number;
  yearBuilt: number;
  landValue: number;
  constructionQuality: ConstructionQuality;
  buildingComponents: BuildingComponent[];
  externalObsolescence: number; // Percentage
  functionalObsolescence: number; // Percentage
  constructionDate: Date;
  neighborhood: string;
  marketCondition: string;
}

/**
 * Depreciation calculation result
 */
export interface DepreciationResult {
  totalDepreciation: number;
  depreciationBreakdown: {
    physical: number;
    functional: number;
    external: number;
  };
  depreciationPercentage: number;
}

/**
 * Cost approach valuation result
 */
export interface CostApproachResult {
  property: CostApproachProperty;
  landValue: number;
  replacementCost: number;
  depreciation: DepreciationResult;
  depreciatedBuildingValue: number;
  totalValueEstimate: number;
  costPerSquareFoot: number;
  estimationDate: Date;
  adjustmentFactors: {
    locationFactor: number;
    marketConditionFactor: number;
    qualityFactor: number;
  };
}

/**
 * Quality factors for different construction quality levels
 */
const QUALITY_FACTORS = {
  [ConstructionQuality.POOR]: 0.8,
  [ConstructionQuality.FAIR]: 0.9,
  [ConstructionQuality.AVERAGE]: 1.0,
  [ConstructionQuality.GOOD]: 1.2,
  [ConstructionQuality.EXCELLENT]: 1.5
};

/**
 * Market condition factors
 */
const MARKET_CONDITION_FACTORS = {
  'Declining': 0.95,
  'Stable': 1.0,
  'Improving': 1.05,
  'Strong': 1.1
};

/**
 * Estimate replacement cost for a property
 * 
 * @param property Property data
 * @returns Estimated replacement cost
 */
export function estimateReplacementCost(property: CostApproachProperty): number {
  // Get quality factor
  const qualityFactor = QUALITY_FACTORS[property.constructionQuality] || 1.0;
  
  // Get market condition factor
  const marketFactor = MARKET_CONDITION_FACTORS[property.marketCondition as keyof typeof MARKET_CONDITION_FACTORS] || 1.0;
  
  // Calculate base replacement cost from components
  const baseComponentCost = property.buildingComponents.reduce(
    (sum, component) => sum + component.value, 
    0
  );
  
  // Apply quality and market factors
  const adjustedCost = baseComponentCost * qualityFactor * marketFactor;
  
  return adjustedCost;
}

/**
 * Calculate depreciation for a property
 * 
 * @param property Property data
 * @returns Depreciation calculation result
 */
export function calculateDepreciation(property: CostApproachProperty): DepreciationResult {
  // Calculate physical depreciation based on components
  const physicalDepreciation = property.buildingComponents.reduce((total, component) => {
    // Calculate depreciation rate based on effective age / total life
    const depreciationRate = Math.min(component.effectiveAge / component.totalEconomicLife, 1);
    // Apply rate to component value
    return total + (component.value * depreciationRate);
  }, 0);
  
  // Calculate replacement cost
  const replacementCost = estimateReplacementCost(property);
  
  // Calculate functional obsolescence
  const functionalDepreciation = replacementCost * (property.functionalObsolescence / 100);
  
  // Calculate external obsolescence
  const externalDepreciation = replacementCost * (property.externalObsolescence / 100);
  
  // Calculate total depreciation
  const totalDepreciation = physicalDepreciation + functionalDepreciation + externalDepreciation;
  
  // Calculate depreciation percentage
  const depreciationPercentage = (totalDepreciation / replacementCost) * 100;
  
  return {
    totalDepreciation,
    depreciationBreakdown: {
      physical: physicalDepreciation,
      functional: functionalDepreciation,
      external: externalDepreciation
    },
    depreciationPercentage
  };
}

/**
 * Calculate property value using the cost approach
 * 
 * @param property Property data
 * @returns Cost approach valuation result
 */
export function calculateCostApproach(property: CostApproachProperty): CostApproachResult {
  // Calculate replacement cost
  const replacementCost = estimateReplacementCost(property);
  
  // Calculate depreciation
  const depreciation = calculateDepreciation(property);
  
  // Calculate depreciated building value
  const depreciatedBuildingValue = replacementCost - depreciation.totalDepreciation;
  
  // Calculate total value (land + building)
  const totalValueEstimate = property.landValue + depreciatedBuildingValue;
  
  // Calculate cost per square foot
  const costPerSquareFoot = property.squareFeet > 0 
    ? totalValueEstimate / property.squareFeet 
    : 0;
  
  // Define quality factor
  const qualityFactor = QUALITY_FACTORS[property.constructionQuality] || 1.0;
  
  // Define market condition factor
  const marketConditionFactor = MARKET_CONDITION_FACTORS[property.marketCondition as keyof typeof MARKET_CONDITION_FACTORS] || 1.0;
  
  // Location factor (placeholder - would normally be based on location data)
  const locationFactor = 1.0;
  
  return {
    property,
    landValue: property.landValue,
    replacementCost,
    depreciation,
    depreciatedBuildingValue,
    totalValueEstimate,
    costPerSquareFoot,
    estimationDate: new Date(),
    adjustmentFactors: {
      locationFactor,
      marketConditionFactor,
      qualityFactor
    }
  };
}

/**
 * Cost Approach Service class
 */
export class CostApproachService {
  /**
   * Analyze a property using the cost approach
   * 
   * @param property Property to analyze
   * @returns Cost approach valuation result
   */
  analyzeProperty(property: CostApproachProperty): CostApproachResult {
    return calculateCostApproach(property);
  }
  
  /**
   * Compare actual sale price to cost approach estimate
   * 
   * @param property Property data
   * @param salePrice Actual sale price
   * @returns Analysis of the difference
   */
  compareToCostApproach(property: CostApproachProperty, salePrice: number): {
    costEstimate: number;
    salePrice: number;
    difference: number;
    percentDifference: number;
  } {
    const costResult = calculateCostApproach(property);
    const difference = salePrice - costResult.totalValueEstimate;
    const percentDifference = (difference / costResult.totalValueEstimate) * 100;
    
    return {
      costEstimate: costResult.totalValueEstimate,
      salePrice,
      difference,
      percentDifference
    };
  }
}

// Export singleton instance
export const costApproachService = new CostApproachService();