/**
 * Development Workflow
 * 
 * This file defines workflows for assisting in development tasks
 * using the multi-agent architecture to automate and improve
 * development processes.
 */

import { AgentWorkflow } from '../types';

/**
 * Feature Development Workflow
 * 
 * This workflow coordinates the development of a new feature
 * from requirements gathering to implementation and testing
 */
export const featureDevelopmentWorkflow: AgentWorkflow = {
  id: 'feature-development-workflow',
  name: 'Feature Development Workflow',
  description: 'Coordinate the development of a new feature from requirements to implementation',
  isEnabled: true,
  steps: [
    // Step 1: Analyze Requirements
    {
      id: 'analyze-requirements',
      agentId: 'architect-prime',
      inputMapping: {
        'featureDescription': 'input.featureDescription',
        'priorityLevel': 'input.priorityLevel'
      },
      outputMapping: {
        'output.requirementsAnalysis': 'requirementsAnalysis',
        'output.architectureImpact': 'architectureImpact'
      },
      continueOnError: false
    },
    
    // Step 2: Design Solution
    {
      id: 'design-solution',
      agentId: 'architect-prime',
      inputMapping: {
        'requirementsAnalysis': 'requirementsAnalysis',
        'architectureImpact': 'architectureImpact',
        'existingComponents': 'input.existingComponents'
      },
      outputMapping: {
        'output.designSpec': 'designSpec',
        'output.componentChanges': 'componentChanges'
      },
      continueOnError: false
    },
    
    // Step 3: Implementation Planning
    {
      id: 'implementation-planning',
      agentId: 'bsbcmaster-lead',
      inputMapping: {
        'designSpec': 'designSpec',
        'componentChanges': 'componentChanges'
      },
      outputMapping: {
        'output.implementationPlan': 'implementationPlan',
        'output.tasks': 'implementationTasks'
      },
      continueOnError: false
    },
    
    // Step 4: Code Generation
    {
      id: 'code-generation',
      agentId: 'god-tier-builder',
      inputMapping: {
        'implementationPlan': 'implementationPlan',
        'designSpec': 'designSpec',
        'codebaseContext': 'input.codebaseContext'
      },
      outputMapping: {
        'output.generatedCode': 'generatedCode',
        'output.fileChanges': 'fileChanges'
      },
      continueOnError: false
    },
    
    // Step 5: Test Generation
    {
      id: 'test-generation',
      agentId: 'tdd-validator',
      inputMapping: {
        'designSpec': 'designSpec',
        'generatedCode': 'generatedCode',
        'testingFramework': 'input.testingFramework'
      },
      outputMapping: {
        'output.testSuite': 'testSuite',
        'output.testCoverage': 'testCoverage'
      },
      continueOnError: true
    },
    
    // Step 6: Code Review
    {
      id: 'code-review',
      agentId: 'architect-prime',
      inputMapping: {
        'generatedCode': 'generatedCode',
        'designSpec': 'designSpec',
        'testSuite': 'testSuite'
      },
      outputMapping: {
        'output.reviewComments': 'reviewComments',
        'output.qualityScore': 'qualityScore'
      },
      continueOnError: true
    },
    
    // Step 7: Integration Planning
    {
      id: 'integration-planning',
      agentId: 'integration-coordinator',
      inputMapping: {
        'fileChanges': 'fileChanges',
        'componentChanges': 'componentChanges',
        'reviewComments': 'reviewComments'
      },
      outputMapping: {
        'output.integrationPlan': 'integrationPlan',
        'output.deploymentSteps': 'deploymentSteps'
      },
      continueOnError: true
    }
  ],
  parameters: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Bug Fix Workflow
 *
 * This workflow analyzes and fixes bugs in the codebase
 */
export const bugFixWorkflow: AgentWorkflow = {
  id: 'bug-fix-workflow',
  name: 'Bug Fix Workflow',
  description: 'Analyze and fix bugs in the codebase',
  isEnabled: true,
  steps: [
    // Step 1: Bug Analysis
    {
      id: 'bug-analysis',
      agentId: 'architect-prime',
      inputMapping: {
        'bugDescription': 'input.bugDescription',
        'reproductionSteps': 'input.reproductionSteps',
        'errorLogs': 'input.errorLogs'
      },
      outputMapping: {
        'output.rootCauseAnalysis': 'rootCauseAnalysis',
        'output.affectedComponents': 'affectedComponents'
      },
      continueOnError: false
    },
    
    // Step 2: Solution Design
    {
      id: 'fix-design',
      agentId: 'bsbcmaster-lead',
      inputMapping: {
        'rootCauseAnalysis': 'rootCauseAnalysis',
        'affectedComponents': 'affectedComponents',
        'codebaseContext': 'input.codebaseContext'
      },
      outputMapping: {
        'output.fixStrategy': 'fixStrategy',
        'output.requiredChanges': 'requiredChanges'
      },
      continueOnError: false
    },
    
    // Step 3: Fix Implementation
    {
      id: 'implement-fix',
      agentId: 'god-tier-builder',
      inputMapping: {
        'fixStrategy': 'fixStrategy',
        'requiredChanges': 'requiredChanges',
        'codebaseContext': 'input.codebaseContext'
      },
      outputMapping: {
        'output.patchCode': 'patchCode',
        'output.fileChanges': 'fileChanges'
      },
      continueOnError: false
    },
    
    // Step 4: Regression Test Generation
    {
      id: 'regression-test',
      agentId: 'tdd-validator',
      inputMapping: {
        'bugDescription': 'input.bugDescription',
        'patchCode': 'patchCode',
        'fixStrategy': 'fixStrategy'
      },
      outputMapping: {
        'output.regressionTests': 'regressionTests',
        'output.verificationSteps': 'verificationSteps'
      },
      continueOnError: true
    },
    
    // Step 5: Verification
    {
      id: 'fix-verification',
      agentId: 'tdd-validator',
      inputMapping: {
        'patchCode': 'patchCode',
        'regressionTests': 'regressionTests',
        'verificationSteps': 'verificationSteps',
        'originalBugDescription': 'input.bugDescription'
      },
      outputMapping: {
        'output.verificationResults': 'verificationResults',
        'output.fixConfidence': 'fixConfidence'
      },
      continueOnError: true
    }
  ],
  parameters: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Code Refactoring Workflow
 * 
 * This workflow analyzes code quality and suggests refactorings
 */
export const codeRefactoringWorkflow: AgentWorkflow = {
  id: 'code-refactoring-workflow',
  name: 'Code Refactoring Workflow',
  description: 'Analyze code quality and suggest refactorings',
  isEnabled: true,
  steps: [
    // Step 1: Code Quality Analysis
    {
      id: 'quality-analysis',
      agentId: 'architect-prime',
      inputMapping: {
        'targetCode': 'input.targetCode',
        'qualityMetrics': 'input.qualityMetrics',
        'codebaseContext': 'input.codebaseContext'
      },
      outputMapping: {
        'output.qualityReport': 'qualityReport',
        'output.refactoringOpportunities': 'refactoringOpportunities'
      },
      continueOnError: false
    },
    
    // Step 2: Refactoring Planning
    {
      id: 'refactoring-plan',
      agentId: 'bsbcmaster-lead',
      inputMapping: {
        'qualityReport': 'qualityReport',
        'refactoringOpportunities': 'refactoringOpportunities'
      },
      outputMapping: {
        'output.refactoringPlan': 'refactoringPlan',
        'output.prioritizedChanges': 'prioritizedChanges'
      },
      continueOnError: false
    },
    
    // Step 3: Refactoring Implementation
    {
      id: 'implement-refactoring',
      agentId: 'god-tier-builder',
      inputMapping: {
        'refactoringPlan': 'refactoringPlan',
        'prioritizedChanges': 'prioritizedChanges',
        'codebaseContext': 'input.codebaseContext'
      },
      outputMapping: {
        'output.refactoredCode': 'refactoredCode',
        'output.fileChanges': 'fileChanges'
      },
      continueOnError: false
    },
    
    // Step 4: Behavior Verification
    {
      id: 'verify-behavior',
      agentId: 'tdd-validator',
      inputMapping: {
        'originalCode': 'input.targetCode',
        'refactoredCode': 'refactoredCode',
        'existingTests': 'input.existingTests'
      },
      outputMapping: {
        'output.behaviorPreserved': 'behaviorPreserved',
        'output.verificationResults': 'verificationResults'
      },
      continueOnError: true
    }
  ],
  parameters: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Register all development workflows with the workflow manager
 * 
 * @param registerFn Function to register a workflow
 */
export function registerDevelopmentWorkflows(registerFn: (workflow: AgentWorkflow) => void): void {
  registerFn(featureDevelopmentWorkflow);
  registerFn(bugFixWorkflow);
  registerFn(codeRefactoringWorkflow);
}