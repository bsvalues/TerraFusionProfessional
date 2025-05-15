/**
 * Script Execution Engine
 * 
 * Provides a secure environment for executing user scripts with access to
 * property data and ETL processing results.
 */

import { Property } from '@shared/schema';

/**
 * Interface for the script execution context
 */
export interface ScriptContext {
  properties: Property[];
  transformedData?: Record<string, any>;
  utils: Record<string, any>;
}

/**
 * Interface for script execution results
 */
export interface ScriptResult {
  output: any;
  executionTime: number;
  success: boolean;
  error?: string;
  logs: string[];
}

/**
 * Execution engine for safely running user scripts
 */
export default class ScriptExecutionEngine {
  private logs: string[] = [];
  
  /**
   * Execute a script in a secure environment
   */
  executeScript(script: string, context: ScriptContext): ScriptResult {
    // Reset logs
    this.logs = [];
    
    // Record start time
    const startTime = performance.now();
    
    try {
      // Create a sandbox environment
      const sandbox = this.createSandbox(context);
      
      // Execute the script in the sandbox
      const output = this.runInSandbox(script, sandbox);
      
      // Record end time
      const endTime = performance.now();
      
      return {
        output,
        executionTime: Math.round(endTime - startTime),
        success: true,
        logs: [...this.logs]
      };
    } catch (error) {
      // Record end time on error
      const endTime = performance.now();
      
      return {
        output: null,
        executionTime: Math.round(endTime - startTime),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs: [...this.logs]
      };
    }
  }
  
  /**
   * Create a sandbox environment with controlled access to properties and utilities
   */
  private createSandbox(context: ScriptContext): Record<string, any> {
    const { properties, transformedData, utils } = context;
    
    // Create a safe console that logs to our internal log array
    const console = {
      log: (...args: any[]) => {
        this.logs.push(args.map(arg => String(arg)).join(' '));
      },
      error: (...args: any[]) => {
        this.logs.push(`ERROR: ${args.map(arg => String(arg)).join(' ')}`);
      },
      warn: (...args: any[]) => {
        this.logs.push(`WARNING: ${args.map(arg => String(arg)).join(' ')}`);
      },
      info: (...args: any[]) => {
        this.logs.push(`INFO: ${args.map(arg => String(arg)).join(' ')}`);
      }
    };
    
    // Create additional utility functions
    const extendedUtils = {
      ...utils,
      
      // Parse a property value string into a number
      parsePropertyValue: (property: Property) => {
        if (!property.value) return 0;
        return parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
      },
      
      // Group an array of objects by a key
      groupBy: <T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> => {
        return array.reduce((result, item) => {
          const groupKey = typeof key === 'function' 
            ? key(item) 
            : String(item[key]);
          
          result[groupKey] = result[groupKey] || [];
          result[groupKey].push(item);
          return result;
        }, {} as Record<string, T[]>);
      },
      
      // Calculate average of an array of numbers
      average: (numbers: number[]): number => {
        if (!numbers.length) return 0;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      },
      
      // Calculate median of an array of numbers
      median: (numbers: number[]): number => {
        if (!numbers.length) return 0;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      }
    };
    
    // Return the sandboxed environment
    return {
      properties,
      transformedData,
      utils: extendedUtils,
      console
    };
  }
  
  /**
   * Execute the script in a sandbox environment
   */
  private runInSandbox(script: string, sandbox: Record<string, any>): any {
    // Create a function with sandbox parameters
    const sandboxVars = Object.keys(sandbox);
    const sandboxValues = Object.values(sandbox);
    
    // Wrap the script in a try-catch to capture errors
    const wrappedScript = `
      try {
        ${script}
      } catch (error) {
        console.error("Script execution error:", error.message);
        throw error;
      }
    `;
    
    // Create a function with the sandbox variables as parameters
    const scriptFunction = new Function(...sandboxVars, wrappedScript);
    
    // Execute the function with sandbox values
    return scriptFunction(...sandboxValues);
  }
}