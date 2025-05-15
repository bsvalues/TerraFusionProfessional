import { 
  formatPropertyValue, 
  parsePropertyValue, 
  ensureCoordinates,
  calculatePercentageDifference
} from '../propertyValueUtils';

describe('propertyValueUtils', () => {
  describe('formatPropertyValue', () => {
    test('should format number values correctly', () => {
      expect(formatPropertyValue(1000)).toBe('1,000');
      expect(formatPropertyValue(1000.5)).toBe('1,000.5');
    });

    test('should format string numeric values correctly', () => {
      expect(formatPropertyValue('1000')).toBe('1,000');
      expect(formatPropertyValue('1000.5')).toBe('1,000.5');
    });

    test('should format currency values with $ prefix', () => {
      expect(formatPropertyValue(1000, true)).toBe('$1,000');
      expect(formatPropertyValue('1000', true)).toBe('$1,000');
    });

    test('should return non-numeric strings as is', () => {
      expect(formatPropertyValue('test')).toBe('test');
      expect(formatPropertyValue('test-123')).toBe('test-123');
    });

    test('should return default value for null/undefined', () => {
      expect(formatPropertyValue(null)).toBe('N/A');
      expect(formatPropertyValue(undefined)).toBe('N/A');
      expect(formatPropertyValue(null, false, 'Not Available')).toBe('Not Available');
    });
  });

  describe('parsePropertyValue', () => {
    test('should return numbers unchanged', () => {
      expect(parsePropertyValue(100)).toBe(100);
      expect(parsePropertyValue(100.5)).toBe(100.5);
    });

    test('should parse string numeric values to numbers', () => {
      expect(parsePropertyValue('100')).toBe(100);
      expect(parsePropertyValue('100.5')).toBe(100.5);
    });

    test('should return default value for non-numeric strings', () => {
      expect(parsePropertyValue('test')).toBe(0);
      expect(parsePropertyValue('test', 10)).toBe(10);
    });

    test('should return default value for null/undefined', () => {
      expect(parsePropertyValue(null)).toBe(0);
      expect(parsePropertyValue(undefined)).toBe(0);
      expect(parsePropertyValue(null, 5)).toBe(5);
    });
  });

  describe('ensureCoordinates', () => {
    test('should handle array coordinates correctly', () => {
      expect(ensureCoordinates([10, 20])).toEqual([10, 20]);
      expect(ensureCoordinates(['10', '20'])).toEqual([10, 20]);
    });

    test('should handle object coordinates correctly', () => {
      expect(ensureCoordinates({ latitude: 10, longitude: 20 })).toEqual([10, 20]);
      expect(ensureCoordinates({ latitude: '10', longitude: '20' })).toEqual([10, 20]);
    });

    test('should return default coordinates for invalid inputs', () => {
      expect(ensureCoordinates(null)).toEqual([0, 0]);
      expect(ensureCoordinates(undefined)).toEqual([0, 0]);
      expect(ensureCoordinates({})).toEqual([0, 0]);
      expect(ensureCoordinates([])).toEqual([0, 0]);
      expect(ensureCoordinates(['invalid', 'coords'])).toEqual([0, 0]);
    });

    test('should use provided default coordinates', () => {
      expect(ensureCoordinates(null, [45, -90])).toEqual([45, -90]);
      expect(ensureCoordinates({}, [45, -90])).toEqual([45, -90]);
    });
  });

  describe('calculatePercentageDifference', () => {
    test('should calculate percentage difference correctly', () => {
      expect(calculatePercentageDifference(110, 100)).toBe(10);
      expect(calculatePercentageDifference(90, 100)).toBe(-10);
      expect(calculatePercentageDifference('110', '100')).toBe(10);
    });

    test('should handle zero second value', () => {
      expect(calculatePercentageDifference(100, 0)).toBe(0);
      expect(calculatePercentageDifference('100', '0')).toBe(0);
    });

    test('should handle null/undefined values', () => {
      expect(calculatePercentageDifference(null, 100)).toBe(-100);
      expect(calculatePercentageDifference(100, null)).toBe(0);
      expect(calculatePercentageDifference(undefined, 100)).toBe(-100);
    });
  });
});