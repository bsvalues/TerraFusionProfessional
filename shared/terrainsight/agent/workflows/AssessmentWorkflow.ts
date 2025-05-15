/**
 * Assessment Calculation Workflow
 * 
 * This file defines the workflow for property assessment calculations,
 * implementing the Assessment Calculation MCP as defined in the strategic guide.
 */

import { AgentWorkflow } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Property Assessment Workflow
 * 
 * This workflow orchestrates the process of assessing a property through
 * multiple stages including property validation, market analysis, valuation,
 * legal compliance checking, and final assessment generation.
 */
export const propertyAssessmentWorkflow: AgentWorkflow = {
  id: 'property-assessment-workflow',
  name: 'Property Assessment Workflow',
  description: 'Complete workflow for property assessment and valuation calculation',
  version: '1.0',
  isEnabled: true,
  category: 'assessment',
  tags: ['property', 'valuation', 'compliance', 'core'],
  parameters: {
    requireLegalCompliance: true,
    includeMarketComparison: true,
    generateDetailedReports: false
  },
  steps: [
    // Step 1: Property Data Validation
    {
      id: 'validate-property-data',
      name: 'Validate Property Data',
      description: 'Validate property details against assessment requirements',
      agentId: 'data-validation-agent',
      inputMapping: {
        'property': 'input.property',
        'validators': 'parameters.validators',
        'requireCompleteAddress': true,
        'requireParcelId': true
      },
      outputMapping: {
        'output.validatedProperty': 'data',
        'output.validationIssues': 'issues',
        'output.isValidForAssessment': 'isValid'
      },
      continueOnError: false
    },
    
    // Step 2: Legal Compliance Check
    {
      id: 'check-legal-compliance',
      name: 'Check Legal Compliance',
      description: 'Verify property assessment complies with legal requirements',
      agentId: 'legal-compliance-agent',
      condition: 'parameters.requireLegalCompliance === true',
      inputMapping: {
        'property': 'output.validatedProperty',
        'assessmentYear': 'input.assessmentYear',
        'jurisdiction': 'input.jurisdiction || "Benton County"',
        'checkExemptions': true
      },
      outputMapping: {
        'output.complianceStatus': 'status',
        'output.complianceIssues': 'issues',
        'output.legalReferences': 'legalReferences',
        'output.exemptions': 'exemptions'
      },
      continueOnError: true
    },
    
    // Step 3: Property Valuation
    {
      id: 'calculate-property-valuation',
      name: 'Calculate Property Valuation',
      description: 'Calculate property value using appropriate valuation methods',
      agentId: 'valuation-agent',
      inputMapping: {
        'property': 'output.validatedProperty',
        'assessmentDate': 'input.assessmentDate',
        'useMarketComparison': 'parameters.includeMarketComparison',
        'useCostApproach': true,
        'useIncomeApproach': 'input.property.propertyType === "commercial" || input.property.propertyType === "multiFamily"',
        'complianceIssues': 'output.complianceIssues'
      },
      outputMapping: {
        'output.propertyValuation': 'valuation',
        'output.valuationMethods': 'methodsUsed',
        'output.valuationExplanation': 'explanation',
        'output.comparables': 'comparableProperties'
      },
      continueOnError: false
    },
    
    // Step 4: Finalize Assessment
    {
      id: 'finalize-assessment',
      name: 'Finalize Assessment',
      description: 'Compile final assessment with valuation, compliance, and documentation',
      agentId: 'workflow-agent',
      inputMapping: {
        'property': 'output.validatedProperty',
        'valuation': 'output.propertyValuation',
        'valuationMethods': 'output.valuationMethods',
        'complianceStatus': 'output.complianceStatus',
        'complianceIssues': 'output.complianceIssues',
        'exemptions': 'output.exemptions',
        'generateDetailedReport': 'parameters.generateDetailedReports'
      },
      outputMapping: {
        'output.finalAssessment': 'assessment',
        'output.assessmentSummary': 'summary',
        'output.assessmentDate': 'timestamp',
        'output.assessmentId': 'assessmentId'
      },
      continueOnError: false
    }
  ]
};

/**
 * Batch Assessment Workflow
 * 
 * This workflow handles the assessment of multiple properties in a batch process,
 * orchestrating parallel processing where possible.
 */
export const batchAssessmentWorkflow: AgentWorkflow = {
  id: 'batch-assessment-workflow',
  name: 'Batch Property Assessment',
  description: 'Process multiple properties for assessment in batch mode',
  version: '1.0',
  isEnabled: true,
  category: 'assessment',
  tags: ['batch', 'property', 'valuation', 'compliance'],
  parameters: {
    requireLegalCompliance: true,
    maxParallelProcessing: 5,
    generateSummaryReport: true
  },
  steps: [
    // Step 1: Validate Batch Data
    {
      id: 'validate-batch-data',
      name: 'Validate Batch Data',
      description: 'Validate the batch of properties for processing',
      agentId: 'data-validation-agent',
      inputMapping: {
        'properties': 'input.properties',
        'validateStructure': true,
        'requireMinimumFields': true
      },
      outputMapping: {
        'output.validProperties': 'validProperties',
        'output.invalidProperties': 'invalidProperties',
        'output.batchStatistics': 'statistics'
      },
      continueOnError: true
    },
    
    // Step 2: Process Each Valid Property
    {
      id: 'process-properties',
      name: 'Process Properties',
      description: 'Process each valid property through the assessment workflow',
      agentId: 'workflow-agent',
      condition: 'output.validProperties && output.validProperties.length > 0',
      inputMapping: {
        'properties': 'output.validProperties',
        'workflowId': '"property-assessment-workflow"',
        'assessmentYear': 'input.assessmentYear',
        'jurisdiction': 'input.jurisdiction',
        'parallelProcessing': 'parameters.maxParallelProcessing > 1',
        'maxParallel': 'parameters.maxParallelProcessing'
      },
      outputMapping: {
        'output.assessmentResults': 'results',
        'output.failedAssessments': 'failures',
        'output.processingStatistics': 'statistics'
      },
      continueOnError: true
    },
    
    // Step 3: Generate Batch Report
    {
      id: 'generate-batch-report',
      name: 'Generate Batch Report',
      description: 'Compile results and generate a batch assessment report',
      agentId: 'workflow-agent',
      condition: 'parameters.generateSummaryReport === true',
      inputMapping: {
        'assessmentResults': 'output.assessmentResults',
        'failedAssessments': 'output.failedAssessments',
        'invalidProperties': 'output.invalidProperties',
        'batchStatistics': 'output.batchStatistics',
        'processingStatistics': 'output.processingStatistics',
        'assessmentYear': 'input.assessmentYear',
        'jurisdiction': 'input.jurisdiction'
      },
      outputMapping: {
        'output.batchReport': 'report',
        'output.batchSummary': 'summary',
        'output.reportFormat': 'format',
        'output.batchId': 'batchId'
      },
      continueOnError: false
    }
  ]
};

/**
 * Register assessment workflows
 * 
 * @param registerWorkflow Function to register workflows with the MCP
 */
export function registerAssessmentWorkflows(registerWorkflow: (workflow: AgentWorkflow) => void): void {
  registerWorkflow(propertyAssessmentWorkflow);
  registerWorkflow(batchAssessmentWorkflow);
}