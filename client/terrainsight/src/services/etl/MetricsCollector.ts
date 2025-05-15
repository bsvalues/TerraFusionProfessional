/**
 * MetricsCollector.ts
 * 
 * Service for collecting and tracking ETL job metrics
 */

import { JobMetrics } from './ETLTypes';

// Define metric record type for browser compatibility
interface JobMetricRecord {
  startTime: Date;
  endTime?: Date;
  extractStartTime?: Date;
  extractEndTime?: Date;
  transformStartTime?: Date;
  transformEndTime?: Date;
  loadStartTime?: Date;
  loadEndTime?: Date;
  recordsProcessed: number;
  recordsValid: number;
  recordsInvalid: number;
  cpuSamples: number[];
  memorySamples: number[];
}

class MetricsCollector {
  // Store job metrics by job ID using Record for browser compatibility
  private jobMetrics: Record<number, JobMetricRecord> = {};
  
  // Timer IDs for performance sampling
  private performanceSamplers: Record<number, ReturnType<typeof setInterval>> = {};
  
  /**
   * Start metrics collection for a job
   */
  startJobMetrics(jobId: number): void {
    console.log(`Starting metrics collection for job ${jobId}`);
    
    // Initialize metrics for this job
    this.jobMetrics[jobId] = {
      startTime: new Date(),
      recordsProcessed: 0,
      recordsValid: 0,
      recordsInvalid: 0,
      cpuSamples: [],
      memorySamples: []
    };
    
    // Start performance sampling
    this.startPerformanceSampling(jobId);
  }
  
  /**
   * Start extract phase metrics
   */
  startExtractPhase(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.extractStartTime = new Date();
  }
  
  /**
   * End extract phase metrics
   */
  endExtractPhase(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.extractEndTime = new Date();
  }
  
  /**
   * Start transform phase metrics
   */
  startTransformPhase(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.transformStartTime = new Date();
  }
  
  /**
   * End transform phase metrics
   */
  endTransformPhase(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.transformEndTime = new Date();
  }
  
  /**
   * Start load phase metrics
   */
  startLoadPhase(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.loadStartTime = new Date();
  }
  
  /**
   * End load phase metrics
   */
  endLoadPhase(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.loadEndTime = new Date();
  }
  
  /**
   * Update records processed count
   */
  updateRecordsProcessed(jobId: number, count: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.recordsProcessed = count;
  }
  
  /**
   * Update records valid/invalid counts
   */
  updateValidationCounts(jobId: number, valid: number, invalid: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return;
    }
    
    metrics.recordsValid = valid;
    metrics.recordsInvalid = invalid;
  }
  
  /**
   * End metrics collection and return final metrics
   */
  endJobMetrics(jobId: number): JobMetrics {
    console.log(`Ending metrics collection for job ${jobId}`);
    
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      console.warn(`No metrics found for job ${jobId}`);
      return this.createEmptyMetrics();
    }
    
    // Stop performance sampling
    this.stopPerformanceSampling(jobId);
    
    // Set end time if not already set
    if (!metrics.endTime) {
      metrics.endTime = new Date();
    }
    
    // Calculate durations and other metrics
    const startTime = metrics.startTime;
    const endTime = metrics.endTime;
    const duration = endTime.getTime() - startTime.getTime();
    
    // Calculate phase timings
    const extractTime = metrics.extractStartTime && metrics.extractEndTime
      ? metrics.extractEndTime.getTime() - metrics.extractStartTime.getTime()
      : 0;
      
    const transformTime = metrics.transformStartTime && metrics.transformEndTime
      ? metrics.transformEndTime.getTime() - metrics.transformStartTime.getTime()
      : 0;
      
    const loadTime = metrics.loadStartTime && metrics.loadEndTime
      ? metrics.loadEndTime.getTime() - metrics.loadStartTime.getTime()
      : 0;
    
    // Calculate throughput (records per second)
    const throughput = duration > 0
      ? (metrics.recordsProcessed / duration) * 1000
      : 0;
    
    // Calculate average CPU and memory usage
    const avgCpuUsage = metrics.cpuSamples.length > 0
      ? metrics.cpuSamples.reduce((sum: number, sample: number) => sum + sample, 0) / metrics.cpuSamples.length
      : undefined;
      
    const avgMemoryUsage = metrics.memorySamples.length > 0
      ? metrics.memorySamples.reduce((sum: number, sample: number) => sum + sample, 0) / metrics.memorySamples.length
      : undefined;
    
    // Compile final metrics
    const finalMetrics: JobMetrics = {
      startTime,
      endTime,
      duration,
      extractTime,
      transformTime,
      loadTime,
      recordsProcessed: metrics.recordsProcessed,
      recordsValid: metrics.recordsValid,
      recordsInvalid: metrics.recordsInvalid,
      throughput,
      cpuUsage: avgCpuUsage,
      memoryUsage: avgMemoryUsage
    };
    
    // Keep the raw metrics for historical data
    // But move out of the active job metrics map
    // In a real implementation, these would likely be stored in a database
    
    // Remove from active job metrics
    delete this.jobMetrics[jobId];
    
    return finalMetrics;
  }
  
  /**
   * Get current job metrics (snapshot)
   */
  getJobMetrics(jobId: number): JobMetrics | null {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      return null;
    }
    
    // Create a snapshot of current metrics
    const now = new Date();
    const duration = now.getTime() - metrics.startTime.getTime();
    
    // Calculate phase timings
    const extractTime = metrics.extractStartTime
      ? (metrics.extractEndTime || now).getTime() - metrics.extractStartTime.getTime()
      : 0;
      
    const transformTime = metrics.transformStartTime
      ? (metrics.transformEndTime || now).getTime() - metrics.transformStartTime.getTime()
      : 0;
      
    const loadTime = metrics.loadStartTime
      ? (metrics.loadEndTime || now).getTime() - metrics.loadStartTime.getTime()
      : 0;
    
    // Calculate throughput (records per second)
    const throughput = duration > 0
      ? (metrics.recordsProcessed / duration) * 1000
      : 0;
    
    // Calculate average CPU and memory usage
    const avgCpuUsage = metrics.cpuSamples.length > 0
      ? metrics.cpuSamples.reduce((sum: number, sample: number) => sum + sample, 0) / metrics.cpuSamples.length
      : undefined;
      
    const avgMemoryUsage = metrics.memorySamples.length > 0
      ? metrics.memorySamples.reduce((sum: number, sample: number) => sum + sample, 0) / metrics.memorySamples.length
      : undefined;
    
    return {
      startTime: metrics.startTime,
      endTime: metrics.endTime || now,
      duration,
      extractTime,
      transformTime,
      loadTime,
      recordsProcessed: metrics.recordsProcessed,
      recordsValid: metrics.recordsValid,
      recordsInvalid: metrics.recordsInvalid,
      throughput,
      cpuUsage: avgCpuUsage,
      memoryUsage: avgMemoryUsage
    };
  }
  
  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    // Stop all performance samplers
    Object.keys(this.performanceSamplers).forEach(jobIdStr => {
      this.stopPerformanceSampling(parseInt(jobIdStr, 10));
    });
    
    // Clear all metrics
    this.jobMetrics = {};
  }
  
  /**
   * Start performance sampling for a job
   */
  private startPerformanceSampling(jobId: number): void {
    // Check if already sampling
    if (this.performanceSamplers[jobId] !== undefined) {
      return;
    }
    
    // Start a timer to sample performance metrics
    // In a real implementation, this would use actual process metrics
    // For this demo, we'll use random values
    const samplingInterval = 1000; // 1 second
    
    const timerId = setInterval(() => {
      this.samplePerformanceMetrics(jobId);
    }, samplingInterval);
    
    this.performanceSamplers[jobId] = timerId;
  }
  
  /**
   * Stop performance sampling for a job
   */
  private stopPerformanceSampling(jobId: number): void {
    const timerId = this.performanceSamplers[jobId];
    
    if (timerId) {
      clearInterval(timerId);
      delete this.performanceSamplers[jobId];
    }
  }
  
  /**
   * Sample performance metrics for a job
   */
  private samplePerformanceMetrics(jobId: number): void {
    const metrics = this.jobMetrics[jobId];
    
    if (!metrics) {
      this.stopPerformanceSampling(jobId);
      return;
    }
    
    // In a real implementation, these would be actual CPU and memory metrics
    // For this demo, we'll use simulated values
    // CPU usage as percentage (0-100)
    const cpuUsage = Math.random() * 20 + 10; // Random between 10-30%
    
    // Memory usage in MB
    const memoryUsage = Math.random() * 100 + 50; // Random between 50-150MB
    
    // Add to samples
    metrics.cpuSamples.push(cpuUsage);
    metrics.memorySamples.push(memoryUsage);
  }
  
  /**
   * Create empty metrics object (fallback for errors)
   */
  private createEmptyMetrics(): JobMetrics {
    const now = new Date();
    return {
      startTime: now,
      endTime: now,
      duration: 0,
      extractTime: 0,
      transformTime: 0,
      loadTime: 0,
      recordsProcessed: 0,
      recordsValid: 0,
      recordsInvalid: 0,
      throughput: 0
    };
  }
}

// Export a singleton instance
export const metricsCollector = new MetricsCollector();