import { TimeSeriesAnalysis } from '../services/timeSeriesAnalysisService';
import { Property } from '@shared/schema';

// Sample property with history data
interface PropertyWithHistory extends Property {
  valueHistory?: {
    [year: string]: string;
  }
}

// Mock properties for testing
const mockPropertiesWithHistory: PropertyWithHistory[] = [
  {
    id: 1,
    parcelId: 'PROP001',
    address: '123 Main St',
    squareFeet: 2000,
    value: '220000', // current value (2023)
    valueHistory: {
      '2020': '200000',
      '2021': '205000',
      '2022': '215000',
      '2023': '220000'
    },
    latitude: 47.1234,
    longitude: -122.4567,
    propertyType: 'residential',
    neighborhood: 'Downtown'
  },
  {
    id: 2,
    parcelId: 'PROP002',
    address: '456 Oak Ave',
    squareFeet: 2500,
    value: '330000', // current value (2023)
    valueHistory: {
      '2020': '300000',
      '2021': '310000',
      '2022': '320000',
      '2023': '330000'
    },
    latitude: 47.1235,
    longitude: -122.4568,
    propertyType: 'residential',
    neighborhood: 'Downtown'
  },
  {
    id: 3,
    parcelId: 'PROP003',
    address: '789 Elm St',
    squareFeet: 3000,
    value: '520000', // current value (2023)
    valueHistory: {
      '2020': '450000',
      '2021': '470000',
      '2022': '500000',
      '2023': '520000'
    },
    latitude: 47.1236,
    longitude: -122.4569,
    propertyType: 'residential',
    neighborhood: 'Suburbs'
  },
  {
    id: 4,
    parcelId: 'PROP004',
    address: '101 Pine St',
    squareFeet: 1800,
    value: '190000', // current value (2023)
    valueHistory: {
      '2020': '180000',
      '2021': '185000',
      '2022': '187000',
      '2023': '190000'
    },
    latitude: 47.1237,
    longitude: -122.4570,
    propertyType: 'residential',
    neighborhood: 'Suburbs'
  }
];

describe('TimeSeriesAnalysis', () => {
  // Test initialization
  test('should initialize with property data', () => {
    const analysis = new TimeSeriesAnalysis(mockPropertiesWithHistory);
    expect(analysis).toBeDefined();
  });

  // Test time series data preparation
  test('should prepare property time series data correctly', () => {
    const analysis = new TimeSeriesAnalysis(mockPropertiesWithHistory);
    const timeSeriesData = analysis.prepareTimeSeriesData();
    
    // Should have data for each time period
    expect(timeSeriesData.periods).toEqual(['2020', '2021', '2022', '2023']);
    
    // Each property should have values for each period
    expect(timeSeriesData.properties.length).toBe(mockPropertiesWithHistory.length);
    
    // Check first property's values
    const firstPropertyData = timeSeriesData.properties.find(p => p.id === 1);
    expect(firstPropertyData).toBeDefined();
    expect(firstPropertyData?.values).toEqual([200000, 205000, 215000, 220000]);
  });

  // Test value change calculation
  test('should calculate value changes between periods', () => {
    const analysis = new TimeSeriesAnalysis(mockPropertiesWithHistory);
    const valueChanges = analysis.calculateValueChanges('2020', '2023');
    
    // Should have changes for each property
    expect(valueChanges.length).toBe(mockPropertiesWithHistory.length);
    
    // Check first property's change
    const firstPropertyChange = valueChanges.find(c => c.propertyId === 1);
    expect(firstPropertyChange).toBeDefined();
    expect(firstPropertyChange?.startValue).toBe(200000);
    expect(firstPropertyChange?.endValue).toBe(220000);
    expect(firstPropertyChange?.absoluteChange).toBe(20000);
    expect(firstPropertyChange?.percentageChange).toBe(10); // 10% increase
  });

  // Test neighborhood aggregation
  test('should aggregate time series data by neighborhood', () => {
    const analysis = new TimeSeriesAnalysis(mockPropertiesWithHistory);
    const neighborhoodData = analysis.aggregateByNeighborhood();
    
    // Should have data for each neighborhood
    expect(Object.keys(neighborhoodData).length).toBe(2); // Downtown and Suburbs
    
    // Check Downtown neighborhood
    expect(neighborhoodData['Downtown']).toBeDefined();
    expect(neighborhoodData['Downtown'].propertyCount).toBe(2); // 2 properties
    expect(neighborhoodData['Downtown'].averageValues.length).toBe(4); // 4 years
    
    // Downtown 2020 average should be (200000 + 300000) / 2 = 250000
    expect(neighborhoodData['Downtown'].averageValues[0]).toBe(250000);
  });

  // Test handling properties with incomplete history
  test('should handle properties with incomplete history', () => {
    const propertiesWithIncompleteHistory = [
      ...mockPropertiesWithHistory,
      {
        id: 5,
        parcelId: 'PROP005',
        address: '555 Incomplete St',
        squareFeet: 2200,
        value: '240000', // current value (2023)
        valueHistory: {
          // Missing 2020
          '2021': '220000',
          '2022': '230000',
          '2023': '240000'
        },
        latitude: 47.1238,
        longitude: -122.4571,
        propertyType: 'residential',
        neighborhood: 'Downtown'
      }
    ];
    
    const analysis = new TimeSeriesAnalysis(propertiesWithIncompleteHistory);
    const timeSeriesData = analysis.prepareTimeSeriesData();
    
    // Should still have all periods
    expect(timeSeriesData.periods).toEqual(['2020', '2021', '2022', '2023']);
    
    // The property with incomplete history should have a null/0 value for missing period
    const incompletePropertyData = timeSeriesData.properties.find(p => p.id === 5);
    expect(incompletePropertyData).toBeDefined();
    expect(incompletePropertyData?.values[0]).toBe(0); // 2020 value should be 0
  });

  // Test handling properties without history
  test('should handle properties without history data', () => {
    const propertiesWithoutHistory = [
      ...mockPropertiesWithHistory,
      {
        id: 6,
        parcelId: 'PROP006',
        address: '666 No History St',
        squareFeet: 2300,
        value: '250000', // only current value
        // No valueHistory property
        latitude: 47.1239,
        longitude: -122.4572,
        propertyType: 'residential',
        neighborhood: 'Suburbs'
      }
    ];
    
    const analysis = new TimeSeriesAnalysis(propertiesWithoutHistory);
    const timeSeriesData = analysis.prepareTimeSeriesData();
    
    // Property without history should use current value for all periods
    const noHistoryPropertyData = timeSeriesData.properties.find(p => p.id === 6);
    expect(noHistoryPropertyData).toBeDefined();
    expect(noHistoryPropertyData?.values).toEqual([250000, 250000, 250000, 250000]);
  });

  // Test with empty property array
  test('should handle empty property array', () => {
    const analysis = new TimeSeriesAnalysis([]);
    const timeSeriesData = analysis.prepareTimeSeriesData();
    
    expect(timeSeriesData.periods).toEqual([]);
    expect(timeSeriesData.properties).toEqual([]);
  });
});