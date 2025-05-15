/**
 * Valuation Agent
 * 
 * This agent is responsible for calculating property values according to
 * Washington State standards and best practices in property assessment.
 */

import { Agent } from './Agent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult, 
  ValidationIssue 
} from './types';
import { Property } from '../schema';

/**
 * Valuation method types
 */
export enum ValuationMethod {
  MARKET_COMPARISON = 'market_comparison',
  COST_APPROACH = 'cost_approach',
  INCOME_APPROACH = 'income_approach',
  MASS_APPRAISAL = 'mass_appraisal',
  HYBRID = 'hybrid'
}

/**
 * Valuation input type
 */
export interface ValuationInput {
  /** Property data to value */
  property: Property | Partial<Property>;
  
  /** Valuation method to use */
  method?: ValuationMethod;
  
  /** Valuation date (defaults to January 1 of current year) */
  valuationDate?: Date;
  
  /** Comparable properties for market comparison approach */
  comparableProperties?: Array<Property | Partial<Property>>;
  
  /** Income data for income approach */
  incomeData?: {
    potentialGrossIncome?: number;
    vacancyRate?: number;
    operatingExpenses?: number;
    capRate?: number;
  };
  
  /** Cost data for cost approach */
  costData?: {
    replacementCost?: number;
    depreciation?: number;
  };
  
  /** Additional valuation parameters */
  parameters?: Record<string, any>;
}

/**
 * Valuation factor influence
 */
export interface ValuationFactor {
  /** Factor name */
  name: string;
  
  /** Factor description */
  description: string;
  
  /** Factor influence (positive or negative percentage) */
  influence: number;
  
  /** Factor category */
  category: 'location' | 'property' | 'market' | 'economic' | 'legal';
}

/**
 * Valuation output type
 */
export interface ValuationOutput {
  /** The original property */
  property: Property | Partial<Property>;
  
  /** Estimated property value */
  estimatedValue: number;
  
  /** Confidence score (0-100) */
  confidenceScore: number;
  
  /** Valuation method used */
  method: ValuationMethod;
  
  /** Value breakdown by component */
  valueComponents?: Record<string, number>;
  
  /** Factors that influenced the valuation */
  factors: ValuationFactor[];
  
  /** Comparable properties used (for market approach) */
  comparableProperties?: Array<Property | Partial<Property>>;
  
  /** Valuation date */
  valuationDate: Date;
  
  /** Value range (low to high estimate) */
  valueRange?: {
    low: number;
    high: number;
  };
  
  /** Explanation of valuation */
  explanation: string;
}

/**
 * Valuation Agent implementation
 */
export class ValuationAgent extends Agent {
  /** Market trends data */
  private marketTrends: Record<string, number>;
  
  /**
   * Initialize a new Valuation Agent
   */
  constructor() {
    super(
      'valuation-agent',
      'Valuation Agent',
      [
        'property-valuation',
        'market-comparison-analysis',
        'cost-approach-valuation',
        'income-approach-valuation',
        'mass-appraisal-valuation',
        'property-value-reconciliation'
      ]
    );
    
    // Initialize market trends (basic sample data)
    this.marketTrends = {
      'residential': 0.05, // 5% annual increase
      'commercial': 0.03, // 3% annual increase
      'industrial': 0.02, // 2% annual increase
      'vacant_land': 0.04, // 4% annual increase
      'agricultural': 0.01 // 1% annual increase
    };
  }
  
  /**
   * Process a valuation request
   * 
   * @param input The valuation input
   * @param context The agent context
   * @returns Valuation results
   */
  async process(input: ValuationInput, context: AgentContext): Promise<AgentResponse> {
    try {
      const startTime = Date.now();
      
      // Log the operation
      context.log('info', 'Valuing property', { 
        propertyType: input.property.propertyType,
        method: input.method
      });
      
      // Set default valuation date if not provided (January 1 of current year)
      const valuationDate = input.valuationDate || new Date(new Date().getFullYear(), 0, 1);
      
      // Determine valuation method if not specified
      const method = input.method || this.determineOptimalValuationMethod(input.property);
      
      // Perform valuation based on method
      let estimatedValue = 0;
      let valueComponents: Record<string, number> = {};
      let factors: ValuationFactor[] = [];
      let explanation = '';
      let comparableProperties: Array<Property | Partial<Property>> | undefined = undefined;
      
      switch (method) {
        case ValuationMethod.MARKET_COMPARISON:
          const marketResult = await this.performMarketComparison(input, valuationDate, context);
          estimatedValue = marketResult.value;
          valueComponents = marketResult.components;
          factors = marketResult.factors;
          explanation = marketResult.explanation;
          comparableProperties = marketResult.comparables;
          break;
          
        case ValuationMethod.COST_APPROACH:
          const costResult = await this.performCostApproach(input, valuationDate, context);
          estimatedValue = costResult.value;
          valueComponents = costResult.components;
          factors = costResult.factors;
          explanation = costResult.explanation;
          break;
          
        case ValuationMethod.INCOME_APPROACH:
          const incomeResult = await this.performIncomeApproach(input, valuationDate, context);
          estimatedValue = incomeResult.value;
          valueComponents = incomeResult.components;
          factors = incomeResult.factors;
          explanation = incomeResult.explanation;
          break;
          
        case ValuationMethod.MASS_APPRAISAL:
          const massResult = await this.performMassAppraisal(input, valuationDate, context);
          estimatedValue = massResult.value;
          valueComponents = massResult.components;
          factors = massResult.factors;
          explanation = massResult.explanation;
          break;
          
        case ValuationMethod.HYBRID:
          const hybridResult = await this.performHybridValuation(input, valuationDate, context);
          estimatedValue = hybridResult.value;
          valueComponents = hybridResult.components;
          factors = hybridResult.factors;
          explanation = hybridResult.explanation;
          break;
      }
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(input.property, method, valueComponents, factors);
      
      // Calculate value range based on confidence score
      const valueRange = {
        low: Math.round(estimatedValue * (1 - (1 - confidenceScore / 100) / 2)),
        high: Math.round(estimatedValue * (1 + (1 - confidenceScore / 100) / 2))
      };
      
      // Prepare result
      const result: ValuationOutput = {
        property: input.property,
        estimatedValue: Math.round(estimatedValue),
        confidenceScore,
        method,
        valueComponents,
        factors,
        comparableProperties,
        valuationDate,
        valueRange,
        explanation
      };
      
      const executionTimeMs = Date.now() - startTime;
      
      // Create response
      return {
        status: 'success',
        data: result,
        explanation: `Property valued at $${Math.round(estimatedValue).toLocaleString()} using ${method} approach`,
        recommendations: this.generateValuationRecommendations(result),
        metrics: {
          executionTimeMs,
          confidenceScore,
          method
        }
      };
    } catch (error) {
      context.log('error', 'Error valuing property', error);
      
      return this.createErrorResponse(
        `Error valuing property: ${error instanceof Error ? error.message : String(error)}`,
        { property: input.property },
        [{
          type: 'valuation_error',
          severity: 'critical',
          message: `Error valuing property: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        }]
      );
    }
  }
  
  /**
   * Validate input before processing
   * 
   * @param input The input to validate
   * @returns Validation result
   */
  async validateInput(input: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // Check if input is an object
    if (!input || typeof input !== 'object') {
      issues.push({
        field: 'input',
        type: 'invalid_type',
        description: 'Input must be an object',
        severity: 'CRITICAL'
      });
      return { isValid: false, issues };
    }
    
    // Check if property is present
    if (!input.property) {
      issues.push({
        field: 'property',
        type: 'missing_required_field',
        description: 'Property data is required',
        severity: 'CRITICAL'
      });
      return { isValid: false, issues };
    }
    
    // Check if property is an object
    if (typeof input.property !== 'object') {
      issues.push({
        field: 'property',
        type: 'invalid_type',
        description: 'Property must be an object',
        severity: 'CRITICAL'
      });
      return { isValid: false, issues };
    }
    
    // Validate minimum property information
    const requiredFields = ['address'];
    
    for (const field of requiredFields) {
      if (!input.property[field]) {
        issues.push({
          field: `property.${field}`,
          type: 'missing_required_field',
          description: `Property must have ${field}`,
          severity: 'HIGH'
        });
      }
    }
    
    // Validate at least one of these fields must be present for accurate valuation
    const valueIndicatorFields = ['squareFeet', 'lotSize', 'bedrooms', 'bathrooms', 'yearBuilt'];
    if (!valueIndicatorFields.some(field => input.property[field])) {
      issues.push({
        field: 'property',
        type: 'insufficient_data',
        description: 'Property must have at least one of these fields: ' + valueIndicatorFields.join(', '),
        severity: 'MEDIUM'
      });
    }
    
    // If method is provided, validate it
    if (input.method !== undefined) {
      if (!Object.values(ValuationMethod).includes(input.method)) {
        issues.push({
          field: 'method',
          type: 'invalid_value',
          description: `Invalid valuation method: ${input.method}`,
          severity: 'MEDIUM'
        });
      }
    }
    
    // If valuationDate is provided, validate it
    if (input.valuationDate !== undefined) {
      if (!(input.valuationDate instanceof Date) && !(typeof input.valuationDate === 'string')) {
        issues.push({
          field: 'valuationDate',
          type: 'invalid_type',
          description: 'Valuation date must be a Date or string',
          severity: 'MEDIUM'
        });
      }
    }
    
    // If comparableProperties is provided, validate it
    if (input.comparableProperties !== undefined) {
      if (!Array.isArray(input.comparableProperties)) {
        issues.push({
          field: 'comparableProperties',
          type: 'invalid_type',
          description: 'Comparable properties must be an array',
          severity: 'MEDIUM'
        });
      } else if (input.method === ValuationMethod.MARKET_COMPARISON && input.comparableProperties.length === 0) {
        issues.push({
          field: 'comparableProperties',
          type: 'insufficient_data',
          description: 'At least one comparable property is required for market comparison approach',
          severity: 'HIGH'
        });
      }
    }
    
    // Validate based on selected method
    if (input.method === ValuationMethod.INCOME_APPROACH && !input.incomeData) {
      issues.push({
        field: 'incomeData',
        type: 'missing_required_field',
        description: 'Income data is required for income approach',
        severity: 'HIGH'
      });
    }
    
    if (input.method === ValuationMethod.COST_APPROACH && !input.costData) {
      issues.push({
        field: 'costData',
        type: 'missing_required_field',
        description: 'Cost data is required for cost approach',
        severity: 'HIGH'
      });
    }
    
    return {
      isValid: !issues.some(issue => issue.severity === 'CRITICAL'),
      issues,
      validatedData: input
    };
  }
  
  /**
   * Determine the optimal valuation method based on property data
   * 
   * @param property The property to value
   * @returns The optimal valuation method
   */
  private determineOptimalValuationMethod(property: Property | Partial<Property>): ValuationMethod {
    // Default to market comparison for most properties
    let method = ValuationMethod.MARKET_COMPARISON;
    
    // Commercial and multi-family often use income approach
    if (property.propertyType === 'Commercial' || 
        property.propertyType === 'Multi-Family' || 
        property.propertyType === 'Mixed Use') {
      method = ValuationMethod.INCOME_APPROACH;
    }
    
    // Specialized properties often use cost approach
    if (property.propertyType === 'Industrial' || 
        property.propertyType === 'Special Purpose') {
      method = ValuationMethod.COST_APPROACH;
    }
    
    // For residential properties, use market comparison if we have sales data
    if (property.propertyType === 'Residential' && property.salePrice) {
      method = ValuationMethod.MARKET_COMPARISON;
    }
    
    // For properties without good comparables, fall back to cost approach
    if (!property.neighborhood || property.propertyType === 'Vacant Land') {
      method = ValuationMethod.COST_APPROACH;
    }
    
    return method;
  }
  
  /**
   * Perform market comparison approach valuation
   * 
   * @param input The valuation input
   * @param valuationDate The valuation date
   * @param context The agent context
   * @returns Valuation result
   */
  private async performMarketComparison(
    input: ValuationInput,
    valuationDate: Date,
    context: AgentContext
  ): Promise<{
    value: number;
    components: Record<string, number>;
    factors: ValuationFactor[];
    explanation: string;
    comparables: Array<Property | Partial<Property>>;
  }> {
    // Log the operation
    context.log('info', 'Performing market comparison valuation');
    
    // Get subject property
    const property = input.property;
    
    // Use provided comparables or generate mock comparables
    const comparableProperties = input.comparableProperties || [];
    
    // Base value starts at 0
    let baseValue = 0;
    
    // For a real implementation, would use actual comparable sales data
    if (property.salePrice) {
      // If the property has a sale price, use it as the starting point
      baseValue = parseFloat(property.salePrice);
      
      // Adjust for time since sale
      if (property.lastSaleDate) {
        const saleDate = new Date(property.lastSaleDate);
        const monthsSinceSale = (valuationDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        // Adjust value based on market trends (monthly)
        const propertyType = property.propertyType ? 
          property.propertyType.toLowerCase().replace(/[ -]/g, '_') : 'residential';
        const annualAppreciationRate = this.marketTrends[propertyType] || 0.03; // Default to 3%
        const monthlyAppreciationRate = annualAppreciationRate / 12;
        
        baseValue *= Math.pow(1 + monthlyAppreciationRate, monthsSinceSale);
      }
    } else {
      // Without a sale price, estimate based on various factors
      
      // Start with a base value for this property type and location
      baseValue = this.estimateBaseValueForProperty(property);
      
      // Adjust based on square footage
      if (property.squareFeet) {
        const avgSqFtValue = this.getAveragePricePerSqFt(property);
        baseValue = property.squareFeet * avgSqFtValue;
      }
    }
    
    // Calculate value components and adjustments
    const components: Record<string, number> = {
      base: baseValue
    };
    
    // Apply adjustments based on property characteristics
    const adjustments = this.calculateMarketAdjustments(property, baseValue);
    
    // Add adjustments to components
    for (const [key, value] of Object.entries(adjustments)) {
      components[key] = value;
    }
    
    // Calculate the total value
    const totalValue = baseValue + Object.values(adjustments).reduce((sum, value) => sum + value, 0);
    
    // Generate factors that influenced the valuation
    const factors = this.generateMarketComparisonFactors(property, adjustments, baseValue);
    
    // Generate explanation
    const explanation = this.generateMarketComparisonExplanation(property, baseValue, adjustments, totalValue);
    
    return {
      value: totalValue,
      components,
      factors,
      explanation,
      comparables: comparableProperties
    };
  }
  
  /**
   * Perform cost approach valuation
   * 
   * @param input The valuation input
   * @param valuationDate The valuation date
   * @param context The agent context
   * @returns Valuation result
   */
  private async performCostApproach(
    input: ValuationInput,
    valuationDate: Date,
    context: AgentContext
  ): Promise<{
    value: number;
    components: Record<string, number>;
    factors: ValuationFactor[];
    explanation: string;
  }> {
    // Log the operation
    context.log('info', 'Performing cost approach valuation');
    
    // Get subject property
    const property = input.property;
    
    // Calculate land value
    const landValue = property.landValue ? 
      parseFloat(property.landValue) : 
      this.estimateLandValue(property);
    
    // Calculate replacement cost
    const replacementCost = input.costData?.replacementCost || 
      this.estimateReplacementCost(property);
    
    // Calculate depreciation
    const depreciation = input.costData?.depreciation || 
      this.estimateDepreciation(property, replacementCost);
    
    // Calculate improvement value (replacement cost - depreciation)
    const improvementValue = replacementCost - depreciation;
    
    // Total value is land value + improvement value
    const totalValue = landValue + improvementValue;
    
    // Calculate value components
    const components: Record<string, number> = {
      land: landValue,
      replacementCost: replacementCost,
      depreciation: -depreciation,
      improvements: improvementValue
    };
    
    // Generate factors that influenced the valuation
    const factors = this.generateCostApproachFactors(property, components);
    
    // Generate explanation
    const explanation = this.generateCostApproachExplanation(property, components, totalValue);
    
    return {
      value: totalValue,
      components,
      factors,
      explanation
    };
  }
  
  /**
   * Perform income approach valuation
   * 
   * @param input The valuation input
   * @param valuationDate The valuation date
   * @param context The agent context
   * @returns Valuation result
   */
  private async performIncomeApproach(
    input: ValuationInput,
    valuationDate: Date,
    context: AgentContext
  ): Promise<{
    value: number;
    components: Record<string, number>;
    factors: ValuationFactor[];
    explanation: string;
  }> {
    // Log the operation
    context.log('info', 'Performing income approach valuation');
    
    // Get subject property
    const property = input.property;
    
    // Use provided income data or estimate it
    const incomeData = input.incomeData || this.estimateIncomeData(property);
    
    // Calculate potential gross income
    const potentialGrossIncome = incomeData.potentialGrossIncome || 0;
    
    // Calculate vacancy and collection loss
    const vacancyRate = incomeData.vacancyRate || 0.05; // Default 5%
    const vacancyLoss = potentialGrossIncome * vacancyRate;
    
    // Calculate effective gross income
    const effectiveGrossIncome = potentialGrossIncome - vacancyLoss;
    
    // Calculate operating expenses
    const operatingExpenses = incomeData.operatingExpenses || (effectiveGrossIncome * 0.4); // Default 40%
    
    // Calculate net operating income
    const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
    
    // Calculate capitalization rate
    const capRate = incomeData.capRate || this.estimateCapRate(property);
    
    // Calculate property value using direct capitalization
    const propertyValue = netOperatingIncome / capRate;
    
    // Calculate value components
    const components: Record<string, number> = {
      potentialGrossIncome: potentialGrossIncome,
      vacancyLoss: -vacancyLoss,
      effectiveGrossIncome: effectiveGrossIncome,
      operatingExpenses: -operatingExpenses,
      netOperatingIncome: netOperatingIncome
    };
    
    // Generate factors that influenced the valuation
    const factors = this.generateIncomeApproachFactors(property, components, capRate);
    
    // Generate explanation
    const explanation = this.generateIncomeApproachExplanation(property, components, capRate, propertyValue);
    
    return {
      value: propertyValue,
      components,
      factors,
      explanation
    };
  }
  
  /**
   * Perform mass appraisal valuation
   * 
   * @param input The valuation input
   * @param valuationDate The valuation date
   * @param context The agent context
   * @returns Valuation result
   */
  private async performMassAppraisal(
    input: ValuationInput,
    valuationDate: Date,
    context: AgentContext
  ): Promise<{
    value: number;
    components: Record<string, number>;
    factors: ValuationFactor[];
    explanation: string;
  }> {
    // Log the operation
    context.log('info', 'Performing mass appraisal valuation');
    
    // Get subject property
    const property = input.property;
    
    // For a real implementation, this would use statistical modeling
    // For now, we'll use a simple model based on key property attributes
    
    // Base value by property type and neighborhood
    const baseValue = this.estimateBaseValueForProperty(property);
    
    // Calculate per-sqft value
    const sqFtValue = property.squareFeet ? 
      this.getAveragePricePerSqFt(property) * property.squareFeet : 0;
    
    // Calculate bedrooms value
    const bedroomsValue = property.bedrooms ? 
      property.bedrooms * this.getValuePerBedroom(property) : 0;
    
    // Calculate bathrooms value
    const bathroomsValue = property.bathrooms ? 
      property.bathrooms * this.getValuePerBathroom(property) : 0;
    
    // Calculate lot size value
    const lotSizeValue = property.lotSize ? 
      property.lotSize * this.getValuePerLotSqFt(property) : 0;
    
    // Calculate age adjustment
    const ageAdjustment = property.yearBuilt ? 
      this.calculateAgeAdjustment(property, valuationDate) : 0;
    
    // Total value is the sum of all components
    const totalValue = baseValue + sqFtValue + bedroomsValue + 
      bathroomsValue + lotSizeValue + ageAdjustment;
    
    // Calculate value components
    const components: Record<string, number> = {
      base: baseValue
    };
    
    if (property.squareFeet) {
      components.sqft = sqFtValue;
    }
    
    if (property.bedrooms) {
      components.bedrooms = bedroomsValue;
    }
    
    if (property.bathrooms) {
      components.bathrooms = bathroomsValue;
    }
    
    if (property.lotSize) {
      components.lotSize = lotSizeValue;
    }
    
    if (property.yearBuilt) {
      components.age = ageAdjustment;
    }
    
    // Generate factors that influenced the valuation
    const factors = this.generateMassAppraisalFactors(property, components);
    
    // Generate explanation
    const explanation = this.generateMassAppraisalExplanation(property, components, totalValue);
    
    return {
      value: totalValue,
      components,
      factors,
      explanation
    };
  }
  
  /**
   * Perform hybrid valuation
   * 
   * @param input The valuation input
   * @param valuationDate The valuation date
   * @param context The agent context
   * @returns Valuation result
   */
  private async performHybridValuation(
    input: ValuationInput,
    valuationDate: Date,
    context: AgentContext
  ): Promise<{
    value: number;
    components: Record<string, number>;
    factors: ValuationFactor[];
    explanation: string;
  }> {
    // Log the operation
    context.log('info', 'Performing hybrid valuation');
    
    // Get subject property
    const property = input.property;
    
    // Perform all three standard approaches
    const marketResult = await this.performMarketComparison(input, valuationDate, context);
    const costResult = await this.performCostApproach(input, valuationDate, context);
    const incomeResult = await this.performIncomeApproach(input, valuationDate, context);
    
    // Define weights for each approach based on property type
    let marketWeight = 0.5;
    let costWeight = 0.3;
    let incomeWeight = 0.2;
    
    // Adjust weights based on property type
    if (property.propertyType === 'Commercial' || property.propertyType === 'Multi-Family') {
      marketWeight = 0.2;
      costWeight = 0.2;
      incomeWeight = 0.6;
    } else if (property.propertyType === 'Industrial') {
      marketWeight = 0.1;
      costWeight = 0.7;
      incomeWeight = 0.2;
    } else if (property.propertyType === 'Vacant Land') {
      marketWeight = 0.7;
      costWeight = 0.3;
      incomeWeight = 0;
    }
    
    // Calculate weighted value
    const weightedValue = 
      (marketResult.value * marketWeight) +
      (costResult.value * costWeight) +
      (incomeResult.value * incomeWeight);
    
    // Calculate value components
    const components: Record<string, number> = {
      marketApproach: marketResult.value * marketWeight,
      costApproach: costResult.value * costWeight,
      incomeApproach: incomeResult.value * incomeWeight
    };
    
    // Combine factors from all approaches
    const factors = [
      ...marketResult.factors,
      ...costResult.factors,
      ...incomeResult.factors
    ];
    
    // Generate explanation
    const explanation = this.generateHybridExplanation(
      property, 
      marketResult.value, 
      costResult.value, 
      incomeResult.value,
      marketWeight,
      costWeight,
      incomeWeight,
      weightedValue
    );
    
    return {
      value: weightedValue,
      components,
      factors,
      explanation
    };
  }
  
  /**
   * Calculate confidence score for valuation
   * 
   * @param property The property being valued
   * @param method The valuation method used
   * @param valueComponents The value components
   * @param factors The valuation factors
   * @returns Confidence score (0-100)
   */
  private calculateConfidenceScore(
    property: Property | Partial<Property>,
    method: ValuationMethod,
    valueComponents: Record<string, number>,
    factors: ValuationFactor[]
  ): number {
    // Base confidence level depends on the method
    let confidence = {
      [ValuationMethod.MARKET_COMPARISON]: 85,
      [ValuationMethod.COST_APPROACH]: 75,
      [ValuationMethod.INCOME_APPROACH]: 80,
      [ValuationMethod.MASS_APPRAISAL]: 70,
      [ValuationMethod.HYBRID]: 90
    }[method] || 75;
    
    // Adjust confidence based on property data completeness
    if (property.squareFeet) confidence += 1;
    if (property.yearBuilt) confidence += 1;
    if (property.bedrooms) confidence += 1;
    if (property.bathrooms) confidence += 1;
    if (property.lotSize) confidence += 1;
    if (property.salePrice) confidence += 5;
    if (property.lastSaleDate) confidence += 2;
    
    // Recent sales data increases confidence for market approach
    if (method === ValuationMethod.MARKET_COMPARISON && property.lastSaleDate) {
      const saleDate = new Date(property.lastSaleDate);
      const monthsSinceSale = (new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsSinceSale < 6) confidence += 5;
      else if (monthsSinceSale < 12) confidence += 3;
      else if (monthsSinceSale < 24) confidence += 1;
      else confidence -= 2;
    }
    
    // Adjust confidence based on the number of value components
    confidence += Math.min(Object.keys(valueComponents).length * 1, 5);
    
    // Reduce confidence for each high negative factor
    const highNegativeFactors = factors.filter(f => f.influence < -0.1);
    confidence -= highNegativeFactors.length * 2;
    
    // Ensure confidence is between 0 and 100
    return Math.max(0, Math.min(100, confidence));
  }
  
  /**
   * Generate recommendations based on valuation result
   * 
   * @param result The valuation result
   * @returns Array of recommendations
   */
  private generateValuationRecommendations(result: ValuationOutput): string[] {
    const recommendations: string[] = [];
    
    // Recommendation based on confidence score
    if (result.confidenceScore < 70) {
      recommendations.push('Consider collecting more property data to improve valuation accuracy');
    }
    
    // Recommendation based on method
    if (result.method === ValuationMethod.MARKET_COMPARISON) {
      recommendations.push('Update comparable property selection periodically to reflect current market conditions');
    } else if (result.method === ValuationMethod.COST_APPROACH) {
      recommendations.push('Review and update depreciation calculations annually');
    } else if (result.method === ValuationMethod.INCOME_APPROACH) {
      recommendations.push('Verify income and expense data regularly to ensure accuracy');
    }
    
    // Recommendation based on factors
    const significantFactors = result.factors.filter(f => Math.abs(f.influence) > 0.1);
    if (significantFactors.length > 0) {
      recommendations.push(
        'Review key factors affecting valuation: ' + 
        significantFactors.map(f => f.name).join(', ')
      );
    }
    
    // Recommendation for very old properties
    if (result.property.yearBuilt && result.property.yearBuilt < 1960) {
      recommendations.push('Consider on-site inspection to verify condition of older property');
    }
    
    // General recommendation
    recommendations.push('Document the valuation methodology to support assessment in accordance with WAC 458-07-030');
    
    return recommendations;
  }
  
  // Helper methods for market comparison approach
  
  private estimateBaseValueForProperty(property: Property | Partial<Property>): number {
    // This would ideally use real baseline values for neighborhoods and property types
    // For now, using simple estimates
    const baseValues: Record<string, number> = {
      'Residential': 250000,
      'Commercial': 500000,
      'Industrial': 750000,
      'Multi-Family': 600000,
      'Vacant Land': 100000,
      'Agricultural': 200000,
      'Mixed Use': 450000
    };
    
    return baseValues[property.propertyType || 'Residential'] || 250000;
  }
  
  private getAveragePricePerSqFt(property: Property | Partial<Property>): number {
    // This would ideally use real market data for price per sq ft by area and property type
    // For now, using simple estimates
    const pricePerSqFt: Record<string, number> = {
      'Residential': 200,
      'Commercial': 300,
      'Industrial': 150,
      'Multi-Family': 225,
      'Vacant Land': 15,
      'Agricultural': 10,
      'Mixed Use': 275
    };
    
    return pricePerSqFt[property.propertyType || 'Residential'] || 200;
  }
  
  private calculateMarketAdjustments(
    property: Property | Partial<Property>, 
    baseValue: number
  ): Record<string, number> {
    const adjustments: Record<string, number> = {};
    
    // Adjust for lot size
    if (property.lotSize) {
      const avgLotSize = 10000; // Avg lot size in sq ft
      const lotSizeAdjustment = (property.lotSize - avgLotSize) * this.getValuePerLotSqFt(property);
      adjustments.lotSize = lotSizeAdjustment;
    }
    
    // Adjust for bedrooms
    if (property.bedrooms) {
      const avgBedrooms = 3; // Avg number of bedrooms
      const bedroomsAdjustment = (property.bedrooms - avgBedrooms) * this.getValuePerBedroom(property);
      adjustments.bedrooms = bedroomsAdjustment;
    }
    
    // Adjust for bathrooms
    if (property.bathrooms) {
      const avgBathrooms = 2; // Avg number of bathrooms
      const bathroomsAdjustment = (property.bathrooms - avgBathrooms) * this.getValuePerBathroom(property);
      adjustments.bathrooms = bathroomsAdjustment;
    }
    
    // Adjust for age/year built
    if (property.yearBuilt) {
      const ageAdjustment = this.calculateAgeAdjustment(property, new Date());
      adjustments.age = ageAdjustment;
    }
    
    // Location quality adjustment (if neighborhood is known)
    if (property.neighborhood) {
      const locationAdjustment = this.calculateLocationAdjustment(property);
      adjustments.location = locationAdjustment;
    }
    
    return adjustments;
  }
  
  private calculateAgeAdjustment(
    property: Property | Partial<Property>,
    valuationDate: Date
  ): number {
    if (!property.yearBuilt) return 0;
    
    const age = valuationDate.getFullYear() - property.yearBuilt;
    
    // Properties typically depreciate with age, but at different rates
    // depending on the property type
    const annualDepreciationRate = {
      'Residential': 0.005, // 0.5% per year
      'Commercial': 0.01,   // 1% per year
      'Industrial': 0.015,  // 1.5% per year
      'Multi-Family': 0.01,  // 1% per year
      'Mixed Use': 0.01     // 1% per year
    }[property.propertyType || 'Residential'] || 0.005;
    
    // Calculate age adjustment, but cap it at a maximum depreciation
    const maxDepreciation = 0.7; // Max 70% depreciation due to age
    const baseValue = this.estimateBaseValueForProperty(property);
    const depreciationFactor = Math.min(age * annualDepreciationRate, maxDepreciation);
    
    return -baseValue * depreciationFactor;
  }
  
  private calculateLocationAdjustment(property: Property | Partial<Property>): number {
    // Ideally this would use real neighborhood data
    // For now, using mock data for demonstration
    const locationFactors: Record<string, number> = {
      'Downtown': 0.2, // 20% premium
      'Waterfront': 0.3, // 30% premium
      'Suburban': 0.05, // 5% premium
      'Rural': -0.1 // 10% discount
    };
    
    // If we know the neighborhood, apply a location factor
    if (property.neighborhood && locationFactors[property.neighborhood]) {
      const baseValue = this.estimateBaseValueForProperty(property);
      return baseValue * locationFactors[property.neighborhood];
    }
    
    return 0;
  }
  
  private getValuePerBedroom(property: Property | Partial<Property>): number {
    // This would ideally use real market data
    return {
      'Residential': 15000,
      'Multi-Family': 12000,
      'Mixed Use': 10000
    }[property.propertyType || 'Residential'] || 0;
  }
  
  private getValuePerBathroom(property: Property | Partial<Property>): number {
    // This would ideally use real market data
    return {
      'Residential': 25000,
      'Multi-Family': 20000,
      'Mixed Use': 18000
    }[property.propertyType || 'Residential'] || 0;
  }
  
  private getValuePerLotSqFt(property: Property | Partial<Property>): number {
    // This would ideally use real market data
    return {
      'Residential': 5,
      'Commercial': 15,
      'Industrial': 3,
      'Multi-Family': 8,
      'Vacant Land': 2,
      'Agricultural': 0.5,
      'Mixed Use': 10
    }[property.propertyType || 'Residential'] || 5;
  }
  
  private generateMarketComparisonFactors(
    property: Property | Partial<Property>,
    adjustments: Record<string, number>,
    baseValue: number
  ): ValuationFactor[] {
    const factors: ValuationFactor[] = [];
    
    // Create factors from adjustments
    for (const [key, value] of Object.entries(adjustments)) {
      if (Math.abs(value) < 0.01 * baseValue) continue; // Skip negligible factors
      
      const influence = value / baseValue;
      let description = '';
      
      // Generate factor descriptions
      switch (key) {
        case 'lotSize':
          description = `Lot size ${property.lotSize} sqft compared to average`;
          break;
        case 'bedrooms':
          description = `${property.bedrooms} bedrooms compared to average`;
          break;
        case 'bathrooms':
          description = `${property.bathrooms} bathrooms compared to average`;
          break;
        case 'age':
          description = `Built in ${property.yearBuilt} affects value due to age`;
          break;
        case 'location':
          description = `Location in ${property.neighborhood} neighborhood`;
          break;
        default:
          description = `${key} adjustment`;
      }
      
      factors.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        description,
        influence,
        category: key === 'location' ? 'location' : 'property'
      });
    }
    
    // Add market trend factor
    const propertyType = property.propertyType ? 
      property.propertyType.toLowerCase().replace(/[ -]/g, '_') : 'residential';
    const marketTrend = this.marketTrends[propertyType] || 0.03;
    
    factors.push({
      name: 'Market Trend',
      description: `Annual market appreciation rate for ${property.propertyType} properties`,
      influence: marketTrend,
      category: 'market'
    });
    
    return factors;
  }
  
  private generateMarketComparisonExplanation(
    property: Property | Partial<Property>,
    baseValue: number,
    adjustments: Record<string, number>,
    totalValue: number
  ): string {
    // Format currency values
    const formatCurrency = (value: number) => {
      return '$' + value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };
    
    // Create explanation text
    let explanation = `Market comparison approach valuation for ${property.address || 'the property'}.\n\n`;
    
    // Base value explanation
    explanation += `Starting with a base value of ${formatCurrency(baseValue)} `;
    
    if (property.salePrice) {
      explanation += `derived from the property's sale price of ${property.salePrice} `;
      
      if (property.lastSaleDate) {
        explanation += `from ${property.lastSaleDate}, adjusted for time. `;
      } else {
        explanation += `. `;
      }
    } else {
      explanation += `for a ${property.propertyType || 'residential'} property `;
      
      if (property.neighborhood) {
        explanation += `in the ${property.neighborhood} neighborhood. `;
      } else {
        explanation += `in this area. `;
      }
    }
    
    // Add adjustments
    if (Object.keys(adjustments).length > 0) {
      explanation += `\n\nThe following adjustments were applied:\n`;
      
      for (const [key, value] of Object.entries(adjustments)) {
        if (Math.abs(value) < 0.01 * baseValue) continue; // Skip negligible adjustments
        
        const formattedValue = value >= 0 ? 
          `+${formatCurrency(value)}` : 
          formatCurrency(value);
        
        switch (key) {
          case 'lotSize':
            explanation += `- Lot Size (${property.lotSize} sqft): ${formattedValue}\n`;
            break;
          case 'bedrooms':
            explanation += `- Bedrooms (${property.bedrooms}): ${formattedValue}\n`;
            break;
          case 'bathrooms':
            explanation += `- Bathrooms (${property.bathrooms}): ${formattedValue}\n`;
            break;
          case 'age':
            explanation += `- Year Built (${property.yearBuilt}): ${formattedValue}\n`;
            break;
          case 'location':
            explanation += `- Location (${property.neighborhood}): ${formattedValue}\n`;
            break;
          default:
            explanation += `- ${key}: ${formattedValue}\n`;
        }
      }
    }
    
    // Add total value
    explanation += `\nFinal market value estimate: ${formatCurrency(totalValue)}`;
    
    return explanation;
  }
  
  // Helper methods for cost approach
  
  private estimateLandValue(property: Property | Partial<Property>): number {
    // This would ideally use real land value data by location
    
    // If we have lot size, use it to estimate land value
    if (property.lotSize) {
      return property.lotSize * this.getValuePerLotSqFt(property);
    }
    
    // Otherwise, estimate based on property type and location
    const baseValue = this.estimateBaseValueForProperty(property);
    
    // Land typically represents a percentage of total property value
    const landValuePercentage = {
      'Residential': 0.2, // 20% of property value
      'Commercial': 0.3,
      'Industrial': 0.25,
      'Multi-Family': 0.15,
      'Vacant Land': 1.0, // 100% for vacant land
      'Agricultural': 0.9,
      'Mixed Use': 0.25
    }[property.propertyType || 'Residential'] || 0.2;
    
    return baseValue * landValuePercentage;
  }
  
  private estimateReplacementCost(property: Property | Partial<Property>): number {
    // This would ideally use real construction cost data
    
    // If we don't have square feet, we can't estimate replacement cost
    if (!property.squareFeet) {
      return 0;
    }
    
    // Construction cost per square foot varies by property type
    const costPerSqFt = {
      'Residential': 150,
      'Commercial': 200,
      'Industrial': 100,
      'Multi-Family': 180,
      'Mixed Use': 220
    }[property.propertyType || 'Residential'] || 150;
    
    return property.squareFeet * costPerSqFt;
  }
  
  private estimateDepreciation(
    property: Property | Partial<Property>,
    replacementCost: number
  ): number {
    // This would ideally use real depreciation schedules
    
    // If we don't have year built, can't calculate depreciation
    if (!property.yearBuilt) {
      return 0;
    }
    
    const age = new Date().getFullYear() - property.yearBuilt;
    
    // Different property types depreciate at different rates
    const annualDepreciationRate = {
      'Residential': 0.01, // 1% per year
      'Commercial': 0.02, // 2% per year
      'Industrial': 0.025, // 2.5% per year
      'Multi-Family': 0.015, // 1.5% per year
      'Mixed Use': 0.02 // 2% per year
    }[property.propertyType || 'Residential'] || 0.01;
    
    // Calculate depreciation with a cap (buildings maintain some value)
    const maxDepreciation = 0.7; // Max 70% depreciation
    const depreciationRate = Math.min(age * annualDepreciationRate, maxDepreciation);
    
    return replacementCost * depreciationRate;
  }
  
  private generateCostApproachFactors(
    property: Property | Partial<Property>,
    components: Record<string, number>
  ): ValuationFactor[] {
    const factors: ValuationFactor[] = [];
    
    // Land value factor
    if (components.land > 0) {
      factors.push({
        name: 'Land Value',
        description: 'Value of the land component',
        influence: components.land / (components.land + components.replacementCost),
        category: 'property'
      });
    }
    
    // Building value factor
    if (components.replacementCost > 0) {
      factors.push({
        name: 'Building Value',
        description: 'Value of the improvements (buildings)',
        influence: components.replacementCost / (components.land + components.replacementCost),
        category: 'property'
      });
    }
    
    // Depreciation factor
    if (components.depreciation < 0) {
      factors.push({
        name: 'Depreciation',
        description: `Depreciation based on age (built in ${property.yearBuilt})`,
        influence: components.depreciation / (components.land + components.replacementCost),
        category: 'property'
      });
    }
    
    // Construction cost factor
    factors.push({
      name: 'Construction Costs',
      description: 'Current construction costs in the area',
      influence: 0.1, // Moderate influence
      category: 'economic'
    });
    
    return factors;
  }
  
  private generateCostApproachExplanation(
    property: Property | Partial<Property>,
    components: Record<string, number>,
    totalValue: number
  ): string {
    // Format currency values
    const formatCurrency = (value: number) => {
      return '$' + value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };
    
    // Create explanation text
    let explanation = `Cost approach valuation for ${property.address || 'the property'}.\n\n`;
    
    // Land value explanation
    explanation += `Land Value: ${formatCurrency(components.land)} `;
    
    if (property.lotSize) {
      const perSqFtValue = this.getValuePerLotSqFt(property);
      explanation += `(${property.lotSize} sqft × ${formatCurrency(perSqFtValue)}/sqft)`;
    }
    
    explanation += `\n\n`;
    
    // Replacement cost explanation
    explanation += `Replacement Cost: ${formatCurrency(components.replacementCost)} `;
    
    if (property.squareFeet) {
      const costPerSqFt = components.replacementCost / property.squareFeet;
      explanation += `(${property.squareFeet} sqft × ${formatCurrency(costPerSqFt)}/sqft)`;
    }
    
    explanation += `\n\n`;
    
    // Depreciation explanation
    explanation += `Less Depreciation: ${formatCurrency(components.depreciation)} `;
    
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      explanation += `(age: ${age} years)`;
    }
    
    explanation += `\n\n`;
    
    // Improvement value explanation
    explanation += `Improvement Value: ${formatCurrency(components.improvements)} `;
    explanation += `(Replacement Cost minus Depreciation)\n\n`;
    
    // Add total value
    explanation += `Final cost approach value estimate: ${formatCurrency(totalValue)} `;
    explanation += `(Land Value plus Improvement Value)`;
    
    return explanation;
  }
  
  // Helper methods for income approach
  
  private estimateIncomeData(property: Property | Partial<Property>): {
    potentialGrossIncome?: number;
    vacancyRate?: number;
    operatingExpenses?: number;
    capRate?: number;
  } {
    // This would ideally use real income data
    
    // If we don't have square feet, we can't estimate income
    if (!property.squareFeet) {
      return {};
    }
    
    // Estimated annual rent per square foot by property type
    const rentPerSqFt = {
      'Commercial': 20,
      'Industrial': 8,
      'Multi-Family': 15,
      'Mixed Use': 18
    }[property.propertyType || 'Commercial'] || 0;
    
    // Calculate potential gross income
    const potentialGrossIncome = property.squareFeet * rentPerSqFt;
    
    // Estimated vacancy rate by property type
    const vacancyRate = {
      'Commercial': 0.05, // 5%
      'Industrial': 0.07, // 7%
      'Multi-Family': 0.04, // 4%
      'Mixed Use': 0.06 // 6%
    }[property.propertyType || 'Commercial'] || 0.05;
    
    // Estimated operating expense ratio by property type
    const operatingExpenseRatio = {
      'Commercial': 0.35, // 35%
      'Industrial': 0.25, // 25%
      'Multi-Family': 0.45, // 45%
      'Mixed Use': 0.4 // 40%
    }[property.propertyType || 'Commercial'] || 0.35;
    
    // Calculate effective gross income
    const effectiveGrossIncome = potentialGrossIncome * (1 - vacancyRate);
    
    // Calculate operating expenses
    const operatingExpenses = effectiveGrossIncome * operatingExpenseRatio;
    
    return {
      potentialGrossIncome,
      vacancyRate,
      operatingExpenses
    };
  }
  
  private estimateCapRate(property: Property | Partial<Property>): number {
    // This would ideally use real cap rate data by location and property type
    
    // Estimated cap rates by property type
    return {
      'Commercial': 0.07, // 7%
      'Industrial': 0.08, // 8%
      'Multi-Family': 0.06, // 6%
      'Mixed Use': 0.065 // 6.5%
    }[property.propertyType || 'Commercial'] || 0.07;
  }
  
  private generateIncomeApproachFactors(
    property: Property | Partial<Property>,
    components: Record<string, number>,
    capRate: number
  ): ValuationFactor[] {
    const factors: ValuationFactor[] = [];
    
    // Rental income factor
    factors.push({
      name: 'Rental Income',
      description: 'Potential gross income from property',
      influence: 0.5, // High influence
      category: 'economic'
    });
    
    // Vacancy factor
    if (components.vacancyLoss < 0) {
      factors.push({
        name: 'Vacancy Rate',
        description: 'Estimated vacancy and collection losses',
        influence: components.vacancyLoss / components.potentialGrossIncome,
        category: 'economic'
      });
    }
    
    // Operating expenses factor
    if (components.operatingExpenses < 0) {
      factors.push({
        name: 'Operating Expenses',
        description: 'Costs to operate and maintain the property',
        influence: components.operatingExpenses / components.potentialGrossIncome,
        category: 'economic'
      });
    }
    
    // Cap rate factor
    factors.push({
      name: 'Capitalization Rate',
      description: `Market-derived rate of return (${(capRate * 100).toFixed(2)}%)`,
      influence: capRate > 0.07 ? -0.1 : 0.1, // High cap rates reduce value
      category: 'market'
    });
    
    // Location factor
    if (property.neighborhood) {
      factors.push({
        name: 'Location Quality',
        description: `Impact of ${property.neighborhood} location on income potential`,
        influence: 0.2, // Significant influence
        category: 'location'
      });
    }
    
    return factors;
  }
  
  private generateIncomeApproachExplanation(
    property: Property | Partial<Property>,
    components: Record<string, number>,
    capRate: number,
    propertyValue: number
  ): string {
    // Format currency values
    const formatCurrency = (value: number) => {
      return '$' + value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };
    
    // Format percentage values
    const formatPercentage = (value: number) => {
      return (value * 100).toFixed(2) + '%';
    };
    
    // Create explanation text
    let explanation = `Income approach valuation for ${property.address || 'the property'}.\n\n`;
    
    // Potential gross income explanation
    explanation += `Potential Gross Income: ${formatCurrency(components.potentialGrossIncome)} `;
    
    if (property.squareFeet) {
      const rentPerSqFt = components.potentialGrossIncome / property.squareFeet;
      explanation += `(${property.squareFeet} sqft × ${formatCurrency(rentPerSqFt)}/sqft/year)`;
    }
    
    explanation += `\n\n`;
    
    // Vacancy and collection loss explanation
    explanation += `Less Vacancy & Collection Loss: ${formatCurrency(Math.abs(components.vacancyLoss))} `;
    explanation += `(${formatPercentage(-components.vacancyLoss / components.potentialGrossIncome)} of PGI)\n\n`;
    
    // Effective gross income explanation
    explanation += `Effective Gross Income: ${formatCurrency(components.effectiveGrossIncome)} `;
    explanation += `(PGI minus Vacancy & Collection Loss)\n\n`;
    
    // Operating expenses explanation
    explanation += `Less Operating Expenses: ${formatCurrency(Math.abs(components.operatingExpenses))} `;
    explanation += `(${formatPercentage(-components.operatingExpenses / components.effectiveGrossIncome)} of EGI)\n\n`;
    
    // Net operating income explanation
    explanation += `Net Operating Income: ${formatCurrency(components.netOperatingIncome)} `;
    explanation += `(EGI minus Operating Expenses)\n\n`;
    
    // Capitalization rate explanation
    explanation += `Capitalization Rate: ${formatPercentage(capRate)}\n\n`;
    
    // Property value calculation
    explanation += `Value = NOI ÷ Cap Rate = ${formatCurrency(components.netOperatingIncome)} ÷ ${formatPercentage(capRate)}\n\n`;
    
    // Final value
    explanation += `Final income approach value estimate: ${formatCurrency(propertyValue)}`;
    
    return explanation;
  }
  
  // Helper methods for mass appraisal
  
  private generateMassAppraisalFactors(
    property: Property | Partial<Property>,
    components: Record<string, number>
  ): ValuationFactor[] {
    const factors: ValuationFactor[] = [];
    
    // Base value factor
    if (components.base > 0) {
      factors.push({
        name: 'Base Value',
        description: `Base value for ${property.propertyType} properties`,
        influence: components.base / Object.values(components).reduce((sum, value) => sum + value, 0),
        category: 'property'
      });
    }
    
    // Square footage factor
    if (components.sqft > 0) {
      factors.push({
        name: 'Square Footage',
        description: `Impact of ${property.squareFeet} square feet`,
        influence: components.sqft / Object.values(components).reduce((sum, value) => sum + value, 0),
        category: 'property'
      });
    }
    
    // Bedrooms factor
    if (components.bedrooms > 0) {
      factors.push({
        name: 'Bedrooms',
        description: `Impact of ${property.bedrooms} bedrooms`,
        influence: components.bedrooms / Object.values(components).reduce((sum, value) => sum + value, 0),
        category: 'property'
      });
    }
    
    // Bathrooms factor
    if (components.bathrooms > 0) {
      factors.push({
        name: 'Bathrooms',
        description: `Impact of ${property.bathrooms} bathrooms`,
        influence: components.bathrooms / Object.values(components).reduce((sum, value) => sum + value, 0),
        category: 'property'
      });
    }
    
    // Lot size factor
    if (components.lotSize > 0) {
      factors.push({
        name: 'Lot Size',
        description: `Impact of ${property.lotSize} sqft lot`,
        influence: components.lotSize / Object.values(components).reduce((sum, value) => sum + value, 0),
        category: 'property'
      });
    }
    
    // Age factor
    if (components.age) {
      factors.push({
        name: 'Age/Condition',
        description: `Impact of age (built in ${property.yearBuilt})`,
        influence: components.age / Object.values(components).reduce((sum, value) => sum + Math.abs(value), 0),
        category: 'property'
      });
    }
    
    return factors;
  }
  
  private generateMassAppraisalExplanation(
    property: Property | Partial<Property>,
    components: Record<string, number>,
    totalValue: number
  ): string {
    // Format currency values
    const formatCurrency = (value: number) => {
      return '$' + value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };
    
    // Create explanation text
    let explanation = `Mass appraisal valuation for ${property.address || 'the property'}.\n\n`;
    
    // Base value explanation
    explanation += `Base Value: ${formatCurrency(components.base)} `;
    explanation += `(base for ${property.propertyType || 'this type of'} property)\n\n`;
    
    // Add all component explanations
    if (components.sqft) {
      explanation += `Square Footage Adjustment: ${formatCurrency(components.sqft)} `;
      explanation += `(${property.squareFeet} sqft)\n\n`;
    }
    
    if (components.bedrooms) {
      explanation += `Bedrooms Adjustment: ${formatCurrency(components.bedrooms)} `;
      explanation += `(${property.bedrooms} bedrooms)\n\n`;
    }
    
    if (components.bathrooms) {
      explanation += `Bathrooms Adjustment: ${formatCurrency(components.bathrooms)} `;
      explanation += `(${property.bathrooms} bathrooms)\n\n`;
    }
    
    if (components.lotSize) {
      explanation += `Lot Size Adjustment: ${formatCurrency(components.lotSize)} `;
      explanation += `(${property.lotSize} sqft)\n\n`;
    }
    
    if (components.age) {
      explanation += `Age Adjustment: ${formatCurrency(components.age)} `;
      explanation += `(built in ${property.yearBuilt})\n\n`;
    }
    
    // Add total value
    explanation += `Final mass appraisal value estimate: ${formatCurrency(totalValue)} `;
    explanation += `(sum of all components)`;
    
    return explanation;
  }
  
  // Helper methods for hybrid valuation
  
  private generateHybridExplanation(
    property: Property | Partial<Property>,
    marketValue: number,
    costValue: number,
    incomeValue: number,
    marketWeight: number,
    costWeight: number,
    incomeWeight: number,
    weightedValue: number
  ): string {
    // Format currency values
    const formatCurrency = (value: number) => {
      return '$' + value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };
    
    // Format percentage values
    const formatPercentage = (value: number) => {
      return (value * 100).toFixed(0) + '%';
    };
    
    // Create explanation text
    let explanation = `Hybrid valuation for ${property.address || 'the property'}.\n\n`;
    
    // Individual approaches
    explanation += `Market Comparison Approach: ${formatCurrency(marketValue)}\n`;
    explanation += `Cost Approach: ${formatCurrency(costValue)}\n`;
    explanation += `Income Approach: ${formatCurrency(incomeValue)}\n\n`;
    
    // Reconciliation weights
    explanation += `For ${property.propertyType || 'this type of'} property, the following weights were applied:\n`;
    explanation += `- Market Comparison: ${formatPercentage(marketWeight)}\n`;
    explanation += `- Cost Approach: ${formatPercentage(costWeight)}\n`;
    explanation += `- Income Approach: ${formatPercentage(incomeWeight)}\n\n`;
    
    // Weighted calculation
    explanation += `Weighted Calculation:\n`;
    explanation += `${formatCurrency(marketValue)} × ${formatPercentage(marketWeight)} = ${formatCurrency(marketValue * marketWeight)}\n`;
    explanation += `${formatCurrency(costValue)} × ${formatPercentage(costWeight)} = ${formatCurrency(costValue * costWeight)}\n`;
    explanation += `${formatCurrency(incomeValue)} × ${formatPercentage(incomeWeight)} = ${formatCurrency(incomeValue * incomeWeight)}\n\n`;
    
    // Final value
    explanation += `Final reconciled value estimate: ${formatCurrency(weightedValue)}`;
    
    return explanation;
  }
}