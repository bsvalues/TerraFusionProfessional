import { Property } from '@shared/schema';
import { 
  calculateValuationMetrics, 
  calculateMarketTrends, 
  calculateRegionalPerformance, 
  calculateValueChanges 
} from '../services/kpi/kpiService';

// Sample test data
const sampleProperties: Property[] = [
  {
    id: 1,
    parcelId: "PR00001",
    address: "123 Main St",
    owner: "John Doe",
    value: "250000",
    squareFeet: 1800,
    yearBuilt: 2005,
    neighborhood: "Downtown",
    propertyType: "residential",
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 5000,
    coordinates: [47.2, -122.3],
    valueHistory: {
      "2023": "250000",
      "2022": "240000",
      "2021": "230000",
      "2020": "220000"
    }
  },
  {
    id: 2,
    parcelId: "PR00002",
    address: "456 Oak Ave",
    owner: "Jane Smith",
    value: "320000",
    squareFeet: 2200,
    yearBuilt: 2010,
    neighborhood: "Downtown",
    propertyType: "residential",
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 6000,
    coordinates: [47.22, -122.32],
    valueHistory: {
      "2023": "320000",
      "2022": "300000",
      "2021": "285000",
      "2020": "270000"
    }
  },
  {
    id: 3,
    parcelId: "PR00003",
    address: "789 Pine Ln",
    owner: "Bob Johnson",
    value: "180000",
    squareFeet: 1200,
    yearBuilt: 1995,
    neighborhood: "Westside",
    propertyType: "residential",
    bedrooms: 2,
    bathrooms: 1,
    lotSize: 4000,
    coordinates: [47.25, -122.4],
    valueHistory: {
      "2023": "180000",
      "2022": "175000",
      "2021": "170000",
      "2020": "165000"
    }
  },
  {
    id: 4,
    parcelId: "PR00004",
    address: "101 Commerce St",
    owner: "Acme Corp",
    value: "750000",
    squareFeet: 5000,
    yearBuilt: 2015,
    neighborhood: "Business District",
    propertyType: "commercial",
    lotSize: 10000,
    coordinates: [47.18, -122.25]
  },
  {
    id: 5,
    parcelId: "PR00005",
    address: "222 Lakeview Dr",
    owner: "Mary Williams",
    value: "420000",
    squareFeet: 2800,
    yearBuilt: 2018,
    neighborhood: "Lakefront",
    propertyType: "residential",
    bedrooms: 5,
    bathrooms: 3.5,
    lotSize: 8000,
    coordinates: [47.3, -122.28],
    valueHistory: {
      "2023": "420000",
      "2022": "400000",
      "2021": "380000",
      "2020": "360000"
    }
  }
];

describe('KPI Service Tests', () => {
  test('calculateValuationMetrics returns correct metrics', () => {
    const metrics = calculateValuationMetrics(sampleProperties);
    expect(metrics.averageValue).toBeGreaterThan(0);
    expect(metrics.averageValue).toBe(384000); // (250000 + 320000 + 180000 + 750000 + 420000) / 5
    expect(metrics.medianValue).toBe(320000);
    expect(metrics.valueRange).toEqual([180000, 750000]);
    expect(metrics.valueDistribution).toHaveProperty('0-200k');
    expect(metrics.valueDistribution).toHaveProperty('200k-300k');
    expect(metrics.valueDistribution).toHaveProperty('300k-400k');
    expect(metrics.valueDistribution).toHaveProperty('400k-500k');
    expect(metrics.valueDistribution).toHaveProperty('500k+');
    expect(metrics.totalProperties).toBe(5);
  });
  
  test('calculateMarketTrends returns correct trend data', () => {
    const trends = calculateMarketTrends(sampleProperties, 'yearly');
    expect(trends.trendData).toBeInstanceOf(Array);
    expect(trends.trendData.length).toBe(4); // 4 years of data
    expect(trends.trendDirection).toBe('up');
    expect(trends.percentageChange).toBeCloseTo(6.45, 1); // Average yearly increase
    
    // The first property in sample data went from 220000 to 250000 over 3 years
    // which is about a 13.64% total increase or about 4.35% per year
  });
  
  test('calculateRegionalPerformance groups properties by region', () => {
    const performance = calculateRegionalPerformance(sampleProperties);
    expect(performance).toBeInstanceOf(Array);
    expect(performance.length).toBe(4); // 4 different neighborhoods
    
    // Check for Downtown properties
    const downtown = performance.find(p => p.region === 'Downtown');
    expect(downtown).toBeDefined();
    expect(downtown?.averageValue).toBe(285000); // (250000 + 320000) / 2
    expect(downtown?.propertyCount).toBe(2);
    
    // Check for Business District
    const businessDistrict = performance.find(p => p.region === 'Business District');
    expect(businessDistrict).toBeDefined();
    expect(businessDistrict?.averageValue).toBe(750000);
    expect(businessDistrict?.propertyCount).toBe(1);
  });
  
  test('calculateValueChanges shows historical changes', () => {
    const changes = calculateValueChanges(sampleProperties, 'yearly');
    expect(changes).toBeInstanceOf(Array);
    expect(changes.length).toBe(4); // 4 years of data
    
    // 2023 values
    const current = changes.find(c => c.period === '2023');
    expect(current).toBeDefined();
    expect(current?.averageValue).toBeCloseTo(292500, 0); // Average of all properties with history
    
    // 2020 values
    const past = changes.find(c => c.period === '2020');
    expect(past).toBeDefined();
    expect(past?.averageValue).toBeCloseTo(253750, 0); // Average of all properties with history
  });
  
  test('handles empty property arrays gracefully', () => {
    const metrics = calculateValuationMetrics([]);
    expect(metrics).toBeDefined();
    expect(metrics.averageValue).toBe(0);
    expect(metrics.medianValue).toBe(0);
    expect(metrics.valueRange).toEqual([0, 0]);
    expect(metrics.totalProperties).toBe(0);
    
    const trends = calculateMarketTrends([], 'yearly');
    expect(trends.trendData).toEqual([]);
    expect(trends.trendDirection).toBe('stable');
    expect(trends.percentageChange).toBe(0);
    
    const performance = calculateRegionalPerformance([]);
    expect(performance).toEqual([]);
    
    const changes = calculateValueChanges([], 'yearly');
    expect(changes).toEqual([]);
  });
  
  test('handles properties without history for trend calculations', () => {
    const propertiesWithoutHistory = [
      {
        id: 6,
        parcelId: "PR00006",
        address: "333 New St",
        value: "350000",
        neighborhood: "Downtown",
        propertyType: "residential",
      } as Property
    ];
    
    const trends = calculateMarketTrends(propertiesWithoutHistory, 'yearly');
    expect(trends.trendData).toEqual([]);
    expect(trends.trendDirection).toBe('stable');
    expect(trends.percentageChange).toBe(0);
    
    const changes = calculateValueChanges(propertiesWithoutHistory, 'yearly');
    expect(changes).toEqual([]);
  });
});