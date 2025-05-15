/**
 * ETL Optimization Pipeline Tests
 * 
 * This file contains tests for the ETL Optimization Pipeline, including metrics collection,
 * data source connections, pipeline management, and other key components.
 */

import { metricsCollector, ETLJobMetrics } from '../services/etl/MetricsCollector';
import { dataConnector } from '../services/etl/DataConnector';
import { etlPipelineManager } from '../services/etl/ETLPipelineManager';
import { DataSourceType, TransformationRule } from '../services/etl/ETLTypes';

// Mock performance for browser environment
global.performance = {
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 30000000
  }
} as any;

describe('ETL Metrics Collector', () => {
  // Reset metrics before each test
  beforeEach(() => {
    // Reset active jobs and metrics (leveraging the fact that we have access to the internals)
    (metricsCollector as any).activeJobMetrics = new Map();
    (metricsCollector as any).historicalMetrics = [];
  });
  
  test('should start collecting metrics for a job', () => {
    // Start metrics collection
    metricsCollector.startJobMetrics('test-job-1', 'Test Job');
    
    // Get the metrics
    const metrics = metricsCollector.getJobMetrics('test-job-1');
    
    // Verify metrics were created
    expect(metrics).not.toBeNull();
    expect(metrics?.jobId).toBe('test-job-1');
    expect(metrics?.startTime).toBeInstanceOf(Date);
    expect(metrics?.endTime).toBeNull();
    expect(metrics?.executionTime).toBeGreaterThanOrEqual(0);
    expect(metrics?.taskMetrics).toHaveLength(0);
  });
  
  test('should track task metrics within a job', () => {
    // Start metrics collection
    metricsCollector.startJobMetrics('test-job-2', 'Test Job');
    
    // Start a task
    metricsCollector.startTaskMetrics('test-job-2', 'task-1', 'Extract Data');
    
    // Update record count
    metricsCollector.updateRecordCount('test-job-2', 100, 'task-1');
    
    // Complete the task
    metricsCollector.completeTaskMetrics('test-job-2', 'task-1');
    
    // Get the metrics
    const metrics = metricsCollector.getJobMetrics('test-job-2');
    
    // Verify task metrics
    expect(metrics).not.toBeNull();
    expect(metrics?.taskMetrics).toHaveLength(1);
    
    const taskMetric = metrics?.taskMetrics[0];
    expect(taskMetric?.taskId).toBe('task-1');
    expect(taskMetric?.taskName).toBe('Extract Data');
    expect(taskMetric?.recordsProcessed).toBe(100);
    expect(taskMetric?.endTime).toBeInstanceOf(Date);
  });
  
  test('should complete job metrics collection', () => {
    // Start metrics collection
    metricsCollector.startJobMetrics('test-job-3', 'Test Job');
    
    // Start and complete a task
    metricsCollector.startTaskMetrics('test-job-3', 'task-1', 'Extract Data');
    metricsCollector.updateRecordCount('test-job-3', 100, 'task-1');
    metricsCollector.completeTaskMetrics('test-job-3', 'task-1');
    
    // Complete the job
    const completedMetrics = metricsCollector.completeJobMetrics('test-job-3');
    
    // Verify completed metrics
    expect(completedMetrics).not.toBeNull();
    expect(completedMetrics?.endTime).toBeInstanceOf(Date);
    expect(completedMetrics?.executionTime).toBeGreaterThan(0);
    
    // Check that the job is moved to historical metrics
    const activeMetrics = metricsCollector.getJobMetrics('test-job-3');
    const historicalMetrics = metricsCollector.getHistoricalJobMetrics();
    
    expect(activeMetrics).not.toBeNull(); // getJobMetrics returns both active and historical
    expect(historicalMetrics).toHaveLength(1);
    expect(historicalMetrics[0].jobId).toBe('test-job-3');
  });
});

describe('Data Connector', () => {
  // Reset data sources before each test
  beforeEach(() => {
    // Reset data sources (leveraging the fact that we have access to the internals)
    (dataConnector as any).dataSources = new Map();
    (dataConnector as any).activeConnections = new Map();
  });
  
  test('should register and retrieve data sources', () => {
    // Register a database source
    const dbSource = dataConnector.registerDataSource({
      name: 'Test Database',
      description: 'Test database connection',
      type: 'database' as DataSourceType,
      connectionDetails: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false
      }
    });
    
    // Register an API source
    const apiSource = dataConnector.registerDataSource({
      name: 'Test API',
      description: 'Test API connection',
      type: 'api' as DataSourceType,
      connectionDetails: {
        baseUrl: 'https://api.example.com',
        authType: 'none'
      }
    });
    
    // Get all sources
    const allSources = dataConnector.getAllDataSources();
    
    // Verify sources were registered
    expect(allSources).toHaveLength(2);
    
    // Verify we can get sources by ID
    const retrievedDbSource = dataConnector.getDataSource(dbSource.id);
    const retrievedApiSource = dataConnector.getDataSource(apiSource.id);
    
    expect(retrievedDbSource).toEqual(dbSource);
    expect(retrievedApiSource).toEqual(apiSource);
  });
  
  test('should update and delete data sources', () => {
    // Register a source
    const source = dataConnector.registerDataSource({
      name: 'Original Name',
      description: 'Original description',
      type: 'database' as DataSourceType,
      connectionDetails: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false
      }
    });
    
    // Update the source
    const updatedSource = dataConnector.updateDataSource(source.id, {
      name: 'Updated Name',
      description: 'Updated description'
    });
    
    // Verify update
    expect(updatedSource?.name).toBe('Updated Name');
    expect(updatedSource?.description).toBe('Updated description');
    
    // Delete the source
    const deleted = dataConnector.deleteDataSource(source.id);
    
    // Verify deletion
    expect(deleted).toBe(true);
    expect(dataConnector.getDataSource(source.id)).toBeUndefined();
  });
});

describe('ETL Pipeline Manager', () => {
  // Reset jobs before each test
  beforeEach(() => {
    // Reset jobs (leveraging the fact that we have access to the internals)
    (etlPipelineManager as any).jobs = new Map();
    (etlPipelineManager as any).activePipelines = new Map();
    (etlPipelineManager as any).executionLogs = [];
  });
  
  test('should create and retrieve jobs', () => {
    // Create a job
    const job = etlPipelineManager.createJob({
      name: 'Test ETL Job',
      description: 'Test ETL job description',
      sourceId: 'source-1',
      targetId: 'target-1',
      transformationRules: []
    });
    
    // Verify job was created
    expect(job.id).toBeDefined();
    expect(job.name).toBe('Test ETL Job');
    expect(job.status).toBe('created');
    
    // Get the job
    const retrievedJob = etlPipelineManager.getJob(job.id);
    
    // Verify job retrieval
    expect(retrievedJob).toEqual(job);
    
    // Get all jobs
    const allJobs = etlPipelineManager.getAllJobs();
    
    // Verify all jobs
    expect(allJobs).toHaveLength(1);
    expect(allJobs[0]).toEqual(job);
  });
  
  test('should update and delete jobs', () => {
    // Create a job
    const job = etlPipelineManager.createJob({
      name: 'Original Job',
      description: 'Original description',
      sourceId: 'source-1',
      targetId: 'target-1',
      transformationRules: []
    });
    
    // Update the job
    const updatedJob = etlPipelineManager.updateJob(job.id, {
      name: 'Updated Job',
      description: 'Updated description'
    });
    
    // Verify update
    expect(updatedJob?.name).toBe('Updated Job');
    expect(updatedJob?.description).toBe('Updated description');
    
    // Delete the job
    const deleted = etlPipelineManager.deleteJob(job.id);
    
    // Verify deletion
    expect(deleted).toBe(true);
    expect(etlPipelineManager.getJob(job.id)).toBeUndefined();
  });
  
  test('should execute a job and generate execution logs', async () => {
    // Create a job
    const job = etlPipelineManager.createJob({
      name: 'Test Execution Job',
      description: 'Job for execution testing',
      sourceId: 'source-1',
      targetId: 'target-1',
      transformationRules: []
    });
    
    // Execute the job
    const executionLog = await etlPipelineManager.executeJob(job.id);
    
    // Verify execution
    expect(executionLog).toBeDefined();
    expect(executionLog?.jobId).toBe(job.id);
    expect(executionLog?.startTime).toBeInstanceOf(Date);
    expect(executionLog?.endTime).toBeInstanceOf(Date);
    expect(executionLog?.status).toBe('success');
    
    // Get job execution logs
    const jobLogs = etlPipelineManager.getJobExecutionLogs(job.id);
    
    // Verify logs
    expect(jobLogs).toHaveLength(1);
    expect(jobLogs[0].jobId).toBe(job.id);
    
    // Verify job status was updated
    const updatedJob = etlPipelineManager.getJob(job.id);
    expect(updatedJob?.status).toBe('completed');
  });
});

// Integration tests
describe('ETL Optimization Pipeline Integration', () => {
  beforeEach(() => {
    // Reset components
    (metricsCollector as any).activeJobMetrics = new Map();
    (metricsCollector as any).historicalMetrics = [];
    (dataConnector as any).dataSources = new Map();
    (dataConnector as any).activeConnections = new Map();
    (etlPipelineManager as any).jobs = new Map();
    (etlPipelineManager as any).activePipelines = new Map();
    (etlPipelineManager as any).executionLogs = [];
  });
  
  test('complete ETL pipeline from data source to job execution with metrics', async () => {
    // 1. Register a data source
    const source = dataConnector.registerDataSource({
      name: 'Test Source',
      type: 'database' as DataSourceType,
      connectionDetails: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false
      }
    });
    
    const target = dataConnector.registerDataSource({
      name: 'Test Target',
      type: 'database' as DataSourceType,
      connectionDetails: {
        host: 'localhost',
        port: 5432,
        database: 'target_db',
        username: 'target_user',
        password: 'target_password',
        ssl: false
      }
    });
    
    // 2. Create transformation rules
    const rules: TransformationRule[] = [
      {
        id: 'rule-1',
        name: 'Uppercase Names',
        description: 'Convert names to uppercase',
        dataType: 'text',
        transformationCode: 'UPPER(name)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // 3. Create an ETL job
    const job = etlPipelineManager.createJob({
      name: 'Integration Test Job',
      description: 'Job for integration testing',
      sourceId: source.id,
      targetId: target.id,
      transformationRules: rules
    });
    
    // 4. Execute the job
    const executionLog = await etlPipelineManager.executeJob(job.id);
    
    // 5. Verify execution was successful
    expect(executionLog?.status).toBe('success');
    
    // 6. Verify metrics were collected
    const metrics = metricsCollector.getJobMetrics(job.id);
    
    expect(metrics).not.toBeNull();
    expect(metrics?.recordsProcessed).toBeGreaterThan(0);
    expect(metrics?.taskMetrics.length).toBeGreaterThan(0);
    
    // 7. Verify task metrics for extract, transform, and load
    const extractTask = metrics?.taskMetrics.find(task => task.taskName === 'Extract Data');
    const transformTask = metrics?.taskMetrics.find(task => task.taskName === 'Transform Data');
    const loadTask = metrics?.taskMetrics.find(task => task.taskName === 'Load Data');
    
    expect(extractTask).toBeDefined();
    expect(transformTask).toBeDefined();
    expect(loadTask).toBeDefined();
    
    expect(extractTask?.endTime).not.toBeNull();
    expect(transformTask?.endTime).not.toBeNull();
    expect(loadTask?.endTime).not.toBeNull();
  });
});