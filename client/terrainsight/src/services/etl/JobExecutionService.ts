/**
 * JobExecutionService.ts
 * 
 * Service for executing ETL jobs
 */

import { 
  ETLJob, 
  ETLJobRun, 
  ETLJobResult, 
  ETLContext, 
  DataSource,
  Transformation,
  JobStatus,
  JobLogEntry
} from './ETLTypes';
import { alertService } from './AlertService';

interface ExecutableJob {
  job: ETLJob;
  source: DataSource;
  transformations: Transformation[];
  context: ETLContext;
}

class JobExecutionService {
  private runningJobs: Map<string, ExecutableJob> = new Map();

  /**
   * Start execution of a job
   */
  async startJob(job: ETLJob, source: DataSource, transformations: Transformation[]): Promise<ETLJobRun> {
    // Create a new job run
    const jobRun: ETLJobRun = {
      id: String(Date.now()),
      jobId: job.id,
      startTime: new Date(),
      status: 'running',
      logs: []
    };

    // Create execution context
    const context: ETLContext = {
      jobId: job.id,
      source,
      transformations,
      data: [],
      metadata: {},
      errors: [],
      logs: jobRun.logs,
      startTime: jobRun.startTime,
      canceled: false
    };

    // Log job start
    this.logInfo(context, `Starting job '${job.name}'`);

    // Store running job
    this.runningJobs.set(job.id, {
      job,
      source,
      transformations,
      context
    });

    // Execute job in background
    this.executeJob(job.id)
      .catch(error => {
        this.logError(context, `Job execution error: ${error.message}`);
        this.finishJob(job.id, 'error', error.message);
      });

    return jobRun;
  }

  /**
   * Execute a job
   */
  private async executeJob(jobId: string): Promise<void> {
    const executableJob = this.runningJobs.get(jobId);
    if (!executableJob) {
      throw new Error(`Job ${jobId} not found in running jobs`);
    }

    const { job, source, transformations, context } = executableJob;

    try {
      // In a real implementation, we would:
      // 1. Extract data from the source
      // 2. Apply transformations
      // 3. Load data to the target
      
      // For this mock implementation, we'll simulate a successful job run
      this.logInfo(context, 'Extracting data from source...');
      await this.simulateDelay(1000);
      
      // Check if job was canceled
      if (context.canceled) {
        this.logInfo(context, 'Job was canceled');
        this.finishJob(jobId, 'error', 'Job was canceled');
        return;
      }
      
      this.logInfo(context, 'Applying transformations...');
      for (const transformation of transformations) {
        this.logInfo(context, `Applying transformation '${transformation.name}'...`);
        await this.simulateDelay(500);
        
        // Check if job was canceled
        if (context.canceled) {
          this.logInfo(context, 'Job was canceled');
          this.finishJob(jobId, 'error', 'Job was canceled');
          return;
        }
      }
      
      this.logInfo(context, 'Loading data to target...');
      await this.simulateDelay(1000);
      
      // Check if job was canceled
      if (context.canceled) {
        this.logInfo(context, 'Job was canceled');
        this.finishJob(jobId, 'error', 'Job was canceled');
        return;
      }
      
      this.logInfo(context, 'Job completed successfully');
      
      // Finish job
      this.finishJob(jobId, 'success');
    } catch (error: any) {
      this.logError(context, `Job execution error: ${error.message}`);
      this.finishJob(jobId, 'error', error.message);
    }
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): boolean {
    const executableJob = this.runningJobs.get(jobId);
    if (!executableJob) {
      return false;
    }

    executableJob.context.canceled = true;
    this.logInfo(executableJob.context, 'Job cancellation requested');

    return true;
  }

  /**
   * Finish a job
   */
  private finishJob(jobId: string, status: 'success' | 'error', errorMessage?: string): ETLJobResult {
    const executableJob = this.runningJobs.get(jobId);
    if (!executableJob) {
      throw new Error(`Job ${jobId} not found in running jobs`);
    }

    const { job, context } = executableJob;
    const endTime = new Date();
    
    // Update context
    context.endTime = endTime;
    
    // Create job result
    const result: ETLJobResult = {
      status: status === 'success' ? JobStatus.SUCCESS : JobStatus.ERROR,
      recordsProcessed: Math.floor(Math.random() * 1000),
      recordsFailed: status === 'success' ? 0 : Math.floor(Math.random() * 10),
      startTime: context.startTime,
      endTime,
      duration: endTime.getTime() - context.startTime.getTime(),
      warnings: [],
      errorMessage
    };
    
    // Remove from running jobs
    this.runningJobs.delete(jobId);
    
    // Create alert
    if (status === 'success') {
      alertService.success(
        `Job '${job.name}' completed successfully`,
        'JobExecutionService',
        { 
          jobId: job.id,
          recordsProcessed: result.recordsProcessed,
          duration: result.duration
        }
      );
    } else {
      alertService.error(
        `Job '${job.name}' failed: ${errorMessage}`,
        'JobExecutionService',
        { 
          jobId: job.id,
          recordsProcessed: result.recordsProcessed,
          recordsFailed: result.recordsFailed,
          duration: result.duration
        }
      );
    }
    
    return result;
  }

  /**
   * Log an info message
   */
  private logInfo(context: ETLContext, message: string, data?: Record<string, any>): void {
    const logEntry: JobLogEntry = {
      timestamp: new Date(),
      level: 'info',
      message,
      data
    };
    
    context.logs.push(logEntry);
  }

  /**
   * Log a warning message
   */
  private logWarning(context: ETLContext, message: string, data?: Record<string, any>): void {
    const logEntry: JobLogEntry = {
      timestamp: new Date(),
      level: 'warning',
      message,
      data
    };
    
    context.logs.push(logEntry);
  }

  /**
   * Log an error message
   */
  private logError(context: ETLContext, message: string, data?: Record<string, any>): void {
    const logEntry: JobLogEntry = {
      timestamp: new Date(),
      level: 'error',
      message,
      data
    };
    
    context.logs.push(logEntry);
  }

  /**
   * Simulate a delay
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const jobExecutionService = new JobExecutionService();