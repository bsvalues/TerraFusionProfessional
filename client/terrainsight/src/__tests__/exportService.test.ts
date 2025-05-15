import { ExportService, ExportFormat, formatPropertyValue } from '../services/exportService';
import * as FileSaver from 'file-saver';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Define test types to match schema
interface Property {
  id: number | string;
  parcelId: string;
  address: string;
  owner?: string;
  value?: string;
  salePrice?: string;
  squareFeet?: number;
  yearBuilt?: number;
  landValue?: string;
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  zoning?: string;
  lastSaleDate?: string;
  taxAssessment?: string;
  pricePerSqFt?: string;
  attributes?: Record<string, any>;
}

// Create sample properties for testing
const createTestProperties = (): Property[] => [
  {
    id: 1,
    parcelId: 'TEST1234',
    address: '123 Test Street',
    owner: 'Test Owner',
    value: '$250,000',
    salePrice: '$245,000',
    squareFeet: 2000,
    yearBuilt: 2005,
    landValue: '$100,000',
    coordinates: [46.23, -119.15],
    latitude: 46.23,
    longitude: -119.15,
    neighborhood: 'Test Neighborhood',
    propertyType: 'Residential',
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 8500,
    zoning: 'R1',
    lastSaleDate: '2020-01-15',
    taxAssessment: '$240,000',
    pricePerSqFt: '$125',
    attributes: { pool: true, garage: 2 }
  },
  {
    id: 2,
    parcelId: 'TEST5678',
    address: '456 Sample Avenue',
    owner: 'Sample Owner',
    value: '$350,000',
    squareFeet: 2500,
    yearBuilt: 2010,
    latitude: 46.24,
    longitude: -119.16,
    propertyType: 'Commercial',
    lotSize: 10000,
    zoning: 'C1'
  }
];

describe('ExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CSV Export', () => {
    test('exportPropertiesToCSV creates correct CSV content', () => {
      const properties = createTestProperties();
      ExportService.exportPropertiesToCSV(properties);
      
      // Verify saveAs was called
      expect(FileSaver.saveAs).toHaveBeenCalled();
      
      // Get the Blob that was passed to saveAs
      const blob = (FileSaver.saveAs as jest.Mock).mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8');
      
      // Verify filename
      const filename = (FileSaver.saveAs as jest.Mock).mock.calls[0][1];
      expect(filename).toBe('spatialest-export.csv');
    });
    
    test('CSV export includes custom fields when specified', () => {
      const properties = createTestProperties();
      ExportService.exportPropertiesToCSV(properties, {
        customFields: ['bedrooms', 'bathrooms']
      });
      
      const blob = (FileSaver.saveAs as jest.Mock).mock.calls[0][0];
      
      // Convert blob to text for verification
      const reader = new FileReader();
      reader.readAsText(blob);
      
      return new Promise<void>((resolve) => {
        reader.onload = () => {
          const csvContent = reader.result as string;
          
          // Check headers include custom fields
          expect(csvContent).toContain('Bedrooms');
          expect(csvContent).toContain('Bathrooms');
          
          // Check property values are included
          expect(csvContent).toContain('3'); // bedrooms value
          expect(csvContent).toContain('2'); // bathrooms value
          
          resolve();
        };
      });
    });
  });
  
  describe('JSON Export', () => {
    test('exportPropertiesToJSON creates valid JSON file', () => {
      const properties = createTestProperties();
      ExportService.exportPropertiesToJSON(properties);
      
      // Verify saveAs was called
      expect(FileSaver.saveAs).toHaveBeenCalled();
      
      // Get the Blob that was passed to saveAs
      const blob = (FileSaver.saveAs as jest.Mock).mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json;charset=utf-8');
      
      // Verify filename
      const filename = (FileSaver.saveAs as jest.Mock).mock.calls[0][1];
      expect(filename).toBe('spatialest-export.json');
    });
    
    test('JSON export includes metadata when requested', () => {
      const properties = createTestProperties();
      ExportService.exportPropertiesToJSON(properties, {
        title: 'Test Export',
        description: 'Export for testing',
        dateGenerated: true
      });
      
      const blob = (FileSaver.saveAs as jest.Mock).mock.calls[0][0];
      
      // Convert blob to text for verification
      const reader = new FileReader();
      reader.readAsText(blob);
      
      return new Promise<void>((resolve) => {
        reader.onload = () => {
          const jsonContent = reader.result as string;
          const parsed = JSON.parse(jsonContent);
          
          // Verify metadata is included
          expect(parsed.metadata).toBeDefined();
          expect(parsed.metadata.title).toBe('Test Export');
          expect(parsed.metadata.description).toBe('Export for testing');
          expect(parsed.metadata.generated).toBeDefined();
          
          // Verify properties are included
          expect(parsed.properties).toHaveLength(2);
          expect(parsed.properties[0].parcelId).toBe('TEST1234');
          
          resolve();
        };
      });
    });
  });
  
  describe('Excel Export', () => {
    test('exportPropertiesToExcel creates Excel file', () => {
      const properties = createTestProperties();
      
      // This should fail until we implement the Excel export
      expect(() => {
        ExportService.exportPropertiesToExcel(properties);
      }).toThrow();
    });
  });
  
  describe('PDF Export', () => {
    test('exportPropertiesToPDF creates PDF file', () => {
      const properties = createTestProperties();
      
      // This should fail until we implement the PDF export
      expect(() => {
        ExportService.exportPropertiesToPDF(properties);
      }).toThrow();
    });
  });
  
  describe('Report Templates', () => {
    test('exportWithTemplate uses the specified template', () => {
      const properties = createTestProperties();
      
      // This should fail until we implement template exports
      expect(() => {
        ExportService.exportWithTemplate(properties, 'residential-detail', ExportFormat.PDF);
      }).toThrow();
    });
  });
  
  describe('Utility Functions', () => {
    test('formatPropertyValue formats currency correctly', () => {
      expect(formatPropertyValue(250000, 'currency')).toBe('$250,000');
    });
    
    test('formatPropertyValue formats numbers correctly', () => {
      expect(formatPropertyValue(1234567, 'number')).toBe('1,234,567');
    });
    
    test('formatPropertyValue formats percentages correctly', () => {
      expect(formatPropertyValue(15.5, 'percent')).toBe('15.5%');
    });
    
    test('formatPropertyValue formats dates correctly', () => {
      expect(formatPropertyValue('2023-01-15', 'date')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });
});