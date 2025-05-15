import { ETLJob, TransformationRule } from './ETLTypes';

/**
 * OptimizationService provides functionality for optimizing ETL pipelines
 */
class OptimizationService {
  /**
   * Analyze an ETL job and provide optimization suggestions
   */
  analyzeJob(job: ETLJob, transformationRules: TransformationRule[]): OptimizationSuggestion[] {
    console.log(`Analyzing job for optimization: ${job.name}`);
    
    const suggestions: OptimizationSuggestion[] = [];
    
    // Only analyze enabled jobs
    if (!job.enabled) {
      return [];
    }
    
    // Filter rules that are part of this job
    const jobRules = transformationRules.filter(rule => 
      job.transformations.includes(rule.id)
    );
    
    if (jobRules.length === 0) {
      return [];
    }
    
    // Sort rules by order
    const sortedRules = [...jobRules].sort((a, b) => a.order - b.order);
    
    // Check for inefficient rule ordering
    const orderingSuggestions = this.analyzeRuleOrdering(sortedRules);
    
    // Check for redundant rules
    const redundancySuggestions = this.analyzeRedundantRules(sortedRules);
    
    // Check for potential performance optimizations
    const performanceSuggestions = this.analyzePerformance(sortedRules);
    
    // Combine and adapt all suggestions to match the expected interface
    const allSuggestions = [
      ...orderingSuggestions,
      ...redundancySuggestions,
      ...performanceSuggestions
    ];
    
    // Convert to final OptimizationSuggestion format
    return allSuggestions.map((suggestion, index) => {
      let severity: SuggestionSeverity;
      switch (suggestion.impact) {
        case 'high':
          severity = SuggestionSeverity.HIGH;
          break;
        case 'medium':
          severity = SuggestionSeverity.MEDIUM;
          break;
        default:
          severity = SuggestionSeverity.LOW;
      }
      
      let category: SuggestionCategory;
      switch (suggestion.type) {
        case 'PERFORMANCE':
          category = SuggestionCategory.PERFORMANCE;
          break;
        case 'RULE_ORDERING':
        case 'RULE_CONSOLIDATION':
          category = SuggestionCategory.STRUCTURE;
          break;
        case 'REDUNDANT_RULE':
        case 'EXCESSIVE_TRANSFORMS':
          category = SuggestionCategory.QUALITY;
          break;
        default:
          category = SuggestionCategory.RELIABILITY;
      }
      
      return {
        id: `${job.id}-suggestion-${index + 1}`,
        jobId: job.id,
        title: suggestion.description,
        description: suggestion.description,
        details: suggestion.details,
        type: suggestion.type,
        impact: suggestion.impact,
        severity,
        category,
        recommendation: suggestion.details,
        actionable: suggestion.action !== undefined,
        action: suggestion.action
      };
    });
  }
  
  /**
   * Analyze rule ordering for inefficiencies
   */
  private analyzeRuleOrdering(rules: TransformationRule[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Check if filters are applied early
    const filterRules = rules.filter(rule => rule.type === 'FILTER');
    
    if (filterRules.length > 0) {
      const firstFilterIndex = rules.findIndex(rule => rule.type === 'FILTER');
      const rulesBefore = rules.slice(0, firstFilterIndex);
      
      // If there are complex transformations before filters, suggest reordering
      const complexRulesBefore = rulesBefore.filter(rule => 
        ['JOIN', 'AGGREGATE', 'GROUP', 'GROUP_BY'].includes(rule.type)
      );
      
      if (complexRulesBefore.length > 0) {
        suggestions.push({
          type: 'RULE_ORDERING',
          description: 'Move filter operations before complex transformations',
          impact: 'high',
          details: 'Applying filters early reduces the amount of data processed by more expensive operations',
          action: {
            type: 'REORDER_RULES',
            parameters: {
              rulesToMove: filterRules.map(rule => rule.id),
              targetPosition: 'start'
            }
          }
        });
      }
    }
    
    // Check if column dropping is done early
    const dropColumnRules = rules.filter(rule => rule.type === 'DROP_COLUMN');
    
    if (dropColumnRules.length > 0) {
      const firstDropIndex = rules.findIndex(rule => rule.type === 'DROP_COLUMN');
      const rulesBefore = rules.slice(0, firstDropIndex);
      
      // If there are many transformations before dropping columns, suggest reordering
      if (rulesBefore.length > 2) {
        suggestions.push({
          type: 'RULE_ORDERING',
          description: 'Drop unused columns earlier in the pipeline',
          impact: 'medium',
          details: 'Dropping columns early reduces memory usage and processing time',
          action: {
            type: 'REORDER_RULES',
            parameters: {
              rulesToMove: dropColumnRules.map(rule => rule.id),
              targetPosition: 'start'
            }
          }
        });
      }
    }
    
    // Check for consecutive similar operations that could be combined
    const ruleTypes = rules.map(rule => rule.type);
    let consecutiveSimilarOps = [];
    
    for (let i = 0; i < ruleTypes.length - 1; i++) {
      if (ruleTypes[i] === ruleTypes[i + 1]) {
        if (consecutiveSimilarOps.length === 0 || !consecutiveSimilarOps.includes(i)) {
          consecutiveSimilarOps.push(i, i + 1);
        } else {
          consecutiveSimilarOps.push(i + 1);
        }
      } else if (consecutiveSimilarOps.length > 0) {
        // Process the group
        const type = ruleTypes[consecutiveSimilarOps[0]];
        const affectedRules = consecutiveSimilarOps.map(idx => rules[idx]);
        
        if (this.canCombineRules(type)) {
          suggestions.push({
            type: 'RULE_CONSOLIDATION',
            description: `Combine ${consecutiveSimilarOps.length} consecutive ${type} operations`,
            impact: 'medium',
            details: 'Combining similar operations reduces pipeline complexity and improves performance',
            action: {
              type: 'COMBINE_RULES',
              parameters: {
                ruleIds: affectedRules.map(rule => rule.id),
                operation: type
              }
            }
          });
        }
        
        // Reset for next group
        consecutiveSimilarOps = [];
      }
    }
    
    // Process any remaining group
    if (consecutiveSimilarOps.length > 0) {
      const type = ruleTypes[consecutiveSimilarOps[0]];
      const affectedRules = consecutiveSimilarOps.map(idx => rules[idx]);
      
      if (this.canCombineRules(type)) {
        suggestions.push({
          type: 'RULE_CONSOLIDATION',
          description: `Combine ${consecutiveSimilarOps.length} consecutive ${type} operations`,
          impact: 'medium',
          details: 'Combining similar operations reduces pipeline complexity and improves performance',
          action: {
            type: 'COMBINE_RULES',
            parameters: {
              ruleIds: affectedRules.map(rule => rule.id),
              operation: type
            }
          }
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Determine if a rule type can be combined
   */
  private canCombineRules(type: string): boolean {
    const combinableTypes = [
      'FILTER',
      'MAP',
      'RENAME_COLUMN',
      'DROP_COLUMN',
      'REPLACE_VALUE',
      'FILL_NULL',
      'TO_UPPERCASE',
      'TO_LOWERCASE',
      'TRIM'
    ];
    
    return combinableTypes.includes(type);
  }
  
  /**
   * Analyze for redundant rules
   */
  private analyzeRedundantRules(rules: TransformationRule[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Check for operations that might be negated or redundant
    for (let i = 0; i < rules.length; i++) {
      const currentRule = rules[i];
      
      // Look for later rules that might negate or supersede this one
      for (let j = i + 1; j < rules.length; j++) {
        const laterRule = rules[j];
        
        if (this.rulesConflict(currentRule, laterRule)) {
          suggestions.push({
            type: 'REDUNDANT_RULE',
            description: `Rule '${currentRule.name}' may be redundant or negated by '${laterRule.name}'`,
            impact: 'medium',
            details: `Check if the operation in rule #${currentRule.id} is later overwritten or negated by rule #${laterRule.id}`,
            action: {
              type: 'REVIEW_RULES',
              parameters: {
                ruleIds: [currentRule.id, laterRule.id]
              }
            }
          });
          
          // Only report one conflict per rule to avoid overwhelming
          break;
        }
      }
    }
    
    // Check for duplicate column transforms
    const columnTransforms: Record<string, TransformationRule[]> = {};
    
    for (const rule of rules) {
      const config = rule.config;
      let targetColumns: string[] = [];
      
      // Extract target columns based on rule type
      switch (rule.type) {
        case 'RENAME_COLUMN':
          if (config.renameMappings) {
            targetColumns = Object.values(config.renameMappings) as string[];
          }
          break;
        
        case 'MAP':
        case 'MAP_VALUES':
          if (config.mappings) {
            targetColumns = config.mappings
              .filter((m: any) => m.target)
              .map((m: any) => m.target);
          }
          break;
        
        default:
          if (config.targetColumn) {
            targetColumns = [config.targetColumn];
          } else if (config.column) {
            targetColumns = [config.column];
          }
      }
      
      // Group rules by target column
      for (const column of targetColumns) {
        if (!columnTransforms[column]) {
          columnTransforms[column] = [];
        }
        
        columnTransforms[column].push(rule);
      }
    }
    
    // Check for columns with multiple transformations
    for (const [column, transforms] of Object.entries(columnTransforms)) {
      if (transforms.length > 2) {
        suggestions.push({
          type: 'EXCESSIVE_TRANSFORMS',
          description: `Column '${column}' is transformed ${transforms.length} times`,
          impact: 'medium',
          details: 'Multiple transformations on the same column may indicate inefficient pipeline design',
          action: {
            type: 'CONSOLIDATE_TRANSFORMS',
            parameters: {
              column,
              ruleIds: transforms.map(rule => rule.id)
            }
          }
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Check if two rules conflict (second rule negates or supersedes first)
   */
  private rulesConflict(rule1: TransformationRule, rule2: TransformationRule): boolean {
    // Direct conflicts
    const directConflicts: [string, string][] = [
      ['TO_UPPERCASE', 'TO_LOWERCASE'],
      ['TO_LOWERCASE', 'TO_UPPERCASE'],
      ['ADD', 'SUBTRACT'],
      ['SUBTRACT', 'ADD'],
      ['MULTIPLY', 'DIVIDE'],
      ['DIVIDE', 'MULTIPLY']
    ];
    
    // Check for direct type conflicts
    for (const [type1, type2] of directConflicts) {
      if (rule1.type === type1 && rule2.type === type2) {
        const config1 = rule1.config;
        const config2 = rule2.config;
        
        // Check if they operate on the same columns
        const column1 = config1.column || (config1.columns && config1.columns[0]);
        const column2 = config2.column || (config2.columns && config2.columns[0]);
        
        if (column1 === column2) {
          return true;
        }
      }
    }
    
    // Check for redundant operations
    if (rule1.type === rule2.type) {
      switch (rule1.type) {
        case 'CAST_TYPE':
          // Same column cast to same type
          return this.columnsOverlap(rule1.config, rule2.config);
        
        case 'TRIM':
        case 'TO_UPPERCASE':
        case 'TO_LOWERCASE':
          // Same column transformed twice with same operation
          return this.columnsOverlap(rule1.config, rule2.config);
        
        case 'DROP_COLUMN':
          // Dropping a column that was already dropped
          return this.columnsOverlap(rule1.config, rule2.config);
      }
    }
    
    // Check for overwritten values
    if (rule2.type === 'REPLACE_VALUE' || rule2.type === 'FILL_NULL') {
      const column1 = this.getAffectedColumns(rule1);
      const column2 = this.getAffectedColumns(rule2);
      
      // If rule2 replaces values in columns affected by rule1
      return column1.some(col => column2.includes(col));
    }
    
    return false;
  }
  
  /**
   * Check if two rule configurations affect any of the same columns
   */
  private columnsOverlap(config1: any, config2: any): boolean {
    const columns1 = this.getColumnsFromConfig(config1);
    const columns2 = this.getColumnsFromConfig(config2);
    
    return columns1.some(col => columns2.includes(col));
  }
  
  /**
   * Extract column names from a rule configuration
   */
  private getColumnsFromConfig(config: any): string[] {
    if (!config) return [];
    
    if (config.column) {
      return [config.column];
    }
    
    if (config.columns && Array.isArray(config.columns)) {
      return config.columns.map((col: any) => typeof col === 'string' ? col : col.name);
    }
    
    if (config.targetColumn) {
      return [config.targetColumn];
    }
    
    return [];
  }
  
  /**
   * Get all columns affected by a transformation rule
   */
  private getAffectedColumns(rule: TransformationRule): string[] {
    const config = rule.config;
    
    if (!config) return [];
    
    const sourceColumns: string[] = [];
    const targetColumns: string[] = [];
    
    // Extract source columns
    if (config.column) {
      sourceColumns.push(config.column);
    }
    
    if (config.columns && Array.isArray(config.columns)) {
      sourceColumns.push(...config.columns.map((col: any) => typeof col === 'string' ? col : col.name));
    }
    
    // Extract target columns
    if (config.targetColumn) {
      targetColumns.push(config.targetColumn);
    }
    
    if (config.renameMappings) {
      targetColumns.push(...Object.values(config.renameMappings) as string[]);
    }
    
    if (config.mappings && Array.isArray(config.mappings)) {
      targetColumns.push(...config.mappings
        .filter((m: any) => m.target)
        .map((m: any) => m.target));
    }
    
    // If no specific target, assume source is also target
    if (targetColumns.length === 0) {
      return sourceColumns;
    }
    
    return [...sourceColumns, ...targetColumns];
  }
  
  /**
   * Analyze for performance optimizations
   */
  private analyzePerformance(rules: TransformationRule[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Check for expensive operations
    const expensiveRules = rules.filter(rule => 
      ['JOIN', 'AGGREGATE', 'GROUP', 'GROUP_BY', 'CUSTOM', 'CUSTOM_FUNCTION', 'SQL', 'JAVASCRIPT'].includes(rule.type)
    );
    
    // Check for filter optimization opportunities
    const filterRules = rules.filter(rule => rule.type === 'FILTER');
    const needsIndexing = filterRules.length > 1 && rules.length > 5;
    
    if (needsIndexing) {
      suggestions.push({
        type: 'PERFORMANCE',
        description: 'Multiple filter operations could benefit from indexing',
        impact: 'medium',
        details: 'Consider adding database indexes for frequently filtered columns',
        action: {
          type: 'ADD_INDEXES',
          parameters: {
            rules: filterRules.map(rule => rule.id)
          }
        }
      });
    }
    
    // Check for expensive operations without prior data reduction
    for (const rule of expensiveRules) {
      const ruleIndex = rules.indexOf(rule);
      const precedingRules = rules.slice(0, ruleIndex);
      
      // Check if there are filters before this expensive operation
      const hasFilters = precedingRules.some(r => r.type === 'FILTER');
      
      if (!hasFilters && ruleIndex > 0) {
        suggestions.push({
          type: 'PERFORMANCE',
          description: `Expensive operation '${rule.name}' without prior data filtering`,
          impact: 'high',
          details: 'Add filters before expensive operations to reduce the amount of data processed',
          action: {
            type: 'ADD_FILTER',
            parameters: {
              beforeRule: rule.id
            }
          }
        });
      }
    }
    
    // Check for cacheable intermediate results
    if (expensiveRules.length > 1) {
      suggestions.push({
        type: 'PERFORMANCE',
        description: 'Multiple expensive operations may benefit from caching',
        impact: 'medium',
        details: 'Consider adding caching for intermediate results to improve performance of repeated runs',
        action: {
          type: 'ADD_CACHING',
          parameters: {
            rules: expensiveRules.map(rule => rule.id)
          }
        }
      });
    }
    
    // Check for parallelization opportunities
    const parallelizableGroups = this.findParallelizableGroups(rules);
    
    if (parallelizableGroups.length > 0) {
      suggestions.push({
        type: 'PERFORMANCE',
        description: `${parallelizableGroups.length} operation groups could be parallelized`,
        impact: 'high',
        details: 'Independent operations can be run in parallel to improve overall pipeline performance',
        action: {
          type: 'PARALLELIZE',
          parameters: {
            groups: parallelizableGroups
          }
        }
      });
    }
    
    return suggestions;
  }
  
  /**
   * Find groups of rules that could be parallelized
   */
  private findParallelizableGroups(rules: TransformationRule[]): number[][] {
    const groups: number[][] = [];
    let currentGroup: number[] = [];
    
    // Simple heuristic: look for consecutive independent operations
    // In a real system, this would require dependency analysis
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      
      // These operations are typically independent and parallelizable
      const parallelizableTypes = [
        'MAP', 'TO_UPPERCASE', 'TO_LOWERCASE', 'TRIM', 'CAST_TYPE',
        'PARSE_DATE', 'PARSE_NUMBER', 'ROUND', 'ADD', 'SUBTRACT',
        'MULTIPLY', 'DIVIDE'
      ];
      
      if (parallelizableTypes.includes(rule.type)) {
        currentGroup.push(rule.id);
      } else {
        // Non-parallelizable operation found
        if (currentGroup.length > 1) {
          groups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    }
    
    // Don't forget the last group
    if (currentGroup.length > 1) {
      groups.push(currentGroup);
    }
    
    return groups;
  }
  
  /**
   * Apply an optimization suggestion to a job
   */
  applyOptimization(job: ETLJob, suggestion: OptimizationSuggestion, transformationRules: TransformationRule[]): ETLJob {
    if (!suggestion.action) {
      return job;
    }
    
    const { type, parameters } = suggestion.action;
    
    switch (type) {
      case 'REORDER_RULES': {
        const { rulesToMove, targetPosition } = parameters;
        let newTransformations = [...job.transformations];
        
        // Remove rules to move
        newTransformations = newTransformations.filter(id => !rulesToMove.includes(id));
        
        // Insert at target position
        if (targetPosition === 'start') {
          newTransformations = [...rulesToMove, ...newTransformations];
        } else if (targetPosition === 'end') {
          newTransformations = [...newTransformations, ...rulesToMove];
        } else if (typeof targetPosition === 'number') {
          newTransformations.splice(targetPosition, 0, ...rulesToMove);
        }
        
        return {
          ...job,
          transformations: newTransformations
        };
      }
      
      case 'COMBINE_RULES': {
        // This would require creating a new combined rule, which is more complex
        // In a real system, this would create a new rule and replace the old ones
        console.log('COMBINE_RULES optimization not fully implemented');
        return job;
      }
      
      case 'ADD_FILTER': {
        // This would require creating a new filter rule, which is more complex
        // In a real system, this would create a new filter and add it to the pipeline
        console.log('ADD_FILTER optimization not fully implemented');
        return job;
      }
      
      case 'PARALLELIZE': {
        // This would require modifying the execution engine to support parallelization
        // In a real system, this would add parallelization metadata to the job
        console.log('PARALLELIZE optimization not fully implemented');
        return job;
      }
      
      default:
        // Other optimization types would require more complex implementations
        console.log(`Optimization type ${type} not implemented`);
        return job;
    }
  }
}

/**
 * Optimization suggestion type
 */
export enum SuggestionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum SuggestionCategory {
  PERFORMANCE = 'performance',
  QUALITY = 'quality',
  COST = 'cost',
  STRUCTURE = 'structure',
  RELIABILITY = 'reliability'
}

export interface OptimizationSuggestion {
  id: string;
  jobId: string;
  title: string;
  description: string;
  details: string;
  type: 'RULE_ORDERING' | 'RULE_CONSOLIDATION' | 'REDUNDANT_RULE' | 'EXCESSIVE_TRANSFORMS' | 'PERFORMANCE';
  impact: 'low' | 'medium' | 'high';
  severity: SuggestionSeverity;
  category: SuggestionCategory;
  recommendation: string;
  appliedAt?: Date;
  actionable: boolean;
  action?: OptimizationAction;
}

/**
 * Optimization action type
 */
export interface OptimizationAction {
  type: 'REORDER_RULES' | 'COMBINE_RULES' | 'REVIEW_RULES' | 'CONSOLIDATE_TRANSFORMS' | 'ADD_INDEXES' | 'ADD_FILTER' | 'ADD_CACHING' | 'PARALLELIZE';
  parameters: any;
}

// Export a singleton instance
export const optimizationService = new OptimizationService();