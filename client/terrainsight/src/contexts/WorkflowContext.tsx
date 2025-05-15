import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// Define our workflow steps with a consistent structure
export type WorkflowStep = {
  id: string;
  label: string;
  description?: string;
  path?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
};

// Define main workflows in the application
export type WorkflowType = 'property-assessment' | 'data-import' | 'report-generation' | 'valuation-analysis';

// Map of workflows with their steps
export type WorkflowMap = {
  [key in WorkflowType]: {
    title: string;
    description: string;
    steps: WorkflowStep[];
    currentStepId: string;
  }
};

// Define current workflow type for the WorkflowManagement page
export interface WorkflowInfo {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'error' | 'paused';
  progress: number;
}

// Define the context shape
interface WorkflowContextType {
  workflows: WorkflowMap;
  activeWorkflow: WorkflowType | null;
  setActiveWorkflow: (workflow: WorkflowType | null) => void;
  updateWorkflowStep: (workflowType: WorkflowType, stepId: string) => void;
  completeWorkflowStep: (workflowType: WorkflowType, stepId: string) => void;
  resetWorkflow: (workflowType: WorkflowType) => void;
  getNextStep: (workflowType: WorkflowType, stepId: string) => WorkflowStep | null;
  currentWorkflow: WorkflowInfo | null;
  setCurrentWorkflow: (workflow: WorkflowInfo | null) => void;
}

// Path to workflow mapping for automatic activation
const PATH_WORKFLOW_MAPPING: { [key: string]: WorkflowType } = {
  '/properties': 'property-assessment',
  '/map': 'property-assessment',
  '/data': 'data-import',
  '/reports': 'report-generation',
  '/analysis': 'valuation-analysis',
  '/income-approach': 'valuation-analysis',
};

// Initial workflow definitions
const DEFAULT_WORKFLOWS: WorkflowMap = {
  'property-assessment': {
    title: 'Property Assessment',
    description: 'Workflow for assessing and valuating properties',
    steps: [
      {
        id: 'search',
        label: 'Property Search',
        description: 'Find and select a property to assess',
        path: '/properties',
        status: 'current'
      },
      {
        id: 'view-details',
        label: 'View Details',
        description: 'Review property information and characteristics',
        path: '/properties',
        status: 'upcoming'
      },
      {
        id: 'map-visualization',
        label: 'Map Visualization',
        description: 'Explore the property location and surroundings',
        path: '/map',
        status: 'upcoming'
      },
      {
        id: 'comparable-analysis',
        label: 'Comparable Analysis',
        description: 'Compare with similar properties',
        path: '/analysis',
        status: 'upcoming'
      },
      {
        id: 'assessment-result',
        label: 'Assessment Result',
        description: 'Review final assessment and valuation',
        path: '/reports',
        status: 'upcoming'
      }
    ],
    currentStepId: 'search'
  },
  'data-import': {
    title: 'Data Import',
    description: 'Import and validate property data from external sources',
    steps: [
      {
        id: 'select-source',
        label: 'Select Data Source',
        description: 'Choose data source and format',
        path: '/data',
        status: 'current'
      },
      {
        id: 'validate-data',
        label: 'Validate Data',
        description: 'Check data quality and format',
        path: '/data',
        status: 'upcoming'
      },
      {
        id: 'transform-data',
        label: 'Transform Data',
        description: 'Map fields and transform values',
        path: '/data',
        status: 'upcoming'
      },
      {
        id: 'import-data',
        label: 'Import Data',
        description: 'Import data into the system',
        path: '/data',
        status: 'upcoming'
      },
      {
        id: 'review-results',
        label: 'Review Results',
        description: 'Review import results and address issues',
        path: '/data',
        status: 'upcoming'
      }
    ],
    currentStepId: 'select-source'
  },
  'report-generation': {
    title: 'Report Generation',
    description: 'Generate property assessment reports',
    steps: [
      {
        id: 'select-property',
        label: 'Select Property',
        description: 'Choose properties for reporting',
        path: '/properties',
        status: 'current'
      },
      {
        id: 'configure-report',
        label: 'Configure Report',
        description: 'Set report parameters and sections',
        path: '/reports',
        status: 'upcoming'
      },
      {
        id: 'preview-report',
        label: 'Preview Report',
        description: 'Review report content and format',
        path: '/reports',
        status: 'upcoming'
      },
      {
        id: 'generate-report',
        label: 'Generate Report',
        description: 'Generate final report document',
        path: '/reports',
        status: 'upcoming'
      }
    ],
    currentStepId: 'select-property'
  },
  'valuation-analysis': {
    title: 'Valuation Analysis',
    description: 'Advanced analysis for property valuation',
    steps: [
      {
        id: 'select-property',
        label: 'Select Property',
        description: 'Choose a property for analysis',
        path: '/properties',
        status: 'current'
      },
      {
        id: 'select-method',
        label: 'Select Method',
        description: 'Choose valuation method',
        path: '/analysis',
        status: 'upcoming'
      },
      {
        id: 'configure-parameters',
        label: 'Configure Parameters',
        description: 'Set analysis parameters',
        path: '/analysis',
        status: 'upcoming'
      },
      {
        id: 'run-analysis',
        label: 'Run Analysis',
        description: 'Execute valuation analysis',
        path: '/analysis',
        status: 'upcoming'
      },
      {
        id: 'review-results',
        label: 'Review Results',
        description: 'Review and interpret analysis results',
        path: '/analysis',
        status: 'upcoming'
      }
    ],
    currentStepId: 'select-property'
  }
};

// Create the context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider component
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workflows, setWorkflows] = useState<WorkflowMap>(DEFAULT_WORKFLOWS);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowInfo | null>(null);
  const [location] = useLocation();

  // Automatically set active workflow based on current path
  useEffect(() => {
    // Map current path to a workflow
    const matchedWorkflow = PATH_WORKFLOW_MAPPING[location];
    if (matchedWorkflow) {
      setActiveWorkflow(matchedWorkflow);
    }
  }, [location]);

  // Update a workflow step status
  const updateWorkflowStep = (workflowType: WorkflowType, stepId: string) => {
    setWorkflows(prevWorkflows => {
      const workflow = { ...prevWorkflows[workflowType] };
      const updatedSteps = workflow.steps.map(step => {
        if (step.id === workflow.currentStepId) {
          return { ...step, status: 'completed' as const };
        }
        if (step.id === stepId) {
          return { ...step, status: 'current' as const };
        }
        return step;
      });
      
      return {
        ...prevWorkflows,
        [workflowType]: {
          ...workflow,
          steps: updatedSteps,
          currentStepId: stepId
        }
      };
    });
  };

  // Mark a step as completed and move to next step
  const completeWorkflowStep = (workflowType: WorkflowType, stepId: string) => {
    setWorkflows(prevWorkflows => {
      const workflow = { ...prevWorkflows[workflowType] };
      const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
      
      if (stepIndex === -1 || stepIndex >= workflow.steps.length - 1) {
        // If it's the last step or not found, just mark it complete
        const updatedSteps = workflow.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: 'completed' as const };
          }
          return step;
        });
        
        return {
          ...prevWorkflows,
          [workflowType]: {
            ...workflow,
            steps: updatedSteps
          }
        };
      } else {
        // Mark current step complete and move to next step
        const nextStep = workflow.steps[stepIndex + 1];
        const updatedSteps = workflow.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: 'completed' as const };
          }
          if (step.id === nextStep.id) {
            return { ...step, status: 'current' as const };
          }
          return step;
        });
        
        return {
          ...prevWorkflows,
          [workflowType]: {
            ...workflow,
            steps: updatedSteps,
            currentStepId: nextStep.id
          }
        };
      }
    });
  };

  // Reset a workflow to its initial state
  const resetWorkflow = (workflowType: WorkflowType) => {
    setWorkflows(prevWorkflows => {
      const workflow = DEFAULT_WORKFLOWS[workflowType];
      return {
        ...prevWorkflows,
        [workflowType]: workflow
      };
    });
  };

  // Get the next step in a workflow
  const getNextStep = (workflowType: WorkflowType, stepId: string): WorkflowStep | null => {
    const workflow = workflows[workflowType];
    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1 || stepIndex >= workflow.steps.length - 1) {
      return null;
    }
    
    return workflow.steps[stepIndex + 1];
  };

  return (
    <WorkflowContext.Provider value={{
      workflows,
      activeWorkflow,
      setActiveWorkflow,
      updateWorkflowStep,
      completeWorkflowStep,
      resetWorkflow,
      getNextStep,
      currentWorkflow,
      setCurrentWorkflow
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook to use the context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};