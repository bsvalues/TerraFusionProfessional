import { Property } from '../../shared/schema';
import { 
  TimeSeriesAnalysisService, 
  TimeSeriesDataPoint,
  ForecastingModel,
  ForecastResult,
  TrendAnalysisResult 
} from '../services/timeseries/timeSeriesAnalysisService';

// Sample property with historical values
const propertyWithHistory: Property & { valueHistory?: Record<string, string> } = {
  id: 1,
  parcelId: 'TS001',
  address: '123 Time Series St',
  propertyType: 'Residential',
  yearBuilt: 2000,
  squareFeet: 2000,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 0.25,
  value: '350000',
  coordinates: [47.6062, -122.3321],
  valueHistory: {
    '2018': '280000',
    '2019': '295000',
    '2020': '310000',
    '2021': '330000',
    '2022': '350000'
  }
};

// Property with sparse history (missing years)
const propertySparseHistory: Property & { valueHistory?: Record<string, string> } = {
  id: 2,
  parcelId: 'TS002',
  address: '456 Time Series St',
  propertyType: 'Residential',
  value: '320000',
  valueHistory: {
    '2018': '260000',
    // 2019 missing
    '2020': '275000',
    // 2021 missing
    '2022': '320000'
  }
};

// Property with insufficient history
const propertyInsufficientHistory: Property & { valueHistory?: Record<string, string> } = {
  id: 3,
  parcelId: 'TS003',
  address: '789 Time Series St',
  propertyType: 'Residential',
  value: '400000',
  valueHistory: {
    '2022': '400000'
  }
};

describe('Time Series Analysis Service', () => {
  let timeSeriesService: TimeSeriesAnalysisService;
  
  beforeEach(() => {
    timeSeriesService = new TimeSeriesAnalysisService();
  });
  
  // Data transformation tests
  test('should transform property history into time series format', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertyWithHistory);
    
    expect(timeSeries).toHaveLength(5);
    expect(timeSeries[0].date).toBeDefined();
    expect(timeSeries[0].value).toBe(280000);
    expect(timeSeries[4].value).toBe(350000);
  });
  
  test('should handle property with no history data', () => {
    const property: Property = {
      id: 4,
      parcelId: 'TS004',
      address: '101 No History St',
      value: '200000'
    };
    
    const timeSeries = timeSeriesService.convertToTimeSeries(property);
    expect(timeSeries).toHaveLength(1);
    expect(timeSeries[0].value).toBe(200000);
  });
  
  test('should handle gaps in historical data', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertySparseHistory);
    const filledTimeSeries = timeSeriesService.fillTimeSeriesGaps(timeSeries);
    
    // Should have entries for all 5 years (2018-2022)
    expect(filledTimeSeries).toHaveLength(5);
    
    // 2019 should be interpolated between 2018 and 2020
    const year2019 = filledTimeSeries.find(p => p.date.getFullYear() === 2019);
    expect(year2019).toBeDefined();
    expect(year2019!.value).toBeGreaterThan(260000);
    expect(year2019!.value).toBeLessThan(275000);
    expect(year2019!.interpolated).toBe(true);
  });
  
  // Trend analysis tests
  test('should detect upward trend in property values', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertyWithHistory);
    const trend = timeSeriesService.analyzeTrend(timeSeries);
    
    expect(trend.direction).toBe('up');
    expect(trend.growthRate).toBeGreaterThan(0);
    expect(trend.averageAnnualChange).toBeGreaterThan(0);
  });
  
  test('should calculate correct growth rate', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertyWithHistory);
    const trend = timeSeriesService.analyzeTrend(timeSeries);
    
    // Growth from 280000 to 350000 over 4 years
    // (350000 / 280000)^(1/4) - 1 ≈ 0.0574 or 5.74%
    expect(trend.growthRate).toBeCloseTo(0.0574, 2);
  });
  
  test('should throw appropriate errors for insufficient data', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertyInsufficientHistory);
    
    expect(() => {
      timeSeriesService.analyzeTrend(timeSeries);
    }).toThrow('Insufficient data points');
  });
  
  // Forecasting tests
  test('should generate future value predictions', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertyWithHistory);
    const forecast = timeSeriesService.forecast(timeSeries, 3, 'linear');
    
    expect(forecast.predictions).toHaveLength(3);
    expect(forecast.predictions[0].date.getFullYear()).toBe(2023);
    expect(forecast.predictions[2].date.getFullYear()).toBe(2025);
    
    // Value should continue the upward trend
    expect(forecast.predictions[0].value).toBeGreaterThan(350000);
  });
  
  test('should adjust confidence based on data quality', () => {
    const completeTimeSeries = timeSeriesService.convertToTimeSeries(propertyWithHistory);
    const sparseTimeSeries = timeSeriesService.convertToTimeSeries(propertySparseHistory);
    
    const completeForecast = timeSeriesService.forecast(completeTimeSeries, 3, 'linear');
    const sparseForecast = timeSeriesService.forecast(sparseTimeSeries, 3, 'linear');
    
    // Confidence should be higher with more complete data
    expect(completeForecast.confidence).toBeGreaterThan(sparseForecast.confidence);
  });
  
  test('should warn when forecasting with limited historical data', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertySparseHistory);
    const forecast = timeSeriesService.forecast(timeSeries, 3, 'linear');
    
    expect(forecast.warnings).toBeDefined();
    expect(forecast.warnings!.length).toBeGreaterThan(0);
  });
  
  test('should not generate forecasts with critically insufficient data', () => {
    const timeSeries = timeSeriesService.convertToTimeSeries(propertyInsufficientHistory);
    
    expect(() => {
      timeSeriesService.forecast(timeSeries, 3, 'linear');
    }).toThrow('Insufficient data points for forecasting');
  });
  
  // Compare properties tests
  test('should compare trends between multiple properties', () => {
    const timeSeries1 = timeSeriesService.convertToTimeSeries(propertyWithHistory);
    const timeSeries2 = timeSeriesService.convertToTimeSeries(propertySparseHistory);
    
    const comparison = timeSeriesService.compareProperties([
      { property: propertyWithHistory, timeSeries: timeSeries1 },
      { property: propertySparseHistory, timeSeries: timeSeries2 }
    ]);
    
    expect(comparison).toHaveLength(2);
    expect(comparison[0].growthRate).toBeDefined();
    expect(comparison[1].growthRate).toBeDefined();
    expect(comparison[0].id).toBe(propertyWithHistory.id);
    expect(comparison[1].id).toBe(propertySparseHistory.id);
  });
});