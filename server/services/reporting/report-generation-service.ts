/**
 * Report Generation Service
 * Handles scalable generation of URAR reports with worker pools
 */

import { Worker } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { createClient } from 'redis';

// Report types
export enum ReportType {
  URAR = 'urar',
  MARKET_ANALYSIS = 'market_analysis',
  PROPERTY_CARD = 'property_card',
  COMPS_GRID = 'comps_grid',
  CUSTOM = 'custom'
}

// Report format
export enum ReportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  HTML = 'html',
  JSON = 'json',
  XML = 'xml'
}

// Report status
export enum ReportStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

// Report job interface
export interface ReportJob {
  id: string;
  type: ReportType;
  format: ReportFormat;
  data: any;
  userId: number;
  priority: number;
  status: ReportStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  outputPath?: string;
  retryCount: number;
}

export class ReportGenerationService {
  private workers: Worker[] = [];
  private jobQueue: ReportJob[] = [];
  private activeJobs: Map<string, ReportJob> = new Map();
  private redisClient: any;
  private workerCount: number;
  private maxConcurrentJobs: number;
  private maxQueueSize: number;
  private baseTempPath: string;
  private baseOutputPath: string;
  
  constructor(options: {
    workerCount?: number;
    maxConcurrentJobs?: number;
    maxQueueSize?: number;
    baseTempPath?: string;
    baseOutputPath?: string;
  } = {}) {
    // Initialize settings with defaults
    this.workerCount = options.workerCount || 4;
    this.maxConcurrentJobs = options.maxConcurrentJobs || 10;
    this.maxQueueSize = options.maxQueueSize || 100;
    this.baseTempPath = options.baseTempPath || join(process.cwd(), 'temp', 'reports');
    this.baseOutputPath = options.baseOutputPath || join(process.cwd(), 'reports');
    
    // Initialize Redis client
    this.initRedis();
    
    // Initialize worker pool
    this.initWorkers();
    
    // Start queue processing
    setInterval(() => this.processQueue(), 1000);
    
    console.log(`Report Generation Service initialized with ${this.workerCount} workers`);
  }
  
  private async initRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redisClient.connect();
      console.log('Redis client connected for report service');
      
      // Restore any queued jobs from Redis
      await this.restoreQueueState();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }
  
  private async restoreQueueState() {
    try {
      const queuedJobs = await this.redisClient.lRange('report:queue', 0, -1);
      if (queuedJobs && queuedJobs.length > 0) {
        for (const jobString of queuedJobs) {
          try {
            const job = JSON.parse(jobString);
            this.jobQueue.push({
              ...job,
              createdAt: new Date(job.createdAt),
              startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
              completedAt: job.completedAt ? new Date(job.completedAt) : undefined
            });
          } catch (e) {
            console.error('Failed to restore job from queue:', e);
          }
        }
        console.log(`Restored ${this.jobQueue.length} jobs from Redis queue`);
      }
    } catch (error) {
      console.error('Failed to restore queue state from Redis:', error);
    }
  }
  
  private initWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      this.createWorker(i);
    }
  }
  
  private createWorker(id: number) {
    const worker = new Worker(join(__dirname, 'report-worker.js'), {
      workerData: {
        workerId: id,
        baseTempPath: this.baseTempPath,
        baseOutputPath: this.baseOutputPath
      }
    });
    
    worker.on('message', (message) => {
      this.handleWorkerMessage(message, id);
    });
    
    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error);
      // Recreate worker on error
      this.workers[id].terminate().catch(err => console.error(`Error terminating worker ${id}:`, err));
      setTimeout(() => this.createWorker(id), 1000);
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${id} exited with code ${code}`);
        // Recreate worker on abnormal exit
        setTimeout(() => this.createWorker(id), 1000);
      }
    });
    
    this.workers[id] = worker;
    console.log(`Worker ${id} initialized`);
  }
  
  private handleWorkerMessage(message: any, workerId: number) {
    const { type, jobId, result } = message;
    
    switch (type) {
      case 'job_completed':
        this.handleJobCompleted(jobId, result);
        break;
      case 'job_failed':
        this.handleJobFailed(jobId, result.error);
        break;
      case 'worker_ready':
        console.log(`Worker ${workerId} ready`);
        break;
      default:
        console.warn(`Unknown message type from worker ${workerId}:`, type);
    }
  }
  
  private async handleJobCompleted(jobId: string, result: any) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      console.warn(`Completed job ${jobId} not found in active jobs`);
      return;
    }
    
    // Update job status
    job.status = ReportStatus.COMPLETED;
    job.completedAt = new Date();
    job.outputPath = result.outputPath;
    
    // Remove from active jobs
    this.activeJobs.delete(jobId);
    
    // Update job status in Redis
    await this.redisClient.hSet(`report:job:${jobId}`, 'status', ReportStatus.COMPLETED);
    await this.redisClient.hSet(`report:job:${jobId}`, 'completedAt', job.completedAt!.toISOString());
    await this.redisClient.hSet(`report:job:${jobId}`, 'outputPath', job.outputPath);
    
    console.log(`Job ${jobId} completed successfully`);
    
    // Emit event or callback
    this.emitJobEvent(job, 'completed');
  }
  
  private async handleJobFailed(jobId: string, error: string) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      console.warn(`Failed job ${jobId} not found in active jobs`);
      return;
    }
    
    // Increment retry count
    job.retryCount++;
    
    if (job.retryCount >= 3) {
      // Max retries reached, mark as failed
      job.status = ReportStatus.FAILED;
      job.failureReason = error;
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Update job status in Redis
      await this.redisClient.hSet(`report:job:${jobId}`, 'status', ReportStatus.FAILED);
      await this.redisClient.hSet(`report:job:${jobId}`, 'failureReason', error);
      
      console.error(`Job ${jobId} failed permanently after ${job.retryCount} retries:`, error);
      
      // Emit event or callback
      this.emitJobEvent(job, 'failed');
    } else {
      // Retry the job
      console.log(`Job ${jobId} failed, retrying (${job.retryCount}/3):`, error);
      
      // Put back in queue with higher priority
      job.status = ReportStatus.QUEUED;
      job.priority += 5; // Increase priority for retries
      this.jobQueue.unshift(job);
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
    }
  }
  
  private async processQueue() {
    // Skip if we're at max concurrent jobs
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }
    
    // Sort queue by priority (highest first)
    this.jobQueue.sort((a, b) => b.priority - a.priority);
    
    // Process jobs until we hit max concurrent
    while (this.jobQueue.length > 0 && this.activeJobs.size < this.maxConcurrentJobs) {
      const job = this.jobQueue.shift();
      if (!job) break;
      
      // Start job
      await this.startJob(job);
    }
  }
  
  private async startJob(job: ReportJob) {
    // Update job status
    job.status = ReportStatus.PROCESSING;
    job.startedAt = new Date();
    
    // Add to active jobs
    this.activeJobs.set(job.id, job);
    
    // Update job in Redis
    await this.redisClient.hSet(`report:job:${job.id}`, 'status', ReportStatus.PROCESSING);
    await this.redisClient.hSet(`report:job:${job.id}`, 'startedAt', job.startedAt.toISOString());
    
    // Find available worker
    const workerId = Math.floor(Math.random() * this.workerCount);
    const worker = this.workers[workerId];
    
    // Send job to worker
    worker.postMessage({
      type: 'process_job',
      job
    });
    
    console.log(`Job ${job.id} started processing on worker ${workerId}`);
  }
  
  private emitJobEvent(job: ReportJob, event: string) {
    // This would be implemented with an event emitter in a real service
    console.log(`Event: ${event} for job ${job.id}`);
  }
  
  // Public API
  
  /**
   * Queue a new report generation job
   */
  public async queueReport(options: {
    type: ReportType;
    format: ReportFormat;
    data: any;
    userId: number;
    priority?: number;
  }): Promise<string> {
    // Check if queue is full
    if (this.jobQueue.length >= this.maxQueueSize) {
      throw new Error('Report queue is full, please try again later');
    }
    
    // Create job
    const jobId = uuidv4();
    const job: ReportJob = {
      id: jobId,
      type: options.type,
      format: options.format,
      data: options.data,
      userId: options.userId,
      priority: options.priority || 1,
      status: ReportStatus.QUEUED,
      createdAt: new Date(),
      retryCount: 0
    };
    
    // Add to queue
    this.jobQueue.push(job);
    
    // Store in Redis
    await this.redisClient.hSet(`report:job:${jobId}`, {
      id: jobId,
      type: job.type,
      format: job.format,
      userId: job.userId,
      priority: job.priority,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      retryCount: job.retryCount
    });
    
    // Store data separately (might be large)
    await this.redisClient.hSet(`report:job:${jobId}:data`, job.data);
    
    // Add to queue list
    await this.redisClient.rPush('report:queue', JSON.stringify({
      id: jobId,
      type: job.type,
      format: job.format,
      userId: job.userId,
      priority: job.priority,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      retryCount: job.retryCount
    }));
    
    console.log(`Job ${jobId} queued for processing`);
    return jobId;
  }
  
  /**
   * Get status of a report job
   */
  public async getJobStatus(jobId: string): Promise<{
    status: ReportStatus;
    position?: number;
    estimatedTime?: number;
    outputPath?: string;
    failureReason?: string;
  }> {
    // Check active jobs first
    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId)!;
      return {
        status: job.status,
        estimatedTime: 30 // Estimate 30 seconds for active jobs
      };
    }
    
    // Check queue
    const queuePosition = this.jobQueue.findIndex(job => job.id === jobId);
    if (queuePosition >= 0) {
      const job = this.jobQueue[queuePosition];
      return {
        status: job.status,
        position: queuePosition + 1,
        estimatedTime: (queuePosition + 1) * 45 // Rough estimate: 45 seconds per job
      };
    }
    
    // Check Redis for completed/failed jobs
    const jobExists = await this.redisClient.exists(`report:job:${jobId}`);
    if (jobExists) {
      const jobData = await this.redisClient.hGetAll(`report:job:${jobId}`);
      return {
        status: jobData.status as ReportStatus,
        outputPath: jobData.outputPath,
        failureReason: jobData.failureReason
      };
    }
    
    throw new Error(`Job ${jobId} not found`);
  }
  
  /**
   * Cancel a queued report job
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    // Check if job is in queue
    const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (queueIndex >= 0) {
      // Remove from queue
      this.jobQueue.splice(queueIndex, 1);
      
      // Remove from Redis
      await this.redisClient.del(`report:job:${jobId}`);
      await this.redisClient.del(`report:job:${jobId}:data`);
      
      // Also remove from queue list
      await this.redisClient.lRem('report:queue', 0, jobId);
      
      console.log(`Job ${jobId} cancelled successfully`);
      return true;
    }
    
    // Cannot cancel jobs that are already processing
    if (this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already processing and cannot be cancelled`);
    }
    
    throw new Error(`Job ${jobId} not found`);
  }
  
  /**
   * Get queue statistics
   */
  public getQueueStats(): {
    queueSize: number;
    activeJobs: number;
    totalCapacity: number;
    workerCount: number;
    estimatedWaitTime: number;
  } {
    return {
      queueSize: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      totalCapacity: this.maxConcurrentJobs,
      workerCount: this.workerCount,
      estimatedWaitTime: Math.ceil(this.jobQueue.length / this.maxConcurrentJobs) * 45 // Rough estimate
    };
  }
}

export default ReportGenerationService;
