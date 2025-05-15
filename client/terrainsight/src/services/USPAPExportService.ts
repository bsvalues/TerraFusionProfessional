import { saveAs } from 'file-saver';
import { 
  USPAPReportData, 
  ExportFormat, 
  ExportTemplate, 
  USPAPExportOptions,
  ExportResult,
  PropertyComparable,
  IncomeAnalysis,
  CostAnalysis,
  USPAPComplianceConfig
} from './exportService';

// Default USPAP compliance configuration
export const DEFAULT_USPAP_CONFIG: USPAPComplianceConfig = {
  includeLetterOfTransmittal: true,
  includeCertification: true,
  includeAssumptionsAndLimitingConditions: true,
  includeAppraiserQualifications: true,
  includeConfidentialityStatement: true,
  includeNonDiscriminationStatement: true,
  includeScopeOfWork: true,
  signatureRequired: true
};

// USPAP standard certification text
const USPAP_CERTIFICATION = `
I certify that, to the best of my knowledge and belief:

- The statements of fact contained in this report are true and correct.
- The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.
- I have no (or the specified) present or prospective interest in the property that is the subject of this report and no (or the specified) personal interest with respect to the parties involved.
- I have performed no (or the specified) services, as an appraiser or in any other capacity, regarding the property that is the subject of this report within the three-year period immediately preceding the agreement to perform this assignment.
- I have no bias with respect to the property that is the subject of this report or to the parties involved with this assignment.
- My engagement in this assignment was not contingent upon developing or reporting predetermined results.
- My compensation for completing this assignment is not contingent upon the development or reporting of a predetermined value or direction in value that favors the cause of the client, the amount of the value opinion, the attainment of a stipulated result, or the occurrence of a subsequent event directly related to the intended use of this appraisal.
- My analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the Uniform Standards of Professional Appraisal Practice (USPAP).
- I have (or have not) made a personal inspection of the property that is the subject of this report.
- No one provided significant real property appraisal assistance to the person signing this certification.
`;

// USPAP standard assumptions and limiting conditions
const USPAP_STANDARD_ASSUMPTIONS = [
  "The appraiser assumes no responsibility for matters of a legal nature affecting the property appraised or its title.",
  "The appraiser assumes the property is free and clear of liens or encumbrances unless otherwise stated.",
  "Information furnished by others is believed to be reliable, but the appraiser does not guarantee its accuracy.",
  "All maps, plats, and exhibits included herein are for illustration only, as an aid in visualizing matters discussed within the report.",
  "The appraiser has made no survey of the property and assumes no responsibility in connection with such matters.",
  "Possession of this report does not carry with it the right of publication.",
  "The appraiser, by reason of this appraisal, is not required to give testimony or to be in attendance in court with reference to the property unless arrangements have been previously made.",
  "The distribution of value between land and improvements, if applicable, represents our judgment only under the existing utilization and is not to be used in conjunction with any other appraisal."
];

// Non-discrimination statement
const NON_DISCRIMINATION_STATEMENT = `
This appraisal has been prepared in compliance with all applicable fair housing and non-discrimination laws. The appraiser has considered all factors influencing value without regard to race, color, religion, sex, handicap, familial status, national origin, sexual orientation, or gender identity.
`;

// Confidentiality statement
const CONFIDENTIALITY_STATEMENT = `
The contents of this appraisal report are confidential and for the exclusive use of the client and intended users identified herein. This report may not be distributed to or relied upon by any other party without express written consent.
`;

/**
 * Formats USPAPReportData into a standardized text report format
 */
const formatUSPAPReportText = (report: USPAPReportData, config: USPAPComplianceConfig): string => {
  let reportText = `
=======================================================
${report.title.toUpperCase()}
=======================================================
File Number: ${report.fileNumber}
Property Address: ${report.propertyAddress || 'N/A'}
Property Type: ${report.propertyType || 'N/A'}
Effective Date: ${report.effectiveDate}
Report Date: ${report.reportDate}
=======================================================

`;

  // Letter of transmittal
  if (config.includeLetterOfTransmittal) {
    reportText += `
LETTER OF TRANSMITTAL
-------------------------------------------------------
${report.reportDate}

${report.clientName}
RE: Appraisal of ${report.propertyAddress || 'Subject Property'}

Dear ${report.clientName},

In accordance with your request, I have prepared an appraisal report for the above-referenced property. This report is intended for use by ${report.intendedUser} for ${report.intendedUse}.

The value conclusion reported is subject to the assumptions and limiting conditions contained in this report.

Respectfully submitted,

${report.appraiserName}
${report.appraiserCredentials}

-------------------------------------------------------
`;
  }

  // Executive Summary
  reportText += `
EXECUTIVE SUMMARY
-------------------------------------------------------
${report.executiveSummary}

`;

  // Scope of Work
  if (config.includeScopeOfWork) {
    reportText += `
SCOPE OF WORK
-------------------------------------------------------
${report.scopeOfWork}

`;
  }

  // Property Description
  if (report.propertyDescription) {
    reportText += `
PROPERTY DESCRIPTION
-------------------------------------------------------
${report.propertyDescription}

`;
  }

  // Neighborhood Analysis
  if (report.neighborhoodAnalysis) {
    reportText += `
NEIGHBORHOOD ANALYSIS
-------------------------------------------------------
${report.neighborhoodAnalysis}

`;
  }

  // Market Analysis
  if (report.marketAnalysis) {
    reportText += `
MARKET ANALYSIS
-------------------------------------------------------
${report.marketAnalysis}

`;
  }

  // Highest and Best Use
  if (report.highestAndBestUse) {
    reportText += `
HIGHEST AND BEST USE
-------------------------------------------------------
${report.highestAndBestUse}

`;
  }

  // Valuation Analysis
  reportText += `
VALUATION ANALYSIS
-------------------------------------------------------
Valuation Approach: ${report.valuationApproach.toUpperCase()}

${report.valuationAnalysis}

`;

  // Sales Comparison Approach Details
  if (report.comparableSales && report.comparableSales.length > 0) {
    reportText += `
SALES COMPARISON APPROACH
-------------------------------------------------------
Comparable Sales:
${formatComparableSales(report.comparableSales)}

`;
  }

  // Income Approach Details
  if (report.incomeAnalysis) {
    reportText += `
INCOME APPROACH
-------------------------------------------------------
${formatIncomeAnalysis(report.incomeAnalysis)}

`;
  }

  // Cost Approach Details
  if (report.costAnalysis) {
    reportText += `
COST APPROACH
-------------------------------------------------------
${formatCostAnalysis(report.costAnalysis)}

`;
  }

  // Reconciliation
  if (report.reconciliation) {
    reportText += `
RECONCILIATION
-------------------------------------------------------
${report.reconciliation}

`;
  }

  // Value Conclusion
  reportText += `
VALUE CONCLUSION
-------------------------------------------------------
`;

  if (report.valueConclusion) {
    reportText += `Final Value Estimate: $${report.valueConclusion.toLocaleString()}
`;
  } else if (report.valueConclusionRangeMin && report.valueConclusionRangeMax) {
    reportText += `Value Range: $${report.valueConclusionRangeMin.toLocaleString()} to $${report.valueConclusionRangeMax.toLocaleString()}
`;
  }

  // Assumptions and Limiting Conditions
  if (config.includeAssumptionsAndLimitingConditions) {
    reportText += `
ASSUMPTIONS AND LIMITING CONDITIONS
-------------------------------------------------------
${report.assumptionsAndLimitingConditions.join('\n\n')}

`;
  }

  // Certification
  if (config.includeCertification) {
    reportText += `
CERTIFICATION
-------------------------------------------------------
${report.certificationStatement || USPAP_CERTIFICATION}

`;
  }

  // Non-discrimination statement
  if (config.includeNonDiscriminationStatement) {
    reportText += `
NON-DISCRIMINATION STATEMENT
-------------------------------------------------------
${NON_DISCRIMINATION_STATEMENT}

`;
  }

  // Confidentiality Statement
  if (config.includeConfidentialityStatement) {
    reportText += `
CONFIDENTIALITY STATEMENT
-------------------------------------------------------
${CONFIDENTIALITY_STATEMENT}

`;
  }

  // Appraiser Qualifications
  if (config.includeAppraiserQualifications) {
    reportText += `
APPRAISER QUALIFICATIONS
-------------------------------------------------------
Name: ${report.appraiserName}
Credentials: ${report.appraiserCredentials}
Certification: ${report.appraiserCertification || 'N/A'}

`;
  }

  // Signature block
  if (config.signatureRequired) {
    reportText += `
=======================================================
SIGNATURE
-------------------------------------------------------
Appraiser: ${report.appraiserName}
Date: ${report.reportDate}
=======================================================
`;
  }

  return reportText;
};

/**
 * Helper function to format comparable sales data
 */
const formatComparableSales = (comparables: PropertyComparable[]): string => {
  let text = '';
  
  comparables.forEach((comp, index) => {
    text += `Comparable ${index + 1}: ${comp.address}\n`;
    text += `  Sale Date: ${comp.saleDate || 'N/A'}\n`;
    text += `  Sale Price: ${comp.salePrice ? '$' + comp.salePrice.toLocaleString() : 'N/A'}\n`;
    text += `  Property Type: ${comp.propertyType || 'N/A'}\n`;
    text += `  Land Area: ${comp.landArea ? comp.landArea.toLocaleString() + ' sq ft' : 'N/A'}\n`;
    text += `  Building Area: ${comp.buildingArea ? comp.buildingArea.toLocaleString() + ' sq ft' : 'N/A'}\n`;
    text += `  Year Built: ${comp.yearBuilt || 'N/A'}\n`;
    
    if (comp.adjustments && Object.keys(comp.adjustments).length > 0) {
      text += `  Adjustments:\n`;
      for (const [key, adjustment] of Object.entries(comp.adjustments)) {
        text += `    ${key}: $${adjustment.amount.toLocaleString()} (${adjustment.percentage}%)\n`;
      }
    }
    
    if (comp.adjustedPrice) {
      text += `  Adjusted Price: $${comp.adjustedPrice.toLocaleString()}\n`;
    }
    
    if (comp.notes) {
      text += `  Notes: ${comp.notes}\n`;
    }
    
    text += '\n';
  });
  
  return text;
};

/**
 * Helper function to format income analysis data
 */
const formatIncomeAnalysis = (income: IncomeAnalysis): string => {
  let text = '';
  
  text += `Potential Gross Income: $${income.potentialGrossIncome.toLocaleString()}\n`;
  text += `Vacancy and Collection Loss: $${income.vacancyAndCollectionLoss.toLocaleString()}\n`;
  text += `Effective Gross Income: $${income.effectiveGrossIncome.toLocaleString()}\n\n`;
  
  text += `Operating Expenses:\n`;
  for (const [category, amount] of Object.entries(income.operatingExpenses)) {
    text += `  ${category}: $${amount.toLocaleString()}\n`;
  }
  
  text += `\nNet Operating Income: $${income.netOperatingIncome.toLocaleString()}\n`;
  text += `Capitalization Rate: ${(income.capitalizationRate * 100).toFixed(2)}%\n`;
  text += `Value Indication: $${income.valueIndication.toLocaleString()}\n`;
  
  return text;
};

/**
 * Helper function to format cost analysis data
 */
const formatCostAnalysis = (cost: CostAnalysis): string => {
  let text = '';
  
  text += `Land Value: $${cost.landValue.toLocaleString()}\n\n`;
  text += `Improvement Cost:\n`;
  text += `  Replacement Cost: $${cost.improvementCost.replacementCost.toLocaleString()}\n`;
  text += `  Physical Depreciation: $${cost.improvementCost.physicalDepreciation.toLocaleString()}\n`;
  text += `  Functional Obsolescence: $${cost.improvementCost.functionalObsolescence.toLocaleString()}\n`;
  text += `  Economic Obsolescence: $${cost.improvementCost.economicObsolescence.toLocaleString()}\n\n`;
  
  text += `Total Depreciation: $${cost.totalDepreciation.toLocaleString()}\n`;
  text += `Depreciated Improvement Value: $${cost.deprecatedImprovementValue.toLocaleString()}\n\n`;
  text += `Total Value Indication: $${cost.totalValueIndication.toLocaleString()}\n`;
  
  return text;
};

/**
 * USPAP Export Service class provides specialized export functionality
 * for appraisal reports that comply with Uniform Standards of Professional Appraisal Practice
 */
export class USPAPExportService {
  /**
   * Export a USPAP-compliant appraisal report to text format
   */
  static async exportToText(report: USPAPReportData, options?: Partial<USPAPExportOptions>): Promise<ExportResult> {
    try {
      // Use default compliance config if not provided
      const complianceConfig = options?.compliance || DEFAULT_USPAP_CONFIG;
      
      // Generate report text content
      const reportText = formatUSPAPReportText(report, complianceConfig);
      
      // Create safe filename from property address or title
      const safeTitle = (report.propertyAddress || report.title).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `appraisal-report-${safeTitle}-${report.effectiveDate.replace(/\//g, '-')}.txt`;
      
      // Create a Blob with the content
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, fileName);
      
      return {
        success: true,
        fileName,
        count: 1
      };
    } catch (error) {
      console.error('Error exporting USPAP report to text:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during export'
      };
    }
  }
  
  /**
   * Export a USPAP-compliant appraisal report to HTML format
   */
  static async exportToHTML(report: USPAPReportData, options?: Partial<USPAPExportOptions>): Promise<ExportResult> {
    try {
      // Use default compliance config if not provided
      const complianceConfig = options?.compliance || DEFAULT_USPAP_CONFIG;
      
      // Create safe filename from property address or title
      const safeTitle = (report.propertyAddress || report.title).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `appraisal-report-${safeTitle}-${report.effectiveDate.replace(/\//g, '-')}.html`;
      
      // Generate HTML content (simplified version)
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} - Appraisal Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 30px; line-height: 1.6; color: #333; }
    .header { border-bottom: 2px solid #444; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { background: #f2f2f2; padding: 10px; margin-bottom: 15px; font-weight: bold; }
    .footer { margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table, th, td { border: 1px solid #ddd; }
    th, td { padding: 10px; text-align: left; }
    th { background-color: #f2f2f2; }
    @media print {
      body { padding: 0; font-size: 12pt; }
      .page-break { page-break-after: always; }
    }
    ${options?.watermark ? `
    body::before {
      content: "${options.watermark}";
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(200, 200, 200, 0.3);
      z-index: -1;
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <p><strong>File Number:</strong> ${report.fileNumber}</p>
    <p><strong>Property Address:</strong> ${report.propertyAddress || 'N/A'}</p>
    <p><strong>Property Type:</strong> ${report.propertyType || 'N/A'}</p>
    <p><strong>Effective Date:</strong> ${report.effectiveDate}</p>
    <p><strong>Report Date:</strong> ${report.reportDate}</p>
  </div>

  ${complianceConfig.includeLetterOfTransmittal ? `
  <div class="section">
    <div class="section-title">LETTER OF TRANSMITTAL</div>
    <p>${report.reportDate}</p>
    <p>${report.clientName}</p>
    <p>RE: Appraisal of ${report.propertyAddress || 'Subject Property'}</p>
    <p>Dear ${report.clientName},</p>
    <p>In accordance with your request, I have prepared an appraisal report for the above-referenced property. This report is intended for use by ${report.intendedUser} for ${report.intendedUse}.</p>
    <p>The value conclusion reported is subject to the assumptions and limiting conditions contained in this report.</p>
    <p>Respectfully submitted,</p>
    <p>${report.appraiserName}<br>${report.appraiserCredentials}</p>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">EXECUTIVE SUMMARY</div>
    <p>${report.executiveSummary}</p>
  </div>

  ${complianceConfig.includeScopeOfWork ? `
  <div class="section">
    <div class="section-title">SCOPE OF WORK</div>
    <p>${report.scopeOfWork}</p>
  </div>
  ` : ''}

  ${report.propertyDescription ? `
  <div class="section">
    <div class="section-title">PROPERTY DESCRIPTION</div>
    <p>${report.propertyDescription}</p>
  </div>
  ` : ''}

  ${report.neighborhoodAnalysis ? `
  <div class="section">
    <div class="section-title">NEIGHBORHOOD ANALYSIS</div>
    <p>${report.neighborhoodAnalysis}</p>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">VALUATION ANALYSIS</div>
    <p><strong>Valuation Approach:</strong> ${report.valuationApproach.toUpperCase()}</p>
    <p>${report.valuationAnalysis}</p>
  </div>

  <div class="section">
    <div class="section-title">VALUE CONCLUSION</div>
    ${report.valueConclusion ? 
      `<p><strong>Final Value Estimate:</strong> $${report.valueConclusion.toLocaleString()}</p>` : 
      (report.valueConclusionRangeMin && report.valueConclusionRangeMax ? 
        `<p><strong>Value Range:</strong> $${report.valueConclusionRangeMin.toLocaleString()} to $${report.valueConclusionRangeMax.toLocaleString()}</p>` : 
        '')
    }
  </div>

  ${complianceConfig.includeAssumptionsAndLimitingConditions ? `
  <div class="section">
    <div class="section-title">ASSUMPTIONS AND LIMITING CONDITIONS</div>
    <ul>
      ${report.assumptionsAndLimitingConditions.map(condition => `<li>${condition}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${complianceConfig.includeCertification ? `
  <div class="section">
    <div class="section-title">CERTIFICATION</div>
    <p>${report.certificationStatement || USPAP_CERTIFICATION}</p>
  </div>
  ` : ''}

  ${complianceConfig.signatureRequired ? `
  <div class="section">
    <div class="section-title">SIGNATURE</div>
    <p><strong>Appraiser:</strong> ${report.appraiserName}</p>
    <p><strong>Date:</strong> ${report.reportDate}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by GeospatialAnalyzerBS - Benton County Assessor's Office</p>
    <p>Copyright © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
      `;
      
      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      saveAs(blob, fileName);
      
      return {
        success: true,
        fileName,
        count: 1
      };
    } catch (error) {
      console.error('Error exporting USPAP report to HTML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during export'
      };
    }
  }
  
  /**
   * Export a USPAP report using specified format and template
   */
  static async exportReport(
    report: USPAPReportData, 
    format: ExportFormat = ExportFormat.PDF,
    options?: Partial<USPAPExportOptions>
  ): Promise<ExportResult> {
    try {
      // Select appropriate export method based on format
      switch (format) {
        case ExportFormat.TEXT:
          return this.exportToText(report, options);
          
        case ExportFormat.HTML:
          return this.exportToHTML(report, options);
          
        case ExportFormat.PDF:
          // In a real implementation, would convert to PDF
          // For now, just return HTML with a note
          const htmlResult = await this.exportToHTML(report, options);
          if (htmlResult.success) {
            return {
              ...htmlResult,
              error: 'PDF export is simulated using HTML - PDF functionality coming soon'
            };
          }
          return htmlResult;
          
        case ExportFormat.WORD:
          // In a real implementation, would format as DOCX
          // For now, just return text with a note
          const textResult = await this.exportToText(report, options);
          if (textResult.success) {
            return {
              ...textResult,
              error: 'Word export is simulated using text - DOCX functionality coming soon'
            };
          }
          return textResult;
          
        default:
          throw new Error(`Export format ${format} is not yet supported for USPAP reports`);
      }
    } catch (error) {
      console.error('Error exporting USPAP report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during export'
      };
    }
  }
  
  /**
   * Create a USPAP-compliant report using a template
   */
  static async exportWithTemplate(
    data: any,
    template: ExportTemplate,
    format: ExportFormat = ExportFormat.PDF,
    options?: Partial<USPAPExportOptions>
  ): Promise<ExportResult> {
    try {
      // In a real implementation, this would use the template to create a report structure
      // For now, create a simple USPAP report structure based on template
      const reportData: USPAPReportData = {
        title: `${template.replace(/-/g, ' ').toUpperCase()} REPORT`,
        fileNumber: `TEMPLATE-${Math.floor(Math.random() * 10000)}`,
        propertyAddress: data.address || '123 Sample Street, Benton County, WA',
        propertyType: data.propertyType || 'Commercial',
        clientName: 'Benton County Assessor\'s Office',
        intendedUser: 'Benton County Assessor\'s Office',
        intendedUse: 'Property tax assessment',
        effectiveDate: new Date().toLocaleDateString(),
        reportDate: new Date().toLocaleDateString(),
        
        valuationApproach: template.includes('income') ? 'income' : 
                          template.includes('sales') ? 'sales' : 
                          template.includes('cost') ? 'cost' : 'multiple',
        
        appraiserName: 'County Appraiser',
        appraiserCredentials: 'Certified Assessor',
        
        executiveSummary: `This is a template-generated report for demonstration purposes based on the ${template} template.`,
        scopeOfWork: 'This report is intended to demonstrate the export capabilities of the GeospatialAnalyzerBS system.',
        assumptionsAndLimitingConditions: USPAP_STANDARD_ASSUMPTIONS,
        valuationAnalysis: 'This analysis would contain the detailed valuation methodology appropriate to the selected approach.',
        certificationStatement: USPAP_CERTIFICATION,
        
        tags: [template, format, 'template-generated'],
        lastModified: new Date().toISOString()
      };
      
      // Export the report using the appropriate format
      return this.exportReport(reportData, format, options);
    } catch (error) {
      console.error('Error exporting with USPAP template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during export'
      };
    }
  }
  
  /**
   * Generate a sample USPAP-compliant report for testing
   */
  static getSampleUSPAPReport(): USPAPReportData {
    return {
      title: 'COMMERCIAL PROPERTY APPRAISAL REPORT',
      fileNumber: 'BC-2024-0421',
      propertyAddress: '750 George Washington Way, Richland, WA 99352',
      propertyType: 'Commercial - Retail',
      clientName: 'Benton County Assessor\'s Office',
      intendedUser: 'Benton County Assessor\'s Office',
      intendedUse: 'Property tax assessment',
      effectiveDate: '04/01/2024',
      reportDate: '04/03/2024',
      
      valuationApproach: 'multiple',
      valueConclusion: 1250000,
      
      appraiserName: 'Jane Smith',
      appraiserCredentials: 'Certified General Appraiser #CG12345',
      appraiserCertification: 'Washington State',
      
      executiveSummary: 'This report presents an appraisal of the commercial retail property located at 750 George Washington Way in Richland, WA. The analysis concludes a market value of $1,250,000 as of April 1, 2024, using a combination of income, sales comparison, and cost approaches to value.',
      
      scopeOfWork: 'This appraisal involved inspection of the subject property, research of market data, analysis of the property\'s highest and best use, and application of the income, sales comparison, and cost approaches to value. Public records, market data services, and interviews with market participants were utilized as data sources.',
      
      assumptionsAndLimitingConditions: [
        ...USPAP_STANDARD_ASSUMPTIONS,
        "This appraisal assumes all building systems are in working order unless otherwise noted.",
        "No environmental issues affecting the property value were observed, but the appraiser is not qualified to detect such conditions."
      ],
      
      neighborhoodAnalysis: 'The subject property is located in the central business district of Richland, WA. The area features a mix of retail, office, and residential uses with good access to major transportation routes. Recent infrastructure improvements have positively impacted property values in the area.',
      
      marketAnalysis: 'The commercial retail market in Benton County has shown stable growth over the past 24 months, with vacancy rates decreasing from 8.5% to 6.2%. Lease rates have increased approximately 3.1% annually, primarily driven by limited new construction and strong demand from service-oriented businesses.',
      
      propertyDescription: 'The subject is a 5,200 square foot retail building constructed in 2005 on a 0.48-acre site. The building features modern finishes, an open retail floor plan, and 25 parking spaces. It is currently leased to a national tenant with 4 years remaining on the lease term.',
      
      highestAndBestUse: 'The highest and best use of the property as improved is its current use as a retail establishment, which is legally permissible, physically possible, financially feasible, and maximally productive.',
      
      valuationAnalysis: 'Three approaches to value were applied in this appraisal: the Income Approach, the Sales Comparison Approach, and the Cost Approach. The Income Approach was given primary consideration due to the property\'s investment characteristics and current lease structure.',
      
      reconciliation: 'The Income Approach indicated a value of $1,275,000, the Sales Comparison Approach indicated $1,230,000, and the Cost Approach indicated $1,245,000. After reconciliation, with primary weight given to the Income Approach, the final value conclusion is $1,250,000.',
      
      // Supporting elements
      comparableSales: [
        {
          address: '425 Columbia Center Blvd, Kennewick, WA',
          saleDate: '11/15/2023',
          salePrice: 1150000,
          propertyType: 'Retail',
          landArea: 21000,
          buildingArea: 4800,
          yearBuilt: 2007,
          adjustments: {
            'Size': { amount: 15000, percentage: 1.3, reason: 'Subject is larger' },
            'Location': { amount: 45000, percentage: 3.9, reason: 'Subject has superior location' },
            'Age/Condition': { amount: -10000, percentage: -0.9, reason: 'Comparable is newer' }
          },
          adjustedPrice: 1200000,
          notes: 'Similar retail use with national tenant'
        },
        {
          address: '1835 Leslie Rd, Richland, WA',
          saleDate: '02/08/2024',
          salePrice: 1325000,
          propertyType: 'Retail',
          landArea: 24000,
          buildingArea: 5500,
          yearBuilt: 2001,
          adjustments: {
            'Size': { amount: -12000, percentage: -0.9, reason: 'Comparable is larger' },
            'Location': { amount: -35000, percentage: -2.6, reason: 'Comparable has superior location' },
            'Age/Condition': { amount: 25000, percentage: 1.9, reason: 'Subject is newer' }
          },
          adjustedPrice: 1303000,
          notes: 'Corner lot with similar visibility'
        }
      ],
      
      incomeAnalysis: {
        potentialGrossIncome: 120000,
        vacancyAndCollectionLoss: 6000,
        effectiveGrossIncome: 114000,
        operatingExpenses: {
          'Property Taxes': 12500,
          'Insurance': 4800,
          'Maintenance': 6200,
          'Management': 5700,
          'Utilities': 3800
        },
        netOperatingIncome: 81000,
        capitalizationRate: 0.0635,
        valueIndication: 1275591,
      },
      
      costAnalysis: {
        landValue: 350000,
        improvementCost: {
          replacementCost: 980000,
          physicalDepreciation: 98000,
          functionalObsolescence: 22000,
          economicObsolescence: 15000
        },
        totalDepreciation: 135000,
        deprecatedImprovementValue: 845000,
        totalValueIndication: 1195000,
      },
      
      certificationStatement: USPAP_CERTIFICATION,
      
      tags: ['Commercial', 'Retail', 'Benton County', '2024'],
      lastModified: new Date().toISOString()
    };
  }
}