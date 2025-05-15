import { JobSchedule } from './ETLTypes';

/**
 * Implementation of JobSchedule interface
 * This class provides backward compatibility with the string-based scheduling system
 */
export class JobScheduleImpl implements JobSchedule {
  expression: string;
  nextRun?: Date;
  runCount?: number;
  lastRun?: Date;
  timezone?: string;
  
  constructor(expression: string) {
    this.expression = expression;
    this.runCount = 0;
    this.calculateNextRun();
  }
  
  /**
   * Create a JobSchedule from a cron expression
   */
  static fromCronExpression(expression: string): JobSchedule {
    return new JobScheduleImpl(expression);
  }
  
  /**
   * Create a JobSchedule for a one-time execution
   */
  static once(date: Date): JobSchedule {
    // Format: @once [ISO string]
    return new JobScheduleImpl(`@once ${date.toISOString()}`);
  }
  
  /**
   * Create a JobSchedule for hourly execution
   */
  static hourly(minute: number = 0): JobSchedule {
    // Standard cron format or shorthand
    if (minute === 0) {
      return new JobScheduleImpl('@hourly');
    }
    return new JobScheduleImpl(`${minute} * * * *`);
  }
  
  /**
   * Create a JobSchedule for daily execution
   */
  static daily(hour: number = 0, minute: number = 0): JobSchedule {
    // Standard cron format or shorthand
    if (hour === 0 && minute === 0) {
      return new JobScheduleImpl('@daily');
    }
    return new JobScheduleImpl(`${minute} ${hour} * * *`);
  }
  
  /**
   * Create a JobSchedule for weekly execution
   */
  static weekly(dayOfWeek: number = 0, hour: number = 0, minute: number = 0): JobSchedule {
    // Standard cron format or shorthand
    if (dayOfWeek === 0 && hour === 0 && minute === 0) {
      return new JobScheduleImpl('@weekly');
    }
    return new JobScheduleImpl(`${minute} ${hour} * * ${dayOfWeek}`);
  }
  
  /**
   * Create a JobSchedule for monthly execution
   */
  static monthly(dayOfMonth: number = 1, hour: number = 0, minute: number = 0): JobSchedule {
    // Standard cron format or shorthand
    if (dayOfMonth === 1 && hour === 0 && minute === 0) {
      return new JobScheduleImpl('@monthly');
    }
    return new JobScheduleImpl(`${minute} ${hour} ${dayOfMonth} * *`);
  }
  
  /**
   * Calculate the next run time based on the cron expression
   */
  private calculateNextRun(): void {
    // This is a simplified implementation
    // In a real-world scenario, you'd use a cron parser library
    
    const now = new Date();
    let nextRun: Date | undefined;
    
    // Handle special expressions
    if (this.expression.startsWith('@once')) {
      const dateStr = this.expression.substring(6).trim();
      nextRun = new Date(dateStr);
    } 
    else if (this.expression === '@hourly') {
      nextRun = new Date(now);
      nextRun.setMinutes(0, 0, 0);
      nextRun.setHours(nextRun.getHours() + 1);
    }
    else if (this.expression === '@daily') {
      nextRun = new Date(now);
      nextRun.setHours(0, 0, 0, 0);
      nextRun.setDate(nextRun.getDate() + 1);
    }
    else if (this.expression === '@weekly') {
      nextRun = new Date(now);
      nextRun.setHours(0, 0, 0, 0);
      // Set to next Monday (1 = Monday in JS getDay, but 0 = Sunday)
      const daysUntilMonday = 7 - now.getDay() || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilMonday);
    }
    else if (this.expression === '@monthly') {
      nextRun = new Date(now);
      nextRun.setHours(0, 0, 0, 0);
      nextRun.setDate(1);
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
    else {
      // For standard cron expressions, we'd need a proper parser
      // This is a placeholder for demo purposes
      nextRun = new Date(now);
      nextRun.setHours(nextRun.getHours() + 1);
    }
    
    this.nextRun = nextRun;
  }
  
  /**
   * Update the job schedule after a run
   */
  updateAfterRun(): void {
    this.lastRun = new Date();
    this.runCount = (this.runCount || 0) + 1;
    this.calculateNextRun();
    
    // If this is a one-time job and it has run, clear the next run
    if (this.expression.startsWith('@once') && this.runCount && this.runCount > 0) {
      this.nextRun = undefined;
    }
  }
}