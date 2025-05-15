import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  ReportBuilder, 
  ReportSection, 
  ReportTemplate,
  Report,
  SaveTemplateOptions,
  OrderChange
} from '../../reporting/reportBuilderService';

describe('ReportBuilder Service', () => {
  let reportBuilder: ReportBuilder;

  beforeEach(() => {
    reportBuilder = new ReportBuilder();
  });

  test('should create a new empty report', () => {
    const title = 'Test Report';
    const report = reportBuilder.createReport(title);
    
    expect(report).toBeDefined();
    expect(report.id).toBeDefined();
    expect(report.title).toBe(title);
    expect(report.sections).toEqual([]);
    expect(report.createdAt).toBeInstanceOf(Date);
  });

  test('should add a section to a report', () => {
    const report = reportBuilder.createReport('Test Report');
    const section: ReportSection = { 
      id: 'section1', 
      title: 'Property Summary', 
      type: 'property-summary',
      order: 0,
      content: { propertyId: 123 }
    };
    
    reportBuilder.addSection(report, section);
    
    expect(report.sections).toHaveLength(1);
    expect(report.sections[0]).toEqual(section);
    expect(report.lastModified).toBeInstanceOf(Date);
  });

  test('should throw an error when adding an invalid section', () => {
    const report = reportBuilder.createReport('Test Report');
    const invalidSection = { title: 'Invalid Section' } as unknown as ReportSection;
    
    expect(() => reportBuilder.addSection(report, invalidSection)).toThrow();
  });

  test('should remove a section from a report', () => {
    const report = reportBuilder.createReport('Test Report');
    const section: ReportSection = { 
      id: 'section1', 
      title: 'Property Summary', 
      type: 'property-summary',
      order: 0,
      content: { propertyId: 123 }
    };
    
    reportBuilder.addSection(report, section);
    const result = reportBuilder.removeSection(report, 'section1');
    
    expect(result).toBe(true);
    expect(report.sections).toHaveLength(0);
    expect(report.lastModified).toBeInstanceOf(Date);
  });

  test('should return false when removing a non-existent section', () => {
    const report = reportBuilder.createReport('Test Report');
    const result = reportBuilder.removeSection(report, 'nonexistent');
    
    expect(result).toBe(false);
  });

  test('should update section content', () => {
    const report = reportBuilder.createReport('Test Report');
    const section: ReportSection = { 
      id: 'section1', 
      title: 'Property Summary', 
      type: 'property-summary',
      order: 0,
      content: { propertyId: 123 }
    };
    
    reportBuilder.addSection(report, section);
    
    const newContent = { propertyId: 456, address: '123 Main St' };
    const result = reportBuilder.updateSectionContent(report, 'section1', newContent);
    
    expect(result).toBe(true);
    expect(report.sections[0].content).toEqual(newContent);
    expect(report.lastModified).toBeInstanceOf(Date);
  });

  test('should return false when updating content for a non-existent section', () => {
    const report = reportBuilder.createReport('Test Report');
    const result = reportBuilder.updateSectionContent(report, 'nonexistent', { data: 'test' });
    
    expect(result).toBe(false);
  });

  test('should reorder sections', () => {
    const report = reportBuilder.createReport('Test Report');
    const section1: ReportSection = { 
      id: 'section1', 
      title: 'Property Summary', 
      type: 'property-summary',
      order: 1,
      content: { propertyId: 123 }
    };
    
    const section2: ReportSection = { 
      id: 'section2', 
      title: 'Property Value', 
      type: 'valuation-details',
      order: 0,
      content: { value: 250000 }
    };
    
    reportBuilder.addSection(report, section1);
    reportBuilder.addSection(report, section2);
    
    const changes: OrderChange[] = [
      { id: 'section1', order: 0 },
      { id: 'section2', order: 1 }
    ];
    
    reportBuilder.reorderSections(report, changes);
    
    expect(report.sections[0].id).toBe('section1');
    expect(report.sections[1].id).toBe('section2');
    expect(report.lastModified).toBeInstanceOf(Date);
  });

  test('should load a template to create a new report', () => {
    const section: ReportSection = { 
      id: 'section1', 
      title: 'Property Summary', 
      type: 'property-summary',
      order: 0,
      content: { propertyId: 123 }
    };
    
    const template: ReportTemplate = {
      id: 'template1',
      name: 'Standard Report',
      description: 'A standard property report',
      sections: [section],
      metadata: { author: 'System' }
    };
    
    const report = reportBuilder.loadTemplate(template);
    
    expect(report.id).toBeDefined();
    expect(report.title).toBe('Standard Report Report');
    expect(report.sections).toEqual([section]);
    expect(report.templateId).toBe('template1');
    expect(report.createdAt).toBeInstanceOf(Date);
    expect(report.metadata).toEqual({ author: 'System' });
  });

  test('should save a report as a template', () => {
    const report = reportBuilder.createReport('Test Report');
    const section1: ReportSection = { 
      id: 'section1', 
      title: 'Property Summary', 
      type: 'property-summary',
      order: 0,
      content: { propertyId: 123 }
    };
    
    const section2: ReportSection = { 
      id: 'section2', 
      title: 'Property Value', 
      type: 'valuation-details',
      order: 1,
      content: { value: 250000 }
    };
    
    reportBuilder.addSection(report, section1);
    reportBuilder.addSection(report, section2);
    
    const options: SaveTemplateOptions = {
      name: 'My Template',
      description: 'A custom template',
      metadata: { author: 'User' }
    };
    
    const template = reportBuilder.saveAsTemplate(report, options);
    
    expect(template.id).toBeDefined();
    expect(template.name).toBe('My Template');
    expect(template.description).toBe('A custom template');
    expect(template.sections).toHaveLength(2);
    expect(template.metadata).toEqual({ author: 'User' });
    expect(template.createdAt).toBeInstanceOf(Date);
  });
});