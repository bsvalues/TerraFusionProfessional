import { Property } from '@shared/schema';

export interface PropertyOutlier {
  property: Property;
  outlierScore: number;
  outlierType: 'value' | 'size' | 'age' | 'pricePerSqFt' | 'spatial';
  reason: string;
  zScore: number;
}

export interface SpatialOutlier extends PropertyOutlier {
  spatialDiscrepancy: number;
  neighborhoodAverage: number;
  neighborhoodStdDev: number;
}

/**
 * Service for detecting outlier properties using statistical methods
 */
export class OutlierDetectionService {
  // Z-score threshold for determining outliers
  private readonly OUTLIER_THRESHOLD = 2.5;
  
  /**
   * Detect value outliers across all properties using z-score method
   */
  public detectValueOutliers(properties: Property[]): PropertyOutlier[] {
    if (!properties.length) return [];
    
    const outliers: PropertyOutlier[] = [];
    
    // Check for value outliers
    outliers.push(...this.detectOutliersForAttribute(properties, 'value'));
    
    // Check for size outliers
    outliers.push(...this.detectOutliersForAttribute(properties, 'squareFeet'));
    
    // Check for age outliers using yearBuilt
    outliers.push(...this.detectOutliersForAttribute(properties, 'yearBuilt'));
    
    // Check for price per square foot outliers
    const pricePerSqFtOutliers = this.detectPricePerSqFtOutliers(properties);
    outliers.push(...pricePerSqFtOutliers);
    
    return outliers;
  }
  
  /**
   * Detect spatial outliers - properties whose values don't align with nearby properties
   */
  public detectSpatialOutliers(properties: Property[]): SpatialOutlier[] {
    const outliers: SpatialOutlier[] = [];
    const currentYear = new Date().getFullYear();
    
    // Group properties by neighborhood
    const neighborhoodGroups = this.groupPropertiesByNeighborhood(properties);
    
    // For each neighborhood, identify properties that don't fit neighborhood patterns
    Object.entries(neighborhoodGroups).forEach(([neighborhood, neighborhoodProperties]) => {
      if (neighborhoodProperties.length < 5) return; // Skip neighborhoods with too few properties
      
      // Calculate neighborhood averages for key metrics
      const valueAvg = this.calculateAverage(neighborhoodProperties, 'value');
      const valueStdDev = this.calculateStandardDeviation(neighborhoodProperties, 'value', valueAvg);
      
      const sizeSqFtAvg = this.calculateAverage(neighborhoodProperties, 'squareFeet');
      const sizeSqFtStdDev = this.calculateStandardDeviation(neighborhoodProperties, 'squareFeet', sizeSqFtAvg);
      
      const ageAvg = this.calculateAverage(
        neighborhoodProperties.filter(p => p.yearBuilt), 
        'yearBuilt'
      );
      const ageStdDev = this.calculateStandardDeviation(
        neighborhoodProperties.filter(p => p.yearBuilt),
        'yearBuilt',
        ageAvg
      );
      
      // Calculate price per sq ft for properties with both value and size
      const propsWithPricePerSqFt = neighborhoodProperties
        .filter(p => this.getPropertyValue(p, 'value') && p.squareFeet)
        .map(p => ({
          ...p,
          pricePerSqFt: this.getPropertyValue(p, 'value') / p.squareFeet!
        }));
      
      const pricePerSqFtAvg = propsWithPricePerSqFt.length ? 
        propsWithPricePerSqFt.reduce((sum, p) => sum + p.pricePerSqFt, 0) / propsWithPricePerSqFt.length : 
        0;
      
      const pricePerSqFtStdDev = propsWithPricePerSqFt.length ? 
        Math.sqrt(
          propsWithPricePerSqFt.reduce((sum, p) => 
            sum + Math.pow(p.pricePerSqFt - pricePerSqFtAvg, 2), 0
          ) / propsWithPricePerSqFt.length
        ) : 
        0;
      
      // Check each property against neighborhood patterns
      neighborhoodProperties.forEach(property => {
        const propertyValue = this.getPropertyValue(property, 'value');
        if (!propertyValue) return;
        
        const valueZScore = Math.abs((propertyValue - valueAvg) / (valueStdDev || 1));
        
        // Check for value outliers within the neighborhood
        if (valueZScore > this.OUTLIER_THRESHOLD) {
          const spatialDiscrepancy = (propertyValue - valueAvg) / valueAvg;
          
          outliers.push({
            property,
            outlierScore: valueZScore,
            outlierType: 'spatial',
            reason: `Value significantly ${propertyValue > valueAvg ? 'higher' : 'lower'} than neighborhood average`,
            zScore: valueZScore,
            spatialDiscrepancy,
            neighborhoodAverage: valueAvg,
            neighborhoodStdDev: valueStdDev
          });
        }
        
        // Check if property has square feet
        if (property.squareFeet) {
          const sizeZScore = Math.abs((property.squareFeet - sizeSqFtAvg) / (sizeSqFtStdDev || 1));
          
          // Check for size outliers within neighborhood
          if (sizeZScore > this.OUTLIER_THRESHOLD) {
            const spatialDiscrepancy = (property.squareFeet - sizeSqFtAvg) / sizeSqFtAvg;
            
            outliers.push({
              property,
              outlierScore: sizeZScore,
              outlierType: 'spatial',
              reason: `Size significantly ${property.squareFeet > sizeSqFtAvg ? 'larger' : 'smaller'} than neighborhood average`,
              zScore: sizeZScore,
              spatialDiscrepancy,
              neighborhoodAverage: sizeSqFtAvg,
              neighborhoodStdDev: sizeSqFtStdDev
            });
          }
        }
        
        // Check if property has year built
        if (property.yearBuilt) {
          const ageZScore = Math.abs((property.yearBuilt - ageAvg) / (ageStdDev || 1));
          
          // Check for age outliers within neighborhood
          if (ageZScore > this.OUTLIER_THRESHOLD) {
            const spatialDiscrepancy = (property.yearBuilt - ageAvg) / ageAvg;
            
            outliers.push({
              property,
              outlierScore: ageZScore,
              outlierType: 'spatial',
              reason: `Age significantly ${property.yearBuilt > ageAvg ? 'newer' : 'older'} than neighborhood average`,
              zScore: ageZScore,
              spatialDiscrepancy,
              neighborhoodAverage: ageAvg,
              neighborhoodStdDev: ageStdDev
            });
          }
        }
        
        // Check for price per sq ft outliers if property has both metrics
        if (property.squareFeet && propertyValue) {
          const propertyPricePerSqFt = propertyValue / property.squareFeet;
          const pricePerSqFtZScore = Math.abs((propertyPricePerSqFt - pricePerSqFtAvg) / (pricePerSqFtStdDev || 1));
          
          if (pricePerSqFtZScore > this.OUTLIER_THRESHOLD) {
            const spatialDiscrepancy = (propertyPricePerSqFt - pricePerSqFtAvg) / pricePerSqFtAvg;
            
            outliers.push({
              property,
              outlierScore: pricePerSqFtZScore,
              outlierType: 'spatial',
              reason: `Price per square foot significantly ${propertyPricePerSqFt > pricePerSqFtAvg ? 'higher' : 'lower'} than neighborhood average`,
              zScore: pricePerSqFtZScore,
              spatialDiscrepancy,
              neighborhoodAverage: pricePerSqFtAvg,
              neighborhoodStdDev: pricePerSqFtStdDev
            });
          }
        }
      });
    });
    
    return outliers;
  }
  
  /**
   * Calculate z-score for a property's attribute compared to a set of properties
   */
  public calculateZScore(property: Property, attribute: keyof Property, allProperties: Property[]): number {
    const propertyValue = this.getPropertyValue(property, attribute);
    if (propertyValue === undefined || propertyValue === null) return 0;
    
    const validProperties = allProperties.filter(p => 
      this.getPropertyValue(p, attribute) !== undefined && 
      this.getPropertyValue(p, attribute) !== null
    );
    
    if (validProperties.length < 2) return 0;
    
    const values = validProperties.map(p => this.getPropertyValue(p, attribute) as number);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    
    if (stdDev === 0) return 0;
    return (propertyValue as number - mean) / stdDev;
  }
  
  /**
   * Detect price per square foot outliers
   */
  private detectPricePerSqFtOutliers(properties: Property[]): PropertyOutlier[] {
    const propertiesWithPricePerSqFt = properties
      .filter(p => this.getPropertyValue(p, 'value') && p.squareFeet && p.squareFeet > 0)
      .map(p => ({
        ...p,
        pricePerSqFt: this.getPropertyValue(p, 'value') / p.squareFeet!
      }));
    
    if (propertiesWithPricePerSqFt.length < 5) return []; // Not enough data points
    
    const pricePerSqFtValues = propertiesWithPricePerSqFt.map(p => p.pricePerSqFt);
    const mean = pricePerSqFtValues.reduce((sum, val) => sum + val, 0) / pricePerSqFtValues.length;
    const stdDev = Math.sqrt(
      pricePerSqFtValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pricePerSqFtValues.length
    );
    
    return propertiesWithPricePerSqFt
      .filter(p => Math.abs((p.pricePerSqFt - mean) / stdDev) > this.OUTLIER_THRESHOLD)
      .map(p => ({
        property: p,
        outlierScore: Math.abs((p.pricePerSqFt - mean) / stdDev),
        outlierType: 'pricePerSqFt',
        reason: `Price per square foot (${p.pricePerSqFt.toFixed(2)}) is significantly ${p.pricePerSqFt > mean ? 'higher' : 'lower'} than average (${mean.toFixed(2)})`,
        zScore: (p.pricePerSqFt - mean) / stdDev
      }));
  }
  
  /**
   * Detect outliers for a specific property attribute 
   */
  private detectOutliersForAttribute(
    properties: Property[], 
    attribute: keyof Property
  ): PropertyOutlier[] {
    // Filter properties that have the attribute
    const propertiesWithAttribute = properties.filter(p => 
      this.getPropertyValue(p, attribute) !== undefined && 
      this.getPropertyValue(p, attribute) !== null
    );
    
    if (propertiesWithAttribute.length < 5) return []; // Not enough data points
    
    // Calculate mean and standard deviation
    const values = propertiesWithAttribute.map(p => this.getPropertyValue(p, attribute) as number);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    
    if (stdDev === 0) return []; // No variation in the data
    
    // Find outliers using z-score
    return propertiesWithAttribute
      .filter(p => {
        const value = this.getPropertyValue(p, attribute) as number;
        const zScore = Math.abs((value - mean) / stdDev);
        return zScore > this.OUTLIER_THRESHOLD;
      })
      .map(p => {
        const value = this.getPropertyValue(p, attribute) as number;
        const zScore = (value - mean) / stdDev;
        const outlierType = this.getOutlierTypeFromAttribute(attribute);
        const attributeLabel = this.getAttributeLabel(attribute);
        
        return {
          property: p,
          outlierScore: Math.abs(zScore),
          outlierType,
          reason: `${attributeLabel} (${value}) is significantly ${zScore > 0 ? 'higher' : 'lower'} than average (${mean.toFixed(2)})`,
          zScore
        };
      });
  }
  
  /**
   * Group properties by neighborhood for spatial outlier detection
   */
  private groupPropertiesByNeighborhood(properties: Property[]): Record<string, Property[]> {
    const neighborhoods: Record<string, Property[]> = {};
    
    properties.forEach(property => {
      if (!property.neighborhood) return;
      
      if (!neighborhoods[property.neighborhood]) {
        neighborhoods[property.neighborhood] = [];
      }
      
      neighborhoods[property.neighborhood].push(property);
    });
    
    return neighborhoods;
  }
  
  /**
   * Calculate average for a property attribute
   */
  private calculateAverage(properties: Property[], attribute: keyof Property): number {
    if (!properties.length) return 0;
    
    const validProperties = properties.filter(p => 
      this.getPropertyValue(p, attribute) !== undefined && 
      this.getPropertyValue(p, attribute) !== null
    );
    
    if (!validProperties.length) return 0;
    
    const sum = validProperties.reduce((total, property) => 
      total + (this.getPropertyValue(property, attribute) as number), 0
    );
    
    return sum / validProperties.length;
  }
  
  /**
   * Calculate standard deviation for a property attribute
   */
  private calculateStandardDeviation(
    properties: Property[], 
    attribute: keyof Property, 
    mean: number
  ): number {
    if (!properties.length) return 0;
    
    const validProperties = properties.filter(p => 
      this.getPropertyValue(p, attribute) !== undefined && 
      this.getPropertyValue(p, attribute) !== null
    );
    
    if (!validProperties.length) return 0;
    
    const squaredDifferences = validProperties.reduce((total, property) => {
      const value = this.getPropertyValue(property, attribute) as number;
      return total + Math.pow(value - mean, 2);
    }, 0);
    
    return Math.sqrt(squaredDifferences / validProperties.length);
  }
  
  /**
   * Safely get a property's value, handling string values that contain numbers
   */
  private getPropertyValue(property: Property, attribute: keyof Property): number | undefined {
    const value = property[attribute];
    
    if (value === undefined || value === null) return undefined;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Handle currency strings like "$250,000"
      return parseFloat(value.replace(/[^0-9.-]+/g, '')) || undefined;
    }
    
    return undefined;
  }
  
  /**
   * Convert attribute name to appropriate outlier type
   */
  private getOutlierTypeFromAttribute(attribute: keyof Property): PropertyOutlier['outlierType'] {
    switch(attribute) {
      case 'value':
      case 'salePrice':
      case 'landValue':
      case 'taxAssessment':
        return 'value';
      case 'squareFeet':
      case 'lotSize':
        return 'size';
      case 'yearBuilt':
        return 'age';
      default:
        return 'value';
    }
  }
  
  /**
   * Get a human-readable label for a property attribute
   */
  private getAttributeLabel(attribute: keyof Property): string {
    switch(attribute) {
      case 'value': return 'Property value';
      case 'salePrice': return 'Sale price';
      case 'landValue': return 'Land value';
      case 'taxAssessment': return 'Tax assessment';
      case 'squareFeet': return 'Square footage';
      case 'lotSize': return 'Lot size';
      case 'yearBuilt': return 'Year built';
      default: return attribute.toString();
    }
  }
}

// Export a singleton instance
export const outlierDetectionService = new OutlierDetectionService();