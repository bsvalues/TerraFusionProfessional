// Income Lease Up seed data for Benton County, WA
import { InsertIncomeLeaseUp, InsertIncomeLeaseUpMonthListing } from "@shared/schema";

// Lease Up income approach sample data for commercial properties
export const leaseUpSeedData: InsertIncomeLeaseUp[] = [
  {
    incomeLeaseUpId: 1,
    incomeYear: 2023,
    supNum: 101,
    incomeId: 1001,
    frequency: "M", // Monthly
    leaseType: "T", // Triple Net
    unitOfMeasure: "S", // Square Foot
    rentLossAreaSqft: 35000,
    rentSqft: 22.50,
    rentNumberOfYears: 5.0,
    rentTotal: 3937500,
    leasePct: 6.00,
    leaseTotal: 236250,
    totalFinishOutSqft: 35.00,
    totalFinishOutTotal: 1225000,
    discountRate: 7.50,
    numberOfYears: 5.0,
    leaseUpCost: 1461250,
    leaseUpCostOverride: false,
    netRentableArea: 50000,
    currentOccupancyPct: 30.00,
    stabilizedOccupancyPct: 90.00,
    stabilizedOccupancy: 45000,
    spaceToBeAbsorbed: 35000,
    absorptionPeriodInMonths: 24,
    estimatedAbsorptionPerYear: 17500,
    estimatedAbsorptionPerMonth: 1458,
    leasingCommissionsPct: 6,
    grossRentLossPerSqft: 22.50,
    tenantFinishAllowancePerSqft: 35.00
  },
  {
    incomeLeaseUpId: 2,
    incomeYear: 2023,
    supNum: 102,
    incomeId: 1002,
    frequency: "M", // Monthly
    leaseType: "G", // Gross
    unitOfMeasure: "S", // Square Foot
    rentLossAreaSqft: 12500,
    rentSqft: 19.75,
    rentNumberOfYears: 3.0,
    rentTotal: 740625,
    leasePct: 5.00,
    leaseTotal: 37031,
    totalFinishOutSqft: 28.50,
    totalFinishOutTotal: 356250,
    discountRate: 7.25,
    numberOfYears: 3.0,
    leaseUpCost: 393281,
    leaseUpCostOverride: false,
    netRentableArea: 25000,
    currentOccupancyPct: 50.00,
    stabilizedOccupancyPct: 85.00,
    stabilizedOccupancy: 21250,
    spaceToBeAbsorbed: 12500,
    absorptionPeriodInMonths: 15,
    estimatedAbsorptionPerYear: 10000,
    estimatedAbsorptionPerMonth: 833,
    leasingCommissionsPct: 5,
    grossRentLossPerSqft: 19.75,
    tenantFinishAllowancePerSqft: 28.50
  },
  {
    incomeLeaseUpId: 3,
    incomeYear: 2023,
    supNum: 103,
    incomeId: 1003,
    frequency: "M", // Monthly
    leaseType: "N", // Net
    unitOfMeasure: "S", // Square Foot
    rentLossAreaSqft: 8500,
    rentSqft: 25.95,
    rentNumberOfYears: 7.0,
    rentTotal: 1543275,
    leasePct: 6.50,
    leaseTotal: 100313,
    totalFinishOutSqft: 42.00,
    totalFinishOutTotal: 357000,
    discountRate: 8.00,
    numberOfYears: 7.0,
    leaseUpCost: 457313,
    leaseUpCostOverride: false,
    netRentableArea: 10000,
    currentOccupancyPct: 15.00,
    stabilizedOccupancyPct: 95.00,
    stabilizedOccupancy: 9500,
    spaceToBeAbsorbed: 8500,
    absorptionPeriodInMonths: 18,
    estimatedAbsorptionPerYear: 5667,
    estimatedAbsorptionPerMonth: 472,
    leasingCommissionsPct: 6,
    grossRentLossPerSqft: 25.95,
    tenantFinishAllowancePerSqft: 42.00
  }
];

// Month listings for lease up
export const leaseUpMonthListingSeedData: InsertIncomeLeaseUpMonthListing[] = [
  // First 12 months for property 1
  {
    incomeLeaseUpMonthListingId: 1,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 1,
    available: 35000.0,
    rentLoss: 65625.0,
    finishAllowance: 51041.7,
    commissions: 3937.5,
    presentValueFactor: 0.99413546,
    presentValue: 119931.9
  },
  {
    incomeLeaseUpMonthListingId: 2,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 2,
    available: 33542.0,
    rentLoss: 62891.2,
    finishAllowance: 48920.9,
    commissions: 3773.5,
    presentValueFactor: 0.98833522,
    presentValue: 114239.0
  },
  {
    incomeLeaseUpMonthListingId: 3,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 3,
    available: 32084.0,
    rentLoss: 60157.5,
    finishAllowance: 46800.0,
    commissions: 3609.5,
    presentValueFactor: 0.98259864,
    presentValue: 108740.8
  },
  {
    incomeLeaseUpMonthListingId: 4,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 4,
    available: 30626.0,
    rentLoss: 57423.8,
    finishAllowance: 44679.2,
    commissions: 3445.4,
    presentValueFactor: 0.97692514,
    presentValue: 103430.9
  },
  {
    incomeLeaseUpMonthListingId: 5,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 5,
    available: 29168.0,
    rentLoss: 54690.0,
    finishAllowance: 42558.3,
    commissions: 3281.4,
    presentValueFactor: 0.97131415,
    presentValue: 98303.8
  },
  {
    incomeLeaseUpMonthListingId: 6,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 6,
    available: 27710.0,
    rentLoss: 51956.3,
    finishAllowance: 40437.5,
    commissions: 3117.4,
    presentValueFactor: 0.96576513,
    presentValue: 93353.8
  },
  {
    incomeLeaseUpMonthListingId: 7,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 7,
    available: 26252.0,
    rentLoss: 49222.5,
    finishAllowance: 38316.7,
    commissions: 2953.4,
    presentValueFactor: 0.96027754,
    presentValue: 88576.1
  },
  {
    incomeLeaseUpMonthListingId: 8,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 8,
    available: 24794.0,
    rentLoss: 46488.8,
    finishAllowance: 36195.9,
    commissions: 2789.3,
    presentValueFactor: 0.95485082,
    presentValue: 83967.1
  },
  {
    incomeLeaseUpMonthListingId: 9,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 9,
    available: 23336.0,
    rentLoss: 43755.0,
    finishAllowance: 34075.0,
    commissions: 2625.3,
    presentValueFactor: 0.94948445,
    presentValue: 79522.9
  },
  {
    incomeLeaseUpMonthListingId: 10,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 10,
    available: 21878.0,
    rentLoss: 41021.3,
    finishAllowance: 31954.2,
    commissions: 2461.3,
    presentValueFactor: 0.94417791,
    presentValue: 75239.4
  },
  {
    incomeLeaseUpMonthListingId: 11,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 11,
    available: 20420.0,
    rentLoss: 38287.5,
    finishAllowance: 29833.3,
    commissions: 2297.3,
    presentValueFactor: 0.93893069,
    presentValue: 71112.2
  },
  {
    incomeLeaseUpMonthListingId: 12,
    incomeLeaseUpId: 1,
    yearNumber: 1,
    monthNumber: 12,
    available: 18962.0,
    rentLoss: 35553.8,
    finishAllowance: 27712.5,
    commissions: 2133.2,
    presentValueFactor: 0.93374227,
    presentValue: 67137.1
  },
  
  // First 6 months for property 2
  {
    incomeLeaseUpMonthListingId: 13,
    incomeLeaseUpId: 2,
    yearNumber: 1,
    monthNumber: 1,
    available: 12500.0,
    rentLoss: 20573.0,
    finishAllowance: 29687.5,
    commissions: 1028.6,
    presentValueFactor: 0.99429446,
    presentValue: 51010.0
  },
  {
    incomeLeaseUpMonthListingId: 14,
    incomeLeaseUpId: 2,
    yearNumber: 1,
    monthNumber: 2,
    available: 11667.0,
    rentLoss: 19201.0,
    finishAllowance: 27708.3,
    commissions: 960.1,
    presentValueFactor: 0.98865186,
    presentValue: 47356.3
  },
  {
    incomeLeaseUpMonthListingId: 15,
    incomeLeaseUpId: 2,
    yearNumber: 1,
    monthNumber: 3,
    available: 10834.0,
    rentLoss: 17829.0,
    finishAllowance: 25729.1,
    commissions: 891.5,
    presentValueFactor: 0.98307168,
    presentValue: 43874.5
  },
  {
    incomeLeaseUpMonthListingId: 16,
    incomeLeaseUpId: 2,
    yearNumber: 1,
    monthNumber: 4,
    available: 10001.0,
    rentLoss: 16457.0,
    finishAllowance: 23749.9,
    commissions: 822.9,
    presentValueFactor: 0.97755342,
    presentValue: 40560.4
  },
  {
    incomeLeaseUpMonthListingId: 17,
    incomeLeaseUpId: 2,
    yearNumber: 1,
    monthNumber: 5,
    available: 9168.0,
    rentLoss: 15085.0,
    finishAllowance: 21770.7,
    commissions: 754.3,
    presentValueFactor: 0.97209659,
    presentValue: 37409.6
  },
  {
    incomeLeaseUpMonthListingId: 18,
    incomeLeaseUpId: 2,
    yearNumber: 1,
    monthNumber: 6,
    available: 8335.0,
    rentLoss: 13713.0,
    finishAllowance: 19791.5,
    commissions: 685.7,
    presentValueFactor: 0.96670070,
    presentValue: 34417.9
  }
];