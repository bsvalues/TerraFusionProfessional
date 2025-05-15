/**
 * IncomeApproachService.ts
 * 
 * Service for income approach to property valuation
 * Handles income capitalization calculations and analysis
 */

import { 
  IncomeProperty, 
  IncomeApproachSummary, 
  IncomeApproachGroup,
  DCFAnalysis,
  IncomeValuationMethod,
  MarketData,
  AdjustmentFactors
} from './IncomeApproachTypes';
import { alertService, AlertCategory, AlertSeverity } from '../etl/AlertService';

/**
 * Income Approach Service
 * 
 * Service for income approach to property valuation
 */
class IncomeApproachService {
  private incomeProperties: IncomeProperty[] = [];
  private incomeGroups: IncomeApproachGroup[] = [];
  private marketDataSets: MarketData[] = [];
  
  /**
   * Calculate income approach summary for a property
   * @param property Income property
   * @returns Income approach summary
   */
  calculateIncomeSummary(property: IncomeProperty): IncomeApproachSummary {
    try {
      // Calculate potential gross income (PGI)
      const rentalIncome = property.rentalUnits.reduce((sum, unit) => {
        const annualRent = unit.monthlyRent * 12;
        return sum + annualRent;
      }, 0);
      
      const otherIncome = property.incomeStreams.reduce((sum, stream) => {
        const annualAmount = stream.monthlyAmount * 12;
        return sum + annualAmount;
      }, 0);
      
      const potentialGrossIncome = rentalIncome + otherIncome;
      
      // Calculate vacancy loss
      const vacancyRate = property.vacancyRate || 0.05; // Default 5%
      const vacancyLoss = potentialGrossIncome * vacancyRate;
      
      // Calculate effective gross income (EGI)
      const effectiveGrossIncome = potentialGrossIncome - vacancyLoss;
      
      // Calculate operating expenses
      const totalOperatingExpenses = property.expenses.reduce((sum, expense) => {
        return sum + expense.annualAmount;
      }, 0);
      
      // Calculate net operating income (NOI)
      const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;
      
      // Calculate expense ratio
      const expenseRatio = totalOperatingExpenses / potentialGrossIncome;
      
      // Calculate operating expense ratio
      const operatingExpenseRatio = totalOperatingExpenses / effectiveGrossIncome;
      
      // Calculate estimated value using appropriate method
      let estimatedValue: number;
      let grossRentMultiplier: number | undefined;
      
      switch (property.valuationMethod) {
        case IncomeValuationMethod.DIRECT_CAPITALIZATION:
          // Use property cap rate or default to 8%
          const capRate = property.capRate || (property.marketData?.capRate || 0.08);
          estimatedValue = netOperatingIncome / capRate;
          break;
          
        case IncomeValuationMethod.GROSS_RENT_MULTIPLIER:
          // Use property GRM or default to market data or 8
          grossRentMultiplier = property.grossRentMultiplier || 
            (property.marketData?.grossRentMultiplier || 8);
          estimatedValue = potentialGrossIncome * grossRentMultiplier;
          break;
          
        case IncomeValuationMethod.DISCOUNTED_CASH_FLOW:
          // For DCF, we'd normally do more complex calculations
          // But for simplicity, we'll use direct cap as a fallback
          const fallbackCapRate = property.capRate || (property.marketData?.capRate || 0.08);
          estimatedValue = netOperatingIncome / fallbackCapRate;
          // We'd then reference a DCF analysis object
          break;
          
        default:
          // Default to direct capitalization
          const defaultCapRate = property.capRate || (property.marketData?.capRate || 0.08);
          estimatedValue = netOperatingIncome / defaultCapRate;
      }
      
      // Calculate per unit metrics
      const valuePerSqFt = estimatedValue / property.totalSqFt;
      const valuePerUnit = estimatedValue / property.unitCount;
      
      return {
        propertyId: property.propertyId,
        potentialGrossIncome,
        vacancyLoss,
        effectiveGrossIncome,
        totalOperatingExpenses,
        netOperatingIncome,
        capRate: property.capRate || (property.marketData?.capRate || 0.08),
        estimatedValue,
        valuePerSqFt,
        valuePerUnit,
        grossRentMultiplier,
        expenseRatio,
        operatingExpenseRatio,
        calculationDate: new Date()
      };
    } catch (error) {
      alertService.addAlert({
        title: 'Calculation Error',
        message: 'Failed to calculate income approach summary',
        details: error instanceof Error ? error.message : String(error),
        category: AlertCategory.SYSTEM,
        severity: AlertSeverity.ERROR,
        source: 'IncomeApproachService'
      });
      
      throw error;
    }
  }
  
  /**
   * Perform DCF analysis
   * @param property Income property
   * @param analysisPeriod Analysis period in years
   * @param discountRate Discount rate
   * @param terminalCapRate Terminal capitalization rate
   * @param incomeGrowthRate Annual income growth rate
   * @param expenseGrowthRate Annual expense growth rate
   * @returns DCF analysis
   */
  performDCFAnalysis(
    property: IncomeProperty,
    analysisPeriod: number = 10,
    discountRate: number = 0.10,
    terminalCapRate: number = 0.08,
    incomeGrowthRate: number = 0.02,
    expenseGrowthRate: number = 0.03
  ): DCFAnalysis {
    try {
      // Start with the property's income summary
      const initialSummary = this.calculateIncomeSummary(property);
      
      // Calculate cash flows for each period
      const cashFlows: number[] = [];
      let currentNOI = initialSummary.netOperatingIncome;
      
      for (let year = 1; year <= analysisPeriod; year++) {
        // Increase income by growth rate
        const income = initialSummary.effectiveGrossIncome * Math.pow(1 + incomeGrowthRate, year);
        
        // Increase expenses by growth rate
        const expenses = initialSummary.totalOperatingExpenses * Math.pow(1 + expenseGrowthRate, year);
        
        // Calculate NOI for this period
        const noi = income - expenses;
        
        // Add to cash flows
        cashFlows.push(noi);
        
        // Update current NOI for terminal value calculation
        if (year === analysisPeriod) {
          currentNOI = noi;
        }
      }
      
      // Calculate terminal value using direct capitalization
      const terminalValue = currentNOI / terminalCapRate;
      
      // Calculate present values
      let presentValueOfCashFlows = 0;
      
      for (let i = 0; i < cashFlows.length; i++) {
        const year = i + 1;
        const presentValue = cashFlows[i] / Math.pow(1 + discountRate, year);
        presentValueOfCashFlows += presentValue;
      }
      
      const presentValueOfTerminalValue = terminalValue / Math.pow(1 + discountRate, analysisPeriod);
      
      // Calculate net present value
      const netPresentValue = presentValueOfCashFlows + presentValueOfTerminalValue;
      
      // Calculate IRR (simplified approach)
      // For a full IRR calculation, we would need to use numerical methods
      // This is just an approximation based on the initial investment and final value
      const initialInvestment = property.lastSalePrice || initialSummary.estimatedValue;
      const internalRateOfReturn = Math.pow((netPresentValue / initialInvestment), 1 / analysisPeriod) - 1;
      
      return {
        propertyId: property.propertyId,
        analysisPeriod,
        discountRate,
        terminalCapRate,
        incomeGrowthRate,
        expenseGrowthRate,
        cashFlows,
        terminalValue,
        presentValueOfCashFlows,
        presentValueOfTerminalValue,
        netPresentValue,
        internalRateOfReturn
      };
    } catch (error) {
      alertService.addAlert({
        title: 'DCF Analysis Error',
        message: 'Failed to perform DCF analysis',
        details: error instanceof Error ? error.message : String(error),
        category: AlertCategory.SYSTEM,
        severity: AlertSeverity.ERROR,
        source: 'IncomeApproachService'
      });
      
      throw error;
    }
  }
  
  /**
   * Create or update an income property
   * @param property Income property
   * @returns Updated property
   */
  saveProperty(property: IncomeProperty): IncomeProperty {
    // Ensure property has an ID
    if (!property.propertyId) {
      property.propertyId = crypto.randomUUID();
    }
    
    // Calculate derived values for rental units
    property.rentalUnits = property.rentalUnits.map(unit => ({
      ...unit,
      annualRent: unit.monthlyRent * 12,
      rentPerSqFt: unit.squareFeet > 0 ? unit.monthlyRent / unit.squareFeet : 0
    }));
    
    // Calculate derived values for income streams
    property.incomeStreams = property.incomeStreams.map(stream => ({
      ...stream,
      annualAmount: stream.monthlyAmount * 12
    }));
    
    // Check if property already exists
    const existingIndex = this.incomeProperties.findIndex(p => p.propertyId === property.propertyId);
    
    if (existingIndex >= 0) {
      // Update existing property
      this.incomeProperties[existingIndex] = property;
    } else {
      // Add new property
      this.incomeProperties.push(property);
    }
    
    return property;
  }
  
  /**
   * Get an income property by ID
   * @param propertyId Property ID
   * @returns Income property or undefined
   */
  getPropertyById(propertyId: string): IncomeProperty | undefined {
    return this.incomeProperties.find(p => p.propertyId === propertyId);
  }
  
  /**
   * Get all income properties
   * @returns All income properties
   */
  getAllProperties(): IncomeProperty[] {
    return [...this.incomeProperties];
  }
  
  /**
   * Delete an income property
   * @param propertyId Property ID
   * @returns True if property was deleted
   */
  deleteProperty(propertyId: string): boolean {
    const initialLength = this.incomeProperties.length;
    this.incomeProperties = this.incomeProperties.filter(p => p.propertyId !== propertyId);
    
    // Also remove the property from any groups it's in
    this.incomeGroups = this.incomeGroups.map(group => {
      return {
        ...group,
        properties: group.properties.filter(p => p.propertyId !== propertyId)
      };
    });
    
    return this.incomeProperties.length < initialLength;
  }
  
  /**
   * Create or update an income approach group
   * @param group Income approach group
   * @returns Updated group
   */
  saveGroup(group: IncomeApproachGroup): IncomeApproachGroup {
    // Ensure group has an ID
    if (!group.groupId) {
      group.groupId = crypto.randomUUID();
    }
    
    // Set creation and update dates
    if (!group.creationDate) {
      group.creationDate = new Date();
    }
    
    group.lastUpdated = new Date();
    
    // Check if group already exists
    const existingIndex = this.incomeGroups.findIndex(g => g.groupId === group.groupId);
    
    if (existingIndex >= 0) {
      // Update existing group
      this.incomeGroups[existingIndex] = group;
    } else {
      // Add new group
      this.incomeGroups.push(group);
    }
    
    return group;
  }
  
  /**
   * Get an income approach group by ID
   * @param groupId Group ID
   * @returns Income approach group or undefined
   */
  getGroupById(groupId: string): IncomeApproachGroup | undefined {
    return this.incomeGroups.find(g => g.groupId === groupId);
  }
  
  /**
   * Get all income approach groups
   * @returns All income approach groups
   */
  getAllGroups(): IncomeApproachGroup[] {
    return [...this.incomeGroups];
  }
  
  /**
   * Delete an income approach group
   * @param groupId Group ID
   * @returns True if group was deleted
   */
  deleteGroup(groupId: string): boolean {
    const initialLength = this.incomeGroups.length;
    this.incomeGroups = this.incomeGroups.filter(g => g.groupId !== groupId);
    return this.incomeGroups.length < initialLength;
  }
  
  /**
   * Add a property to a group
   * @param groupId Group ID
   * @param propertyId Property ID
   * @returns Updated group or undefined if not found
   */
  addPropertyToGroup(groupId: string, propertyId: string): IncomeApproachGroup | undefined {
    const group = this.getGroupById(groupId);
    const property = this.getPropertyById(propertyId);
    
    if (!group || !property) {
      return undefined;
    }
    
    // Check if property is already in the group
    if (group.properties.some(p => p.propertyId === propertyId)) {
      return group;
    }
    
    // Add property to group
    const updatedGroup: IncomeApproachGroup = {
      ...group,
      properties: [...group.properties, property],
      lastUpdated: new Date()
    };
    
    return this.saveGroup(updatedGroup);
  }
  
  /**
   * Remove a property from a group
   * @param groupId Group ID
   * @param propertyId Property ID
   * @returns Updated group or undefined if not found
   */
  removePropertyFromGroup(groupId: string, propertyId: string): IncomeApproachGroup | undefined {
    const group = this.getGroupById(groupId);
    
    if (!group) {
      return undefined;
    }
    
    // Remove property from group
    const updatedGroup: IncomeApproachGroup = {
      ...group,
      properties: group.properties.filter(p => p.propertyId !== propertyId),
      lastUpdated: new Date()
    };
    
    return this.saveGroup(updatedGroup);
  }
  
  /**
   * Create or update market data
   * @param marketData Market data
   * @returns Updated market data
   */
  saveMarketData(marketData: MarketData): MarketData {
    // Check if market data already exists
    const existingIndex = this.marketDataSets.findIndex(
      md => md.marketName === marketData.marketName && 
            md.propertyType === marketData.propertyType &&
            md.dataYear === marketData.dataYear
    );
    
    if (existingIndex >= 0) {
      // Update existing market data
      this.marketDataSets[existingIndex] = marketData;
    } else {
      // Add new market data
      this.marketDataSets.push(marketData);
    }
    
    return marketData;
  }
  
  /**
   * Get market data
   * @param marketName Market name
   * @param propertyType Property type
   * @param dataYear Data year
   * @returns Market data or undefined
   */
  getMarketData(
    marketName: string, 
    propertyType: string, 
    dataYear: number
  ): MarketData | undefined {
    return this.marketDataSets.find(
      md => md.marketName === marketName && 
            md.propertyType === propertyType &&
            md.dataYear === dataYear
    );
  }
  
  /**
   * Get all market data
   * @returns All market data
   */
  getAllMarketData(): MarketData[] {
    return [...this.marketDataSets];
  }
  
  /**
   * Calculate comparative property performance
   * @param groupId Group ID
   * @returns Property comparisons with rankings
   */
  calculateComparativePerformance(groupId: string): any[] {
    const group = this.getGroupById(groupId);
    
    if (!group || group.properties.length === 0) {
      return [];
    }
    
    // Calculate income summaries for all properties
    const summaries = group.properties.map(property => ({
      property,
      summary: this.calculateIncomeSummary(property)
    }));
    
    // Calculate performance metrics
    return summaries.map(({ property, summary }) => ({
      propertyId: property.propertyId,
      propertyName: property.propertyName,
      address: property.address,
      totalSqFt: property.totalSqFt,
      unitCount: property.unitCount,
      
      netOperatingIncome: summary.netOperatingIncome,
      noiPerSqFt: summary.netOperatingIncome / property.totalSqFt,
      noiPerUnit: summary.netOperatingIncome / property.unitCount,
      
      capRate: summary.capRate,
      expenseRatio: summary.expenseRatio,
      valuePerSqFt: summary.valuePerSqFt,
      valuePerUnit: summary.valuePerUnit,
      
      // Calculate percentile rankings within the group
      rankings: {
        noiRank: this.calculatePercentileRank(summaries, 'netOperatingIncome', property.propertyId),
        noiPerSqFtRank: this.calculatePercentileRank(summaries, 'noiPerSqFt', property.propertyId),
        noiPerUnitRank: this.calculatePercentileRank(summaries, 'noiPerUnit', property.propertyId),
        capRateRank: this.calculatePercentileRank(summaries, 'capRate', property.propertyId),
        expenseRatioRank: this.calculatePercentileRank(summaries, 'expenseRatio', property.propertyId, true), // Lower is better
        valuePerSqFtRank: this.calculatePercentileRank(summaries, 'valuePerSqFt', property.propertyId),
        valuePerUnitRank: this.calculatePercentileRank(summaries, 'valuePerUnit', property.propertyId)
      }
    }));
  }
  
  /**
   * Calculate percentile rank for a property within a group
   * @param summaries Property summaries
   * @param metric Metric to rank by
   * @param propertyId Property ID
   * @param inversed Whether lower values are better
   * @returns Percentile rank (0-100)
   */
  private calculatePercentileRank(
    summaries: { property: IncomeProperty; summary: IncomeApproachSummary }[],
    metric: string,
    propertyId: string,
    inversed: boolean = false
  ): number {
    // Create a copy and sort by the metric
    const sorted = [...summaries].sort((a, b) => {
      const aValue = this.getMetricValue(a, metric);
      const bValue = this.getMetricValue(b, metric);
      
      return inversed 
        ? aValue - bValue // Lower is better (e.g., expense ratio)
        : bValue - aValue; // Higher is better (e.g., NOI)
    });
    
    // Find the position of the property
    const position = sorted.findIndex(item => item.property.propertyId === propertyId);
    
    if (position === -1) {
      return 0;
    }
    
    // Calculate percentile rank
    return Math.round((position / (sorted.length - 1)) * 100);
  }
  
  /**
   * Get a metric value from a property summary
   * @param data Property summary data
   * @param metric Metric name
   * @returns Metric value
   */
  private getMetricValue(
    data: { property: IncomeProperty; summary: IncomeApproachSummary },
    metric: string
  ): number {
    if (metric === 'noiPerSqFt') {
      return data.summary.netOperatingIncome / data.property.totalSqFt;
    }
    
    if (metric === 'noiPerUnit') {
      return data.summary.netOperatingIncome / data.property.unitCount;
    }
    
    return (data.summary as any)[metric] || 0;
  }
  
  /**
   * Adjust property value based on comparison factors
   * @param propertyId Base property ID
   * @param comparableId Comparable property ID
   * @param adjustmentFactors Adjustment factors
   * @returns Adjusted value
   */
  adjustPropertyValue(
    propertyId: string, 
    comparableId: string, 
    adjustmentFactors: AdjustmentFactors
  ): number {
    const baseProperty = this.getPropertyById(propertyId);
    const comparableProperty = this.getPropertyById(comparableId);
    
    if (!baseProperty || !comparableProperty) {
      throw new Error('Properties not found');
    }
    
    // Calculate base and comparable summaries
    const baseSummary = this.calculateIncomeSummary(baseProperty);
    const comparableSummary = this.calculateIncomeSummary(comparableProperty);
    
    // Calculate total adjustment factor
    const totalAdjustment = 
      adjustmentFactors.locationFactor * 
      adjustmentFactors.conditionFactor * 
      adjustmentFactors.amenitiesFactor * 
      adjustmentFactors.ageFactor * 
      adjustmentFactors.sizeFactor * 
      adjustmentFactors.parkingFactor * 
      adjustmentFactors.qualityFactor;
    
    // Apply adjustment to comparable value
    return comparableSummary.estimatedValue * totalAdjustment;
  }
}

// Export a singleton instance
export const incomeApproachService = new IncomeApproachService();
export default incomeApproachService;