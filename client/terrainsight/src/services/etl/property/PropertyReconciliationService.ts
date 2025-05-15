import { Property } from '@shared/schema';
import { PropertyDataConnector } from './PropertyDataConnector';

/**
 * Represents a value from a specific data source
 */
export interface FieldValueWithSource {
  value: any;
  sourceId: string;
}

/**
 * Represents a conflict for a specific property field
 */
export interface FieldConflict {
  fieldName: string;
  values: FieldValueWithSource[];
  resolved: boolean;
  selectedValue?: any;
  selectedSourceId?: string;
}

/**
 * Represents a property with conflicts between data sources
 */
export interface PropertyConflict {
  propertyId: string;
  parcelId: string;
  sourceIds: string[];
  conflicts: FieldConflict[];
}

/**
 * Options for reconciling property data from different sources
 */
export interface PropertyReconciliationOptions {
  // Default source priority (in order of precedence)
  defaultSourcePriority?: string[];
  
  // Field-specific merge strategies
  fieldPriorities?: {
    [field: string]: {
      // Source priority for this specific field (overrides default)
      sourcePriority?: string[];
      // Take the newest value (for date-based fields)
      newest?: boolean;
      // Take the highest value (for numeric fields like price)
      highest?: boolean;
      // Take the lowest value (for numeric fields)
      lowest?: boolean;
      // Take the value with most data (for fields like address)
      mostComplete?: boolean;
    };
  };
  
  // Whether to force merge properties even if conflicts are unresolved
  forceMerge?: boolean;
}

/**
 * Service for reconciling property data from different sources
 */
export class PropertyReconciliationService {
  // Object map of registered data connectors by source ID
  private dataConnectors: Record<string, PropertyDataConnector> = {};
  
  /**
   * Register a data connector with the service
   */
  registerDataConnector(connector: PropertyDataConnector): void {
    this.dataConnectors[connector.metadata.id] = connector;
  }
  
  /**
   * Get a data connector by source ID
   */
  getDataConnector(sourceId: string): PropertyDataConnector | undefined {
    return this.dataConnectors[sourceId];
  }
  
  /**
   * Find conflicts between property data from different sources
   */
  findConflicts(
    propertiesBySource: { [sourceId: string]: Property[] },
    options: PropertyReconciliationOptions
  ): PropertyConflict[] {
    const conflicts: PropertyConflict[] = [];
    
    // Get all unique parcel IDs
    const parcelIds = new Set<string>();
    Object.values(propertiesBySource).forEach(properties => {
      properties.forEach(property => {
        if (property.parcelId) {
          parcelIds.add(property.parcelId);
        }
      });
    });
    
    // Process each parcel ID
    parcelIds.forEach(parcelId => {
      // Get all properties with this parcel ID from all sources
      const propertiesWithParcelId: { [sourceId: string]: Property } = {};
      Object.entries(propertiesBySource).forEach(([sourceId, properties]) => {
        const property = properties.find(p => p.parcelId === parcelId);
        if (property) {
          propertiesWithParcelId[sourceId] = property;
        }
      });
      
      // If we have this property from multiple sources, check for conflicts
      const sourceIds = Object.keys(propertiesWithParcelId);
      if (sourceIds.length > 1) {
        // Create a new conflict object
        const conflict: PropertyConflict = {
          propertyId: parcelId,
          parcelId: parcelId,
          sourceIds: sourceIds,
          conflicts: []
        };
        
        // Get all fields that are present in at least one property
        const allFields = new Set<string>();
        Object.values(propertiesWithParcelId).forEach(property => {
          Object.keys(property).forEach(key => {
            // Don't include id and sourceId fields in conflict detection
            if (key !== 'id' && key !== 'sourceId') {
              allFields.add(key);
            }
          });
        });
        
        // Check for conflicts in each field
        allFields.forEach(fieldName => {
          const valuesWithSources: FieldValueWithSource[] = [];
          
          // Get values for this field from all sources
          Object.entries(propertiesWithParcelId).forEach(([sourceId, property]) => {
            // @ts-ignore - We're dynamically accessing a property
            const value = property[fieldName];
            
            // Only include defined values
            if (value !== undefined && value !== null) {
              valuesWithSources.push({
                value,
                sourceId
              });
            }
          });
          
          // If we have values from multiple sources, check if they match
          if (valuesWithSources.length > 1) {
            // Check if all values are the same
            const firstValue = valuesWithSources[0].value;
            const allSame = valuesWithSources.every(vs => 
              this.areValuesEqual(vs.value, firstValue)
            );
            
            // If not all values are the same, we have a conflict
            if (!allSame) {
              conflict.conflicts.push({
                fieldName,
                values: valuesWithSources,
                resolved: false
              });
            }
          }
        });
        
        // Only add the conflict if there are actual conflicts
        if (conflict.conflicts.length > 0) {
          conflicts.push(conflict);
        }
      }
    });
    
    return conflicts;
  }
  
  /**
   * Check if two values are equal
   */
  private areValuesEqual(value1: any, value2: any): boolean {
    if (typeof value1 !== typeof value2) {
      return false;
    }
    
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase() === value2.toLowerCase();
    }
    
    return value1 === value2;
  }
  
  /**
   * Resolve a conflict field with a specific value
   */
  resolveConflictField(
    conflict: PropertyConflict,
    fieldName: string,
    value: any,
    sourceId: string
  ): PropertyConflict {
    // Create a copy of the conflict
    const updatedConflict = { ...conflict };
    
    // Find the conflict field
    const fieldConflictIndex = conflict.conflicts.findIndex(fc => fc.fieldName === fieldName);
    if (fieldConflictIndex === -1) {
      return conflict;
    }
    
    // Update the conflict field
    updatedConflict.conflicts = [...conflict.conflicts];
    updatedConflict.conflicts[fieldConflictIndex] = {
      ...conflict.conflicts[fieldConflictIndex],
      resolved: true,
      selectedValue: value,
      selectedSourceId: sourceId
    };
    
    return updatedConflict;
  }
  
  /**
   * Automatically resolve a conflict based on reconciliation options
   */
  autoResolveConflict(
    conflict: PropertyConflict,
    options: PropertyReconciliationOptions
  ): PropertyConflict {
    // Create a copy of the conflict
    const resolvedConflict = { ...conflict, conflicts: [...conflict.conflicts] };
    
    // Resolve each conflict field
    resolvedConflict.conflicts = resolvedConflict.conflicts.map(fieldConflict => {
      // If already resolved, skip
      if (fieldConflict.resolved) {
        return fieldConflict;
      }
      
      // Get the reconciliation strategy for this field
      const fieldStrategy = options.fieldPriorities?.[fieldConflict.fieldName];
      
      // Try to resolve using field-specific source priority
      if (fieldStrategy?.sourcePriority) {
        const resolution = this.resolveBySourcePriority(
          fieldConflict,
          fieldStrategy.sourcePriority
        );
        if (resolution) {
          return resolution;
        }
      }
      
      // Try to resolve using highest value strategy
      if (fieldStrategy?.highest) {
        const resolution = this.resolveByHighestValue(fieldConflict);
        if (resolution) {
          return resolution;
        }
      }
      
      // Try to resolve using lowest value strategy
      if (fieldStrategy?.lowest) {
        const resolution = this.resolveByLowestValue(fieldConflict);
        if (resolution) {
          return resolution;
        }
      }
      
      // Try to resolve using most complete strategy
      if (fieldStrategy?.mostComplete) {
        const resolution = this.resolveByMostComplete(fieldConflict);
        if (resolution) {
          return resolution;
        }
      }
      
      // Try to resolve using default source priority
      if (options.defaultSourcePriority) {
        const resolution = this.resolveBySourcePriority(
          fieldConflict,
          options.defaultSourcePriority
        );
        if (resolution) {
          return resolution;
        }
      }
      
      // If we couldn't resolve the conflict, return it unchanged
      return fieldConflict;
    });
    
    return resolvedConflict;
  }
  
  /**
   * Resolve a field conflict based on source priority
   */
  private resolveBySourcePriority(
    fieldConflict: FieldConflict,
    sourcePriority: string[]
  ): FieldConflict | null {
    // Find the value from the highest priority source
    for (const sourceId of sourcePriority) {
      const valueWithSource = fieldConflict.values.find(vs => vs.sourceId === sourceId);
      if (valueWithSource) {
        return {
          ...fieldConflict,
          resolved: true,
          selectedValue: valueWithSource.value,
          selectedSourceId: sourceId
        };
      }
    }
    
    return null;
  }
  
  /**
   * Resolve a field conflict by taking the highest value
   */
  private resolveByHighestValue(fieldConflict: FieldConflict): FieldConflict | null {
    // Only works for numeric fields
    const numericValues = fieldConflict.values
      .filter(vs => typeof vs.value === 'number' || !isNaN(parseFloat(vs.value)))
      .map(vs => ({
        ...vs,
        numericValue: typeof vs.value === 'number' ? vs.value : parseFloat(vs.value)
      }));
    
    if (numericValues.length === 0) {
      return null;
    }
    
    // Find the highest value
    const highest = numericValues.reduce((max, current) => 
      current.numericValue > max.numericValue ? current : max
    , numericValues[0]);
    
    return {
      ...fieldConflict,
      resolved: true,
      selectedValue: highest.value,
      selectedSourceId: highest.sourceId
    };
  }
  
  /**
   * Resolve a field conflict by taking the lowest value
   */
  private resolveByLowestValue(fieldConflict: FieldConflict): FieldConflict | null {
    // Only works for numeric fields
    const numericValues = fieldConflict.values
      .filter(vs => typeof vs.value === 'number' || !isNaN(parseFloat(vs.value)))
      .map(vs => ({
        ...vs,
        numericValue: typeof vs.value === 'number' ? vs.value : parseFloat(vs.value)
      }));
    
    if (numericValues.length === 0) {
      return null;
    }
    
    // Find the lowest value
    const lowest = numericValues.reduce((min, current) => 
      current.numericValue < min.numericValue ? current : min
    , numericValues[0]);
    
    return {
      ...fieldConflict,
      resolved: true,
      selectedValue: lowest.value,
      selectedSourceId: lowest.sourceId
    };
  }
  
  /**
   * Resolve a field conflict by taking the most complete value
   */
  private resolveByMostComplete(fieldConflict: FieldConflict): FieldConflict | null {
    // Only works for string fields
    const stringValues = fieldConflict.values.filter(vs => typeof vs.value === 'string');
    
    if (stringValues.length === 0) {
      return null;
    }
    
    // Find the longest string (assuming it's the most complete)
    const mostComplete = stringValues.reduce((max, current) => 
      current.value.length > max.value.length ? current : max
    , stringValues[0]);
    
    return {
      ...fieldConflict,
      resolved: true,
      selectedValue: mostComplete.value,
      selectedSourceId: mostComplete.sourceId
    };
  }
  
  /**
   * Merge properties based on resolved conflicts
   */
  mergeProperties(
    conflicts: PropertyConflict[],
    options: PropertyReconciliationOptions
  ): Property[] {
    const mergedProperties: Property[] = [];
    
    // Process each conflict
    conflicts.forEach(conflict => {
      // Skip conflicts that aren't fully resolved unless forceMerge is enabled
      if (!conflict.conflicts.every(fc => fc.resolved) && !options.forceMerge) {
        return;
      }
      
      // Start with a base property from the highest priority source
      let baseSourceId: string | undefined;
      if (options.defaultSourcePriority && options.defaultSourcePriority.length > 0) {
        // Find the first source that has this property
        for (const sourceId of options.defaultSourcePriority) {
          if (conflict.sourceIds.includes(sourceId)) {
            baseSourceId = sourceId;
            break;
          }
        }
      }
      
      // If we couldn't find a base source, use the first one
      if (!baseSourceId && conflict.sourceIds.length > 0) {
        baseSourceId = conflict.sourceIds[0];
      }
      
      // Create the merged property
      const mergedProperty: Partial<Property> = {
        parcelId: conflict.parcelId,
        sourceId: 'merged'
      };
      
      // Apply all resolved conflict fields
      conflict.conflicts.forEach(fc => {
        if (fc.resolved && fc.selectedValue !== undefined) {
          // @ts-ignore - We're dynamically setting a property
          mergedProperty[fc.fieldName] = fc.selectedValue;
        }
      });
      
      // Add to the list of merged properties
      mergedProperties.push(mergedProperty as Property);
    });
    
    return mergedProperties;
  }
}

// Export a singleton instance
export const propertyReconciliationService = new PropertyReconciliationService();