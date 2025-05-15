/**
 * Tax Estimator Service
 * Provides utilities for estimating property taxes based on assessed values,
 * tax rates, and applicable exemptions.
 */

import { formatCurrency } from '@/lib/utils';
import { Property } from '../../shared/schema';

/**
 * Default tax rates for Benton County, WA
 * These rates would typically come from an API or database in a production app
 */
const DEFAULT_TAX_RATES = {
  county: 1.25, // Per $1000 of assessed value
  city: {
    'Kennewick': 2.45,
    'Richland': 2.38,
    'Prosser': 2.40,
    'Benton City': 2.42,
    'West Richland': 2.35,
    'default': 2.40
  },
  schoolDistrict: 4.30,
  fireDistrict: 1.50,
  libraryDistrict: 0.45,
  hospitalDistrict: 0.30,
  portDistrict: 0.35,
  stateSchool: 2.45
};

/**
 * Options for tax estimation
 */
export interface TaxEstimateOptions {
  includeCounty: boolean;
  includeCity: boolean;
  includeSchoolDistrict: boolean;
  includeFireDistrict: boolean;
  includeLibraryDistrict: boolean;
  includeHospitalDistrict: boolean;
  includePortDistrict: boolean;
  includeStateSchool: boolean;
  homesteadExemption: boolean;
  seniorExemption: boolean;
  disabilityExemption: boolean;
  veteranExemption: boolean;
  historicPropertyExemption: boolean;
  agriculturalExemption: boolean;
  exemptionAmount: number;
}

/**
 * Default options for tax estimation
 */
export const DEFAULT_TAX_OPTIONS: TaxEstimateOptions = {
  includeCounty: true,
  includeCity: true,
  includeSchoolDistrict: true,
  includeFireDistrict: true,
  includeLibraryDistrict: true,
  includeHospitalDistrict: true,
  includePortDistrict: true,
  includeStateSchool: true,
  homesteadExemption: false,
  seniorExemption: false,
  disabilityExemption: false,
  veteranExemption: false,
  historicPropertyExemption: false,
  agriculturalExemption: false,
  exemptionAmount: 0
};

/**
 * Tax estimate breakdown structure
 */
export interface TaxEstimateBreakdown {
  county: number;
  city: number;
  schoolDistrict: number;
  fireDistrict: number;
  libraryDistrict: number;
  hospitalDistrict: number;
  portDistrict: number;
  stateSchool: number;
  total: number;
  effectiveRate: number;
  exemptions: {
    total: number;
  };
}

/**
 * Parses a property value string to number
 * @param value Property value string (e.g. "$250,000")
 * @returns Numeric value
 */
export function parsePropertyValue(value: string | null): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, ''));
}

/**
 * Gets the city tax rate based on property location
 * @param property Property object
 * @returns Tax rate for the property's city
 */
function getCityTaxRate(property: Property): number {
  const neighborhood = property.neighborhood;
  if (neighborhood && DEFAULT_TAX_RATES.city[neighborhood as keyof typeof DEFAULT_TAX_RATES.city]) {
    return DEFAULT_TAX_RATES.city[neighborhood as keyof typeof DEFAULT_TAX_RATES.city];
  }
  return DEFAULT_TAX_RATES.city.default;
}

/**
 * Estimates property tax based on property value and tax options
 * @param property Property to estimate taxes for
 * @param options Tax estimation options
 * @returns Breakdown of estimated taxes
 */
export function estimatePropertyTax(
  property: Property,
  options: TaxEstimateOptions = DEFAULT_TAX_OPTIONS
): TaxEstimateBreakdown {
  // Parse property value
  const propertyValue = parsePropertyValue(property.value);
  
  // Adjust for exemptions
  const taxableValue = Math.max(0, propertyValue - options.exemptionAmount);
  
  // Tax rates per $1000, so divide by 1000
  const taxableValuePerThousand = taxableValue / 1000;
  
  // Calculate individual taxes
  const countyTax = options.includeCounty ? taxableValuePerThousand * DEFAULT_TAX_RATES.county : 0;
  const cityTax = options.includeCity ? taxableValuePerThousand * getCityTaxRate(property) : 0;
  const schoolDistrictTax = options.includeSchoolDistrict ? taxableValuePerThousand * DEFAULT_TAX_RATES.schoolDistrict : 0;
  const fireDistrictTax = options.includeFireDistrict ? taxableValuePerThousand * DEFAULT_TAX_RATES.fireDistrict : 0;
  const libraryDistrictTax = options.includeLibraryDistrict ? taxableValuePerThousand * DEFAULT_TAX_RATES.libraryDistrict : 0;
  const hospitalDistrictTax = options.includeHospitalDistrict ? taxableValuePerThousand * DEFAULT_TAX_RATES.hospitalDistrict : 0;
  const portDistrictTax = options.includePortDistrict ? taxableValuePerThousand * DEFAULT_TAX_RATES.portDistrict : 0;
  const stateSchoolTax = options.includeStateSchool ? taxableValuePerThousand * DEFAULT_TAX_RATES.stateSchool : 0;
  
  // Calculate total tax
  const totalTax = countyTax + cityTax + schoolDistrictTax + fireDistrictTax + 
    libraryDistrictTax + hospitalDistrictTax + portDistrictTax + stateSchoolTax;
  
  // Calculate effective tax rate
  const effectiveRate = propertyValue > 0 ? (totalTax / propertyValue) * 100 : 0;
  
  return {
    county: Math.round(countyTax),
    city: Math.round(cityTax),
    schoolDistrict: Math.round(schoolDistrictTax),
    fireDistrict: Math.round(fireDistrictTax),
    libraryDistrict: Math.round(libraryDistrictTax),
    hospitalDistrict: Math.round(hospitalDistrictTax),
    portDistrict: Math.round(portDistrictTax),
    stateSchool: Math.round(stateSchoolTax),
    total: Math.round(totalTax),
    effectiveRate: parseFloat(effectiveRate.toFixed(3)),
    exemptions: {
      total: options.exemptionAmount
    }
  };
}

/**
 * Formats a tax summary string based on tax breakdown
 * @param breakdown Tax estimate breakdown
 * @returns Formatted summary string
 */
export function formatTaxSummary(breakdown: TaxEstimateBreakdown): string {
  const parts = [];
  
  if (breakdown.county > 0) {
    parts.push(`County: ${formatCurrency(breakdown.county)}`);
  }
  
  if (breakdown.city > 0) {
    parts.push(`City: ${formatCurrency(breakdown.city)}`);
  }
  
  if (breakdown.schoolDistrict > 0) {
    parts.push(`School: ${formatCurrency(breakdown.schoolDistrict)}`);
  }
  
  if (breakdown.stateSchool > 0) {
    parts.push(`State School: ${formatCurrency(breakdown.stateSchool)}`);
  }
  
  // Add exemption info if applicable
  if (breakdown.exemptions.total > 0) {
    parts.push(`Exemption: ${formatCurrency(breakdown.exemptions.total)}`);
  }
  
  return parts.join(' • ');
}

/**
 * Calculates a monthly tax payment estimate based on annual tax amount
 * @param annualTax Annual tax amount
 * @returns Monthly tax payment amount
 */
export function calculateMonthlyPayment(annualTax: number): number {
  return Math.round(annualTax / 12);
}

/**
 * Formats property tax information for display in reports
 * @param property Property object
 * @param taxBreakdown Tax breakdown information
 * @returns Formatted tax report data
 */
export function formatTaxReportData(property: Property, taxBreakdown: TaxEstimateBreakdown) {
  const valueString = property.value || 'Unknown value';
  
  return {
    propertyAddress: property.address,
    propertyValue: valueString,
    annualTax: formatCurrency(taxBreakdown.total),
    monthlyTax: formatCurrency(calculateMonthlyPayment(taxBreakdown.total)),
    effectiveRate: `${taxBreakdown.effectiveRate}%`,
    breakdown: {
      county: formatCurrency(taxBreakdown.county),
      city: formatCurrency(taxBreakdown.city),
      schoolDistrict: formatCurrency(taxBreakdown.schoolDistrict),
      otherDistricts: formatCurrency(
        taxBreakdown.fireDistrict + 
        taxBreakdown.libraryDistrict + 
        taxBreakdown.hospitalDistrict + 
        taxBreakdown.portDistrict
      ),
      stateSchool: formatCurrency(taxBreakdown.stateSchool)
    },
    exemptions: formatCurrency(taxBreakdown.exemptions.total)
  };
}