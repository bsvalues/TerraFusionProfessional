/**
 * Demo Scenarios
 * 
 * This file contains predefined demo scenarios for showcasing the application's
 * capabilities to stakeholders and during presentations.
 */

import { Property } from '@/shared/types';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
  targetProperties?: string[]; // Array of property IDs to highlight
  mapCenter?: [number, number]; // Latitude, longitude for map center
  mapZoom?: number; // Zoom level
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: () => void;
  waitForCompletion?: boolean;
  completionCheck?: () => boolean;
}

/**
 * Predefined demonstration scenarios
 */
export const demoScenarios: DemoScenario[] = [
  {
    id: 'property-valuation',
    name: 'Property Valuation Analysis',
    description: 'Demonstrate how assessors can quickly analyze property values and compare with similar properties in the area.',
    mapCenter: [46.2085, -119.1372], // Benton County approximate center
    mapZoom: 14,
    targetProperties: ['1', '2', '3', '4'], // Example property IDs to highlight
    steps: [
      {
        id: 'select-property',
        title: 'Select Target Property',
        description: 'Click on a residential property to view its details',
        action: () => {
          console.log('Demo: Select a residential property');
          // Simulation code would go here
        }
      },
      {
        id: 'view-details',
        title: 'View Property Details',
        description: 'Examine the property characteristics, including square footage, year built, and current valuation',
        action: () => {
          console.log('Demo: Viewing property details');
          // Simulation code would go here
        }
      },
      {
        id: 'find-comparable',
        title: 'Find Comparable Properties',
        description: 'Use the "Find Similar Properties" feature to identify comparable properties in the area',
        action: () => {
          console.log('Demo: Finding comparable properties');
          // Simulation code would go here
        }
      },
      {
        id: 'analyze-value',
        title: 'Analyze Value Trends',
        description: 'Review the historical value trends for this property and its comparables',
        action: () => {
          console.log('Demo: Analyzing value trends');
          // Simulation code would go here
        }
      },
      {
        id: 'adjust-valuation',
        title: 'Suggest Value Adjustment',
        description: 'Based on the analysis, determine if the current valuation is appropriate or needs adjustment',
        action: () => {
          console.log('Demo: Suggesting value adjustment');
          // Simulation code would go here
        }
      }
    ]
  },
  {
    id: 'neighborhood-analysis',
    name: 'Neighborhood Value Analysis',
    description: 'Explore how property values vary across different neighborhoods in Benton County.',
    mapCenter: [46.2591, -119.2816], // Different area of Benton County
    mapZoom: 13,
    steps: [
      {
        id: 'select-neighborhood',
        title: 'Select Neighborhood',
        description: 'Use the map to focus on a specific neighborhood or residential area',
        action: () => {
          console.log('Demo: Selecting neighborhood area');
          // Simulation code would go here
        }
      },
      {
        id: 'view-neighborhood-stats',
        title: 'View Neighborhood Statistics',
        description: 'Examine the aggregated property statistics for this neighborhood',
        action: () => {
          console.log('Demo: Viewing neighborhood statistics');
          // Simulation code would go here
        }
      },
      {
        id: 'compare-neighborhoods',
        title: 'Compare with Adjacent Neighborhoods',
        description: 'Compare this neighborhood\'s value trends with adjacent neighborhoods',
        action: () => {
          console.log('Demo: Comparing neighborhoods');
          // Simulation code would go here
        }
      },
      {
        id: 'identify-outliers',
        title: 'Identify Value Outliers',
        description: 'Identify properties that have significantly different values than neighborhood averages',
        action: () => {
          console.log('Demo: Identifying value outliers');
          // Simulation code would go here
        }
      },
      {
        id: 'generate-report',
        title: 'Generate Neighborhood Report',
        description: 'Create a summary report of the neighborhood analysis findings',
        action: () => {
          console.log('Demo: Generating neighborhood report');
          // Simulation code would go here
        }
      }
    ]
  },
  {
    id: 'new-construction',
    name: 'New Construction Assessment',
    description: 'Demonstrate the workflow for assessing newly constructed properties and determining initial valuations.',
    mapCenter: [46.2388, -119.2278], // Development area in Benton County
    mapZoom: 15,
    steps: [
      {
        id: 'locate-new-construction',
        title: 'Locate New Construction',
        description: 'Identify recently built properties using permit data and construction dates',
        action: () => {
          console.log('Demo: Locating new construction');
          // Simulation code would go here
        }
      },
      {
        id: 'review-permits',
        title: 'Review Building Permits',
        description: 'Examine the building permits and construction details',
        action: () => {
          console.log('Demo: Reviewing building permits');
          // Simulation code would go here
        }
      },
      {
        id: 'calculate-initial-value',
        title: 'Calculate Initial Value',
        description: 'Use construction cost data and property characteristics to determine initial value',
        action: () => {
          console.log('Demo: Calculating initial value');
          // Simulation code would go here
        }
      },
      {
        id: 'compare-with-similar',
        title: 'Compare with Similar New Construction',
        description: 'Compare the valuation with other recently built similar properties',
        action: () => {
          console.log('Demo: Comparing with similar new construction');
          // Simulation code would go here
        }
      },
      {
        id: 'finalize-assessment',
        title: 'Finalize Assessment',
        description: 'Finalize the property assessment and record the new valuation',
        action: () => {
          console.log('Demo: Finalizing assessment');
          // Simulation code would go here
        }
      }
    ]
  },
  {
    id: 'market-trends',
    name: 'Market Trend Analysis',
    description: 'Analyze property value trends over time and identify areas with significant changes.',
    mapCenter: [46.2192, -119.1884], // Another area of Benton County
    mapZoom: 12,
    steps: [
      {
        id: 'select-time-period',
        title: 'Select Analysis Period',
        description: 'Choose a time period for analyzing property value trends (e.g., past 3 years)',
        action: () => {
          console.log('Demo: Selecting analysis period');
          // Simulation code would go here
        }
      },
      {
        id: 'view-county-trends',
        title: 'View County-wide Trends',
        description: 'Examine the overall property value trends across Benton County',
        action: () => {
          console.log('Demo: Viewing county-wide trends');
          // Simulation code would go here
        }
      },
      {
        id: 'identify-hotspots',
        title: 'Identify Value Hotspots',
        description: 'Identify areas with significant increases or decreases in property values',
        action: () => {
          console.log('Demo: Identifying value hotspots');
          // Simulation code would go here
        }
      },
      {
        id: 'analyze-property-types',
        title: 'Analyze by Property Type',
        description: 'Compare value trends across different property types (residential, commercial, etc.)',
        action: () => {
          console.log('Demo: Analyzing by property type');
          // Simulation code would go here
        }
      },
      {
        id: 'forecast-trends',
        title: 'Forecast Future Trends',
        description: 'Use historical data to forecast potential future value trends',
        action: () => {
          console.log('Demo: Forecasting future trends');
          // Simulation code would go here
        }
      }
    ]
  },
  {
    id: 'mass-appraisal',
    name: 'Mass Appraisal Simulation',
    description: 'Demonstrate how the system can be used for efficient mass appraisal of multiple properties.',
    mapCenter: [46.2722, -119.2730], // Another location in Benton County
    mapZoom: 14,
    steps: [
      {
        id: 'define-appraisal-criteria',
        title: 'Define Appraisal Criteria',
        description: 'Set up the criteria and parameters for the mass appraisal process',
        action: () => {
          console.log('Demo: Defining appraisal criteria');
          // Simulation code would go here
        }
      },
      {
        id: 'select-property-subset',
        title: 'Select Property Subset',
        description: 'Identify a subset of properties for mass appraisal (e.g., specific neighborhood or property type)',
        action: () => {
          console.log('Demo: Selecting property subset');
          // Simulation code would go here
        }
      },
      {
        id: 'run-valuation-models',
        title: 'Run Valuation Models',
        description: 'Execute automated valuation models on the selected properties',
        action: () => {
          console.log('Demo: Running valuation models');
          // Simulation code would go here
        }
      },
      {
        id: 'review-results',
        title: 'Review Valuation Results',
        description: 'Examine the valuation results and identify properties requiring manual review',
        action: () => {
          console.log('Demo: Reviewing valuation results');
          // Simulation code would go here
        }
      },
      {
        id: 'finalize-batch',
        title: 'Finalize Batch Valuations',
        description: 'After review, finalize the valuations for the batch of properties',
        action: () => {
          console.log('Demo: Finalizing batch valuations');
          // Simulation code would go here
        }
      }
    ]
  }
];

/**
 * Get a demo scenario by ID
 */
export function getDemoScenario(id: string): DemoScenario | undefined {
  return demoScenarios.find(scenario => scenario.id === id);
}

/**
 * Execute a demo step
 */
export function executeStep(scenarioId: string, stepId: string): void {
  const scenario = getDemoScenario(scenarioId);
  if (!scenario) {
    console.error(`Demo scenario ${scenarioId} not found`);
    return;
  }
  
  const step = scenario.steps.find(s => s.id === stepId);
  if (!step) {
    console.error(`Step ${stepId} not found in scenario ${scenarioId}`);
    return;
  }
  
  console.log(`Executing demo step: ${step.title}`);
  step.action();
}

/**
 * Run a complete demo scenario
 */
export async function runDemoScenario(id: string): Promise<void> {
  const scenario = getDemoScenario(id);
  if (!scenario) {
    console.error(`Demo scenario ${id} not found`);
    return;
  }
  
  console.log(`Starting demo scenario: ${scenario.name}`);
  
  for (const step of scenario.steps) {
    console.log(`Step: ${step.title}`);
    step.action();
    
    // If this step needs to wait for completion, do so
    if (step.waitForCompletion && step.completionCheck) {
      let isComplete = false;
      while (!isComplete) {
        isComplete = step.completionCheck();
        if (!isComplete) {
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } else {
      // Add a small delay between steps for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  console.log(`Demo scenario complete: ${scenario.name}`);
}