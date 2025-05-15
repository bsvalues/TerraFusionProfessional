import { neighborhoodComparisonReportService, NeighborhoodTimeline } from '../services/neighborhoodComparisonReportService';

// Define Property interface for testing purposes
interface Property {
  id: number;
  parcelId: string;
  address: string;
  value: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  neighborhood: string;
  latitude: number;
  longitude: number;
  owner: string;
  salePrice: string;
  saleDate: string;
  landValue: string;
  improvementValue: string;
  pricePerSqFt: string;
  lotSize: number;
  zoning: string;
  taxAssessment: string;
  taxYear: number;
  lastModified: string;
  attributes: Record<string, any>;
}
import { saveAs } from 'file-saver';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

describe('Neighborhood Comparison Report Service', () => {
  // Sample test data
  const mockNeighborhoods: NeighborhoodTimeline[] = [
    {
      id: 'n1',
      name: 'Richland Heights',
      growthRate: 5.2,
      data: [
        { year: '2020', value: 450000, percentChange: 4.2, transactionCount: 32 },
        { year: '2021', value: 472500, percentChange: 5.0, transactionCount: 45 },
        { year: '2022', value: 498000, percentChange: 5.4, transactionCount: 38 }
      ]
    },
    {
      id: 'n2',
      name: 'West Pasco',
      growthRate: 3.8,
      data: [
        { year: '2020', value: 320000, percentChange: 3.1, transactionCount: 27 },
        { year: '2021', value: 335000, percentChange: 4.7, transactionCount: 31 },
        { year: '2022', value: 347000, percentChange: 3.6, transactionCount: 24 }
      ]
    }
  ];
  
  const mockProperties: Property[] = [
    {
      id: 1,
      parcelId: 'P001',
      address: '123 Main St',
      value: '450000',
      squareFeet: 2400,
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: 2005,
      neighborhood: 'n1',
      // Other required properties with defaults
      latitude: 46.2,
      longitude: -119.1,
      owner: 'John Doe',
      salePrice: '450000',
      saleDate: '2022-01-15',
      landValue: '120000',
      improvementValue: '330000',
      pricePerSqFt: '187.5',
      lotSize: 10000,
      zoning: 'Residential',
      taxAssessment: '440000',
      taxYear: 2022,
      lastModified: '2022-12-01',
      attributes: {}
    },
    {
      id: 2,
      parcelId: 'P002',
      address: '456 Oak St',
      value: '320000',
      squareFeet: 1800,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 1998,
      neighborhood: 'n2',
      // Other required properties with defaults
      latitude: 46.3,
      longitude: -119.2,
      owner: 'Jane Smith',
      salePrice: '320000',
      saleDate: '2022-02-10',
      landValue: '90000',
      improvementValue: '230000',
      pricePerSqFt: '177.8',
      lotSize: 8500,
      zoning: 'Residential',
      taxAssessment: '310000',
      taxYear: 2022,
      lastModified: '2022-12-01',
      attributes: {}
    }
  ];
  
  // Reset mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('generateCSVReport creates correct CSV format', () => {
    const result = neighborhoodComparisonReportService.generateCSVReport({
      neighborhoods: mockNeighborhoods,
      selectedNeighborhoods: ['n1', 'n2'],
      properties: mockProperties,
      selectedYear: '2022',
      metric: 'value',
      format: 'csv'
    });
    
    // Verify CSV header
    expect(result).toContain('Neighborhood,Average Value,Growth Rate,Transaction Count');
    
    // Verify Richland Heights data
    expect(result).toContain('"Richland Heights",498000,5.4,38');
    
    // Verify West Pasco data
    expect(result).toContain('"West Pasco",347000,3.6,24');
  });
  
  test('generateCSVReport filters neighborhoods correctly', () => {
    const result = neighborhoodComparisonReportService.generateCSVReport({
      neighborhoods: mockNeighborhoods,
      selectedNeighborhoods: ['n1'], // Only one neighborhood selected
      properties: mockProperties,
      selectedYear: '2022',
      metric: 'value',
      format: 'csv'
    });
    
    // Verify Richland Heights data is included
    expect(result).toContain('"Richland Heights",498000,5.4,38');
    
    // Verify West Pasco data is NOT included
    expect(result).not.toContain('"West Pasco",347000,3.6,24');
  });
  
  test('generateAndDownloadReport calls saveAs with proper arguments for CSV format', async () => {
    await neighborhoodComparisonReportService.generateAndDownloadReport({
      neighborhoods: mockNeighborhoods,
      selectedNeighborhoods: ['n1'],
      properties: mockProperties,
      selectedYear: '2022',
      metric: 'value',
      format: 'csv'
    });
    
    // Verify saveAs was called
    expect(saveAs).toHaveBeenCalled();
    
    // Check the first argument is a Blob with correct type
    const saveAsArgs = (saveAs as unknown as jest.Mock).mock.calls[0];
    expect(saveAsArgs[0]).toBeInstanceOf(Blob);
    expect(saveAsArgs[0].type).toBe('text/csv;charset=utf-8');
    
    // Check the filename contains 'neighborhood-comparison' and '.csv'
    expect(saveAsArgs[1]).toContain('neighborhood-comparison');
    expect(saveAsArgs[1]).toContain('.csv');
  });
  
  test('generateAndDownloadReport throws error when no neighborhoods selected', async () => {
    await expect(
      neighborhoodComparisonReportService.generateAndDownloadReport({
        neighborhoods: mockNeighborhoods,
        selectedNeighborhoods: [], // Empty selection
        properties: mockProperties,
        selectedYear: '2022',
        metric: 'value',
        format: 'csv'
      })
    ).rejects.toThrow('No neighborhoods selected for report');
    
    // Verify saveAs was not called
    expect(saveAs).not.toHaveBeenCalled();
  });
});