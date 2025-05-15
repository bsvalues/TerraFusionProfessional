import { 
  generateHistoricalData,
  calculateGrowthRate,
  predictFutureValues,
  generatePropertyValueTrend,
  formatChartDate,
  formatChartCurrency
} from '../ValuationTrendUtils';
import { Property } from '@shared/schema';

describe('ValuationTrendUtils', () => {
  // Test property with sample data
  const testProperty: Partial<Property> = {
    id: 1,
    address: '123 Main St',
    value: '$300000',
    yearBuilt: 2000,
    squareFeet: 2000,
    propertyType: 'Residential',
    neighborhood: 'Downtown'
  };

  describe('generateHistoricalData', () => {
    it('should generate historical data for a property', () => {
      const historicalData = generateHistoricalData(testProperty as Property, 3);
      
      // Check that we have the right number of data points (quarterly for 3 years = 13 points)
      expect(historicalData).toHaveLength(13);
      
      // Check that the data is properly structured
      historicalData.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('value');
        expect(point.date).toBeInstanceOf(Date);
        expect(typeof point.value).toBe('number');
        expect(point.value).toBeGreaterThan(0);
      });
      
      // Ensure dates are in ascending order
      const dates = historicalData.map(point => point.date.getTime());
      const sortedDates = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sortedDates);
    });
    
    it('should return empty array for property with no value', () => {
      const noValueProperty = { ...testProperty, value: null };
      const result = generateHistoricalData(noValueProperty as Property);
      expect(result).toHaveLength(0);
    });
  });
  
  describe('calculateGrowthRate', () => {
    it('should calculate growth rate from historical data', () => {
      // Create sample historical data with known values
      const historicalData = [
        { date: new Date('2020-01-01'), value: 200000 },
        { date: new Date('2021-01-01'), value: 210000 },
        { date: new Date('2022-01-01'), value: 220500 }
      ];
      
      const growthRate = calculateGrowthRate(historicalData);
      
      // Growth from 200000 to 220500 over 2 years = approximately 5% annual growth
      expect(growthRate).toBeCloseTo(0.05, 1);
    });
    
    it('should use default growth rate if insufficient data', () => {
      const growthRate = calculateGrowthRate([{ date: new Date(), value: 100000 }]);
      // Should return the default growth rate
      expect(growthRate).toBe(0.035);
    });
  });
  
  describe('predictFutureValues', () => {
    it('should predict future values based on historical data', () => {
      const historicalData = [
        { date: new Date('2020-01-01'), value: 200000 },
        { date: new Date('2021-01-01'), value: 210000 },
        { date: new Date('2022-01-01'), value: 220500 }
      ];
      
      const predictions = predictFutureValues(historicalData, { 
        growthRate: 0.05, 
        timeframe: 2,
        confidenceInterval: 90,
        volatility: 0.15
      });
      
      // Check that we have the right number of data points (quarterly for 2 years = 8 points)
      expect(predictions).toHaveLength(8);
      
      // Check that the data is properly structured
      predictions.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('value');
        expect(point).toHaveProperty('upperBound');
        expect(point).toHaveProperty('lowerBound');
        expect(point.date).toBeInstanceOf(Date);
        expect(typeof point.value).toBe('number');
        expect(point.value).toBeGreaterThan(0);
        expect(point.upperBound).toBeGreaterThan(point.value);
        expect(point.lowerBound).toBeLessThan(point.value);
      });
      
      // Ensure dates are in ascending order
      const dates = predictions.map(point => point.date.getTime());
      const sortedDates = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sortedDates);
      
      // First prediction should be approximately 5% growth from last historical value
      const lastHistorical = historicalData[historicalData.length - 1].value;
      const firstPrediction = predictions[0].value;
      const quarterlyGrowthRate = Math.pow(1 + 0.05, 0.25) - 1; // Convert annual to quarterly
      
      // Expected value after one quarter with 5% annual growth
      const expectedValue = lastHistorical * (1 + quarterlyGrowthRate);
      
      // Allow for rounding differences
      expect(firstPrediction).toBeCloseTo(expectedValue, -2);
    });
    
    it('should return empty array for empty historical data', () => {
      const result = predictFutureValues([]);
      expect(result).toHaveLength(0);
    });
  });
  
  describe('generatePropertyValueTrend', () => {
    it('should generate complete trend data for a property', () => {
      const trendData = generatePropertyValueTrend(testProperty as Property);
      
      expect(trendData).toHaveProperty('historical');
      expect(trendData).toHaveProperty('predicted');
      expect(trendData).toHaveProperty('property');
      
      expect(trendData.historical.length).toBeGreaterThan(0);
      expect(trendData.predicted.length).toBeGreaterThan(0);
      expect(trendData.property).toEqual(testProperty);
    });
  });
  
  describe('formatChartDate', () => {
    it('should format dates correctly for different formats', () => {
      const testDate = new Date('2022-05-15');
      
      expect(formatChartDate(testDate, 'short')).toBe('5/22');
      expect(formatChartDate(testDate, 'month-year')).toBe('May 2022');
      expect(formatChartDate(testDate, 'quarter-year')).toBe('Q2 2022');
      expect(formatChartDate(testDate, 'full')).toBe('May 2022');
    });
  });
  
  describe('formatChartCurrency', () => {
    it('should format currency values correctly', () => {
      expect(formatChartCurrency(1234567)).toBe('$1,234,567');
      expect(formatChartCurrency(1234567, true)).toBe('$1.2M');
      expect(formatChartCurrency(12345, true)).toBe('$12K');
      expect(formatChartCurrency(123, true)).toBe('$123');
    });
  });
});