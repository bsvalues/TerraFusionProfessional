import { 
  parsePropertyValue, 
  estimatePropertyTax, 
  formatTaxSummary,
  calculateMonthlyPayment,
  formatTaxReportData,
  DEFAULT_TAX_OPTIONS,
  TaxEstimateOptions
} from '../taxEstimatorService';
import { Property } from '../../../shared/schema';

describe('Tax Estimator Service', () => {
  // Create a mock property to test with
  const mockProperty: Partial<Property> = {
    id: 1,
    address: '123 Test St',
    parcelId: 'TEST123',
    value: '$300,000',
    squareFeet: 2000,
    neighborhood: 'Kennewick',
    propertyType: 'Residential'
  };
  
  describe('parsePropertyValue', () => {
    it('should parse property value correctly', () => {
      expect(parsePropertyValue('$250,000')).toBe(250000);
      expect(parsePropertyValue('$1,250,000.50')).toBe(1250000.5);
      expect(parsePropertyValue('250000')).toBe(250000);
    });
    
    it('should handle null values', () => {
      expect(parsePropertyValue(null)).toBe(0);
    });
    
    it('should handle empty strings', () => {
      expect(parsePropertyValue('')).toBe(0);
    });
  });
  
  describe('estimatePropertyTax', () => {
    it('should calculate total tax correctly with default options', () => {
      const result = estimatePropertyTax(mockProperty as Property);
      
      // Verify the breakdown includes all tax district amounts
      expect(result.county).toBeGreaterThan(0);
      expect(result.city).toBeGreaterThan(0);
      expect(result.schoolDistrict).toBeGreaterThan(0);
      expect(result.fireDistrict).toBeGreaterThan(0);
      expect(result.libraryDistrict).toBeGreaterThan(0);
      expect(result.hospitalDistrict).toBeGreaterThan(0);
      expect(result.portDistrict).toBeGreaterThan(0);
      expect(result.stateSchool).toBeGreaterThan(0);
      
      // Verify the total is the sum of all tax district amounts
      const calculatedTotal = result.county + result.city + result.schoolDistrict +
        result.fireDistrict + result.libraryDistrict + result.hospitalDistrict +
        result.portDistrict + result.stateSchool;
      
      expect(result.total).toBe(calculatedTotal);
      
      // Verify effective rate is calculated correctly
      const propertyValue = parsePropertyValue(mockProperty.value);
      const expectedEffectiveRate = ((result.total / propertyValue) * 100);
      expect(result.effectiveRate).toBeCloseTo(expectedEffectiveRate, 2);
    });
    
    it('should exclude disabled tax districts', () => {
      const options: TaxEstimateOptions = {
        ...DEFAULT_TAX_OPTIONS,
        includeCity: false,
        includeLibraryDistrict: false
      };
      
      const result = estimatePropertyTax(mockProperty as Property, options);
      
      expect(result.city).toBe(0);
      expect(result.libraryDistrict).toBe(0);
      expect(result.county).toBeGreaterThan(0); // Should still include county
    });
    
    it('should apply exemptions to reduce taxable value', () => {
      const options: TaxEstimateOptions = {
        ...DEFAULT_TAX_OPTIONS,
        homesteadExemption: true,
        exemptionAmount: 50000
      };
      
      const result = estimatePropertyTax(mockProperty as Property, options);
      const resultWithoutExemption = estimatePropertyTax(mockProperty as Property);
      
      // Total tax should be less with exemption
      expect(result.total).toBeLessThan(resultWithoutExemption.total);
      expect(result.exemptions.total).toBe(50000);
    });
    
    it('should handle zero or negative property values', () => {
      const zeroValueProperty = { ...mockProperty, value: '$0' };
      const result = estimatePropertyTax(zeroValueProperty as Property);
      
      expect(result.total).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });
  });
  
  describe('formatTaxSummary', () => {
    it('should format tax summary correctly', () => {
      const taxBreakdown = {
        county: 375,
        city: 735,
        schoolDistrict: 1290,
        fireDistrict: 450,
        libraryDistrict: 135,
        hospitalDistrict: 90,
        portDistrict: 105,
        stateSchool: 735,
        total: 3915,
        effectiveRate: 1.305,
        exemptions: { total: 0 }
      };
      
      const summary = formatTaxSummary(taxBreakdown);
      
      // Should include main tax districts
      expect(summary).toContain('County: $375');
      expect(summary).toContain('City: $735');
      expect(summary).toContain('School: $1,290');
      expect(summary).toContain('State School: $735');
    });
    
    it('should include exemption in summary if applicable', () => {
      const taxBreakdown = {
        county: 375,
        city: 735,
        schoolDistrict: 1290,
        fireDistrict: 450,
        libraryDistrict: 135,
        hospitalDistrict: 90,
        portDistrict: 105,
        stateSchool: 735,
        total: 3915,
        effectiveRate: 1.305,
        exemptions: { total: 50000 }
      };
      
      const summary = formatTaxSummary(taxBreakdown);
      expect(summary).toContain('Exemption: $50,000');
    });
  });
  
  describe('calculateMonthlyPayment', () => {
    it('should calculate monthly payment correctly', () => {
      expect(calculateMonthlyPayment(12000)).toBe(1000);
      expect(calculateMonthlyPayment(3915)).toBe(326);
    });
  });
  
  describe('formatTaxReportData', () => {
    it('should format tax report data correctly', () => {
      const taxBreakdown = {
        county: 375,
        city: 735,
        schoolDistrict: 1290,
        fireDistrict: 450,
        libraryDistrict: 135,
        hospitalDistrict: 90,
        portDistrict: 105,
        stateSchool: 735,
        total: 3915,
        effectiveRate: 1.305,
        exemptions: { total: 0 }
      };
      
      const report = formatTaxReportData(mockProperty as Property, taxBreakdown);
      
      expect(report.propertyAddress).toBe(mockProperty.address);
      expect(report.propertyValue).toBe(mockProperty.value);
      expect(report.annualTax).toBe('$3,915');
      expect(report.monthlyTax).toBe('$326');
      expect(report.effectiveRate).toBe('1.305%');
      
      // Check breakdown
      expect(report.breakdown.county).toBe('$375');
      expect(report.breakdown.city).toBe('$735');
      expect(report.breakdown.schoolDistrict).toBe('$1,290');
      expect(report.breakdown.stateSchool).toBe('$735');
      
      // Other districts combined
      const otherDistricts = 450 + 135 + 90 + 105; // fire + library + hospital + port
      expect(report.breakdown.otherDistricts).toBe(`$${otherDistricts.toLocaleString()}`);
    });
  });
});