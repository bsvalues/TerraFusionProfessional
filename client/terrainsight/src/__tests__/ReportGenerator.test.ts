import { Property } from '@shared/schema';
import { ReportGenerator, PropertyReport, ComparisonReport, ReportType, BatchJob } from '../services/reporting/reportGenerator';
import { ReportExporter } from '../services/reporting/reportExporter';

// Mock property data
const mockProperty1: Property = {
  id: 1,
  parcelId: 'PR000001',
  address: '123 Main St',
  owner: 'John Doe',
  value: '350000',
  squareFeet: 2200,
  yearBuilt: 1990,
  landValue: '100000',
  coordinates: [46.2, -119.1],
  propertyType: 'Residential',
  bedrooms: 4,
  bathrooms: 2.5,
  lotSize: 0.25,
  neighborhood: 'Downtown',
  zoning: 'R1',
  lastSaleDate: '2020-03-15',
  taxAssessment: '340000'
};

const mockProperty2: Property = {
  id: 2,
  parcelId: 'PR000002',
  address: '456 Oak Ave',
  owner: 'Jane Smith',
  value: '425000',
  squareFeet: 2800,
  yearBuilt: 2005,
  landValue: '120000',
  coordinates: [46.21, -119.12],
  propertyType: 'Residential',
  bedrooms: 5,
  bathrooms: 3,
  lotSize: 0.3,
  neighborhood: 'Riverfront',
  zoning: 'R1',
  lastSaleDate: '2021-05-20',
  taxAssessment: '410000'
};

const mockProperty3: Property = {
  id: 3,
  parcelId: 'PR000003',
  address: '789 Business Pkwy',
  owner: 'ABC Corporation',
  value: '950000',
  squareFeet: 5000,
  yearBuilt: 2010,
  landValue: '250000',
  coordinates: [46.22, -119.13],
  propertyType: 'Commercial',
  neighborhood: 'Business District',
  zoning: 'C2',
  lastSaleDate: '2019-11-10',
  taxAssessment: '900000'
};

// Mock property with value history
const mockPropertyWithHistory: Property & { valueHistory?: { [year: string]: string } } = {
  ...mockProperty1,
  valueHistory: {
    '2020': '320000',
    '2021': '335000',
    '2022': '350000'
  }
};

describe('Report Generator', () => {
  let reportGenerator: ReportGenerator;
  let reportExporter: ReportExporter;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
    reportExporter = new ReportExporter();
  });

  // Feature: Property Comparison Reports
  test('should generate comparison report for multiple properties', () => {
    const properties = [mockProperty1, mockProperty2, mockProperty3];
    const report = reportGenerator.generateComparisonReport(properties);
    
    expect(report).toBeDefined();
    expect(report.properties.length).toBe(3);
    expect(report.comparisonMetrics).toHaveProperty('valueRange');
    expect(report.comparisonMetrics).toHaveProperty('averageValue');
    expect(report.comparisonMetrics).toHaveProperty('medianValue');
  });
  
  test('should include temporal analysis in property reports', () => {
    const property = mockPropertyWithHistory;
    const report = reportGenerator.generatePropertyReport(property);
    
    expect(report.valueHistory).toBeDefined();
    expect(report.valueHistory && report.valueHistory.length).toBeGreaterThan(0);
    if (report.valueHistory) {
      expect(report.valueHistory[0]).toHaveProperty('year');
      expect(report.valueHistory[0]).toHaveProperty('value');
    }
  });
  
  // Feature: Multi-format Export
  test('should export report as PDF', async () => {
    const report = reportGenerator.generatePropertyReport(mockProperty1);
    const pdfExport = await reportExporter.exportAs(report, 'pdf');
    
    expect(pdfExport).toBeDefined();
    expect(pdfExport.mimeType).toBe('application/pdf');
    expect(pdfExport.data).toBeDefined();
  });
  
  test('should export report as CSV', async () => {
    const report = reportGenerator.generatePropertyReport(mockProperty1);
    const csvExport = await reportExporter.exportAs(report, 'csv');
    
    expect(csvExport).toBeDefined();
    expect(csvExport.mimeType).toBe('text/csv');
    expect(typeof csvExport.data).toBe('string');
    expect(csvExport.data).toContain(mockProperty1.address);
  });
  
  // Feature: Batch Reporting
  test('should process batch reports', async () => {
    const properties = [mockProperty1, mockProperty2, mockProperty3];
    const batchJob = await reportGenerator.createBatchJob(properties, 'pdf');
    
    expect(batchJob).toBeDefined();
    expect(batchJob.status).toBe('processing');
    expect(batchJob.totalReports).toBe(3);
  });
  
  test('should track batch report progress', async () => {
    const batchJobId = 'test-batch-job';
    const progress = await reportGenerator.getBatchJobProgress(batchJobId);
    
    expect(progress).toBeDefined();
    expect(progress.completed).toBeGreaterThanOrEqual(0);
    expect(progress.total).toBeGreaterThan(0);
    expect(progress.percentage).toBeGreaterThanOrEqual(0);
    expect(progress.percentage).toBeLessThanOrEqual(100);
  });

  // Edge case: Large property dataset
  test('should handle very large property datasets efficiently', () => {
    // Generate a large set of properties
    const largePropertySet: Property[] = Array(100).fill(null).map((_, index) => ({
      ...mockProperty1,
      id: index + 100,
      parcelId: `PR${index + 100}`,
      address: `${index + 100} Test Street`
    }));
    
    const startTime = performance.now();
    
    const report = reportGenerator.generateComparisonReport(largePropertySet.slice(0, 5));
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    expect(report).toBeDefined();
  });

  // Edge case: Properties with missing data
  test('should correctly format reports for properties with missing data', () => {
    const incompleteProperty: Property = { 
      ...mockProperty1,
      id: 999,
      yearBuilt: undefined,
      squareFeet: undefined
    };
    
    const report = reportGenerator.generatePropertyReport(incompleteProperty);
    
    expect(report).toBeDefined();
    expect(report.sections.find(s => s.title === 'Property Details')).toBeDefined();
    expect(report.warnings).toContain('Some property data is incomplete');
  });
});