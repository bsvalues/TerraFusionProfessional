/**
 * Legal Compliance Agent
 * 
 * This agent is responsible for ensuring all operations comply with
 * Washington State laws and regulations related to property assessment.
 */

import { Agent } from './Agent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult, 
  ValidationIssue 
} from './types';

/**
 * Legal regulation types
 */
export enum RegulationType {
  PROPERTY_TAX = 'property_tax',
  ASSESSMENT_PROCEDURE = 'assessment_procedure',
  EXEMPTIONS = 'exemptions',
  DATA_PRIVACY = 'data_privacy',
  PUBLIC_DISCLOSURE = 'public_disclosure',
  APPEALS_PROCESS = 'appeals_process'
}

/**
 * Washington State legal reference
 */
export interface LegalReference {
  /** Code citation */
  citation: string;
  
  /** Document name */
  document: string;
  
  /** Section title */
  title: string;
  
  /** URL to the legal document */
  url?: string;
  
  /** Description of the reference */
  description: string;
}

/**
 * Legal compliance check input
 */
export interface LegalComplianceInput {
  /** Operation being performed */
  operation: string;
  
  /** Operation data */
  data: any;
  
  /** Compliance check options */
  options?: {
    /** Specific regulation types to check */
    regulationTypes?: RegulationType[];
    
    /** Whether the operation is for public disclosure */
    isPublicDisclosure?: boolean;
    
    /** Whether to include full legal references */
    includeFullReferences?: boolean;
  };
}

/**
 * Legal compliance check output
 */
export interface LegalComplianceOutput {
  /** Whether the operation is compliant */
  isCompliant: boolean;
  
  /** Compliance issues */
  issues: Array<{
    description: string;
    regulationType: RegulationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reference: LegalReference;
  }>;
  
  /** Legal references */
  references: LegalReference[];
  
  /** Compliance recommendations */
  recommendations: string[];
}

/**
 * Legal Compliance Agent implementation
 */
export class LegalComplianceAgent extends Agent {
  /** Washington State legal references */
  private washingtonLaws: Record<RegulationType, LegalReference[]>;
  
  /**
   * Initialize a new Legal Compliance Agent
   */
  constructor() {
    super(
      'legal-compliance-agent',
      'Legal Compliance Agent',
      [
        'washington-state-law-compliance-checking',
        'regulatory-update-monitoring',
        'compliance-reporting',
        'exemption-validation',
        'assessment-procedure-validation',
        'data-privacy-compliance'
      ]
    );
    
    // Initialize Washington State legal references
    this.washingtonLaws = {
      [RegulationType.PROPERTY_TAX]: [
        {
          citation: 'RCW 84.40.020',
          document: 'Revised Code of Washington',
          title: 'Assessment Date',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.020',
          description: 'All real property in the state subject to taxation shall be listed and assessed every year, with reference to its value on January 1st of the year in which it is assessed.'
        },
        {
          citation: 'RCW 84.40.030',
          document: 'Revised Code of Washington',
          title: 'Basis of valuation, assessment, appraisal',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.030',
          description: 'All property shall be valued at one hundred percent of its true and fair value in money and assessed on the same basis unless specifically provided otherwise by law.'
        },
        {
          citation: 'RCW 84.41.030',
          document: 'Revised Code of Washington',
          title: 'Revaluation program to be on continuous basis',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.030',
          description: 'Each county assessor shall maintain an active and systematic program of revaluation on a continuous basis.'
        }
      ],
      [RegulationType.ASSESSMENT_PROCEDURE]: [
        {
          citation: 'WAC 458-07-015',
          document: 'Washington Administrative Code',
          title: 'Revaluation of real property',
          url: 'https://apps.leg.wa.gov/wac/default.aspx?cite=458-07-015',
          description: 'All real property must be revalued annually based on physical inspection or statistical analysis.'
        },
        {
          citation: 'WAC 458-07-025',
          document: 'Washington Administrative Code',
          title: 'Valuation criteria',
          url: 'https://apps.leg.wa.gov/wac/default.aspx?cite=458-07-025',
          description: 'Property must be valued using market data, cost approach, income approach, or a combination of these approaches.'
        },
        {
          citation: 'WAC 458-07-030',
          document: 'Washington Administrative Code',
          title: 'True and fair value',
          url: 'https://apps.leg.wa.gov/wac/default.aspx?cite=458-07-030',
          description: 'Property must be appraised at 100% of its true and fair value in accordance with generally accepted appraisal practices.'
        }
      ],
      [RegulationType.EXEMPTIONS]: [
        {
          citation: 'RCW 84.36',
          document: 'Revised Code of Washington',
          title: 'Exemptions',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.36',
          description: 'Defines various property tax exemptions including those for seniors, disabled persons, nonprofit organizations, and others.'
        },
        {
          citation: 'WAC 458-16',
          document: 'Washington Administrative Code',
          title: 'Property Tax Exemptions',
          url: 'https://apps.leg.wa.gov/wac/default.aspx?cite=458-16',
          description: 'Regulations implementing property tax exemption statutes.'
        }
      ],
      [RegulationType.DATA_PRIVACY]: [
        {
          citation: 'RCW 42.56.070',
          document: 'Revised Code of Washington',
          title: 'Public Records Act',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=42.56.070',
          description: 'Requirements for maintaining and providing access to public records.'
        },
        {
          citation: 'RCW 42.56.230',
          document: 'Revised Code of Washington',
          title: 'Personal information',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=42.56.230',
          description: 'Exemptions from public disclosure for certain personal information.'
        }
      ],
      [RegulationType.PUBLIC_DISCLOSURE]: [
        {
          citation: 'RCW 84.40.175',
          document: 'Revised Code of Washington',
          title: 'Listing of exempt property',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.175',
          description: 'Requirements for listing and valuing tax-exempt property.'
        },
        {
          citation: 'RCW 84.48.150',
          document: 'Revised Code of Washington',
          title: 'Valuation criteria including market, cost, and income approaches',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.48.150',
          description: 'Requirements for transparency in assessment procedures and valuations.'
        }
      ],
      [RegulationType.APPEALS_PROCESS]: [
        {
          citation: 'RCW 84.48.010',
          document: 'Revised Code of Washington',
          title: 'County board of equalization',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.48.010',
          description: 'County boards of equalization shall meet annually to examine and compare assessment values.'
        },
        {
          citation: 'RCW 84.08.130',
          document: 'Revised Code of Washington',
          title: 'Appeals from county board of equalization to board of tax appeals',
          url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=84.08.130',
          description: 'Procedures for appealing property valuations to the board of tax appeals.'
        }
      ]
    };
  }
  
  /**
   * Process a legal compliance check request
   * 
   * @param input The compliance check input
   * @param context The agent context
   * @returns Compliance check results
   */
  async process(input: LegalComplianceInput, context: AgentContext): Promise<AgentResponse> {
    try {
      const startTime = Date.now();
      
      // Log the operation
      context.log('info', 'Checking legal compliance', { 
        operation: input.operation,
        options: input.options
      });
      
      // Determine which regulation types to check
      const regulationTypes = input.options?.regulationTypes || Object.values(RegulationType);
      
      // Check compliance for each regulation type
      const issues: Array<{
        description: string;
        regulationType: RegulationType;
        severity: 'low' | 'medium' | 'high' | 'critical';
        reference: LegalReference;
      }> = [];
      
      // Check all applicable regulation types
      for (const regulationType of regulationTypes) {
        const complianceIssues = await this.checkComplianceForRegulationType(
          regulationType,
          input.operation,
          input.data
        );
        
        issues.push(...complianceIssues);
      }
      
      // Collect all referenced legal citations
      const references: LegalReference[] = [];
      if (input.options?.includeFullReferences !== false) {
        const referencedCitations = new Set<string>();
        
        // Add references from issues
        for (const issue of issues) {
          if (!referencedCitations.has(issue.reference.citation)) {
            references.push(issue.reference);
            referencedCitations.add(issue.reference.citation);
          }
        }
        
        // Add additional relevant references
        for (const regulationType of regulationTypes) {
          const laws = this.washingtonLaws[regulationType];
          for (const law of laws) {
            if (!referencedCitations.has(law.citation) && this.isRelevantToOperation(law, input.operation)) {
              references.push(law);
              referencedCitations.add(law.citation);
            }
          }
        }
      }
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(issues, input.operation);
      
      // Prepare result
      const result: LegalComplianceOutput = {
        isCompliant: issues.length === 0,
        issues,
        references,
        recommendations
      };
      
      const executionTimeMs = Date.now() - startTime;
      
      // Check for critical compliance issues
      const hasCriticalIssues = issues.some(issue => issue.severity === 'critical');
      
      // Create response
      if (hasCriticalIssues) {
        return {
          status: 'blockedByCompliance',
          data: result,
          explanation: `Operation "${input.operation}" has critical compliance issues and cannot proceed`,
          recommendations: result.recommendations,
          legalReferences: result.references.map(ref => ref.citation),
          metrics: {
            executionTimeMs,
            issueCount: issues.length,
            referencesCount: references.length
          }
        };
      } else if (issues.length > 0) {
        return {
          status: 'warning',
          data: result,
          explanation: `Operation "${input.operation}" has ${issues.length} compliance considerations that should be addressed`,
          recommendations: result.recommendations,
          legalReferences: result.references.map(ref => ref.citation),
          metrics: {
            executionTimeMs,
            issueCount: issues.length,
            referencesCount: references.length
          }
        };
      } else {
        return {
          status: 'success',
          data: result,
          explanation: `Operation "${input.operation}" is compliant with Washington State laws and regulations`,
          legalReferences: result.references.map(ref => ref.citation),
          metrics: {
            executionTimeMs,
            issueCount: 0,
            referencesCount: references.length
          }
        };
      }
    } catch (error) {
      context.log('error', 'Error checking legal compliance', error);
      
      return this.createErrorResponse(
        `Error checking legal compliance: ${error instanceof Error ? error.message : String(error)}`,
        { operation: input.operation },
        [{
          type: 'compliance_check_error',
          severity: 'critical',
          message: `Error checking legal compliance: ${error instanceof Error ? error.message : String(error)}`,
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
    
    // Check if operation is present
    if (!input.operation) {
      issues.push({
        field: 'operation',
        type: 'missing_required_field',
        description: 'Operation name is required',
        severity: 'CRITICAL'
      });
    } else if (typeof input.operation !== 'string') {
      issues.push({
        field: 'operation',
        type: 'invalid_type',
        description: 'Operation must be a string',
        severity: 'CRITICAL'
      });
    }
    
    // Check if data is present
    if (input.data === undefined) {
      issues.push({
        field: 'data',
        type: 'missing_required_field',
        description: 'Operation data is required',
        severity: 'CRITICAL'
      });
    }
    
    // If options is present, validate it
    if (input.options !== undefined) {
      if (input.options === null || typeof input.options !== 'object') {
        issues.push({
          field: 'options',
          type: 'invalid_type',
          description: 'Options must be an object if provided',
          severity: 'MEDIUM'
        });
      } else {
        // Validate regulation types if provided
        if (input.options.regulationTypes !== undefined) {
          if (!Array.isArray(input.options.regulationTypes)) {
            issues.push({
              field: 'options.regulationTypes',
              type: 'invalid_type',
              description: 'Regulation types must be an array if provided',
              severity: 'MEDIUM'
            });
          } else {
            // Check that each regulation type is valid
            for (const regulationType of input.options.regulationTypes) {
              if (!Object.values(RegulationType).includes(regulationType)) {
                issues.push({
                  field: 'options.regulationTypes',
                  type: 'invalid_value',
                  description: `Invalid regulation type: ${regulationType}`,
                  severity: 'MEDIUM'
                });
              }
            }
          }
        }
        
        // Validate isPublicDisclosure if provided
        if (input.options.isPublicDisclosure !== undefined && typeof input.options.isPublicDisclosure !== 'boolean') {
          issues.push({
            field: 'options.isPublicDisclosure',
            type: 'invalid_type',
            description: 'isPublicDisclosure must be a boolean if provided',
            severity: 'MEDIUM'
          });
        }
        
        // Validate includeFullReferences if provided
        if (input.options.includeFullReferences !== undefined && typeof input.options.includeFullReferences !== 'boolean') {
          issues.push({
            field: 'options.includeFullReferences',
            type: 'invalid_type',
            description: 'includeFullReferences must be a boolean if provided',
            severity: 'LOW'
          });
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      validatedData: input
    };
  }
  
  /**
   * Check compliance for a specific regulation type
   * 
   * @param regulationType The regulation type to check
   * @param operation The operation being performed
   * @param data The operation data
   * @returns Compliance issues
   */
  private async checkComplianceForRegulationType(
    regulationType: RegulationType,
    operation: string,
    data: any
  ): Promise<Array<{
    description: string;
    regulationType: RegulationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reference: LegalReference;
  }>> {
    const issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }> = [];
    
    // Get relevant laws for this regulation type
    const laws = this.washingtonLaws[regulationType];
    
    // Check each law's compliance based on the operation and data
    switch (regulationType) {
      case RegulationType.PROPERTY_TAX:
        await this.checkPropertyTaxCompliance(operation, data, laws, issues);
        break;
        
      case RegulationType.ASSESSMENT_PROCEDURE:
        await this.checkAssessmentProcedureCompliance(operation, data, laws, issues);
        break;
        
      case RegulationType.EXEMPTIONS:
        await this.checkExemptionsCompliance(operation, data, laws, issues);
        break;
        
      case RegulationType.DATA_PRIVACY:
        await this.checkDataPrivacyCompliance(operation, data, laws, issues);
        break;
        
      case RegulationType.PUBLIC_DISCLOSURE:
        await this.checkPublicDisclosureCompliance(operation, data, laws, issues);
        break;
        
      case RegulationType.APPEALS_PROCESS:
        await this.checkAppealsProcessCompliance(operation, data, laws, issues);
        break;
    }
    
    return issues;
  }
  
  /**
   * Check property tax compliance
   * 
   * @param operation The operation being performed
   * @param data The operation data
   * @param laws The relevant laws
   * @param issues The issues array to populate
   */
  private async checkPropertyTaxCompliance(
    operation: string,
    data: any,
    laws: LegalReference[],
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>
  ): Promise<void> {
    // Example implementation for property tax compliance checks
    if (operation === 'update_property_value' || operation === 'create_property') {
      // Check RCW 84.40.020 compliance (assessment date)
      const assessmentDateLaw = laws.find(law => law.citation === 'RCW 84.40.020');
      if (assessmentDateLaw && (!data.assessmentDate || new Date(data.assessmentDate).getFullYear() !== new Date().getFullYear())) {
        issues.push({
          description: 'Assessment date must reference value on January 1st of the current year',
          regulationType: RegulationType.PROPERTY_TAX,
          severity: 'high',
          reference: assessmentDateLaw
        });
      }
      
      // Check RCW 84.40.030 compliance (100% of true and fair value)
      const valuationLaw = laws.find(law => law.citation === 'RCW 84.40.030');
      if (valuationLaw && (data.valueRatio !== undefined && data.valueRatio !== 100)) {
        issues.push({
          description: 'Property must be valued at 100% of its true and fair value in money',
          regulationType: RegulationType.PROPERTY_TAX,
          severity: 'critical',
          reference: valuationLaw
        });
      }
    }
  }
  
  /**
   * Check assessment procedure compliance
   * 
   * @param operation The operation being performed
   * @param data The operation data
   * @param laws The relevant laws
   * @param issues The issues array to populate
   */
  private async checkAssessmentProcedureCompliance(
    operation: string,
    data: any,
    laws: LegalReference[],
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>
  ): Promise<void> {
    // Example implementation for assessment procedure compliance checks
    if (operation === 'update_property_value' || operation === 'create_property') {
      // Check WAC 458-07-025 compliance (valuation criteria)
      const valuationCriteriaLaw = laws.find(law => law.citation === 'WAC 458-07-025');
      if (valuationCriteriaLaw && (!data.valuationMethod || !['market', 'cost', 'income'].includes(data.valuationMethod))) {
        issues.push({
          description: 'Property must be valued using market data, cost approach, or income approach',
          regulationType: RegulationType.ASSESSMENT_PROCEDURE,
          severity: 'medium',
          reference: valuationCriteriaLaw
        });
      }
      
      // Check WAC 458-07-030 compliance (true and fair value)
      const trueFairValueLaw = laws.find(law => law.citation === 'WAC 458-07-030');
      if (trueFairValueLaw && !data.appraisalMethodology) {
        issues.push({
          description: 'Property must be appraised in accordance with generally accepted appraisal practices',
          regulationType: RegulationType.ASSESSMENT_PROCEDURE,
          severity: 'medium',
          reference: trueFairValueLaw
        });
      }
    }
  }
  
  /**
   * Check exemptions compliance
   * 
   * @param operation The operation being performed
   * @param data The operation data
   * @param laws The relevant laws
   * @param issues The issues array to populate
   */
  private async checkExemptionsCompliance(
    operation: string,
    data: any,
    laws: LegalReference[],
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>
  ): Promise<void> {
    // Example implementation for exemptions compliance checks
    if (operation === 'apply_exemption' || operation === 'update_exemption') {
      // Check RCW 84.36 compliance (exemptions)
      const exemptionsLaw = laws.find(law => law.citation === 'RCW 84.36');
      if (exemptionsLaw && (!data.exemptionType || !data.exemptionReason)) {
        issues.push({
          description: 'Exemption must have a valid type and reason as defined in RCW 84.36',
          regulationType: RegulationType.EXEMPTIONS,
          severity: 'high',
          reference: exemptionsLaw
        });
      }
      
      // Check WAC 458-16 compliance (exemption implementation)
      const exemptionImplLaw = laws.find(law => law.citation === 'WAC 458-16');
      if (exemptionImplLaw && data.exemptionType && !data.documentationProvided) {
        issues.push({
          description: 'Proper documentation must be provided for the exemption as required by WAC 458-16',
          regulationType: RegulationType.EXEMPTIONS,
          severity: 'high',
          reference: exemptionImplLaw
        });
      }
    }
  }
  
  /**
   * Check data privacy compliance
   * 
   * @param operation The operation being performed
   * @param data The operation data
   * @param laws The relevant laws
   * @param issues The issues array to populate
   */
  private async checkDataPrivacyCompliance(
    operation: string,
    data: any,
    laws: LegalReference[],
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>
  ): Promise<void> {
    // Example implementation for data privacy compliance checks
    if (operation === 'export_property_data' || operation === 'generate_report') {
      // Check RCW 42.56.230 compliance (personal information)
      const personalInfoLaw = laws.find(law => law.citation === 'RCW 42.56.230');
      if (personalInfoLaw && data.includePersonalInfo && !data.redactedFields) {
        issues.push({
          description: 'Personal information must be redacted in accordance with RCW 42.56.230 exemptions',
          regulationType: RegulationType.DATA_PRIVACY,
          severity: 'critical',
          reference: personalInfoLaw
        });
      }
    }
  }
  
  /**
   * Check public disclosure compliance
   * 
   * @param operation The operation being performed
   * @param data The operation data
   * @param laws The relevant laws
   * @param issues The issues array to populate
   */
  private async checkPublicDisclosureCompliance(
    operation: string,
    data: any,
    laws: LegalReference[],
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>
  ): Promise<void> {
    // Example implementation for public disclosure compliance checks
    if (operation === 'publish_assessment_data' || operation === 'respond_to_public_records_request') {
      // Check RCW 84.40.175 compliance (exempt property listing)
      const exemptPropertyLaw = laws.find(law => law.citation === 'RCW 84.40.175');
      if (exemptPropertyLaw && data.includeExemptProperties && !data.includeExemptPropertyValues) {
        issues.push({
          description: 'Exempt properties must include valuation information as required by RCW 84.40.175',
          regulationType: RegulationType.PUBLIC_DISCLOSURE,
          severity: 'medium',
          reference: exemptPropertyLaw
        });
      }
    }
  }
  
  /**
   * Check appeals process compliance
   * 
   * @param operation The operation being performed
   * @param data The operation data
   * @param laws The relevant laws
   * @param issues The issues array to populate
   */
  private async checkAppealsProcessCompliance(
    operation: string,
    data: any,
    laws: LegalReference[],
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>
  ): Promise<void> {
    // Example implementation for appeals process compliance checks
    if (operation === 'process_appeal' || operation === 'respond_to_appeal') {
      // Check RCW 84.48.010 compliance (county board of equalization)
      const boardOfEqualizationLaw = laws.find(law => law.citation === 'RCW 84.48.010');
      if (boardOfEqualizationLaw && !data.boardOfEqualizationReview) {
        issues.push({
          description: 'Appeals must be reviewed by the county board of equalization as required by RCW 84.48.010',
          regulationType: RegulationType.APPEALS_PROCESS,
          severity: 'high',
          reference: boardOfEqualizationLaw
        });
      }
    }
  }
  
  /**
   * Generate recommendations based on compliance issues
   * 
   * @param issues The compliance issues
   * @param operation The operation being performed
   * @returns Array of recommendations
   */
  private generateRecommendations(
    issues: Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>,
    operation: string
  ): string[] {
    const recommendations: string[] = [];
    
    // Group issues by regulation type
    const issuesByType: Record<RegulationType, Array<{
      description: string;
      regulationType: RegulationType;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reference: LegalReference;
    }>> = {};
    
    for (const issue of issues) {
      if (!issuesByType[issue.regulationType]) {
        issuesByType[issue.regulationType] = [];
      }
      issuesByType[issue.regulationType].push(issue);
    }
    
    // Generate recommendations based on issue types
    if (issuesByType[RegulationType.PROPERTY_TAX]) {
      recommendations.push(
        'Ensure property tax assessments comply with Washington State laws regarding assessment date and valuation methods (RCW 84.40)'
      );
    }
    
    if (issuesByType[RegulationType.ASSESSMENT_PROCEDURE]) {
      recommendations.push(
        'Follow proper assessment procedures including revaluation requirements and valuation criteria (WAC 458-07)'
      );
    }
    
    if (issuesByType[RegulationType.EXEMPTIONS]) {
      recommendations.push(
        'Verify that all property tax exemptions are properly documented and meet eligibility requirements (RCW 84.36)'
      );
    }
    
    if (issuesByType[RegulationType.DATA_PRIVACY]) {
      recommendations.push(
        'Protect personal information according to Washington State data privacy laws (RCW 42.56)'
      );
    }
    
    if (issuesByType[RegulationType.PUBLIC_DISCLOSURE]) {
      recommendations.push(
        'Ensure public disclosures include all required information while protecting exempt data (RCW 84.40.175)'
      );
    }
    
    if (issuesByType[RegulationType.APPEALS_PROCESS]) {
      recommendations.push(
        'Follow proper appeals process procedures including board of equalization review (RCW 84.48)'
      );
    }
    
    // Add operation-specific recommendations
    if (operation === 'update_property_value') {
      recommendations.push(
        'Document the valuation methodology used (market, cost, or income approach) to support the assessment'
      );
    } else if (operation === 'apply_exemption') {
      recommendations.push(
        'Collect and maintain all documentation required to support the exemption status'
      );
    } else if (operation === 'process_appeal') {
      recommendations.push(
        'Ensure the property owner is notified of appeal rights and deadlines'
      );
    }
    
    // Add general recommendation if there are issues
    if (issues.length > 0) {
      recommendations.push(
        'Consult with legal counsel to ensure full compliance with Washington State property assessment laws and regulations'
      );
    }
    
    return recommendations;
  }
  
  /**
   * Check if a legal reference is relevant to an operation
   * 
   * @param reference The legal reference
   * @param operation The operation
   * @returns Whether the reference is relevant
   */
  private isRelevantToOperation(reference: LegalReference, operation: string): boolean {
    // Map operations to relevant citations
    const operationCitationMap: Record<string, string[]> = {
      'update_property_value': ['RCW 84.40.020', 'RCW 84.40.030', 'WAC 458-07-025', 'WAC 458-07-030'],
      'create_property': ['RCW 84.40.020', 'RCW 84.40.030', 'WAC 458-07-025', 'WAC 458-07-030'],
      'apply_exemption': ['RCW 84.36', 'WAC 458-16'],
      'update_exemption': ['RCW 84.36', 'WAC 458-16'],
      'export_property_data': ['RCW 42.56.070', 'RCW 42.56.230'],
      'generate_report': ['RCW 42.56.070', 'RCW 42.56.230'],
      'publish_assessment_data': ['RCW 84.40.175', 'RCW 84.48.150'],
      'respond_to_public_records_request': ['RCW 42.56.070', 'RCW 42.56.230', 'RCW 84.40.175'],
      'process_appeal': ['RCW 84.48.010', 'RCW 84.08.130'],
      'respond_to_appeal': ['RCW 84.48.010', 'RCW 84.08.130'],
      'revalue_property': ['RCW 84.41.030', 'WAC 458-07-015', 'WAC 458-07-025', 'WAC 458-07-030']
    };
    
    // If operation is in the map, check if citation is relevant
    if (operation in operationCitationMap) {
      return operationCitationMap[operation].includes(reference.citation);
    }
    
    // Default to true for unknown operations
    return true;
  }
}