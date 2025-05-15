import { 
  calculateCostApproach,
  calculateDepreciation,
  estimateReplacementCost,
  CostApproachProperty,
  CostApproachResult,
  DepreciationType,
  ConstructionQuality
} from '../../services/cost/CostApproachService';

describe('Cost Approach Service', () => {
  // Sample test property
  const sampleProperty: CostApproachProperty = {
    id: '1',
    parcelId: 'TEST-001',
    address: '123 Test Street',
    propertyType: 'Single Family',
    squareFeet: 2000,
    yearBuilt: 2000,
    landValue: 150000,
    constructionQuality: ConstructionQuality.AVERAGE,
    buildingComponents: [
      { type: 'Foundation', value: 30000, effectiveAge: 20, totalEconomicLife: 75 },
      { type: 'Framing', value: 50000, effectiveAge: 20, totalEconomicLife: 75 },
      { type: 'Roofing', value: 25000, effectiveAge: 10, totalEconomicLife: 25 },
      { type: 'HVAC', value: 15000, effectiveAge: 10, totalEconomicLife: 20 },
      { type: 'Electrical', value: 20000, effectiveAge: 15, totalEconomicLife: 50 },
      { type: 'Plumbing', value: 18000, effectiveAge: 15, totalEconomicLife: 50 },
      { type: 'Interior Finishes', value: 40000, effectiveAge: 12, totalEconomicLife: 25 }
    ],
    externalObsolescence: 5, // 5% external obsolescence
    functionalObsolescence: 3, // 3% functional obsolescence
    constructionDate: new Date(2000, 0, 1),
    neighborhood: 'Test Neighborhood',
    marketCondition: 'Stable'
  };

  test('estimateReplacementCost calculates accurate replacement costs', () => {
    // Base test with average quality
    const baseCost = estimateReplacementCost(sampleProperty);
    
    // Should be roughly the sum of component values (198000)
    expect(baseCost).toBeGreaterThan(190000);
    expect(baseCost).toBeLessThan(210000);
    
    // Test with different quality levels
    const highQualityProperty = {
      ...sampleProperty,
      constructionQuality: ConstructionQuality.EXCELLENT
    };
    
    const lowQualityProperty = {
      ...sampleProperty,
      constructionQuality: ConstructionQuality.FAIR
    };
    
    const highQualityCost = estimateReplacementCost(highQualityProperty);
    const lowQualityCost = estimateReplacementCost(lowQualityProperty);
    
    // Higher quality should cost more
    expect(highQualityCost).toBeGreaterThan(baseCost);
    // Lower quality should cost less
    expect(lowQualityCost).toBeLessThan(baseCost);
  });

  test('calculateDepreciation handles different types of depreciation correctly', () => {
    // Calculate total depreciation
    const { totalDepreciation, depreciationBreakdown } = calculateDepreciation(sampleProperty);
    
    // Check physical depreciation for each component
    expect(depreciationBreakdown.physical).toBeGreaterThan(0);
    
    // Verify functional obsolescence calculation
    expect(depreciationBreakdown.functional).toEqual(
      estimateReplacementCost(sampleProperty) * (sampleProperty.functionalObsolescence / 100)
    );
    
    // Verify external obsolescence calculation
    expect(depreciationBreakdown.external).toEqual(
      estimateReplacementCost(sampleProperty) * (sampleProperty.externalObsolescence / 100)
    );
    
    // Total depreciation should be sum of all types
    expect(totalDepreciation).toEqual(
      depreciationBreakdown.physical + 
      depreciationBreakdown.functional + 
      depreciationBreakdown.external
    );
  });

  test('calculateCostApproach generates proper valuation results', () => {
    // Calculate cost approach valuation
    const result = calculateCostApproach(sampleProperty);
    
    // Verify result structure
    expect(result).toHaveProperty('property');
    expect(result).toHaveProperty('landValue');
    expect(result).toHaveProperty('replacementCost');
    expect(result).toHaveProperty('depreciation');
    expect(result).toHaveProperty('depreciatedBuildingValue');
    expect(result).toHaveProperty('totalValueEstimate');
    
    // Check specific calculations
    expect(result.landValue).toEqual(sampleProperty.landValue);
    expect(result.replacementCost).toBeGreaterThan(0);
    expect(result.depreciation.totalDepreciation).toBeGreaterThan(0);
    
    // Depreciated building value should be replacement cost minus depreciation
    expect(result.depreciatedBuildingValue).toEqual(
      result.replacementCost - result.depreciation.totalDepreciation
    );
    
    // Total value should be land value plus depreciated building value
    expect(result.totalValueEstimate).toEqual(
      result.landValue + result.depreciatedBuildingValue
    );
  });

  test('handles edge cases properly', () => {
    // Test with very old property (high depreciation)
    const oldProperty: CostApproachProperty = {
      ...sampleProperty,
      yearBuilt: 1920,
      buildingComponents: sampleProperty.buildingComponents.map(component => ({
        ...component,
        effectiveAge: 80
      }))
    };
    
    const oldPropertyResult = calculateCostApproach(oldProperty);
    
    // Depreciation should be very high but shouldn't exceed replacement cost
    expect(oldPropertyResult.depreciation.totalDepreciation).toBeLessThanOrEqual(oldPropertyResult.replacementCost);
    
    // Test with new construction (minimal depreciation)
    const newProperty: CostApproachProperty = {
      ...sampleProperty,
      yearBuilt: new Date().getFullYear() - 1,
      buildingComponents: sampleProperty.buildingComponents.map(component => ({
        ...component,
        effectiveAge: 1
      })),
      functionalObsolescence: 0,
      externalObsolescence: 0
    };
    
    const newPropertyResult = calculateCostApproach(newProperty);
    
    // New property should have minimal depreciation
    expect(newPropertyResult.depreciation.totalDepreciation).toBeLessThan(oldPropertyResult.depreciation.totalDepreciation);
    expect(newPropertyResult.depreciation.totalDepreciation / newPropertyResult.replacementCost).toBeLessThan(0.05); // Less than 5%
  });
});