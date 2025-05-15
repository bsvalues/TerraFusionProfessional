import { ETLJob, JobStatus } from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Schedule frequency enum
 */
export enum ScheduleFrequency {
  ONCE = 'ONCE',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

/**
 * Schedule configuration interface
 */
export interface ScheduleConfig {
  /** Schedule frequency */
  frequency: ScheduleFrequency;
  
  /** Start date */
  startDate?: Date;
  
  /** End date */
  endDate?: Date;
  
  /** Hours for hourly schedule */
  hours?: number;
  
  /** Time for daily schedule (HH:MM) */
  time?: string;
  
  /** Day of week for weekly schedule (0-6, 0 = Sunday) */
  dayOfWeek?: number;
  
  /** Day of month for monthly schedule (1-31) */
  dayOfMonth?: number;
  
  /** Cron expression for custom schedule */
  cronExpression?: string;
  
  /** Whether the schedule is enabled */
  enabled: boolean;
}

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  /** Job ID */
  jobId: number;
  
  /** Schedule configuration */
  schedule: ScheduleConfig;
  
  /** Next run timestamp */
  nextRun?: Date;
  
  /** Last run timestamp */
  lastRun?: Date;
  
  /** Current status */
  status: JobStatus;
}

/**
 * Matches a time string (HH:MM) against the current time
 */
function matchesTime(timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return now.getHours() === hours && now.getMinutes() === minutes;
}

/**
 * Calculates when a job should next run
 */
function calculateNextRun(schedule: ScheduleConfig): Date | undefined {
  if (!schedule.enabled) {
    return undefined;
  }
  
  const now = new Date();
  
  // Don't schedule if end date is in the past
  if (schedule.endDate && schedule.endDate < now) {
    return undefined;
  }
  
  // Don't schedule if start date is in the future
  if (schedule.startDate && schedule.startDate > now) {
    return schedule.startDate;
  }
  
  // Calculate next run based on frequency
  switch (schedule.frequency) {
    case ScheduleFrequency.ONCE:
      return schedule.startDate && schedule.startDate > now ? schedule.startDate : undefined;
      
    case ScheduleFrequency.HOURLY: {
      const nextRun = new Date(now);
      nextRun.setHours(nextRun.getHours() + (schedule.hours || 1));
      nextRun.setMinutes(0);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      return nextRun;
    }
      
    case ScheduleFrequency.DAILY: {
      const nextRun = new Date(now);
      const [hours, minutes] = (schedule.time || '00:00').split(':').map(Number);
      
      nextRun.setHours(hours);
      nextRun.setMinutes(minutes);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      
      // If the time has already passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      return nextRun;
    }
      
    case ScheduleFrequency.WEEKLY: {
      const nextRun = new Date(now);
      const [hours, minutes] = (schedule.time || '00:00').split(':').map(Number);
      const dayOfWeek = schedule.dayOfWeek !== undefined ? schedule.dayOfWeek : 0;
      
      nextRun.setHours(hours);
      nextRun.setMinutes(minutes);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      
      // Calculate days until next occurrence of dayOfWeek
      let daysUntil = dayOfWeek - nextRun.getDay();
      if (daysUntil <= 0 || (daysUntil === 0 && nextRun <= now)) {
        daysUntil += 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntil);
      
      return nextRun;
    }
      
    case ScheduleFrequency.MONTHLY: {
      const nextRun = new Date(now);
      const [hours, minutes] = (schedule.time || '00:00').split(':').map(Number);
      const dayOfMonth = schedule.dayOfMonth !== undefined ? schedule.dayOfMonth : 1;
      
      nextRun.setHours(hours);
      nextRun.setMinutes(minutes);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      nextRun.setDate(dayOfMonth);
      
      // If the day has already passed this month, schedule for next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      
      return nextRun;
    }
      
    case ScheduleFrequency.CUSTOM:
      // In a real app, we would use a cron parser library
      // For now, just schedule for the next day
      const nextRun = new Date(now);
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0);
      nextRun.setMinutes(0);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      return nextRun;
      
    default:
      return undefined;
  }
}

/**
 * Scheduler
 * 
 * This class is responsible for scheduling and running ETL jobs.
 */
class Scheduler {
  private scheduledJobs = new Map<number, ScheduledJob>();
  private pollInterval = 60 * 1000; // 60 seconds
  private pollIntervalId: number | null = null;
  private isRunning = false;
  private dueJobs: number[] = [];
  private runningJobs = new Set<number>();
  private jobRunner: ((jobId: number) => Promise<void>) | null = null;
  
  /**
   * Schedule a job
   */
  scheduleJob(jobId: number, schedule: ScheduleConfig): ScheduledJob {
    // Create a scheduled job
    const scheduledJob: ScheduledJob = {
      jobId,
      schedule,
      status: JobStatus.IDLE
    };
    
    // Calculate next run
    if (schedule.enabled) {
      scheduledJob.nextRun = calculateNextRun(schedule);
    }
    
    // Add to scheduled jobs
    this.scheduledJobs.set(jobId, scheduledJob);
    
    // Log job scheduled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: 'Job Scheduled',
      message: `Job ${jobId} scheduled for ${scheduledJob.nextRun?.toLocaleString() || 'manual execution only'}`
    });
    
    return scheduledJob;
  }
  
  /**
   * Update a job schedule
   */
  updateSchedule(jobId: number, schedule: ScheduleConfig): ScheduledJob | undefined {
    // Get scheduled job
    const scheduledJob = this.scheduledJobs.get(jobId);
    
    if (!scheduledJob) {
      return undefined;
    }
    
    // Update schedule
    scheduledJob.schedule = schedule;
    
    // Calculate next run
    if (schedule.enabled) {
      scheduledJob.nextRun = calculateNextRun(schedule);
    } else {
      scheduledJob.nextRun = undefined;
    }
    
    // Update scheduled job
    this.scheduledJobs.set(jobId, scheduledJob);
    
    // Log schedule updated
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: 'Schedule Updated',
      message: `Job ${jobId} schedule updated, next run: ${scheduledJob.nextRun?.toLocaleString() || 'manual execution only'}`
    });
    
    return scheduledJob;
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: number): boolean {
    const result = this.scheduledJobs.delete(jobId);
    
    if (result) {
      // Log job unscheduled
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: 'Job Unscheduled',
        message: `Job ${jobId} has been unscheduled`
      });
    }
    
    return result;
  }
  
  /**
   * Get a scheduled job
   */
  getScheduledJob(jobId: number): ScheduledJob | undefined {
    return this.scheduledJobs.get(jobId);
  }
  
  /**
   * Get all scheduled jobs
   */
  getAllScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }
  
  /**
   * Get due jobs
   */
  getDueJobs(): number[] {
    const now = new Date();
    const dueJobs: number[] = [];
    
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      if (job.nextRun && job.nextRun <= now && job.status !== JobStatus.RUNNING) {
        dueJobs.push(jobId);
      }
    }
    
    return dueJobs;
  }
  
  /**
   * Start the scheduler
   */
  start(jobRunner: (jobId: number) => Promise<void>): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.jobRunner = jobRunner;
    
    // Start polling
    this.poll();
    this.pollIntervalId = window.setInterval(() => this.poll(), this.pollInterval);
    
    // Log scheduler started
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'Scheduler Started',
      message: `Scheduler has started with ${this.scheduledJobs.size} jobs scheduled`
    });
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Stop polling
    if (this.pollIntervalId !== null) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    
    // Log scheduler stopped
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'Scheduler Stopped',
      message: 'Scheduler has been stopped'
    });
  }
  
  /**
   * Poll for due jobs
   */
  private poll(): void {
    // Check for due jobs
    this.dueJobs = this.getDueJobs();
    
    // Process due jobs
    this.processDueJobs();
    
    // Update next run times
    this.updateNextRunTimes();
  }
  
  /**
   * Process due jobs
   */
  private processDueJobs(): void {
    if (this.dueJobs.length === 0 || !this.jobRunner) {
      return;
    }
    
    // Process each due job
    for (const jobId of this.dueJobs) {
      // Skip if already running
      if (this.runningJobs.has(jobId)) {
        continue;
      }
      
      // Get job
      const job = this.scheduledJobs.get(jobId);
      
      if (!job) {
        continue;
      }
      
      // Update job status
      job.status = JobStatus.RUNNING;
      job.lastRun = new Date();
      this.runningJobs.add(jobId);
      
      // Run job
      this.jobRunner(jobId)
        .then(() => {
          // Update job status
          if (job) {
            job.status = JobStatus.SUCCEEDED;
          }
        })
        .catch(error => {
          // Update job status
          if (job) {
            job.status = JobStatus.FAILED;
          }
          
          // Log error
          alertService.createAlert({
            type: AlertType.ERROR,
            severity: AlertSeverity.HIGH,
            category: AlertCategory.JOB,
            title: 'Job Execution Error',
            message: `Error executing job ${jobId}: ${error instanceof Error ? error.message : String(error)}`
          });
        })
        .finally(() => {
          // Remove from running jobs
          this.runningJobs.delete(jobId);
        });
    }
    
    // Clear due jobs
    this.dueJobs = [];
  }
  
  /**
   * Update next run times
   */
  private updateNextRunTimes(): void {
    const now = new Date();
    
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      // Skip running jobs
      if (job.status === JobStatus.RUNNING) {
        continue;
      }
      
      // Skip disabled schedules
      if (!job.schedule.enabled) {
        job.nextRun = undefined;
        continue;
      }
      
      // Update next run if it's in the past
      if (job.nextRun && job.nextRun <= now) {
        job.nextRun = calculateNextRun(job.schedule);
      }
      
      // If no next run, calculate it
      if (!job.nextRun) {
        job.nextRun = calculateNextRun(job.schedule);
      }
    }
  }
  
  /**
   * Get job execution counts
   */
  getJobExecutionCounts(): Record<JobStatus, number> {
    const counts: Record<JobStatus, number> = {
      [JobStatus.IDLE]: 0,
      [JobStatus.RUNNING]: 0,
      [JobStatus.SUCCEEDED]: 0,
      [JobStatus.FAILED]: 0
    };
    
    for (const job of this.scheduledJobs.values()) {
      counts[job.status]++;
    }
    
    return counts;
  }
}

// Export singleton instance
export const scheduler = new Scheduler();