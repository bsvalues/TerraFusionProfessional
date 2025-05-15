import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FormTemplate, FormField, FormSection, FieldValidation } from '../types';

/**
 * Parser for TOTAL XFR form files
 * XFR files are XML-based form definition files used by a la mode TOTAL
 */
export class XfrFormParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true,
      parseAttributeValue: true,
    });
  }

  /**
   * Parse an XFR file and convert it to TerraFusionPro form template
   * @param filePath Path to the XFR file
   */
  public async parseFile(filePath: string): Promise<FormTemplate> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return this.parseContent(fileContent, path.basename(filePath));
    } catch (error) {
      console.error(`Error parsing XFR file ${filePath}:`, error);
      throw new Error(`Failed to parse XFR file: ${error.message}`);
    }
  }

  /**
   * Parse XFR content string and convert it to TerraFusionPro form template
   * @param content XFR file content as string
   * @param sourceName Source name for reference (e.g., filename)
   */
  public parseContent(content: string, sourceName: string): FormTemplate {
    try {
      // Parse the XML content
      const parsedXml = this.xmlParser.parse(content);
      
      // Extract form metadata
      const formMetadata = this.extractFormMetadata(parsedXml, sourceName);
      
      // Extract form sections and fields
      const { sections, fields } = this.extractFormStructure(parsedXml);
      
      // Create the form template
      const formTemplate: FormTemplate = {
        code: formMetadata.code,
        name: formMetadata.name,
        version: formMetadata.version,
        schema: {
          fields,
          validations: this.extractValidations(parsedXml, fields),
        },
        layout: {
          sections,
          pageLayout: this.extractPageLayout(parsedXml),
        },
        metadata: {
          source: 'total-xfr',
          sourceFile: sourceName,
          originalMetadata: formMetadata.originalMetadata,
          conversionDate: new Date().toISOString(),
        },
      };
      
      return formTemplate;
    } catch (error) {
      console.error(`Error parsing XFR content from ${sourceName}:`, error);
      throw new Error(`Failed to parse XFR content: ${error.message}`);
    }
  }

  /**
   * Extract form metadata from parsed XML
   */
  private extractFormMetadata(parsedXml: any, sourceName: string): {
    code: string;
    name: string;
    version: string;
    originalMetadata: any;
  } {
    const form = parsedXml.FORM || parsedXml.Form || {};
    const formName = form.NAME || form.Name || 'Unknown Form';
    
    // Try to determine form code from form name or other attributes
    let formCode = '';
    if (formName.includes('1004') || formName.includes('URAR')) {
      formCode = 'urar';
    } else if (formName.includes('1073')) {
      formCode = '1073';
    } else if (formName.includes('2055')) {
      formCode = '2055';
    } else {
      // Extract from filename or path as fallback
      const match = sourceName.match(/([0-9]{4})/);
      formCode = match ? match[1] : 'custom';
    }
    
    return {
      code: formCode,
      name: formName,
      version: form.VERSION || form.Version || '1.0',
      originalMetadata: {
        // Store original metadata for reference
        name: formName,
        version: form.VERSION || form.Version,
        creator: form.CREATOR || form.Creator,
        date: form.DATE || form.Date,
        // Add any other relevant metadata from the XFR file
      },
    };
  }

  /**
   * Extract form sections and fields from parsed XML
   */
  private extractFormStructure(parsedXml: any): {
    sections: FormSection[];
    fields: Record<string, FormField>;
  } {
    const form = parsedXml.FORM || parsedXml.Form || {};
    const pages = Array.isArray(form.PAGE) ? form.PAGE : [form.PAGE];
    
    const sections: FormSection[] = [];
    const fields: Record<string, FormField> = {};
    
    // Process each page
    pages.forEach((page, pageIndex) => {
      // Process sections on the page
      const pageSections = this.extractSectionsFromPage(page, pageIndex);
      sections.push(...pageSections);
      
      // Process fields on the page
      const pageFields = this.extractFieldsFromPage(page, pageIndex);
      Object.assign(fields, pageFields);
    });
    
    return { sections, fields };
  }

  /**
   * Extract sections from a page
   */
  private extractSectionsFromPage(page: any, pageIndex: number): FormSection[] {
    const sections: FormSection[] = [];
    
    // Check for explicitly defined sections
    const xmlSections = page.SECTION || page.Section;
    if (xmlSections) {
      const sectionList = Array.isArray(xmlSections) ? xmlSections : [xmlSections];
      
      sectionList.forEach((section, sectionIndex) => {
        sections.push({
          id: `page${pageIndex}_section${sectionIndex}`,
          title: section.TITLE || section.Title || `Section ${sectionIndex + 1}`,
          order: sectionIndex,
          pageIndex,
          position: {
            x: Number(section.X || 0),
            y: Number(section.Y || 0),
            width: Number(section.WIDTH || 100),
            height: Number(section.HEIGHT || 100),
          },
        });
      });
    } else {
      // Create a default section for the page if none defined
      sections.push({
        id: `page${pageIndex}_main`,
        title: `Page ${pageIndex + 1}`,
        order: 0,
        pageIndex,
        position: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      });
    }
    
    return sections;
  }

  /**
   * Extract fields from a page
   */
  private extractFieldsFromPage(page: any, pageIndex: number): Record<string, FormField> {
    const fields: Record<string, FormField> = {};
    
    // Process field elements
    const xmlFields = page.FIELD || page.Field;
    if (xmlFields) {
      const fieldList = Array.isArray(xmlFields) ? xmlFields : [xmlFields];
      
      fieldList.forEach((field) => {
        const fieldId = this.sanitizeFieldId(field.ID || field.Id || `field_${Math.random().toString(36).substr(2, 9)}`);
        
        fields[fieldId] = {
          id: fieldId,
          label: field.LABEL || field.Label || '',
          type: this.mapFieldType(field.TYPE || field.Type),
          required: Boolean(field.REQUIRED || field.Required),
          readOnly: Boolean(field.READONLY || field.ReadOnly),
          defaultValue: field.DEFAULT || field.Default || '',
          options: this.extractFieldOptions(field),
          position: {
            pageIndex,
            x: Number(field.X || 0),
            y: Number(field.Y || 0),
            width: Number(field.WIDTH || 100),
            height: Number(field.HEIGHT || 24),
          },
          styling: {
            fontFamily: field.FONT || field.Font || 'Arial',
            fontSize: Number(field.FONTSIZE || field.FontSize || 10),
            alignment: field.ALIGN || field.Align || 'left',
          },
          // Map additional field properties as needed
        };
      });
    }
    
    return fields;
  }

  /**
   * Extract field options for select/radio fields
   */
  private extractFieldOptions(field: any): { value: string; label: string }[] {
    const options: { value: string; label: string }[] = [];
    
    const xmlOptions = field.OPTION || field.Option;
    if (xmlOptions) {
      const optionList = Array.isArray(xmlOptions) ? xmlOptions : [xmlOptions];
      
      optionList.forEach((option) => {
        options.push({
          value: option.VALUE || option.Value || '',
          label: option.LABEL || option.Label || option.VALUE || option.Value || '',
        });
      });
    }
    
    return options;
  }

  /**
   * Extract validations from the form
   */
  private extractValidations(parsedXml: any, fields: Record<string, FormField>): FieldValidation[] {
    const validations: FieldValidation[] = [];
    const form = parsedXml.FORM || parsedXml.Form || {};
    
    // Process validation rules if present
    const xmlValidations = form.VALIDATION || form.Validation;
    if (xmlValidations) {
      const validationList = Array.isArray(xmlValidations) ? xmlValidations : [xmlValidations];
      
      validationList.forEach((validation) => {
        const fieldId = this.sanitizeFieldId(validation.FIELD || validation.Field || '');
        
        // Skip if field not found
        if (!fields[fieldId]) return;
        
        validations.push({
          fieldId,
          type: validation.TYPE || validation.Type || 'required',
          message: validation.MESSAGE || validation.Message || `Invalid value for ${fields[fieldId].label}`,
          condition: validation.CONDITION || validation.Condition || '',
          regex: validation.REGEX || validation.Regex || '',
          min: validation.MIN || validation.Min,
          max: validation.MAX || validation.Max,
        });
      });
    }
    
    // Add default required validations
    Object.entries(fields).forEach(([fieldId, field]) => {
      if (field.required && !validations.some((v) => v.fieldId === fieldId && v.type === 'required')) {
        validations.push({
          fieldId,
          type: 'required',
          message: `${field.label} is required`,
        });
      }
    });
    
    return validations;
  }

  /**
   * Extract page layout information
   */
  private extractPageLayout(parsedXml: any): any {
    const form = parsedXml.FORM || parsedXml.Form || {};
    const pages = Array.isArray(form.PAGE) ? form.PAGE : [form.PAGE];
    
    const pageLayout = pages.map((page, index) => ({
      pageIndex: index,
      orientation: page.ORIENTATION || page.Orientation || 'portrait',
      width: Number(page.WIDTH || page.Width || 8.5 * 72), // Convert to points (72 points per inch)
      height: Number(page.HEIGHT || page.Height || 11 * 72),
      margins: {
        top: Number(page.MARGINTOP || page.MarginTop || 36), // Default 0.5 inch
        right: Number(page.MARGINRIGHT || page.MarginRight || 36),
        bottom: Number(page.MARGINBOTTOM || page.MarginBottom || 36),
        left: Number(page.MARGINLEFT || page.MarginLeft || 36),
      },
    }));
    
    return {
      pages: pageLayout,
      defaultPageSize: {
        width: 8.5 * 72,
        height: 11 * 72,
      },
    };
  }

  /**
   * Map TOTAL field types to TerraFusionPro field types
   */
  private mapFieldType(totalType: string): string {
    const typeMap: Record<string, string> = {
      'TEXT': 'text',
      'MEMO': 'textarea',
      'NUMBER': 'number',
      'CURRENCY': 'currency',
      'DATE': 'date',
      'CHECKBOX': 'checkbox',
      'RADIO': 'radio',
      'SELECT': 'select',
      'COMBOBOX': 'combobox',
      // Add more mappings as needed
    };
    
    return typeMap[totalType?.toUpperCase()] || 'text';
  }

  /**
   * Sanitize field ID to be valid in our system
   */
  private sanitizeFieldId(id: string): string {
    // Replace spaces and special characters with underscores
    return id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }
}

export default XfrFormParser;
