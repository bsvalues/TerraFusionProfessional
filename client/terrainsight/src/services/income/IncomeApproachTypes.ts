/**
 * IncomeApproachTypes.ts
 * 
 * Type definitions for the Income Approach module
 * Supports property valuation using income capitalization methods
 */

/**
 * Income property types categorization
 */
export enum IncomePropertyType {
  RESIDENTIAL_MULTIFAMILY = 'residential_multifamily',
  COMMERCIAL_RETAIL = 'commercial_retail',
  COMMERCIAL_OFFICE = 'commercial_office',
  COMMERCIAL_INDUSTRIAL = 'commercial_industrial',
  COMMERCIAL_MIXED_USE = 'commercial_mixed_use',
  SPECIAL_PURPOSE = 'special_purpose'
}

/**
 * Income valuation methods
 */
export enum IncomeValuationMethod {
  DIRECT_CAPITALIZATION = 'direct_capitalization',
  GROSS_RENT_MULTIPLIER = 'gross_rent_multiplier',
  DISCOUNTED_CASH_FLOW = 'discounted_cash_flow'
}

/**
 * Expense category types
 */
export enum ExpenseCategory {
  FIXED = 'fixed',
  VARIABLE = 'variable',
  REPLACEMENT_RESERVES = 'replacement_reserves'
}

/**
 * Income stream types
 */
export enum IncomeStreamType {
  RENTAL = 'rental',
  OTHER = 'other',
  PARKING = 'parking',
  LAUNDRY = 'laundry',
  VENDING = 'vending',
  LATE_FEES = 'late_fees'
}

/**
 * Interface for market data - cap rates, vacancy rates, etc.
 */
export interface MarketData {
  /** Market name or identifier */
  marketName: string;
  
  /** Property type */
  propertyType: IncomePropertyType;
  
  /** Average capitalization rate */
  capRate: number;
  
  /** Average vacancy rate */
  vacancyRate: number;
  
  /** Average expense ratio */
  expenseRatio: number;
  
  /** Average rent per square foot */
  rentPerSqFt: number;
  
  /** Average gross rent multiplier */
  grossRentMultiplier?: number;
  
  /** Year of market data */
  dataYear: number;
  
  /** Source of market data */
  dataSource?: string;
}

/**
 * Interface for rental unit details
 */
export interface RentalUnit {
  /** Unit identifier */
  unitId: string;
  
  /** Unit type or description */
  unitType: string;
  
  /** Square footage */
  squareFeet: number;
  
  /** Number of bedrooms (residential) */
  bedrooms?: number;
  
  /** Number of bathrooms (residential) */
  bathrooms?: number;
  
  /** Monthly rent */
  monthlyRent: number;
  
  /** Annual rent (calculated) */
  annualRent?: number;
  
  /** Rent per square foot (calculated) */
  rentPerSqFt?: number;
  
  /** Current vacancy status */
  isVacant: boolean;
  
  /** Lease end date */
  leaseEndDate?: Date;
  
  /** Tenant information */
  tenantName?: string;
  
  /** Unit-specific notes */
  notes?: string;
}

/**
 * Interface for income stream details
 */
export interface IncomeStream {
  /** Income stream name */
  name: string;
  
  /** Income stream type */
  type: IncomeStreamType;
  
  /** Monthly amount */
  monthlyAmount: number;
  
  /** Annual amount (calculated) */
  annualAmount?: number;
  
  /** Notes about income stream */
  notes?: string;
}

/**
 * Interface for expense item details
 */
export interface ExpenseItem {
  /** Expense name */
  name: string;
  
  /** Expense category */
  category: ExpenseCategory;
  
  /** Annual amount */
  annualAmount: number;
  
  /** Is expense fixed or variable */
  isFixed: boolean;
  
  /** Notes about expense */
  notes?: string;
}

/**
 * Interface for income approach property valuation
 */
export interface IncomeProperty {
  /** Property identifier */
  propertyId: string;
  
  /** Property name */
  propertyName: string;
  
  /** Property address */
  address: string;
  
  /** Property type */
  propertyType: IncomePropertyType;
  
  /** Total building square footage */
  totalSqFt: number;
  
  /** Year built */
  yearBuilt?: number;
  
  /** Last sale date */
  lastSaleDate?: Date;
  
  /** Last sale price */
  lastSalePrice?: number;
  
  /** Parcel number */
  parcelNumber?: string;
  
  /** Number of units */
  unitCount: number;
  
  /** Individual rental units */
  rentalUnits: RentalUnit[];
  
  /** Additional income streams */
  incomeStreams: IncomeStream[];
  
  /** Expense items */
  expenses: ExpenseItem[];
  
  /** Capitalization rate (%) */
  capRate?: number;
  
  /** Gross rent multiplier */
  grossRentMultiplier?: number;
  
  /** Estimated market value from income approach */
  estimatedValue?: number;
  
  /** Vacancy rate (%) */
  vacancyRate?: number;
  
  /** Valuation method used */
  valuationMethod: IncomeValuationMethod;
  
  /** Market data used for comparison */
  marketData?: MarketData;
  
  /** Valuation date */
  valuationDate: Date;
  
  /** Additional notes */
  notes?: string;
}

/**
 * Interface for income approach calculations summary
 */
export interface IncomeApproachSummary {
  /** Property identifier */
  propertyId: string;
  
  /** Potential gross income */
  potentialGrossIncome: number;
  
  /** Vacancy and credit loss */
  vacancyLoss: number;
  
  /** Effective gross income */
  effectiveGrossIncome: number;
  
  /** Total operating expenses */
  totalOperatingExpenses: number;
  
  /** Net operating income */
  netOperatingIncome: number;
  
  /** Capitalization rate used */
  capRate: number;
  
  /** Estimated property value */
  estimatedValue: number;
  
  /** Value per square foot */
  valuePerSqFt: number;
  
  /** Value per unit */
  valuePerUnit: number;
  
  /** Gross rent multiplier */
  grossRentMultiplier?: number;
  
  /** Expense ratio */
  expenseRatio: number;
  
  /** Operating expense ratio */
  operatingExpenseRatio: number;
  
  /** Calculated by user */
  calculatedBy?: string;
  
  /** Calculation date */
  calculationDate: Date;
}

/**
 * Interface for income approach comparison group
 */
export interface IncomeApproachGroup {
  /** Group identifier */
  groupId: string;
  
  /** Group name */
  groupName: string;
  
  /** Group description */
  description?: string;
  
  /** Property type */
  propertyType: IncomePropertyType;
  
  /** Properties in this group */
  properties: IncomeProperty[];
  
  /** Market data associated with this group */
  marketData?: MarketData;
  
  /** Creation date */
  creationDate: Date;
  
  /** Created by user */
  createdBy?: string;
  
  /** Last updated date */
  lastUpdated: Date;
}

/**
 * Interface for income approach adjustment factors
 */
export interface AdjustmentFactors {
  /** Location quality adjustment */
  locationFactor: number;
  
  /** Property condition adjustment */
  conditionFactor: number;
  
  /** Amenities adjustment */
  amenitiesFactor: number;
  
  /** Property age adjustment */
  ageFactor: number;
  
  /** Unit size adjustment */
  sizeFactor: number;
  
  /** Parking availability adjustment */
  parkingFactor: number;
  
  /** Overall quality adjustment */
  qualityFactor: number;
}

/**
 * Interface for DCF analysis
 */
export interface DCFAnalysis {
  /** Property identifier */
  propertyId: string;
  
  /** Analysis period in years */
  analysisPeriod: number;
  
  /** Discount rate (%) */
  discountRate: number;
  
  /** Terminal capitalization rate (%) */
  terminalCapRate: number;
  
  /** Annual income growth rate (%) */
  incomeGrowthRate: number;
  
  /** Annual expense growth rate (%) */
  expenseGrowthRate: number;
  
  /** Cash flows for each period */
  cashFlows: number[];
  
  /** Terminal value */
  terminalValue: number;
  
  /** Present value of cash flows */
  presentValueOfCashFlows: number;
  
  /** Present value of terminal value */
  presentValueOfTerminalValue: number;
  
  /** Total net present value */
  netPresentValue: number;
  
  /** Internal rate of return (%) */
  internalRateOfReturn?: number;
}