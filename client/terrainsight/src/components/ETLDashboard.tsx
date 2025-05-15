import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/custom-tooltip";

import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  Clock, 
  Database,
  Download, 
  File, 
  FileText, 
  Filter, 
  HelpCircle, 
  Info, 
  ListFilter, 
  MoreVertical, 
  Play, 
  Plus, 
  RefreshCw, 
  Search, 
  Settings, 
  Trash2, 
  XCircle 
} from 'lucide-react';

import { 
  JobStatus, 
  DataSourceType, 
  TransformationType,
  FilterLogic,
  initializeETL 
} from '../services/etl';

import type { 
  ETLJob, 
  DataSource, 
  TransformationRule, 
  JobRun, 
  Alert as AlertModel, 
  SystemStatus 
} from '../services/etl';

// Use direct imports to avoid circular dependencies
import { etlPipelineManager as etlManager } from '../services/etl/ETLPipelineManager';
import { alertService as alertSvc, AlertSeverity } from '../services/etl/AlertService';

/**
 * Status badge component
 */
const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  switch (status) {
    case JobStatus.IDLE:
      return <Badge variant="outline" className="bg-gray-100">Idle</Badge>;
    case JobStatus.RUNNING:
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Running</Badge>;
    case JobStatus.SUCCEEDED:
      return <Badge variant="outline" className="bg-green-100 text-green-800">Succeeded</Badge>;
    case JobStatus.FAILED:
      return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

/**
 * Data source type badge component
 */
const DataSourceTypeBadge: React.FC<{ type: DataSourceType }> = ({ type }) => {
  switch (type) {
    case DataSourceType.POSTGRESQL:
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">PostgreSQL</Badge>;
    case DataSourceType.MYSQL:
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">MySQL</Badge>;
    case DataSourceType.SQL_SERVER:
      return <Badge variant="outline" className="bg-red-100 text-red-800">SQL Server</Badge>;
    case DataSourceType.ODBC:
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">ODBC</Badge>;
    case DataSourceType.REST_API:
      return <Badge variant="outline" className="bg-purple-100 text-purple-800">REST API</Badge>;
    case DataSourceType.FILE_CSV:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">CSV File</Badge>;
    case DataSourceType.FILE_JSON:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">JSON File</Badge>;
    case DataSourceType.MEMORY:
      return <Badge variant="outline" className="bg-gray-100">In-Memory</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

/**
 * Transformation type badge component
 */
const TransformationTypeBadge: React.FC<{ type: TransformationType }> = ({ type }) => {
  switch (type) {
    case TransformationType.FILTER:
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Filter</Badge>;
    case TransformationType.MAP:
      return <Badge variant="outline" className="bg-green-100 text-green-800">Map</Badge>;
    case TransformationType.JOIN:
      return <Badge variant="outline" className="bg-purple-100 text-purple-800">Join</Badge>;
    case TransformationType.AGGREGATE:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Aggregate</Badge>;
    case TransformationType.VALIDATE:
      return <Badge variant="outline" className="bg-red-100 text-red-800">Validate</Badge>;
    case TransformationType.ENRICH:
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Enrich</Badge>;
    case TransformationType.CUSTOM:
      return <Badge variant="outline" className="bg-gray-100">Custom</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

/**
 * Alert severity icon component
 */
const AlertTypeIcon: React.FC<{ type: AlertSeverity }> = ({ type }) => {
  switch (type) {
    case AlertSeverity.INFO:
      return <Info className="h-4 w-4 text-blue-500" />;
    case AlertSeverity.SUCCESS:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case AlertSeverity.WARNING:
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case AlertSeverity.ERROR:
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

/**
 * ETL Dashboard component
 */
const ETLDashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([]);
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  const [alerts, setAlerts] = useState<AlertModel[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<number | null>(null);
  const [selectedTransformationRuleId, setSelectedTransformationRuleId] = useState<number | null>(null);
  
  // Job dialog state
  const [jobDialogOpen, setJobDialogOpen] = useState<boolean>(false);
  const [newJob, setNewJob] = useState<Partial<ETLJob>>({
    name: '',
    sources: [],
    destinations: [],
    transformations: [],
    enabled: true,
    description: ''
  });
  
  // Data source dialog state
  const [dataSourceDialogOpen, setDataSourceDialogOpen] = useState<boolean>(false);
  const [newDataSource, setNewDataSource] = useState<Partial<DataSource>>({
    name: '',
    type: DataSourceType.POSTGRESQL,
    config: {},
    enabled: true,
    description: ''
  });
  
  // Transformation rule dialog state
  const [transformationRuleDialogOpen, setTransformationRuleDialogOpen] = useState<boolean>(false);
  const [newTransformationRule, setNewTransformationRule] = useState<Partial<TransformationRule>>({
    name: '',
    type: TransformationType.FILTER,
    config: {
      conditions: [],
      logic: FilterLogic.AND
    },
    order: 1,
    enabled: true,
    description: ''
  });
  
  // Initialize ETL system on mount
  useEffect(() => {
    initializeETL();
  }, []);
  
  // Fetch data on mount and when refresh counter changes
  useEffect(() => {
    setJobs(etlManager.getAllJobs());
    setDataSources(etlManager.getAllDataSources());
    setTransformationRules(etlManager.getAllTransformationRules());
    setJobRuns(etlManager.getAllJobRuns());
    setAlerts(alertSvc.getAlerts());
    setSystemStatus(etlManager.getSystemStatus());
  }, [refreshCounter]);
  
  // Set up alert listener
  useEffect(() => {
    const handleAlertCreated = () => {
      setAlerts(alertSvc.getAlerts());
    };
    
    const unsubscribe = alertSvc.registerListener(handleAlertCreated);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Refresh data
  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
  };
  
  // Run a job
  const runJob = async (jobId: number) => {
    try {
      await etlManager.runJob(jobId);
      refreshData();
    } catch (error) {
      console.error('Error running job:', error);
    }
  };
  
  // Enable/disable a job
  const toggleJobEnabled = (jobId: number, enabled: boolean) => {
    if (enabled) {
      etlManager.enableJob(jobId);
    } else {
      etlManager.disableJob(jobId);
    }
    refreshData();
  };
  
  // Enable/disable a data source
  const toggleDataSourceEnabled = (dataSourceId: number, enabled: boolean) => {
    if (enabled) {
      etlManager.enableDataSource(dataSourceId);
    } else {
      etlManager.disableDataSource(dataSourceId);
    }
    refreshData();
  };
  
  // Enable/disable a transformation rule
  const toggleTransformationRuleEnabled = (transformationRuleId: number, enabled: boolean) => {
    if (enabled) {
      etlManager.enableTransformationRule(transformationRuleId);
    } else {
      etlManager.disableTransformationRule(transformationRuleId);
    }
    refreshData();
  };
  
  // Delete a job
  const deleteJob = (jobId: number) => {
    etlManager.deleteJob(jobId);
    refreshData();
  };
  
  // Delete a data source
  const deleteDataSource = (dataSourceId: number) => {
    etlManager.deleteDataSource(dataSourceId);
    refreshData();
  };
  
  // Delete a transformation rule
  const deleteTransformationRule = (transformationRuleId: number) => {
    etlManager.deleteTransformationRule(transformationRuleId);
    refreshData();
  };
  
  // Create a job
  const createJob = () => {
    if (newJob.name && newJob.sources && newJob.destinations) {
      etlManager.createJob({
        name: newJob.name,
        sources: newJob.sources,
        destinations: newJob.destinations,
        transformations: newJob.transformations || [],
        enabled: newJob.enabled || false,
        description: newJob.description
      });
      setJobDialogOpen(false);
      setNewJob({
        name: '',
        sources: [],
        destinations: [],
        transformations: [],
        enabled: true,
        description: ''
      });
      refreshData();
    }
  };
  
  // Create a data source
  const createDataSource = () => {
    if (newDataSource.name && newDataSource.type) {
      etlManager.createDataSource({
        name: newDataSource.name,
        type: newDataSource.type,
        config: newDataSource.config || {},
        enabled: newDataSource.enabled || false,
        description: newDataSource.description
      });
      setDataSourceDialogOpen(false);
      setNewDataSource({
        name: '',
        type: DataSourceType.POSTGRESQL,
        config: {},
        enabled: true,
        description: ''
      });
      refreshData();
    }
  };
  
  // Create a transformation rule
  const createTransformationRule = () => {
    if (newTransformationRule.name && newTransformationRule.type) {
      etlManager.createTransformationRule({
        name: newTransformationRule.name,
        type: newTransformationRule.type,
        config: newTransformationRule.config || {
          conditions: [],
          logic: FilterLogic.AND
        },
        order: newTransformationRule.order || 1,
        enabled: newTransformationRule.enabled || false,
        description: newTransformationRule.description
      });
      setTransformationRuleDialogOpen(false);
      setNewTransformationRule({
        name: '',
        type: TransformationType.FILTER,
        config: {
          conditions: [],
          logic: FilterLogic.AND
        },
        order: 1,
        enabled: true,
        description: ''
      });
      refreshData();
    }
  };
  
  // Format date
  const formatDate = (date: Date | undefined): string => {
    if (!date) {
      return 'N/A';
    }
    
    return new Date(date).toLocaleString();
  };
  
  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  };
  
  // Render dashboard tab
  const renderDashboardTab = () => {
    if (!systemStatus) {
      return (
        <div className="flex items-center justify-center h-64">
          <p>Loading system status...</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Jobs:</span>
                <span>{systemStatus.jobCount} ({systemStatus.enabledJobCount} enabled)</span>
              </div>
              <div className="flex justify-between">
                <span>Data Sources:</span>
                <span>{systemStatus.dataSourceCount} ({systemStatus.enabledDataSourceCount} enabled)</span>
              </div>
              <div className="flex justify-between">
                <span>Transformation Rules:</span>
                <span>{systemStatus.transformationRuleCount} ({systemStatus.enabledTransformationRuleCount} enabled)</span>
              </div>
              <div className="flex justify-between">
                <span>Running Jobs:</span>
                <span>{systemStatus.runningJobCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Job status */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                  Idle
                </span>
                <span>{systemStatus.schedulerStatus[JobStatus.IDLE]}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  Running
                </span>
                <span>{systemStatus.schedulerStatus[JobStatus.RUNNING]}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Succeeded
                </span>
                <span>{systemStatus.schedulerStatus[JobStatus.SUCCEEDED]}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Failed
                </span>
                <span>{systemStatus.schedulerStatus[JobStatus.FAILED]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent job runs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Runs:</span>
                <span>{systemStatus.recentJobRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Successful
                </span>
                <span>{systemStatus.successJobRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Failed
                </span>
                <span>{systemStatus.failedJobRuns}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Record counts */}
        <Card>
          <CardHeader>
            <CardTitle>Record Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Extracted:</span>
                  <span>{systemStatus.recordCounts?.extracted || 0}</span>
                </div>
                <Progress value={(systemStatus.recordCounts?.extracted || 0) / Math.max(1, (systemStatus.recordCounts?.extracted || 0) + (systemStatus.recordCounts?.rejected || 0)) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Transformed:</span>
                  <span>{systemStatus.recordCounts?.transformed || 0}</span>
                </div>
                <Progress value={(systemStatus.recordCounts?.transformed || 0) / Math.max(1, (systemStatus.recordCounts?.extracted || 0)) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Loaded:</span>
                  <span>{systemStatus.recordCounts?.loaded || 0}</span>
                </div>
                <Progress value={(systemStatus.recordCounts?.loaded || 0) / Math.max(1, (systemStatus.recordCounts?.transformed || 0)) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Rejected:</span>
                  <span>{systemStatus.recordCounts?.rejected || 0}</span>
                </div>
                <Progress value={((systemStatus.recordCounts?.rejected || 0) / Math.max(1, (systemStatus.recordCounts?.extracted || 0) + (systemStatus.recordCounts?.rejected || 0))) * 100} className="bg-red-100" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent alerts */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.slice(0, 5).map(alert => (
                <Alert key={alert.id} variant={
                  alert.severity === AlertSeverity.ERROR ? "destructive" :
                  alert.severity === AlertSeverity.WARNING ? "default" :
                  alert.severity === AlertSeverity.SUCCESS ? "default" :
                  "default"
                }>
                  <div className="flex items-start">
                    <AlertTypeIcon type={alert.severity} />
                    <div className="ml-2">
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No recent alerts
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('alerts')}>
              View All Alerts
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Render jobs tab
  const renderJobsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">ETL Jobs</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                  <DialogDescription>
                    Create a new ETL job to process data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-name">Job Name</Label>
                    <Input
                      id="job-name"
                      value={newJob.name}
                      onChange={e => setNewJob({ ...newJob, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-description">Description</Label>
                    <Input
                      id="job-description"
                      value={newJob.description}
                      onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-sources">Sources</Label>
                    <p className="text-sm text-gray-500">Select data sources</p>
                    <div className="grid grid-cols-2 gap-2">
                      {dataSources
                        .filter(source => !source.config.options?.target)
                        .map(source => (
                          <div key={source.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`source-${source.id}`}
                              checked={newJob.sources?.includes(source.id) || false}
                              onChange={e => {
                                if (e.target.checked) {
                                  setNewJob({
                                    ...newJob,
                                    sources: [...(newJob.sources || []), source.id]
                                  });
                                } else {
                                  setNewJob({
                                    ...newJob,
                                    sources: (newJob.sources || []).filter(id => id !== source.id)
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`source-${source.id}`} className="text-sm">
                              {source.name}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-destinations">Destinations</Label>
                    <p className="text-sm text-gray-500">Select data destinations</p>
                    <div className="grid grid-cols-2 gap-2">
                      {dataSources
                        .filter(source => source.config.options?.target)
                        .map(source => (
                          <div key={source.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`destination-${source.id}`}
                              checked={newJob.destinations?.includes(source.id) || false}
                              onChange={e => {
                                if (e.target.checked) {
                                  setNewJob({
                                    ...newJob,
                                    destinations: [...(newJob.destinations || []), source.id]
                                  });
                                } else {
                                  setNewJob({
                                    ...newJob,
                                    destinations: (newJob.destinations || []).filter(id => id !== source.id)
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`destination-${source.id}`} className="text-sm">
                              {source.name}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-transformations">Transformations</Label>
                    <p className="text-sm text-gray-500">Select transformation rules</p>
                    <div className="grid grid-cols-2 gap-2">
                      {transformationRules.map(rule => (
                        <div key={rule.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`transformation-${rule.id}`}
                            checked={newJob.transformations?.includes(rule.id) || false}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewJob({
                                  ...newJob,
                                  transformations: [...(newJob.transformations || []), rule.id]
                                });
                              } else {
                                setNewJob({
                                  ...newJob,
                                  transformations: (newJob.transformations || []).filter(id => id !== rule.id)
                                });
                              }
                            }}
                          />
                          <label htmlFor={`transformation-${rule.id}`} className="text-sm">
                            {rule.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="job-enabled"
                      checked={newJob.enabled || false}
                      onChange={e => setNewJob({ ...newJob, enabled: e.target.checked })}
                    />
                    <Label htmlFor="job-enabled">Enabled</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJobDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createJob}>Create Job</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Destinations</TableHead>
                <TableHead>Transformations</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell>{job.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{job.name}</div>
                    {job.description && (
                      <div className="text-sm text-gray-500">{job.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>{job.sources.length}</TableCell>
                  <TableCell>{job.destinations.length}</TableCell>
                  <TableCell>{job.transformations.length}</TableCell>
                  <TableCell>
                    <Badge variant={job.enabled ? "default" : "outline"}>
                      {job.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Tooltip content="Run Job">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => runJob(job.id)}
                          disabled={job.status === JobStatus.RUNNING || !job.enabled}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleJobEnabled(job.id, !job.enabled)}>
                            {job.enabled ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteJob(job.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No jobs found
            </div>
          )}
        </div>
        
        {/* Job Runs */}
        <h3 className="text-lg font-semibold mt-8">Recent Job Runs</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobRuns.map(run => {
                const job = jobs.find(j => j.id === run.jobId);
                return (
                  <TableRow key={run.id}>
                    <TableCell>{run.id}</TableCell>
                    <TableCell>
                      {job?.name || `Job #${run.jobId}`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} />
                    </TableCell>
                    <TableCell>{formatDate(run.startTime)}</TableCell>
                    <TableCell>{formatDuration(run.executionTime)}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>Extracted: {run.recordCounts?.extracted || 0}</div>
                        <div>Transformed: {run.recordCounts?.transformed || 0}</div>
                        <div>Loaded: {run.recordCounts?.loaded || 0}</div>
                        <div>Rejected: {run.recordCounts?.rejected || 0}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {jobRuns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No job runs found
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render data sources tab
  const renderDataSourcesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Data Sources</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/database-connection">
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Direct Database
              </Button>
            </Link>
            <Link href="/ftp-data-migration">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                FTP Migration
              </Button>
            </Link>
            <Dialog open={dataSourceDialogOpen} onOpenChange={setDataSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Data Source</DialogTitle>
                  <DialogDescription>
                    Create a new data source for ETL jobs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="source-name">Name</Label>
                    <Input
                      id="source-name"
                      value={newDataSource.name}
                      onChange={e => setNewDataSource({ ...newDataSource, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source-type">Type</Label>
                    <select
                      id="source-type"
                      className="w-full p-2 border rounded"
                      value={newDataSource.type}
                      onChange={e => setNewDataSource({ 
                        ...newDataSource, 
                        type: e.target.value as DataSourceType 
                      })}
                    >
                      {Object.values(DataSourceType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source-description">Description</Label>
                    <Input
                      id="source-description"
                      value={newDataSource.description}
                      onChange={e => setNewDataSource({ ...newDataSource, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="source-enabled"
                      checked={newDataSource.enabled || false}
                      onChange={e => setNewDataSource({ ...newDataSource, enabled: e.target.checked })}
                    />
                    <Label htmlFor="source-enabled">Enabled</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDataSourceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDataSource}>Create Data Source</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.map(source => (
                <TableRow key={source.id}>
                  <TableCell>{source.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{source.name}</div>
                    {source.description && (
                      <div className="text-sm text-gray-500">{source.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DataSourceTypeBadge type={source.type} />
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {source.type === DataSourceType.POSTGRESQL && (
                        <>
                          <div>Host: {source.config.host || 'localhost'}</div>
                          <div>Port: {source.config.port || 5432}</div>
                          <div>Database: {source.config.database || '-'}</div>
                        </>
                      )}
                      {source.type === DataSourceType.REST_API && (
                        <>
                          <div>URL: {source.config.url || '-'}</div>
                          <div>Method: {source.config.method || 'GET'}</div>
                        </>
                      )}
                      {source.type === DataSourceType.FILE_CSV && (
                        <>
                          <div>Path: {source.config.filePath || '-'}</div>
                          <div>Delimiter: {source.config.delimiter || ','}</div>
                        </>
                      )}
                      {source.type === DataSourceType.MEMORY && (
                        <>
                          <div>Records: {source.config.data?.length || 0}</div>
                        </>
                      )}
                      {source.config.options?.target && (
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            Destination: {source.config.options.target}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={source.enabled ? "default" : "outline"}>
                      {source.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Source Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleDataSourceEnabled(source.id, !source.enabled)}>
                          {source.enabled ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteDataSource(source.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {dataSources.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data sources found
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render transformations tab
  const renderTransformationsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transformation Rules</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={transformationRuleDialogOpen} onOpenChange={setTransformationRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Transformation Rule</DialogTitle>
                  <DialogDescription>
                    Create a new transformation rule for ETL jobs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Name</Label>
                    <Input
                      id="rule-name"
                      value={newTransformationRule.name}
                      onChange={e => setNewTransformationRule({ ...newTransformationRule, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-type">Type</Label>
                    <select
                      id="rule-type"
                      className="w-full p-2 border rounded"
                      value={newTransformationRule.type}
                      onChange={e => setNewTransformationRule({ 
                        ...newTransformationRule, 
                        type: e.target.value as TransformationType 
                      })}
                    >
                      {Object.values(TransformationType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-order">Order</Label>
                    <Input
                      id="rule-order"
                      type="number"
                      min={1}
                      value={newTransformationRule.order}
                      onChange={e => setNewTransformationRule({ 
                        ...newTransformationRule, 
                        order: parseInt(e.target.value) 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-description">Description</Label>
                    <Input
                      id="rule-description"
                      value={newTransformationRule.description}
                      onChange={e => setNewTransformationRule({ ...newTransformationRule, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rule-enabled"
                      checked={newTransformationRule.enabled || false}
                      onChange={e => setNewTransformationRule({ ...newTransformationRule, enabled: e.target.checked })}
                    />
                    <Label htmlFor="rule-enabled">Enabled</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTransformationRuleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTransformationRule}>Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transformationRules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                    {rule.description && (
                      <div className="text-sm text-gray-500">{rule.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <TransformationTypeBadge type={rule.type} />
                  </TableCell>
                  <TableCell>{rule.order}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {rule.type === TransformationType.FILTER && (
                        <>
                          <div>Conditions: {(rule.config as any).conditions?.length || 0}</div>
                          <div>Logic: {(rule.config as any).logic}</div>
                        </>
                      )}
                      {rule.type === TransformationType.MAP && (
                        <>
                          <div>Mappings: {(rule.config as any).mappings?.length || 0}</div>
                        </>
                      )}
                      {rule.type === TransformationType.VALIDATE && (
                        <>
                          <div>Validations: {(rule.config as any).validations?.length || 0}</div>
                        </>
                      )}
                      {rule.type === TransformationType.AGGREGATE && (
                        <>
                          <div>Group By: {(rule.config as any).groupBy?.join(', ') || '-'}</div>
                          <div>Aggregations: {(rule.config as any).aggregations?.length || 0}</div>
                        </>
                      )}
                      {rule.type === TransformationType.ENRICH && (
                        <>
                          <div>Type: {(rule.config as any).type}</div>
                          <div>Fields: {(rule.config as any).fields?.length || 0}</div>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? "default" : "outline"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Rule Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleTransformationRuleEnabled(rule.id, !rule.enabled)}>
                          {rule.enabled ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteTransformationRule(rule.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {transformationRules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transformation rules found
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render alerts tab
  const renderAlertsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">System Alerts</h2>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map(alert => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <AlertTypeIcon type={alert.severity} />
                      <span className="ml-2">
                        {alert.severity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{alert.title}</TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>{formatDate(alert.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No alerts found
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">ETL Management Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          {renderDashboardTab()}
        </TabsContent>
        
        <TabsContent value="jobs">
          {renderJobsTab()}
        </TabsContent>
        
        <TabsContent value="data-sources">
          {renderDataSourcesTab()}
        </TabsContent>
        
        <TabsContent value="transformations">
          {renderTransformationsTab()}
        </TabsContent>
        
        <TabsContent value="alerts">
          {renderAlertsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ETLDashboard;