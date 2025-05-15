import { saveAs } from 'file-saver';
import { Property } from '@/shared/schema';
import { ExportService, ExportFormat, formatPropertyValue } from '../services/exportService';

// Mock the file-saver library
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Sample test properties
const testProperties: Property[] = [
  {
    id: 1,
    parcelId: 'TEST-001',
    address: '123 Main St',
    owner: 'Test Owner',
    value: '$350,000',
    salePrice: '$345,000',
    squareFeet: 2000,
    yearBuilt: 2005,
    landValue: '$100,000',
    neighborhood: 'Test Neighborhood',
    propertyType: 'Residential',
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 8000,
    zoning: 'R1',
    lastSaleDate: '2021-06-15',
    taxAssessment: '$325,000',
    pricePerSqFt: '$175',
    attributes: { 
      hasGarage: true, 
      poolSize: 0, 
      construction: 'Frame' 
    }
  } as Property,
  {
    id: 2,
    parcelId: 'TEST-002',
    address: '456 Oak Ave',
    owner: 'Another Owner',
    value: '$425,000',
    squareFeet: 2500,
    yearBuilt: 2010,
    landValue: '$120,000',
    neighborhood: 'Test Neighborhood',
    propertyType: 'Residential',
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 9500,
    zoning: 'R1'
  } as Property
];

describe('Property Export Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('CSV Export', () => {
    test('generates valid CSV with correct headers and property data', () => {
      // Call the export function
      ExportService.exportPropertiesToCSV(testProperties, {
        fileName: 'test-export',
        title: 'Test Export',
        description: 'CSV export test'
      });
      
      // Verify that saveAs was called with the correct arguments
      expect(saveAs).toHaveBeenCalledTimes(1);
      
      // Get the blob that was passed to saveAs
      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      expect(blob instanceof Blob).toBe(true);
      expect(blob.type).toBe('text/csv;charset=utf-8');
      
      // Verify that the filename is correct
      const filename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(filename).toBe('test-export.csv');
    });
    
    test('includes all selected properties in CSV export', () => {
      // Call the export function with custom fields
      ExportService.exportPropertiesToCSV(testProperties, {
        customFields: ['bedrooms', 'bathrooms', 'lotSize'],
        fileName: 'test-export'
      });
      
      // Get the blob content
      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      
      // Create a FileReader to read the blob content
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const csvContent = reader.result as string;
          
          // Check that all properties are included
          testProperties.forEach(property => {
            expect(csvContent).toContain(property.parcelId);
            expect(csvContent).toContain(property.address);
          });
          
          // Check that custom fields are included
          expect(csvContent).toContain('Bedrooms');
          expect(csvContent).toContain('Bathrooms');
          expect(csvContent).toContain('Lot Size');
          
          resolve();
        };
        reader.readAsText(blob);
      });
    });
  });
  
  describe('JSON Export', () => {
    test('generates valid JSON with property data', () => {
      // Call the export function
      ExportService.exportPropertiesToJSON(testProperties, {
        fileName: 'test-export',
        title: 'Test Export',
        description: 'JSON export test'
      });
      
      // Verify that saveAs was called with correct arguments
      expect(saveAs).toHaveBeenCalledTimes(1);
      
      // Get the blob that was passed to saveAs
      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      expect(blob instanceof Blob).toBe(true);
      expect(blob.type).toBe('application/json;charset=utf-8');
      
      // Verify filename
      const filename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(filename).toBe('test-export.json');
      
      // Create a FileReader to read the blob content
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const jsonContent = reader.result as string;
          const parsed = JSON.parse(jsonContent);
          
          // Check that properties array exists and has the right length
          expect(parsed.properties).toBeDefined();
          expect(parsed.properties.length).toBe(2);
          
          // Check that metadata is included
          expect(parsed.metadata).toBeDefined();
          expect(parsed.metadata.title).toBe('Test Export');
          
          // Verify first property data
          expect(parsed.properties[0].id).toBe(1);
          expect(parsed.properties[0].parcelId).toBe('TEST-001');
          expect(parsed.properties[0].address).toBe('123 Main St');
          
          resolve();
        };
        reader.readAsText(blob);
      });
    });
  });
  
  describe('PDF Export', () => {
    test('creates PDF with proper formatting', () => {
      // Call the export function
      ExportService.exportPropertiesToPDF(testProperties, {
        fileName: 'test-export',
        title: 'Test PDF Export',
        description: 'PDF export test'
      });
      
      // Verify that saveAs was called
      expect(saveAs).toHaveBeenCalledTimes(1);
      
      // Get the blob that was passed to saveAs
      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      expect(blob instanceof Blob).toBe(true);
      expect(blob.type).toBe('application/pdf');
      
      // Verify filename
      const filename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(filename).toBe('test-export.pdf');
    });
  });
  
  describe('Excel Export', () => {
    test('creates Excel file with formatted data', () => {
      // Call the export function
      ExportService.exportPropertiesToExcel(testProperties, {
        fileName: 'test-export',
        title: 'Test Excel Export',
        description: 'Excel export test'
      });
      
      // Verify that saveAs was called
      expect(saveAs).toHaveBeenCalledTimes(1);
      
      // Get the blob that was passed to saveAs
      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      expect(blob instanceof Blob).toBe(true);
      
      // Verify filename
      const filename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(filename).toBe('test-export.xlsx');
    });
  });
  
  describe('Value Formatting', () => {
    test('formats currency values correctly', () => {
      expect(formatPropertyValue(250000, 'currency')).toBe('$250,000');
      expect(formatPropertyValue('150000', 'currency')).toBe('$150,000');
      expect(formatPropertyValue('$350,000', 'currency')).toBe('$350,000');
    });
    
    test('formats number values correctly', () => {
      expect(formatPropertyValue(2500, 'number')).toBe('2,500');
      expect(formatPropertyValue('1230', 'number')).toBe('1,230');
    });
    
    test('formats percentage values correctly', () => {
      expect(formatPropertyValue(0.155, 'percent')).toBe('15.5%');
      expect(formatPropertyValue(25, 'percent')).toBe('2,500.0%');
    });
    
    test('formats date values correctly', () => {
      const dateResult = formatPropertyValue('2023-01-15', 'date');
      expect(dateResult).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
    
    test('handles empty values gracefully', () => {
      expect(formatPropertyValue(undefined, 'currency')).toBe('');
      expect(formatPropertyValue(null, 'number')).toBe('');
      expect(formatPropertyValue('', 'text')).toBe('');
    });
  });
});