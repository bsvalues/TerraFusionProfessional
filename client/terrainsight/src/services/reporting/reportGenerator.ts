import { Property } from '@shared/schema';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';

/**
 * Report section containing title and content
 */
export interface ReportSection {
  title: string;
  content: string | Record<string, any>;
}

/**
 * Value history entry for temporal analysis
 */
export interface ValueHistoryEntry {
  year: string;
  value: string;
  formattedValue: string;
}

/**
 * Report for a single property
 */
export interface PropertyReport {
  type: 'property';
  property: Property;
  title: string;
  createdAt: Date;
  sections: ReportSection[];
  valueHistory?: ValueHistoryEntry[];
  warnings: string[];
}

/**
 * Report comparing multiple properties
 */
export interface ComparisonReport {
  type: 'comparison';
  properties: Property[];
  title: string;
  createdAt: Date;
  sections: ReportSection[];
  comparisonMetrics: {
    valueRange: [number, number];
    averageValue: number;
    medianValue: number;
    priceDifferences: Record<string, number>;
    sizeComparison: Record<string, number>;
    ageComparison: Record<string, number>;
  };
  warnings: string[];
}

export type Report = PropertyReport | ComparisonReport;
export type ReportType = 'pdf' | 'csv' | 'excel' | 'json';

/**
 * Batch job status for report generation
 */
export interface BatchJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalReports: number;
  completedReports: number;
  outputFormat: ReportType;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

/**
 * Progress information for batch jobs
 */
export interface BatchJobProgress {
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Generator service for creating property reports
 */
export class ReportGenerator {
  private batchJobs: Map<string, BatchJob> = new Map();
  private nextBatchId: number = 1;

  /**
   * Generates a report for a single property
   */
  generatePropertyReport(property: Property): PropertyReport {
    // Check for missing data
    const warnings: string[] = [];
    if (!property.yearBuilt || !property.squareFeet) {
      warnings.push('Some property data is incomplete');
    }

    // Create basic sections
    const sections: ReportSection[] = [
      {
        title: 'Property Overview',
        content: {
          address: property.address,
          parcelId: property.parcelId,
          type: property.propertyType || 'Unknown',
          value: property.value ? formatCurrency(parseFloat(property.value)) : 'Not Specified',
          neighborhood: property.neighborhood || 'Not Specified'
        }
      },
      {
        title: 'Property Details',
        content: {
          yearBuilt: property.yearBuilt ? property.yearBuilt.toString() : 'Unknown',
          squareFeet: property.squareFeet ? formatNumber(property.squareFeet) : 'Unknown',
          bedrooms: property.bedrooms?.toString() || 'N/A',
          bathrooms: property.bathrooms?.toString() || 'N/A',
          lotSize: property.lotSize ? `${property.lotSize} acres` : 'Unknown',
          zoning: property.zoning || 'Unknown'
        }
      },
      {
        title: 'Valuation Information',
        content: {
          currentValue: property.value ? formatCurrency(parseFloat(property.value)) : 'Not Specified',
          landValue: property.landValue ? formatCurrency(parseFloat(property.landValue)) : 'Not Specified',
          taxAssessment: property.taxAssessment ? formatCurrency(parseFloat(property.taxAssessment)) : 'Not Specified',
          lastSaleDate: property.lastSaleDate ? formatDate(new Date(property.lastSaleDate)) : 'Unknown',
          salePrice: property.salePrice ? formatCurrency(parseFloat(property.salePrice)) : 'Not Specified',
        }
      },
      {
        title: 'Location Information',
        content: {
          coordinates: property.coordinates ? `${property.coordinates[0]}, ${property.coordinates[1]}` : 'Unknown',
          neighborhood: property.neighborhood || 'Not Specified',
        }
      }
    ];

    // Process temporal data if available
    let valueHistory: ValueHistoryEntry[] | undefined;
    
    if ((property as any).valueHistory) {
      const history = (property as any).valueHistory as Record<string, string>;
      valueHistory = Object.entries(history)
        .map(([year, value]) => ({
          year,
          value,
          formattedValue: formatCurrency(parseFloat(value))
        }))
        .sort((a, b) => a.year.localeCompare(b.year));
    }

    return {
      type: 'property',
      property,
      title: `Property Report: ${property.address}`,
      createdAt: new Date(),
      sections,
      valueHistory,
      warnings
    };
  }

  /**
   * Generates a comparison report for multiple properties
   */
  generateComparisonReport(properties: Property[]): ComparisonReport {
    // Validate input
    if (properties.length === 0) {
      throw new Error('Cannot generate comparison report: No properties provided');
    }

    const warnings: string[] = [];
    
    // Check for missing data
    if (properties.some(p => !p.value)) {
      warnings.push('Some properties are missing value data');
    }

    // Calculate comparison metrics
    const values = properties
      .map(p => p.value ? parseFloat(p.value) : 0)
      .filter(v => v > 0);
    
    const valueRange: [number, number] = [
      Math.min(...values),
      Math.max(...values)
    ];
    
    const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate median value
    const sortedValues = [...values].sort((a, b) => a - b);
    const medianValue = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];
    
    // Calculate price differences (percentage difference from median)
    const priceDifferences: Record<string, number> = {};
    properties.forEach(p => {
      if (p.value) {
        const value = parseFloat(p.value);
        priceDifferences[p.id.toString()] = ((value - medianValue) / medianValue) * 100;
      }
    });
    
    // Size comparison (as percentage of largest)
    const sizeComparison: Record<string, number> = {};
    const maxSize = Math.max(...properties.map(p => p.squareFeet || 0));
    properties.forEach(p => {
      if (p.squareFeet) {
        sizeComparison[p.id.toString()] = (p.squareFeet / maxSize) * 100;
      }
    });
    
    // Age comparison (newest = 100%)
    const ageComparison: Record<string, number> = {};
    const years = properties.map(p => p.yearBuilt || 0).filter(y => y > 0);
    if (years.length > 0) {
      const newestYear = Math.max(...years);
      const oldestYear = Math.min(...years);
      const yearRange = newestYear - oldestYear;
      
      properties.forEach(p => {
        if (p.yearBuilt) {
          ageComparison[p.id.toString()] = yearRange > 0
            ? ((p.yearBuilt - oldestYear) / yearRange) * 100
            : 100;
        }
      });
    }

    // Create report sections
    const sections: ReportSection[] = [
      {
        title: 'Comparison Overview',
        content: {
          propertiesCount: properties.length,
          valueRange: `${formatCurrency(valueRange[0])} - ${formatCurrency(valueRange[1])}`,
          averageValue: formatCurrency(averageValue),
          medianValue: formatCurrency(medianValue),
        }
      },
      {
        title: 'Property Comparison',
        content: properties.map(p => ({
          id: p.id,
          address: p.address,
          value: p.value ? formatCurrency(parseFloat(p.value)) : 'N/A',
          squareFeet: p.squareFeet ? formatNumber(p.squareFeet) : 'N/A',
          yearBuilt: p.yearBuilt?.toString() || 'N/A',
          neighborhood: p.neighborhood || 'N/A',
          propertyType: p.propertyType || 'N/A'
        }))
      }
    ];

    return {
      type: 'comparison',
      properties,
      title: `Property Comparison Report (${properties.length} Properties)`,
      createdAt: new Date(),
      sections,
      comparisonMetrics: {
        valueRange,
        averageValue,
        medianValue,
        priceDifferences,
        sizeComparison,
        ageComparison
      },
      warnings
    };
  }

  /**
   * Creates a batch job for processing multiple reports
   */
  async createBatchJob(properties: Property[], outputFormat: ReportType): Promise<BatchJob> {
    const batchId = `batch-${this.nextBatchId++}`;
    
    const batchJob: BatchJob = {
      id: batchId,
      status: 'processing',
      totalReports: properties.length,
      completedReports: 0,
      outputFormat,
      createdAt: new Date()
    };
    
    this.batchJobs.set(batchId, batchJob);
    
    // Simulate async processing
    setTimeout(() => this.processBatchJob(batchId, properties, outputFormat), 100);
    
    return batchJob;
  }

  /**
   * Gets the current progress of a batch job
   */
  async getBatchJobProgress(batchJobId: string): Promise<BatchJobProgress> {
    const batchJob = this.batchJobs.get(batchJobId);
    
    if (!batchJob) {
      return {
        completed: 0,
        total: 0,
        percentage: 0
      };
    }
    
    return {
      completed: batchJob.completedReports,
      total: batchJob.totalReports,
      percentage: (batchJob.completedReports / batchJob.totalReports) * 100
    };
  }

  /**
   * Processes a batch job (simulated)
   */
  private processBatchJob(batchJobId: string, properties: Property[], outputFormat: ReportType): void {
    const batchJob = this.batchJobs.get(batchJobId);
    
    if (!batchJob) return;
    
    // Simulate processing
    const processInterval = setInterval(() => {
      if (!this.batchJobs.has(batchJobId)) {
        clearInterval(processInterval);
        return;
      }
      
      const job = this.batchJobs.get(batchJobId)!;
      
      // Increment completed count
      job.completedReports += 1;
      
      // Check if complete
      if (job.completedReports >= job.totalReports) {
        job.status = 'completed';
        job.completedAt = new Date();
        clearInterval(processInterval);
      }
      
      // Update job in the map
      this.batchJobs.set(batchJobId, job);
    }, 500); // Process one report every 500ms
  }
}