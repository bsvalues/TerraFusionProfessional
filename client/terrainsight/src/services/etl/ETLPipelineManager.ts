/**
 * ETLPipelineManager.ts
 * 
 * Service for managing the entire ETL pipeline
 */

import { 
  ETLJob, 
  DataSource,
  Transformation,
  JobStatus,
  ETLJobRun,
  JobFrequency,
  ETLContext,
  ETLJobResult,
  SystemStatus,
  SystemStatusInfo,
  JobLogEntry,
  DataSourceType,
  TransformationType
} from './ETLTypes';
import { Alert, TransformationRule, alertService } from './index';

// Dummy implementation of ETL pipeline manager
class ETLPipelineManager {
  private jobs: ETLJob[] = [];
  private dataSources: DataSource[] = [];
  private transformationRules: TransformationRule[] = [];
  private jobRuns: ETLJobRun[] = [];
  
  /**
   * Get all jobs
   */
  getAllJobs(): ETLJob[] {
    return this.jobs;
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return this.dataSources;
  }
  
  /**
   * Get all transformation rules
   */
  getAllTransformationRules(): TransformationRule[] {
    return this.transformationRules;
  }
  
  /**
   * Get all job runs
   */
  getAllJobRuns(): ETLJobRun[] {
    return this.jobRuns;
  }
  
  /**
   * Get system status
   */
  getSystemStatus(): SystemStatusInfo {
    const successJobs = this.jobRuns.filter(jr => jr.status === JobStatus.SUCCESS).length;
    const failedJobs = this.jobRuns.filter(jr => jr.status === JobStatus.ERROR || jr.status === JobStatus.ABORTED).length;
    
    // Determine overall system status
    let status = SystemStatus.HEALTHY;
    if (failedJobs > 0 && failedJobs > successJobs) {
      status = SystemStatus.DEGRADED;
    }
    if (this.jobs.length === 0 && this.dataSources.length === 0) {
      status = SystemStatus.STARTING;
    }
    
    // Determine scheduler status
    let schedulerStatus = SystemStatus.ONLINE;
    const runningJobs = this.jobs.filter(job => job.status === JobStatus.RUNNING).length;
    if (runningJobs > 0) {
      schedulerStatus = SystemStatus.RUNNING;
    }
    
    return {
      status: status,
      jobCount: this.jobs.length,
      enabledJobCount: this.jobs.filter(job => job.enabled).length,
      dataSourceCount: this.dataSources.length,
      enabledDataSourceCount: this.dataSources.filter(source => source.status === 'active').length,
      transformationRuleCount: this.transformationRules.length,
      enabledTransformationRuleCount: this.transformationRules.filter(rule => rule.enabled).length,
      runningJobCount: this.jobs.filter(job => job.status === JobStatus.RUNNING).length,
      schedulerStatus: schedulerStatus,
      lastUpdated: new Date(),
      recentJobRuns: this.jobRuns.slice(-10), // Return the 10 most recent job runs
      successJobRuns: successJobs,
      failedJobRuns: failedJobs,
      recordCounts: {
        processed: this.jobRuns.reduce((sum, jr) => sum + (jr.metrics?.recordsProcessed || 0), 0),
        succeeded: this.jobRuns.reduce((sum, jr) => sum + (jr.metrics?.recordsSuccess || 0), 0),
        failed: this.jobRuns.reduce((sum, jr) => sum + (jr.metrics?.recordsError || 0), 0),
        skipped: this.jobRuns.reduce((sum, jr) => sum + (jr.metrics?.recordsSkipped || 0), 0),
        extracted: this.jobRuns.reduce((sum, jr) => sum + (jr.recordCounts?.extracted || 0), 0),
        transformed: this.jobRuns.reduce((sum, jr) => sum + (jr.recordCounts?.transformed || 0), 0),
        loaded: this.jobRuns.reduce((sum, jr) => sum + (jr.recordCounts?.loaded || 0), 0),
        rejected: this.jobRuns.reduce((sum, jr) => sum + (jr.recordCounts?.rejected || 0), 0)
      }
    };
  }
  
  /**
   * Run a job
   */
  async runJob(jobId: number): Promise<void> {
    console.log(`Running job ${jobId}`);
    // In a real implementation, this would start the job execution
  }
  
  /**
   * Enable a job
   */
  enableJob(jobId: number): void {
    const job = this.jobs.find(j => Number(j.id) === jobId);
    if (job) {
      job.enabled = true;
    }
  }
  
  /**
   * Disable a job
   */
  disableJob(jobId: number): void {
    const job = this.jobs.find(j => Number(j.id) === jobId);
    if (job) {
      job.enabled = false;
    }
  }
  
  /**
   * Enable a data source
   */
  enableDataSource(dataSourceId: number): void {
    const dataSource = this.dataSources.find(ds => Number(ds.id) === dataSourceId);
    if (dataSource) {
      dataSource.status = 'active';
    }
  }
  
  /**
   * Disable a data source
   */
  disableDataSource(dataSourceId: number): void {
    const dataSource = this.dataSources.find(ds => Number(ds.id) === dataSourceId);
    if (dataSource) {
      dataSource.status = 'inactive';
    }
  }
  
  /**
   * Enable a transformation rule
   */
  enableTransformationRule(transformationRuleId: number): void {
    const transformationRule = this.transformationRules.find(tr => Number(tr.id) === transformationRuleId);
    if (transformationRule) {
      transformationRule.enabled = true;
    }
  }
  
  /**
   * Disable a transformation rule
   */
  disableTransformationRule(transformationRuleId: number): void {
    const transformationRule = this.transformationRules.find(tr => Number(tr.id) === transformationRuleId);
    if (transformationRule) {
      transformationRule.enabled = false;
    }
  }
  
  /**
   * Delete a job
   */
  deleteJob(jobId: number): void {
    this.jobs = this.jobs.filter(j => Number(j.id) !== jobId);
  }
  
  /**
   * Delete a data source
   */
  deleteDataSource(dataSourceId: number): void {
    this.dataSources = this.dataSources.filter(ds => Number(ds.id) !== dataSourceId);
  }
  
  /**
   * Delete a transformation rule
   */
  deleteTransformationRule(transformationRuleId: number): void {
    this.transformationRules = this.transformationRules.filter(tr => Number(tr.id) !== transformationRuleId);
  }
  
  /**
   * Create a job with the new ETL job structure
   * @param jobConfig Partial ETL job configuration
   * @returns The created job
   */
  createJob(jobConfig: Partial<ETLJob>): ETLJob {
    // Generate unique ID
    const jobId = String(Date.now());
    
    // Create new job with defaults for missing properties
    const newJob: ETLJob = {
      id: jobId,
      name: jobConfig.name || `ETL Job ${jobId.slice(-4)}`,
      description: jobConfig.description || '',
      // Support both single source and multiple sources
      source: jobConfig.source,
      sources: jobConfig.sources || [],
      // Support both direct transformation references and string IDs
      transformations: jobConfig.transformations || [],
      // Support both single destination and multiple destinations
      destination: jobConfig.destination,
      destinations: jobConfig.destinations || [],
      schedule: jobConfig.schedule || {
        frequency: JobFrequency.MANUAL
      },
      settings: jobConfig.settings || {
        batchSize: 1000,
        timeout: 60000,
        maxRetries: 3,
        alertOnSuccess: true,
        alertOnFailure: true,
        validateData: true,
      },
      enabled: jobConfig.enabled !== undefined ? jobConfig.enabled : true,
      tags: jobConfig.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to our jobs collection
    this.jobs.push(newJob);
    
    // Log the job creation
    console.log(`ETL Job created: ${newJob.name} (ID: ${newJob.id})`);
    
    // Create a success alert
    alertService.createAlert({
      severity: 'info',
      message: `ETL Job "${newJob.name}" created successfully`,
      source: 'ETL Manager',
      category: 'job'
    });
    
    return newJob;
  }
  
  /**
   * Create a data source with enhanced functionality
   * @param dataSourceConfig Partial data source configuration
   * @returns The created data source
   */
  createDataSource(dataSourceConfig: Partial<DataSource>): DataSource {
    // Generate unique ID
    const sourceId = String(Date.now());
    
    // Create new data source with defaults for missing properties
    const newDataSource: DataSource = {
      id: sourceId,
      name: dataSourceConfig.name || `Data Source ${sourceId.slice(-4)}`,
      description: dataSourceConfig.description || '',
      type: dataSourceConfig.type || DataSourceType.FILE,
      config: dataSourceConfig.config || {},
      lastSyncDate: dataSourceConfig.lastSyncDate,
      enabled: dataSourceConfig.enabled !== undefined ? dataSourceConfig.enabled : true,
      tags: dataSourceConfig.tags || []
    };
    
    // Add to our data sources collection
    this.dataSources.push(newDataSource);
    
    // Log the data source creation
    console.log(`Data Source created: ${newDataSource.name} (ID: ${newDataSource.id}, Type: ${newDataSource.type})`);
    
    // Create a success alert
    alertService.createAlert({
      severity: 'info',
      message: `Data Source "${newDataSource.name}" created successfully`,
      source: 'ETL Manager',
      category: 'data_source'
    });
    
    return newDataSource;
  }
  
  /**
   * Test connection to a data source
   * @param dataSourceId ID of the data source to test
   * @returns Promise resolving to connection test result
   */
  async testDataSourceConnection(dataSourceId: string): Promise<{success: boolean; message: string}> {
    try {
      const dataSource = this.dataSources.find(ds => ds.id === dataSourceId);
      
      if (!dataSource) {
        return { 
          success: false, 
          message: `Data source with ID ${dataSourceId} not found` 
        };
      }
      
      console.log(`Testing connection to data source: ${dataSource.name} (${dataSource.type})`);
      
      // Simulate connection test based on data source type
      // In a real implementation, this would attempt to connect to the actual data source
      switch (dataSource.type) {
        case DataSourceType.DATABASE:
        case DataSourceType.POSTGRESQL:
        case DataSourceType.MYSQL:
        case DataSourceType.SQL_SERVER:
          // Simulate database connection test
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          return { 
            success: true, 
            message: `Successfully connected to database ${dataSource.config.database || 'unknown'}` 
          };
          
        case DataSourceType.API:
        case DataSourceType.REST_API:
          // Simulate API connection test
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return { 
            success: true, 
            message: `Successfully connected to API endpoint` 
          };
          
        case DataSourceType.FTP:
          // Simulate FTP connection test
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          return { 
            success: true, 
            message: `Successfully connected to FTP server ${dataSource.config.host || 'unknown'}` 
          };
          
        case DataSourceType.FILE:
        case DataSourceType.FILE_CSV:
        case DataSourceType.FILE_JSON:
        case DataSourceType.FILE_XML:
        case DataSourceType.FILE_EXCEL:
          // Simulate file system check
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return { 
            success: true, 
            message: `Successfully verified file access` 
          };
          
        default:
          return { 
            success: true, 
            message: `Connection test not implemented for type ${dataSource.type}` 
          };
      }
    } catch (error) {
      console.error('Data source connection test failed:', error);
      
      // Create an alert for the failure
      alertService.createAlert({
        severity: 'error',
        message: `Connection test failed for data source ID ${dataSourceId}`,
        source: 'ETL Manager',
        category: 'connection',
        details: error instanceof Error ? error.message : String(error)
      });
      
      return { 
        success: false, 
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
  
  /**
   * Create a transformation rule
   * @param transformConfig Partial transformation configuration
   * @returns The created transformation rule
   */
  createTransformationRule(transformConfig: Partial<Transformation>): Transformation {
    // Generate unique ID
    const transformId = String(Date.now());
    
    // Create new transformation rule with defaults for missing properties
    const newRule: Transformation = {
      id: transformId,
      name: transformConfig.name || `Transformation ${transformId.slice(-4)}`,
      description: transformConfig.description || '',
      type: transformConfig.type || TransformationType.MAP,
      code: transformConfig.code || '',
      config: transformConfig.config || {},
      order: transformConfig.order !== undefined ? transformConfig.order : 0,
      enabled: transformConfig.enabled !== undefined ? transformConfig.enabled : true
    };
    
    // Add to our transformations collection
    this.transformationRules.push(newRule as TransformationRule);
    
    // Log the transformation creation
    console.log(`Transformation rule created: ${newRule.name} (ID: ${newRule.id}, Type: ${newRule.type})`);
    
    // Create a success alert
    alertService.createAlert({
      severity: 'info',
      message: `Transformation rule "${newRule.name}" created successfully`,
      source: 'ETL Manager',
      category: 'transformation'
    });
    
    return newRule;
  }
  
  /**
   * Execute a job with detailed progress tracking
   * @param jobId ID of the job to execute
   * @returns Promise resolving to job execution result
   */
  async executeJob(jobId: string): Promise<ETLJobResult> {
    try {
      // Find the job by ID
      const job = this.jobs.find(j => j.id === jobId);
      
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }
      
      // Create a new job run record
      const jobRun: ETLJobRun = {
        id: String(Date.now()),
        jobId: job.id,
        startTime: new Date(),
        endTime: null,
        status: JobStatus.RUNNING,
        error: null,
        metrics: {
          recordsProcessed: 0,
          recordsSuccess: 0,
          recordsError: 0,
          recordsSkipped: 0,
          executionTimeMs: 0
        },
        logs: []
      };
      
      // Add to our job runs collection
      this.jobRuns.push(jobRun);
      
      // Log the job execution start
      this.addJobLogEntry(jobRun.id, 'info', `Starting execution of job: ${job.name}`);
      
      // Create execution context
      const context: ETLContext = {
        job,
        jobRun,
        data: [],
        errors: [],
        metadata: {},
        progress: 0,
        updateProgress: (progress: number) => {
          jobRun.metrics.progress = progress;
          this.addJobLogEntry(jobRun.id, 'info', `Job progress: ${progress}%`);
        }
      };
      
      // Stage 1: Extract data from sources
      this.addJobLogEntry(jobRun.id, 'info', 'Starting extraction phase');
      await this.executeExtractPhase(context);
      
      // Stage 2: Apply transformations
      this.addJobLogEntry(jobRun.id, 'info', 'Starting transformation phase');
      await this.executeTransformPhase(context);
      
      // Stage 3: Load to destinations
      this.addJobLogEntry(jobRun.id, 'info', 'Starting load phase');
      await this.executeLoadPhase(context);
      
      // Record successful completion
      jobRun.status = JobStatus.SUCCESS;
      jobRun.endTime = new Date();
      jobRun.metrics.executionTimeMs = jobRun.endTime.getTime() - jobRun.startTime.getTime();
      
      this.addJobLogEntry(jobRun.id, 'info', `Job completed successfully in ${jobRun.metrics.executionTimeMs}ms`);
      
      // Create a success alert if configured
      if (job.settings?.alertOnSuccess) {
        alertService.createAlert({
          severity: 'success',
          message: `Job "${job.name}" completed successfully`,
          source: 'ETL Manager',
          category: 'job_execution',
          details: `Processed ${jobRun.metrics.recordsProcessed} records in ${jobRun.metrics.executionTimeMs}ms`
        });
      }
      
      return {
        success: true,
        jobRunId: jobRun.id,
        metrics: jobRun.metrics,
        message: `Job completed successfully`
      };
    } catch (error) {
      // Find the job run
      const jobRun = this.jobRuns.find(jr => jr.jobId === jobId && jr.status === JobStatus.RUNNING);
      
      if (jobRun) {
        // Record error in job run
        jobRun.status = JobStatus.ERROR;
        jobRun.endTime = new Date();
        jobRun.error = error instanceof Error ? error.message : String(error);
        
        if (jobRun.startTime) {
          jobRun.metrics.executionTimeMs = jobRun.endTime.getTime() - jobRun.startTime.getTime();
        }
        
        this.addJobLogEntry(jobRun.id, 'error', `Job execution failed: ${jobRun.error}`);
        
        // Create an error alert for the job
        const job = this.jobs.find(j => j.id === jobId);
        if (job?.settings?.alertOnFailure) {
          alertService.createAlert({
            severity: 'error',
            message: `Job "${job.name}" failed`,
            source: 'ETL Manager',
            category: 'job_execution',
            details: jobRun.error
          });
        }
      }
      
      console.error('Job execution failed:', error);
      
      return {
        success: false,
        jobRunId: jobRun?.id,
        message: `Job execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Add a log entry to a job run
   * @param jobRunId ID of the job run
   * @param level Log level
   * @param message Log message
   */
  private addJobLogEntry(jobRunId: string, level: 'info' | 'warning' | 'error', message: string): void {
    const jobRun = this.jobRuns.find(jr => jr.id === jobRunId);
    
    if (jobRun) {
      const logEntry: JobLogEntry = {
        timestamp: new Date(),
        level,
        message
      };
      
      jobRun.logs.push(logEntry);
      
      // Also log to console for debugging
      console.log(`[ETL Job Run ${jobRunId}] [${level.toUpperCase()}] ${message}`);
    }
  }
  
  /**
   * Execute the extract phase of an ETL job
   * @param context ETL execution context
   */
  private async executeExtractPhase(context: ETLContext): Promise<void> {
    const { job, jobRun } = context;
    
    try {
      const sources = [];
      
      // Collect all sources (legacy and new format)
      if (job.source) {
        sources.push(job.source);
      }
      
      if (job.sources && job.sources.length > 0) {
        sources.push(...job.sources);
      }
      
      if (sources.length === 0) {
        throw new Error('No data sources defined for job');
      }
      
      // Update progress
      context.updateProgress(10);
      
      // Extract data from each source
      // In a real implementation, this would connect to each source and extract data
      let extractedRecords = 0;
      
      for (const sourceId of sources) {
        // Find the data source
        const source = this.dataSources.find(ds => ds.id === sourceId);
        
        if (!source) {
          this.addJobLogEntry(jobRun.id, 'warning', `Data source ${sourceId} not found, skipping`);
          continue;
        }
        
        this.addJobLogEntry(jobRun.id, 'info', `Extracting data from source: ${source.name}`);
        
        // Simulate data extraction
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate sample data based on source type
        const sampleData = this.generateSampleDataForSource(source);
        
        // Add to context data
        context.data.push(...sampleData);
        extractedRecords += sampleData.length;
        
        this.addJobLogEntry(
          jobRun.id, 
          'info', 
          `Extracted ${sampleData.length} records from source: ${source.name}`
        );
      }
      
      // Update metrics
      jobRun.metrics.recordsProcessed = extractedRecords;
      
      // Update progress
      context.updateProgress(33);
      
      this.addJobLogEntry(
        jobRun.id, 
        'info', 
        `Extract phase completed. Total records: ${extractedRecords}`
      );
    } catch (error) {
      this.addJobLogEntry(
        jobRun.id, 
        'error', 
        `Extract phase failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Execute the transform phase of an ETL job
   * @param context ETL execution context
   */
  private async executeTransformPhase(context: ETLContext): Promise<void> {
    const { job, jobRun } = context;
    
    try {
      // If no transformations defined, skip this phase
      if (!job.transformations || job.transformations.length === 0) {
        this.addJobLogEntry(jobRun.id, 'info', 'No transformations defined, skipping transform phase');
        context.updateProgress(66);
        return;
      }
      
      this.addJobLogEntry(jobRun.id, 'info', `Applying ${job.transformations.length} transformations`);
      
      // Apply each transformation in order
      let transformedCount = 0;
      let transformationErrors = 0;
      
      for (const transformRef of job.transformations) {
        // Find the transformation rule
        let transform: Transformation | undefined;
        
        if (typeof transformRef === 'string') {
          transform = this.transformationRules.find(t => t.id === transformRef) as Transformation;
        } else {
          transform = transformRef;
        }
        
        if (!transform) {
          this.addJobLogEntry(
            jobRun.id, 
            'warning', 
            `Transformation ${typeof transformRef === 'string' ? transformRef : 'inline'} not found, skipping`
          );
          continue;
        }
        
        // Skip disabled transformations
        if (!transform.enabled) {
          this.addJobLogEntry(
            jobRun.id, 
            'info', 
            `Skipping disabled transformation: ${transform.name}`
          );
          continue;
        }
        
        this.addJobLogEntry(
          jobRun.id, 
          'info', 
          `Applying transformation: ${transform.name} (${transform.type})`
        );
        
        try {
          // Apply the transformation to data
          // In a real implementation, this would execute the appropriate transformation function
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Simulate transformation effects
          switch (transform.type) {
            case TransformationType.FILTER:
              // Simulate filtering out ~10% of records
              const originalCount = context.data.length;
              context.data = context.data.filter(() => Math.random() > 0.1);
              const filteredCount = originalCount - context.data.length;
              
              this.addJobLogEntry(
                jobRun.id, 
                'info', 
                `Filtered out ${filteredCount} records`
              );
              break;
              
            case TransformationType.MAP:
              // Simulate adding a field to each record
              context.data = context.data.map(record => ({
                ...record,
                transformedAt: new Date()
              }));
              
              this.addJobLogEntry(
                jobRun.id, 
                'info', 
                `Mapped ${context.data.length} records`
              );
              break;
              
            case TransformationType.AGGREGATE:
              // Simulate aggregation by reducing record count
              const beforeAgg = context.data.length;
              // Simulating aggregation by keeping 1/3 of records
              context.data = context.data.slice(0, Math.floor(context.data.length / 3));
              
              this.addJobLogEntry(
                jobRun.id, 
                'info', 
                `Aggregated ${beforeAgg} records into ${context.data.length} records`
              );
              break;
              
            case TransformationType.JOIN:
              // Simulate joining with another dataset
              this.addJobLogEntry(
                jobRun.id, 
                'info', 
                `Joined ${context.data.length} records with reference dataset`
              );
              break;
              
            case TransformationType.CUSTOM:
              // Simulate custom transformation
              this.addJobLogEntry(
                jobRun.id, 
                'info', 
                `Applied custom transformation to ${context.data.length} records`
              );
              break;
              
            default:
              this.addJobLogEntry(
                jobRun.id, 
                'warning', 
                `Unknown transformation type: ${transform.type}, skipping`
              );
          }
          
          transformedCount += context.data.length;
        } catch (error) {
          this.addJobLogEntry(
            jobRun.id, 
            'error', 
            `Error applying transformation ${transform.name}: ${error instanceof Error ? error.message : String(error)}`
          );
          
          transformationErrors++;
          
          // Add to context errors
          context.errors.push({
            phase: 'transform',
            message: `Error applying transformation ${transform.name}`,
            details: error instanceof Error ? error.message : String(error)
          });
          
          // Continue with next transformation unless it's critical
          if (job.settings?.stopOnError) {
            throw error;
          }
        }
      }
      
      // Update progress
      context.updateProgress(66);
      
      // Update metrics
      jobRun.metrics.recordsSuccess = transformedCount;
      jobRun.metrics.recordsError = transformationErrors;
      
      this.addJobLogEntry(
        jobRun.id, 
        'info', 
        `Transform phase completed. Transformed: ${transformedCount}, Errors: ${transformationErrors}`
      );
    } catch (error) {
      this.addJobLogEntry(
        jobRun.id, 
        'error', 
        `Transform phase failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Execute the load phase of an ETL job
   * @param context ETL execution context
   */
  private async executeLoadPhase(context: ETLContext): Promise<void> {
    const { job, jobRun } = context;
    
    try {
      const destinations = [];
      
      // Collect all destinations (legacy and new format)
      if (job.destination) {
        destinations.push(job.destination);
      }
      
      if (job.destinations && job.destinations.length > 0) {
        destinations.push(...job.destinations);
      }
      
      if (destinations.length === 0) {
        this.addJobLogEntry(jobRun.id, 'warning', 'No destinations defined, data will not be saved');
        context.updateProgress(100);
        return;
      }
      
      // Load data to each destination
      for (const destinationId of destinations) {
        // Find the data source (destination)
        const destination = this.dataSources.find(ds => ds.id === destinationId);
        
        if (!destination) {
          this.addJobLogEntry(jobRun.id, 'warning', `Destination ${destinationId} not found, skipping`);
          continue;
        }
        
        this.addJobLogEntry(jobRun.id, 'info', `Loading data to destination: ${destination.name}`);
        
        // Simulate data loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.addJobLogEntry(
          jobRun.id, 
          'info', 
          `Loaded ${context.data.length} records to destination: ${destination.name}`
        );
        
        // Update last sync date for destination
        destination.lastSyncDate = new Date();
      }
      
      // Update progress
      context.updateProgress(100);
      
      this.addJobLogEntry(
        jobRun.id, 
        'info', 
        `Load phase completed. Loaded to ${destinations.length} destination(s)`
      );
      
      // Set metrics
      jobRun.metrics.recordsSuccess = context.data.length;
    } catch (error) {
      this.addJobLogEntry(
        jobRun.id, 
        'error', 
        `Load phase failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Generate sample data for a data source (for demonstration purposes)
   * @param source Data source
   * @returns Array of sample data records
   */
  private generateSampleDataForSource(source: DataSource): any[] {
    // In a real implementation, this would fetch actual data from the source
    const recordCount = Math.floor(Math.random() * 20) + 10; // 10-30 records
    const records = [];
    
    // Generate different data structures based on source type
    switch (source.type) {
      case DataSourceType.DATABASE:
      case DataSourceType.POSTGRESQL:
      case DataSourceType.SQL_SERVER:
        // Generate property-like data
        for (let i = 0; i < recordCount; i++) {
          records.push({
            id: `P${10000 + i}`,
            address: `${1000 + i} Main St`,
            city: 'Kennewick',
            state: 'WA',
            zipCode: '99336',
            propertyType: ['Residential', 'Commercial', 'Industrial'][Math.floor(Math.random() * 3)],
            value: Math.round(100000 + Math.random() * 900000),
            sqFt: Math.round(1000 + Math.random() * 4000),
            yearBuilt: Math.round(1950 + Math.random() * 70)
          });
        }
        break;
        
      case DataSourceType.FILE:
      case DataSourceType.FILE_CSV:
        // Generate simpler CSV-like data
        for (let i = 0; i < recordCount; i++) {
          records.push({
            id: `R${10000 + i}`,
            name: `Record ${i}`,
            value: Math.round(Math.random() * 1000),
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          });
        }
        break;
        
      case DataSourceType.API:
      case DataSourceType.REST_API:
        // Generate API-like data
        for (let i = 0; i < recordCount; i++) {
          records.push({
            id: `A${10000 + i}`,
            title: `Item ${i}`,
            description: `Description for item ${i}`,
            status: ['active', 'pending', 'archived'][Math.floor(Math.random() * 3)],
            metadata: {
              createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              version: `1.${Math.floor(Math.random() * 10)}`
            }
          });
        }
        break;
        
      default:
        // Generic data
        for (let i = 0; i < recordCount; i++) {
          records.push({
            id: `G${10000 + i}`,
            name: `Generic Record ${i}`,
            value: Math.round(Math.random() * 1000)
          });
        }
    }
    
    return records;
  }
  
  /**
   * Get detailed information about a specific job run
   * @param jobRunId ID of the job run
   * @returns Job run details or null if not found
   */
  getJobRunDetails(jobRunId: string): ETLJobRun | null {
    return this.jobRuns.find(jr => jr.id === jobRunId) || null;
  }
  
  /**
   * Batch execute multiple jobs
   * @param jobIds Array of job IDs to execute
   * @returns Promise resolving to batch execution results
   */
  async executeBatchJobs(jobIds: string[]): Promise<{
    totalJobs: number;
    successCount: number;
    failureCount: number;
    results: { jobId: string; success: boolean; message: string; jobRunId?: string }[];
  }> {
    // Create batch results structure
    const batchResults = {
      totalJobs: jobIds.length,
      successCount: 0,
      failureCount: 0,
      results: [] as { jobId: string; success: boolean; message: string; jobRunId?: string }[]
    };
    
    // Execute each job in sequence
    for (const jobId of jobIds) {
      try {
        // Execute the job
        const result = await this.executeJob(jobId);
        
        // Add to results
        batchResults.results.push({
          jobId,
          success: result.success,
          message: result.message,
          jobRunId: result.jobRunId
        });
        
        // Update counts
        if (result.success) {
          batchResults.successCount++;
        } else {
          batchResults.failureCount++;
        }
      } catch (error) {
        // Handle any unexpected errors
        batchResults.results.push({
          jobId,
          success: false,
          message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        });
        
        batchResults.failureCount++;
      }
    }
    
    // Create a summary alert
    alertService.createAlert({
      severity: batchResults.failureCount > 0 ? 'warning' : 'success',
      message: `Batch job execution completed: ${batchResults.successCount}/${batchResults.totalJobs} successful`,
      source: 'ETL Manager',
      category: 'batch_execution'
    });
    
    return batchResults;
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();