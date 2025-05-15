import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

import DataSourceManager from './DataSourceManager';
import TransformationManager from './TransformationManager';
import JobManager from './JobManager';

import { 
  DataSource, 
  TransformationRule, 
  ETLJob,
  JobSchedule,
  DataSourceType,
  DatabaseType,
  ApiType,
  AuthType,
  TransformationType,
  JobStatus
} from '../../services/etl/ETLTypes';
import { etlPipelineManager, JobRun } from '../../services/etl/ETLPipelineManager';
import { alertService, Alert as ETLAlert, AlertType, AlertSeverity, AlertState } from '../../services/etl/AlertService';
import { optimizationService, OptimizationSuggestion, SuggestionSeverity, SuggestionCategory } from '../../services/etl/OptimizationService';

import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  InfoIcon, 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  RefreshCw,
  ZapIcon,
  ListChecks,
  Clock,
  CheckCircle2,
  Cpu,
  Database,
  Filter,
  ServerCrash
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ETLDashboardProps {
  // Optional props can be added here
}

const ETLDashboard: React.FC<ETLDashboardProps> = (props) => {
  // State for data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  
  // State for transformations
  const [transformations, setTransformations] = useState<TransformationRule[]>([]);
  
  // State for jobs
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  
  // State for job runs
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  
  // State for running jobs
  const [runningJobs, setRunningJobs] = useState<string[]>([]);
  
  // State for alerts
  const [alerts, setAlerts] = useState<ETLAlert[]>([]);
  
  // State for optimization suggestions
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  
  // State for selected suggestion (for dialog)
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  
  // State for suggestion dialog
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  
  // State for alert dialog
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  // State for selected alert (for dialog)
  const [selectedAlert, setSelectedAlert] = useState<ETLAlert | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedRuns: 0,
    failedRuns: 0,
    scheduledJobs: 0,
    avgDuration: 0,
    successRate: 0,
    totalRecordsProcessed: 0,
    activeAlerts: 0
  });
  
  // Load initial data
  useEffect(() => {
    // In a real implementation, this would load data from API/backend
    // For now, we'll use sample data
    
    // Setup default data sources
    const sampleDataSources: DataSource[] = [
      {
        id: 1,
        name: 'Property Database',
        description: 'PostgreSQL database with property records',
        type: DataSourceType.DATABASE,
        connection: {
          database: {
            type: DatabaseType.POSTGRESQL,
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'password',
            database: 'properties'
          }
        },
        enabled: true,
        extraction: {
          fields: ['id', 'address', 'city', 'state', 'zip', 'price', 'bedrooms', 'bathrooms', 'sqft', 'year_built', 'property_type'],
          filters: { active: true }
        }
      },
      {
        id: 2,
        name: 'Tax Records API',
        description: 'API access to county tax assessor records',
        type: DataSourceType.API,
        connection: {
          api: {
            type: ApiType.REST,
            url: 'https://api.county.gov/tax-records',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        },
        enabled: true,
        extraction: {
          fields: ['parcel_id', 'tax_year', 'assessed_value', 'tax_amount', 'owner_name']
        }
      },
      {
        id: 3,
        name: 'Property Export',
        description: 'Destination for processed property data',
        type: DataSourceType.DATABASE,
        connection: {
          database: {
            type: DatabaseType.POSTGRESQL,
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'password',
            database: 'property_analytics'
          }
        },
        enabled: true,
        extraction: {
          fields: ['property_id', 'street_address', 'listing_price', 'square_feet', 'construction_year']
        }
      }
    ];
    
    // Setup default transformations
    const sampleTransformations: TransformationRule[] = [
      {
        id: 1,
        name: 'Filter Active Properties',
        description: 'Only include active property listings',
        type: TransformationType.FILTER,
        order: 0,
        enabled: true,
        config: {
          conditions: [
            { field: 'status', operator: 'equals', value: 'active' }
          ]
        }
      },
      {
        id: 2,
        name: 'Map Property Fields',
        description: 'Standardize property field names',
        type: TransformationType.MAP,
        order: 1,
        enabled: true,
        config: {
          mappings: [
            { source: 'address', target: 'street_address' },
            { source: 'price', target: 'listing_price' },
            { source: 'sqft', target: 'square_feet' },
            { source: 'year_built', target: 'construction_year' }
          ],
          includeOriginal: false
        }
      },
      {
        id: 3,
        name: 'Validate Required Fields',
        description: 'Ensure all required fields are present',
        type: TransformationType.VALIDATE,
        order: 2,
        enabled: true,
        config: {
          validations: [
            { 
              field: 'street_address', 
              rules: [{ type: 'required', message: 'Property address is required' }] 
            },
            { 
              field: 'listing_price', 
              rules: [
                { type: 'required', message: 'Listing price is required' },
                { type: 'type', expectedType: 'number', message: 'Price must be a number' }
              ] 
            }
          ],
          stopOnFirstError: false,
          logErrors: true
        }
      }
    ];
    
    // Setup default jobs
    const sampleJobs: ETLJob[] = [
      {
        id: 'job-1',
        name: 'Daily Property Import',
        description: 'Import properties from database and enrich with tax data',
        sources: [1, 2],
        transformations: [1, 2, 3],
        destinations: [3],
        schedule: { expression: '0 0 * * *' },
        enabled: true,
        continueOnError: false
      }
    ];
    
    // Setup sample job runs
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const sampleJobRuns: JobRun[] = [
      {
        id: 'run-1',
        jobId: 'job-1',
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 45 * 60 * 1000),
        status: JobStatus.COMPLETED,
        recordsProcessed: 1250,
        recordsLoaded: 1250
      },
      {
        id: 'run-2',
        jobId: 'job-1',
        startTime: oneHourAgo,
        endTime: new Date(oneHourAgo.getTime() + 30 * 60 * 1000),
        status: JobStatus.FAILED,
        recordsProcessed: 1500,
        errors: ['Connection timeout during loading phase']
      }
    ];
    
    // Setup sample alerts
    const sampleAlerts: ETLAlert[] = [
      {
        id: 'alert-1',
        jobId: 'job-1',
        severity: AlertSeverity.ERROR,
        type: AlertType.JOB_FAILURE,
        message: 'Job "Daily Property Import" failed: Connection timeout during loading phase',
        details: {
          runId: 'run-2',
          error: 'Connection timeout during loading phase'
        },
        state: AlertState.ACTIVE,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo,
        notificationSent: true
      }
    ];
    
    // Setup sample suggestions
    const sampleSuggestions: OptimizationSuggestion[] = [
      {
        id: 'suggestion-1',
        jobId: 'job-1',
        title: 'Add validation step',
        description: 'This ETL pipeline does not include a validation step to ensure data quality.',
        severity: SuggestionSeverity.Warning,
        category: SuggestionCategory.DataQuality,
        actionable: true,
        recommendation: 'Add a validation transformation to check for data integrity and completeness.',
        createdAt: yesterday
      }
    ];
    
    // Set the sample data to state
    setDataSources(sampleDataSources);
    setTransformations(sampleTransformations);
    setJobs(sampleJobs);
    setJobRuns(sampleJobRuns);
    setAlerts(sampleAlerts);
    setSuggestions(sampleSuggestions);
    
    // Setup alert service default rules
    alertService.createDefaultRules();
    
    // Calculate metrics
    calculateMetrics(sampleJobs, sampleJobRuns, sampleAlerts);
    
  }, []);
  
  /**
   * Calculate dashboard metrics
   */
  const calculateMetrics = (jobs: ETLJob[], runs: JobRun[], alerts: ETLAlert[]) => {
    const activeJobs = jobs.filter(job => job.enabled).length;
    const scheduledJobs = jobs.filter(job => job.schedule).length;
    const completedRuns = runs.filter(run => run.status === JobStatus.COMPLETED).length;
    const failedRuns = runs.filter(run => run.status === JobStatus.FAILED).length;
    const activeAlerts = alerts.filter(alert => alert.state === AlertState.ACTIVE).length;
    
    // Calculate average duration
    let totalDuration = 0;
    let finishedRuns = 0;
    
    runs.forEach(run => {
      if (run.endTime) {
        const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
        totalDuration += duration;
        finishedRuns++;
      }
    });
    
    const avgDuration = finishedRuns > 0 ? totalDuration / finishedRuns : 0;
    
    // Calculate success rate
    const totalRuns = completedRuns + failedRuns;
    const successRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;
    
    // Calculate total records processed
    const totalRecordsProcessed = runs.reduce((sum, run) => sum + run.recordsProcessed, 0);
    
    setMetrics({
      totalJobs: jobs.length,
      activeJobs,
      completedRuns,
      failedRuns,
      scheduledJobs,
      avgDuration,
      successRate,
      totalRecordsProcessed,
      activeAlerts
    });
  };
  
  // Data Source handlers
  const handleAddDataSource = (dataSource: DataSource) => {
    setDataSources([...dataSources, dataSource]);
  };
  
  const handleUpdateDataSource = (dataSource: DataSource) => {
    setDataSources(dataSources.map(ds => ds.id === dataSource.id ? dataSource : ds));
  };
  
  const handleDeleteDataSource = (id: number) => {
    setDataSources(dataSources.filter(ds => ds.id !== id));
  };
  
  // Transformation handlers
  const handleAddTransformation = (transformation: TransformationRule) => {
    setTransformations([...transformations, transformation]);
  };
  
  const handleUpdateTransformation = (transformation: TransformationRule) => {
    setTransformations(transformations.map(t => t.id === transformation.id ? transformation : t));
  };
  
  const handleDeleteTransformation = (id: number) => {
    setTransformations(transformations.filter(t => t.id !== id));
  };
  
  const handleReorderTransformations = (orderedTransformations: TransformationRule[]) => {
    setTransformations(orderedTransformations);
  };
  
  // Job handlers
  const handleAddJob = (job: ETLJob) => {
    setJobs([...jobs, job]);
    calculateMetrics([...jobs, job], jobRuns, alerts);
  };
  
  const handleUpdateJob = (job: ETLJob) => {
    const updatedJobs = jobs.map(j => j.id === job.id ? job : j);
    setJobs(updatedJobs);
    calculateMetrics(updatedJobs, jobRuns, alerts);
  };
  
  const handleDeleteJob = (id: string) => {
    const filteredJobs = jobs.filter(j => j.id !== id);
    setJobs(filteredJobs);
    calculateMetrics(filteredJobs, jobRuns, alerts);
  };
  
  const handleRunJob = (id: string) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    
    // In a real implementation, this would call etlPipelineManager.executeJob()
    
    // For demo, add the job to running jobs
    setRunningJobs([...runningJobs, id]);
    
    // Simulate job completion after a delay
    setTimeout(() => {
      // Generate a new run ID
      const runId = `run-${Date.now()}`;
      
      // Create a new job run
      const newRun: JobRun = {
        id: runId,
        jobId: id,
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Started 5 minutes ago
        endTime: new Date(),
        status: Math.random() > 0.2 ? JobStatus.COMPLETED : JobStatus.FAILED, // 80% chance of success
        recordsProcessed: Math.floor(Math.random() * 2000) + 500,
        errors: []
      };
      
      // If failed, add an error
      if (newRun.status === JobStatus.FAILED) {
        newRun.errors = ['Simulated error for demonstration purposes'];
        
        // Create an alert
        const newAlert: ETLAlert = {
          id: `alert-${Date.now()}`,
          jobId: id,
          severity: AlertSeverity.ERROR,
          type: AlertType.JOB_FAILURE,
          message: `Job "${job.name}" failed: Simulated error for demonstration purposes`,
          details: {
            runId,
            error: 'Simulated error for demonstration purposes'
          },
          state: AlertState.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          notificationSent: true
        };
        
        setAlerts([...alerts, newAlert]);
      }
      
      // Add records loaded if completed
      if (newRun.status === JobStatus.COMPLETED) {
        newRun.recordsLoaded = newRun.recordsProcessed;
      }
      
      // Update job runs
      const updatedRuns = [...jobRuns, newRun];
      setJobRuns(updatedRuns);
      
      // Remove from running jobs
      setRunningJobs(runningJobs.filter(j => j !== id));
      
      // Recalculate metrics
      calculateMetrics(jobs, updatedRuns, alerts);
    }, 5000); // Simulate 5 second job run
  };
  
  const handleCancelJob = (id: string) => {
    // In a real implementation, this would call etlPipelineManager.cancelJob()
    
    // For demo, remove the job from running jobs
    setRunningJobs(runningJobs.filter(j => j !== id));
    
    // Create a cancelled job run
    const runId = `run-${Date.now()}`;
    const job = jobs.find(j => j.id === id);
    
    if (job) {
      const newRun: JobRun = {
        id: runId,
        jobId: id,
        startTime: new Date(Date.now() - 2 * 60 * 1000), // Started 2 minutes ago
        endTime: new Date(),
        status: JobStatus.CANCELLED,
        recordsProcessed: Math.floor(Math.random() * 100),
        errors: ['Job cancelled by user']
      };
      
      // Update job runs
      const updatedRuns = [...jobRuns, newRun];
      setJobRuns(updatedRuns);
      
      // Recalculate metrics
      calculateMetrics(jobs, updatedRuns, alerts);
    }
  };
  
  const handleScheduleJob = (id: string, schedule: JobSchedule) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === id) {
        return {
          ...job,
          schedule
        };
      }
      return job;
    });
    
    setJobs(updatedJobs);
    calculateMetrics(updatedJobs, jobRuns, alerts);
  };
  
  const handleUnscheduleJob = (id: string) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === id) {
        return {
          ...job,
          schedule: undefined
        };
      }
      return job;
    });
    
    setJobs(updatedJobs);
    calculateMetrics(updatedJobs, jobRuns, alerts);
  };
  
  const handleEnableJob = (id: string) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === id) {
        return {
          ...job,
          enabled: true
        };
      }
      return job;
    });
    
    setJobs(updatedJobs);
    calculateMetrics(updatedJobs, jobRuns, alerts);
  };
  
  const handleDisableJob = (id: string) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === id) {
        return {
          ...job,
          enabled: false
        };
      }
      return job;
    });
    
    setJobs(updatedJobs);
    calculateMetrics(updatedJobs, jobRuns, alerts);
  };
  
  const handleViewJobRuns = (id: string) => {
    // No-op for now, JobManager handles this internally
  };
  
  // Alert handlers
  const handleAcknowledgeAlert = (alertId: string) => {
    const updatedAlerts = alerts.map(alert => {
      if (alert.id === alertId) {
        return {
          ...alert,
          state: AlertState.ACKNOWLEDGED,
          acknowledgedAt: new Date(),
          updatedAt: new Date()
        };
      }
      return alert;
    });
    
    setAlerts(updatedAlerts);
    calculateMetrics(jobs, jobRuns, updatedAlerts);
  };
  
  const handleResolveAlert = (alertId: string) => {
    const updatedAlerts = alerts.map(alert => {
      if (alert.id === alertId) {
        return {
          ...alert,
          state: AlertState.RESOLVED,
          resolvedAt: new Date(),
          updatedAt: new Date()
        };
      }
      return alert;
    });
    
    setAlerts(updatedAlerts);
    calculateMetrics(jobs, jobRuns, updatedAlerts);
  };
  
  // Suggestion handlers
  const handleApplySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;
    
    // Apply the suggestion
    const job = jobs.find(j => j.id === suggestion.jobId);
    if (!job) return;
    
    // Update the job based on the suggestion
    let updatedJob = { ...job };
    
    // For demo purposes, we'll handle a couple of suggestion types
    if (suggestion.title.includes('validation')) {
      // Add validation transformation if not present
      if (!job.transformations.includes(3)) { // ID 3 is our validation transformation
        updatedJob = {
          ...job,
          transformations: [...job.transformations, 3]
        };
      }
    }
    
    handleUpdateJob(updatedJob);
    
    // Mark suggestion as applied
    const updatedSuggestions = suggestions.map(s => {
      if (s.id === suggestionId) {
        return {
          ...s,
          appliedAt: new Date()
        };
      }
      return s;
    });
    
    setSuggestions(updatedSuggestions);
  };
  
  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.filter(s => s.id !== suggestionId));
  };
  
  /**
   * Format duration for display
   */
  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}s`;
    } else if (durationMs < 3600000) {
      return `${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
    } else {
      return `${Math.floor(durationMs / 3600000)}h ${Math.floor((durationMs % 3600000) / 60000)}m`;
    }
  };
  
  /**
   * Get severity color for alerts and suggestions
   */
  const getSeverityColor = (severity: AlertSeverity | SuggestionSeverity): string => {
    switch (severity) {
      case 'info':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  /**
   * Get severity icon for alerts and suggestions
   */
  const getSeverityIcon = (severity: AlertSeverity | SuggestionSeverity) => {
    switch (severity) {
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <InfoIcon className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">Total Jobs</CardTitle>
                </div>
                <Cpu className="w-5 h-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalJobs}</div>
                <p className="text-sm text-gray-500">
                  {metrics.activeJobs} active, {metrics.scheduledJobs} scheduled
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">Success Rate</CardTitle>
                </div>
                <CheckCircle2 className="w-5 h-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                <div className="mt-2">
                  <Progress value={metrics.successRate} className="h-1" />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {metrics.completedRuns} completed, {metrics.failedRuns} failed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">Avg. Duration</CardTitle>
                </div>
                <Clock className="w-5 h-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(metrics.avgDuration)}</div>
                <p className="text-sm text-gray-500">
                  For {metrics.completedRuns + metrics.failedRuns} total runs
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">Records Processed</CardTitle>
                </div>
                <Database className="w-5 h-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalRecordsProcessed.toLocaleString()}</div>
                <p className="text-sm text-gray-500">
                  Across all ETL jobs and runs
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  {metrics.activeAlerts > 0 
                    ? `${metrics.activeAlerts} active alerts require attention`
                    : 'No active alerts at this time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No alerts to display.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts
                      .filter(alert => alert.state === AlertState.ACTIVE)
                      .slice(0, 5)
                      .map(alert => (
                        <Alert key={alert.id} variant="outline" className="cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setIsAlertDialogOpen(true);
                          }}
                        >
                          <div className="flex items-start">
                            {getSeverityIcon(alert.severity)}
                            <div className="ml-3">
                              <AlertTitle className={getSeverityColor(alert.severity)}>
                                {alert.type} {' '}
                                <span className="text-xs text-gray-500">
                                  {new Date(alert.createdAt).toLocaleString()}
                                </span>
                              </AlertTitle>
                              <AlertDescription className="mt-1">
                                {alert.message}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      ))}
                  </div>
                )}
              </CardContent>
              {alerts.filter(alert => alert.state === AlertState.ACTIVE).length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('jobs')}>
                    View All Alerts
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
                <CardDescription>
                  Recommendations to improve your ETL processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suggestions.filter(s => !s.appliedAt).length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No active suggestions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions
                      .filter(s => !s.appliedAt)
                      .map(suggestion => (
                        <div 
                          key={suggestion.id} 
                          className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setSelectedSuggestion(suggestion);
                            setIsSuggestionDialogOpen(true);
                          }}
                        >
                          <div className="flex items-start">
                            {getSeverityIcon(suggestion.severity)}
                            <div className="ml-3">
                              <h4 className={`text-sm font-medium ${getSeverityColor(suggestion.severity)}`}>
                                {suggestion.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {suggestion.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Jobs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Job Activity</CardTitle>
              <CardDescription>
                Latest ETL job executions and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobRuns.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No job runs to display.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...jobRuns]
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5)
                    .map(run => {
                      const job = jobs.find(j => j.id === run.jobId);
                      
                      return (
                        <div key={run.id} className="p-3 border rounded-md flex items-center justify-between">
                          <div className="flex items-center">
                            {run.status === JobStatus.COMPLETED ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            ) : run.status === JobStatus.FAILED ? (
                              <XCircle className="w-5 h-5 text-red-500 mr-3" />
                            ) : run.status === JobStatus.RUNNING ? (
                              <RefreshCw className="w-5 h-5 text-blue-500 mr-3 animate-spin" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
                            )}
                            <div>
                              <p className="font-medium">{job?.name || `Job ${run.jobId}`}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(run.startTime).toLocaleString()} • 
                                {run.status === JobStatus.RUNNING ? ' In progress' : ` ${formatDuration(new Date(run.endTime!).getTime() - new Date(run.startTime).getTime())}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              {run.recordsProcessed} records
                              {run.recordsLoaded && ` (${run.recordsLoaded} loaded)`}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={
                                run.status === JobStatus.COMPLETED ? 'bg-green-50 text-green-700' :
                                run.status === JobStatus.FAILED ? 'bg-red-50 text-red-700' :
                                run.status === JobStatus.RUNNING ? 'bg-blue-50 text-blue-700' :
                                'bg-yellow-50 text-yellow-700'
                              }
                            >
                              {run.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
            {jobRuns.length > 0 && (
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('jobs')}>
                  View All Job Runs
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Data Sources Tab */}
        <TabsContent value="sources" className="mt-6">
          <DataSourceManager
            dataSources={dataSources}
            onAddDataSource={handleAddDataSource}
            onUpdateDataSource={handleUpdateDataSource}
            onDeleteDataSource={handleDeleteDataSource}
          />
        </TabsContent>
        
        {/* Transformations Tab */}
        <TabsContent value="transformations" className="mt-6">
          <TransformationManager
            transformations={transformations}
            onAddTransformation={handleAddTransformation}
            onUpdateTransformation={handleUpdateTransformation}
            onDeleteTransformation={handleDeleteTransformation}
            onReorderTransformations={handleReorderTransformations}
          />
        </TabsContent>
        
        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-6">
          <JobManager
            jobs={jobs}
            jobRuns={jobRuns}
            dataSources={dataSources}
            transformations={transformations}
            runningJobs={runningJobs}
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onRunJob={handleRunJob}
            onCancelJob={handleCancelJob}
            onScheduleJob={handleScheduleJob}
            onUnscheduleJob={handleUnscheduleJob}
            onEnableJob={handleEnableJob}
            onDisableJob={handleDisableJob}
            onViewJobRuns={handleViewJobRuns}
          />
        </TabsContent>
      </Tabs>
      
      {/* Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={`flex items-center ${selectedAlert ? getSeverityColor(selectedAlert.severity) : ''}`}>
              {selectedAlert && (
                <>
                  {getSeverityIcon(selectedAlert.severity)}
                  <span className="ml-2">{selectedAlert.type} Alert</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAlert?.message}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="grid gap-4 py-4">
              <div>
                <h4 className="text-sm font-medium">Job</h4>
                <p className="text-sm text-gray-500">
                  {jobs.find(j => j.id === selectedAlert.jobId)?.name || selectedAlert.jobId}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Time</h4>
                <p className="text-sm text-gray-500">
                  {new Date(selectedAlert.createdAt).toLocaleString()}
                </p>
              </div>
              
              {selectedAlert.details && (
                <div>
                  <h4 className="text-sm font-medium">Details</h4>
                  <p className="text-sm text-gray-500">
                    {typeof selectedAlert.details === 'object' ? 
                      Object.entries(selectedAlert.details).map(([key, value]) => 
                        <div key={key}>{key}: {String(value)}</div>
                      ) : 
                      String(selectedAlert.details)
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedAlert) {
                  handleAcknowledgeAlert(selectedAlert.id);
                }
                setIsAlertDialogOpen(false);
              }}
            >
              Acknowledge
            </Button>
            <Button 
              onClick={() => {
                if (selectedAlert) {
                  handleResolveAlert(selectedAlert.id);
                }
                setIsAlertDialogOpen(false);
              }}
            >
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Suggestion Dialog */}
      <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={`flex items-center ${selectedSuggestion ? getSeverityColor(selectedSuggestion.severity) : ''}`}>
              {selectedSuggestion && (
                <>
                  {getSeverityIcon(selectedSuggestion.severity)}
                  <span className="ml-2">{selectedSuggestion.title}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedSuggestion?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSuggestion && (
            <div className="grid gap-4 py-4">
              <div>
                <h4 className="text-sm font-medium">Recommendation</h4>
                <p className="text-sm text-gray-500">
                  {selectedSuggestion.recommendation}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Job</h4>
                <p className="text-sm text-gray-500">
                  {jobs.find(j => j.id === selectedSuggestion.jobId)?.name || selectedSuggestion.jobId}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Category</h4>
                <p className="text-sm text-gray-500">
                  {selectedSuggestion.category}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedSuggestion) {
                  handleDismissSuggestion(selectedSuggestion.id);
                }
                setIsSuggestionDialogOpen(false);
              }}
            >
              Dismiss
            </Button>
            {selectedSuggestion?.actionable && (
              <Button 
                onClick={() => {
                  if (selectedSuggestion) {
                    handleApplySuggestion(selectedSuggestion.id);
                  }
                  setIsSuggestionDialogOpen(false);
                }}
              >
                Apply Suggestion
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ETLDashboard;