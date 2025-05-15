import { 
  ETLJob, 
  JobStatus, 
  DataSource, 
  TransformationRule,
  RecordCounts,
  TransformationType
} from './ETLTypes';
import { dataConnector, ExtractResult, LoadResult } from './DataConnector';
import { transformationService } from './TransformationService';
import { dataQualityService } from './DataQualityService';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Interface representing a running ETL job
 */
export interface JobRun {
  /** Run ID */
  id: string;
  
  /** Job ID */
  jobId: number;
  
  /** Run status */
  status: JobStatus;
  
  /** Start timestamp */
  startTime: Date;
  
  /** End timestamp */
  endTime?: Date;
  
  /** Execution time (ms) */
  executionTime: number;
  
  /** Record counts */
  recordCounts: RecordCounts;
  
  /** Error message */
  error?: string;
  
  /** Whether this was a manual run */
  isManual: boolean;
}

/**
 * ETL Pipeline
 * 
 * This class is responsible for coordinating the ETL process.
 */
class ETLPipeline {
  private nextRunId = 1;
  
  /**
   * Execute an ETL job
   */
  async executeJob(
    job: ETLJob,
    dataSources: Map<number, DataSource>,
    transformationRules: Map<number, TransformationRule>,
    isManual: boolean = false
  ): Promise<JobRun> {
    const startTime = new Date();
    let endTime: Date | undefined;
    let executionTime = 0;
    let status = JobStatus.RUNNING;
    let error: string | undefined;
    
    const recordCounts: RecordCounts = {
      extracted: 0,
      transformed: 0,
      loaded: 0,
      rejected: 0
    };
    
    const jobRun: JobRun = {
      id: `run-${this.nextRunId++}`,
      jobId: job.id,
      status,
      startTime,
      executionTime,
      recordCounts,
      isManual
    };
    
    try {
      // Log job start
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: `Job Started: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) has started execution`
      });
      
      // Validate job configuration
      if (job.sources.length === 0) {
        throw new Error('Job has no sources defined');
      }
      
      if (job.destinations.length === 0) {
        throw new Error('Job has no destinations defined');
      }
      
      // Execute the job
      try {
        // Extract data from sources
        await this.extractData(job, dataSources, recordCounts);
        
        // Transform data using transformation rules
        const transformedData = await this.transformData(job, dataSources, transformationRules, recordCounts);
        
        // Analyze data quality
        this.analyzeDataQuality(transformedData, job.name);
        
        // Load data into destinations
        await this.loadData(job, dataSources, transformedData, recordCounts);
        
        // Update job status
        status = JobStatus.SUCCEEDED;
        
        // Log job success
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.JOB,
          title: `Job Completed: ${job.name}`,
          message: `ETL job "${job.name}" (ID: ${job.id}) completed successfully: ${recordCounts.extracted} records extracted, ${recordCounts.transformed} transformed, ${recordCounts.loaded} loaded, ${recordCounts.rejected} rejected`
        });
      } catch (e) {
        // Update job status
        status = JobStatus.FAILED;
        error = e instanceof Error ? e.message : String(e);
        
        // Log job failure
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.JOB,
          title: `Job Failed: ${job.name}`,
          message: `ETL job "${job.name}" (ID: ${job.id}) failed: ${error}`
        });
        
        throw e; // Re-throw for outer catch block
      }
    } catch (e) {
      // This catch block handles any errors, including ones from the inner try-catch
      status = JobStatus.FAILED;
      error = e instanceof Error ? e.message : String(e);
    } finally {
      // Update job run
      endTime = new Date();
      executionTime = endTime.getTime() - startTime.getTime();
      
      jobRun.status = status;
      jobRun.endTime = endTime;
      jobRun.executionTime = executionTime;
      jobRun.recordCounts = recordCounts;
      jobRun.error = error;
      
      // Return job run
      return jobRun;
    }
  }
  
  /**
   * Extract data from sources
   */
  private async extractData(
    job: ETLJob,
    dataSources: Map<number, DataSource>,
    recordCounts: RecordCounts
  ): Promise<any[]> {
    // Get data sources
    const sources = job.sources
      .map(sourceId => dataSources.get(sourceId))
      .filter(source => source !== undefined) as DataSource[];
    
    if (sources.length === 0) {
      throw new Error('No valid sources found for job');
    }
    
    // Extract data from each source
    const extractedData: any[] = [];
    
    for (const sourceId of job.sources) {
      const source = dataSources.get(sourceId);
      
      if (!source) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Source Not Found: ${sourceId}`,
          message: `Data source with ID ${sourceId} not found for job "${job.name}" (ID: ${job.id})`
        });
        continue;
      }
      
      if (!source.enabled) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Source Disabled: ${source.name}`,
          message: `Data source "${source.name}" (ID: ${sourceId}) is disabled for job "${job.name}" (ID: ${job.id})`
        });
        continue;
      }
      
      try {
        const extractResult: ExtractResult = await dataConnector.extract(sourceId);
        
        if (!extractResult.success) {
          throw new Error(extractResult.error || 'Unknown error during extraction');
        }
        
        // Add extracted data to the list
        extractedData.push(...extractResult.data);
        
        // Update record counts
        recordCounts.extracted += extractResult.data.length;
        
        // Log extraction success
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_SOURCE,
          title: `Extraction Completed: ${source.name}`,
          message: `Extracted ${extractResult.data.length} records from "${source.name}" (ID: ${sourceId}) for job "${job.name}" (ID: ${job.id})`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log extraction error
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.DATA_SOURCE,
          title: `Extraction Error: ${source.name}`,
          message: `Error extracting data from "${source.name}" (ID: ${sourceId}) for job "${job.name}" (ID: ${job.id}): ${errorMessage}`
        });
        
        throw error;
      }
    }
    
    return extractedData;
  }
  
  /**
   * Transform data using transformation rules
   */
  private async transformData(
    job: ETLJob,
    dataSources: Map<number, DataSource>,
    transformationRules: Map<number, TransformationRule>,
    recordCounts: RecordCounts
  ): Promise<any[]> {
    // Get transformation rules
    const rules = job.transformations
      .map(ruleId => transformationRules.get(ruleId))
      .filter(rule => rule !== undefined && rule.enabled)
      .sort((a, b) => a!.order - b!.order) as TransformationRule[];
    
    // Extract data from sources
    const extractedData = await this.extractData(job, dataSources, recordCounts);
    
    // If no transformation rules, return extracted data as is
    if (rules.length === 0) {
      recordCounts.transformed = extractedData.length;
      return extractedData;
    }
    
    // Apply transformation rules in order
    let transformedData = [...extractedData];
    
    for (const rule of rules) {
      try {
        // Apply transformation
        const transformResult = transformationService.applyTransformation(rule, transformedData);
        
        if (!transformResult.success) {
          throw new Error(transformResult.error || `Transformation "${rule.name}" failed`);
        }
        
        // Update transformed data
        transformedData = transformResult.data;
        
        // Update record counts
        recordCounts.transformed = transformedData.length;
        recordCounts.rejected += transformResult.rejected;
        
        // Log transformation success
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.TRANSFORMATION,
          title: `Transformation Applied: ${rule.name}`,
          message: `Applied transformation "${rule.name}" (ID: ${rule.id}) for job "${job.name}" (ID: ${job.id}): ${transformedData.length} records output, ${transformResult.rejected} records rejected`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log transformation error
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.TRANSFORMATION,
          title: `Transformation Error: ${rule.name}`,
          message: `Error applying transformation "${rule.name}" (ID: ${rule.id}) for job "${job.name}" (ID: ${job.id}): ${errorMessage}`
        });
        
        throw error;
      }
    }
    
    return transformedData;
  }
  
  /**
   * Analyze data quality
   */
  private analyzeDataQuality(data: any[], jobName: string): void {
    try {
      // Skip if no data
      if (data.length === 0) {
        return;
      }
      
      // Analyze data quality
      const result = dataQualityService.analyzeData(data);
      
      // Log issues
      if (result.issues.length > 0) {
        const criticalIssues = result.issues.filter(issue => issue.severity === 'CRITICAL').length;
        const highIssues = result.issues.filter(issue => issue.severity === 'HIGH').length;
        
        alertService.createAlert({
          type: criticalIssues > 0 ? AlertType.ERROR : highIssues > 0 ? AlertType.WARNING : AlertType.INFO,
          severity: criticalIssues > 0 ? AlertSeverity.HIGH : highIssues > 0 ? AlertSeverity.MEDIUM : AlertSeverity.LOW,
          category: AlertCategory.VALIDATION,
          title: `Data Quality Analysis: ${jobName}`,
          message: `Data quality analysis for job "${jobName}" found ${result.issues.length} issues (${criticalIssues} critical, ${highIssues} high)`
        });
      } else {
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.VALIDATION,
          title: `Data Quality Analysis: ${jobName}`,
          message: `Data quality analysis for job "${jobName}" found no issues`
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log data quality analysis error
      alertService.createAlert({
        type: AlertType.WARNING,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.VALIDATION,
        title: `Data Quality Analysis Error: ${jobName}`,
        message: `Error analyzing data quality for job "${jobName}": ${errorMessage}`
      });
      
      // Don't throw the error - data quality analysis is optional
    }
  }
  
  /**
   * Load data into destinations
   */
  private async loadData(
    job: ETLJob,
    dataSources: Map<number, DataSource>,
    transformedData: any[],
    recordCounts: RecordCounts
  ): Promise<void> {
    // Get destinations
    const destinations = job.destinations
      .map(destId => dataSources.get(destId))
      .filter(dest => dest !== undefined) as DataSource[];
    
    if (destinations.length === 0) {
      throw new Error('No valid destinations found for job');
    }
    
    // Load data into each destination
    for (const destId of job.destinations) {
      const destination = dataSources.get(destId);
      
      if (!destination) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Destination Not Found: ${destId}`,
          message: `Data destination with ID ${destId} not found for job "${job.name}" (ID: ${job.id})`
        });
        continue;
      }
      
      if (!destination.enabled) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Destination Disabled: ${destination.name}`,
          message: `Data destination "${destination.name}" (ID: ${destId}) is disabled for job "${job.name}" (ID: ${job.id})`
        });
        continue;
      }
      
      try {
        // Get target from destination config
        const target = destination.config.options?.target as string;
        
        if (!target) {
          throw new Error(`No target specified for destination "${destination.name}" (ID: ${destId})`);
        }
        
        // Load data
        const loadResult: LoadResult = await dataConnector.load(destId, transformedData, {
          target,
          mode: destination.config.options?.loadMode as 'INSERT' | 'UPDATE' | 'UPSERT' | 'REPLACE' | 'APPEND'
        });
        
        if (!loadResult.success) {
          throw new Error(loadResult.error || 'Unknown error during loading');
        }
        
        // Update record counts
        recordCounts.loaded += loadResult.count;
        recordCounts.rejected += loadResult.rejected;
        
        // Log load success
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_SOURCE,
          title: `Load Completed: ${destination.name}`,
          message: `Loaded ${loadResult.count} records into "${destination.name}" (ID: ${destId}) for job "${job.name}" (ID: ${job.id})`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log load error
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.DATA_SOURCE,
          title: `Load Error: ${destination.name}`,
          message: `Error loading data into "${destination.name}" (ID: ${destId}) for job "${job.name}" (ID: ${job.id}): ${errorMessage}`
        });
        
        throw error;
      }
    }
  }
}

// Export singleton instance
export const etlPipeline = new ETLPipeline();