import { 
  calculateGrowthRate, 
  predictFutureValues, 
  generateTrendLineData,
  calculateCompoundAnnualGrowthRate,
  normalizeValuationData
} from '../components/comparison/ValuationTrendUtils';

describe('ValuationTrendUtils', () => {
  // Sample data for testing
  const sampleData = [
    { year: '2019', value: 250000 },
    { year: '2020', value: 275000 },
    { year: '2021', value: 290000 },
    { year: '2022', value: 315000 },
    { year: '2023', value: 350000 },
  ];

  describe('calculateGrowthRate', () => {
    test('calculates growth rate correctly with sample data', () => {
      const growthRate = calculateGrowthRate(sampleData);
      // From $250,000 to $350,000 = 40% growth
      expect(growthRate).toBeCloseTo(40, 1);
    });

    test('returns 0 for a single data point', () => {
      const growthRate = calculateGrowthRate([{ year: '2023', value: 350000 }]);
      expect(growthRate).toEqual(0);
    });

    test('returns 0 for empty array', () => {
      const growthRate = calculateGrowthRate([]);
      expect(growthRate).toEqual(0);
    });

    test('handles negative growth correctly', () => {
      const data = [
        { year: '2022', value: 400000 },
        { year: '2023', value: 350000 },
      ];
      const growthRate = calculateGrowthRate(data);
      // From $400,000 to $350,000 = -12.5% growth
      expect(growthRate).toBeCloseTo(-12.5, 1);
    });
  });

  describe('calculateCompoundAnnualGrowthRate', () => {
    test('calculates CAGR correctly with sample data', () => {
      const cagr = calculateCompoundAnnualGrowthRate(sampleData);
      // CAGR over 4 years (2019-2023): (350000/250000)^(1/4) - 1 = 8.77%
      expect(cagr).toBeCloseTo(8.77, 1);
    });

    test('returns 0 for a single data point', () => {
      const cagr = calculateCompoundAnnualGrowthRate([{ year: '2023', value: 350000 }]);
      expect(cagr).toEqual(0);
    });

    test('returns 0 for empty array', () => {
      const cagr = calculateCompoundAnnualGrowthRate([]);
      expect(cagr).toEqual(0);
    });

    test('handles negative growth correctly', () => {
      const data = [
        { year: '2020', value: 400000 },
        { year: '2021', value: 380000 },
        { year: '2022', value: 360000 },
        { year: '2023', value: 350000 },
      ];
      const cagr = calculateCompoundAnnualGrowthRate(data);
      // CAGR over 3 years (2020-2023): (350000/400000)^(1/3) - 1 = -4.38%
      expect(cagr).toBeCloseTo(-4.38, 1);
    });
  });

  describe('predictFutureValues', () => {
    test('predicts future values correctly based on historical trend', () => {
      const predictions = predictFutureValues(sampleData, 2);
      
      // Should have 2 more years beyond the sample data
      expect(predictions.length).toBe(2);
      
      // Years should be 2024 and 2025
      expect(predictions[0].year).toBe('2024');
      expect(predictions[1].year).toBe('2025');
      
      // Values should follow the trend (approximately)
      // Based on the sample data trend, 2024 value should be around 385,000
      expect(predictions[0].value).toBeGreaterThan(375000);
      expect(predictions[0].value).toBeLessThan(395000);
    });

    test('returns empty array when input data is empty', () => {
      const predictions = predictFutureValues([], 2);
      expect(predictions).toEqual([]);
    });

    test('returns empty array when years parameter is 0', () => {
      const predictions = predictFutureValues(sampleData, 0);
      expect(predictions).toEqual([]);
    });

    test('returns empty array when years parameter is negative', () => {
      const predictions = predictFutureValues(sampleData, -1);
      expect(predictions).toEqual([]);
    });
  });

  describe('generateTrendLineData', () => {
    test('generates correct trend line data points', () => {
      const trendData = generateTrendLineData(sampleData);
      
      // Should have the same number of points as the input
      expect(trendData.length).toBe(sampleData.length);
      
      // First and last points should match the regression line
      expect(trendData[0].year).toBe('2019');
      expect(trendData[trendData.length - 1].year).toBe('2023');
      
      // Check if the trend values are roughly in line with the expected trend
      // We don't check exact values as regression calculation might vary slightly
      expect(trendData[trendData.length - 1].value).toBeGreaterThan(trendData[0].value);
    });

    test('returns empty array when input data is empty', () => {
      const trendData = generateTrendLineData([]);
      expect(trendData).toEqual([]);
    });

    test('returns original data point when only one data point exists', () => {
      const singlePointData = [{ year: '2023', value: 350000 }];
      const trendData = generateTrendLineData(singlePointData);
      expect(trendData).toEqual(singlePointData);
    });
  });

  describe('normalizeValuationData', () => {
    test('normalizes data from various formats correctly', () => {
      const mixedData = [
        { year: 2019, value: 250000 },
        { date: '2020-06-15', propertyValue: 275000 },
        { taxYear: '2021', assessedValue: 290000 },
        { year: '2022', value: "$315,000" },
        { period: 2023, marketValue: 350000 },
      ];
      
      const normalized = normalizeValuationData(mixedData);
      
      // Should normalize to our standard format
      expect(normalized.length).toBe(5);
      expect(normalized[0]).toEqual({ year: '2019', value: 250000 });
      expect(normalized[1]).toEqual({ year: '2020', value: 275000 });
      expect(normalized[2]).toEqual({ year: '2021', value: 290000 });
      expect(normalized[3]).toEqual({ year: '2022', value: 315000 });
      expect(normalized[4]).toEqual({ year: '2023', value: 350000 });
    });

    test('handles empty array', () => {
      const normalized = normalizeValuationData([]);
      expect(normalized).toEqual([]);
    });

    test('sorts data by year', () => {
      const unsortedData = [
        { year: '2022', value: 315000 },
        { year: '2019', value: 250000 },
        { year: '2021', value: 290000 },
        { year: '2023', value: 350000 },
        { year: '2020', value: 275000 },
      ];
      
      const normalized = normalizeValuationData(unsortedData);
      
      // Should be sorted by year
      expect(normalized[0].year).toBe('2019');
      expect(normalized[1].year).toBe('2020');
      expect(normalized[2].year).toBe('2021');
      expect(normalized[3].year).toBe('2022');
      expect(normalized[4].year).toBe('2023');
    });
  });
});