/**
 * Report Builder Service
 * 
 * Provides core functionality for creating, managing, and exporting property reports.
 * This service is responsible for:
 * - Creating new reports
 * - Managing report templates
 * - Adding, removing, and updating report sections
 * - Converting reports to templates and vice versa
 */

/**
 * Types of report sections available in the system
 */
export type ReportSectionType = 
  | 'property-summary' 
  | 'valuation-details' 
  | 'tax-breakdown' 
  | 'comparison' 
  | 'neighborhood-analysis'
  | 'market-trends'
  | 'property-history'
  | 'custom';

/**
 * Report section structure
 */
export interface ReportSection {
  /** Unique identifier for the section */
  id: string;
  
  /** Display title for the section */
  title: string;
  
  /** Section type determines rendering and behavior */
  type: ReportSectionType;
  
  /** Order in which the section appears (0-based) */
  order: number;
  
  /** Content and configuration for the section */
  content: Record<string, any>;
  
  /** Optional flag to indicate section is required (cannot be removed) */
  required?: boolean;
}

/**
 * Report template structure
 */
export interface ReportTemplate {
  /** Unique identifier for the template */
  id: string;
  
  /** Template name for display */
  name: string;
  
  /** Description of the template's purpose */
  description: string;
  
  /** Sections included in the template */
  sections: ReportSection[];
  
  /** Optional metadata for the template */
  metadata?: Record<string, any>;
  
  /** Optional creation date */
  createdAt?: Date;
  
  /** Optional last modified date */
  lastModified?: Date;
}

/**
 * Report structure - an instance of a template with specific data
 */
export interface Report {
  /** Unique identifier for the report */
  id: string;
  
  /** Report title */
  title: string;
  
  /** Sections in the report */
  sections: ReportSection[];
  
  /** Optional metadata for the report */
  metadata?: Record<string, any>;
  
  /** Date the report was created */
  createdAt: Date;
  
  /** Date the report was last modified */
  lastModified?: Date;
  
  /** ID of the template used to create this report (if any) */
  templateId?: string;
}

/**
 * Options for creating a template from a report
 */
export interface SaveTemplateOptions {
  /** Name for the new template */
  name: string;
  
  /** Description of the template */
  description: string;
  
  /** Optional metadata to include */
  metadata?: Record<string, any>;
}

/**
 * Order change instruction for reordering sections
 */
export interface OrderChange {
  /** ID of the section to reorder */
  id: string;
  
  /** New order value for the section */
  order: number;
}

/**
 * ReportBuilder service class
 */
export class ReportBuilder {
  /**
   * Creates a new empty report
   * @param title Title of the report
   * @returns A new report instance
   */
  createReport(title: string): Report {
    return {
      id: this.generateId(),
      title,
      sections: [],
      createdAt: new Date()
    };
  }
  
  /**
   * Adds a section to a report
   * @param report Report to add the section to
   * @param section Section to add
   * @throws Error if section is invalid
   */
  addSection(report: Report, section: ReportSection): void {
    // Validate section structure
    if (!section.id || !section.type) {
      throw new Error('Invalid section: must have id and type properties');
    }
    
    report.sections.push(section);
    report.lastModified = new Date();
  }
  
  /**
   * Removes a section from a report by ID
   * @param report Report to modify
   * @param sectionId ID of the section to remove
   * @returns True if section was found and removed, false otherwise
   */
  removeSection(report: Report, sectionId: string): boolean {
    const initialLength = report.sections.length;
    report.sections = report.sections.filter(section => section.id !== sectionId);
    
    // Update lastModified if a section was removed
    if (report.sections.length !== initialLength) {
      report.lastModified = new Date();
      return true;
    }
    
    return false;
  }
  
  /**
   * Updates the content of a section
   * @param report Report containing the section
   * @param sectionId ID of the section to update
   * @param content New content for the section
   * @returns True if section was found and updated, false otherwise
   */
  updateSectionContent(report: Report, sectionId: string, content: Record<string, any>): boolean {
    const section = report.sections.find(section => section.id === sectionId);
    
    if (section) {
      section.content = content;
      report.lastModified = new Date();
      return true;
    }
    
    return false;
  }
  
  /**
   * Reorders sections in a report
   * @param report Report to modify
   * @param changes Array of order changes to apply
   */
  reorderSections(report: Report, changes: OrderChange[]): void {
    // Apply changes to section orders
    changes.forEach(change => {
      const section = report.sections.find(s => s.id === change.id);
      if (section) {
        section.order = change.order;
      }
    });
    
    // Sort sections by order
    report.sections.sort((a, b) => a.order - b.order);
    report.lastModified = new Date();
  }
  
  /**
   * Loads a template to create a new report
   * @param template Template to use
   * @returns A new report based on the template
   */
  loadTemplate(template: ReportTemplate): Report {
    return {
      id: this.generateId(),
      title: `${template.name} Report`, // Add "Report" suffix
      sections: [...template.sections], // Copy sections
      templateId: template.id,
      createdAt: new Date(),
      metadata: template.metadata ? { ...template.metadata } : {}
    };
  }
  
  /**
   * Saves a report as a template for future use
   * @param report Report to save as template
   * @param options Template options
   * @returns The new template
   */
  saveAsTemplate(report: Report, options: SaveTemplateOptions): ReportTemplate {
    return {
      id: this.generateId(),
      name: options.name,
      description: options.description,
      sections: [...report.sections], // Copy sections
      metadata: options.metadata ? { ...options.metadata } : {},
      createdAt: new Date()
    };
  }
  
  /**
   * Generates a unique ID
   * @returns A unique ID string
   * @private
   */
  private generateId(): string {
    return 'report_' + Math.random().toString(36).substring(2, 11);
  }
}