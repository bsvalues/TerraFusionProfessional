import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Play,
  RotateCw,
  Server,
  StopCircle,
  Timer,
  X
} from 'lucide-react';
import { ETLJob, ETLDashboardMetrics } from '../../services/etl/ETLTypes';

// Helper function to format date for display
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

// Sample data
const sampleJobs: ETLJob[] = [
  {
    id: 'job-1',
    name: 'Property Data Import',
    description: 'Import property data from county database',
    sourceId: 'source-1',
    targetId: 'target-1',
    transformationIds: ['rule-1', 'rule-2'],
    status: 'success',
    schedule: {
      frequency: 'daily',
      timeOfDay: '02:00',
      lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 20 * 60 * 60 * 1000)
    },
    metrics: {
      executionTimeMs: 45600,
      cpuUtilization: 65,
      memoryUsageMb: 256,
      rowsProcessed: 25000,
      bytesProcessed: 12500000,
      errorCount: 0,
      warningCount: 2,
      dataQualityScore: 98.5
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: 'job-2',
    name: 'Sales Data Enrichment',
    description: 'Enrich property sales data with demographic information',
    sourceId: 'source-3',
    targetId: 'target-1',
    transformationIds: ['rule-3', 'rule-4'],
    status: 'running',
    schedule: {
      frequency: 'weekly',
      daysOfWeek: [1, 4],
      timeOfDay: '03:30',
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    metrics: {
      executionTimeMs: 0, // Still running
      cpuUtilization: 85,
      memoryUsageMb: 512,
      rowsProcessed: 8500,
      bytesProcessed: 4500000,
      errorCount: 0,
      warningCount: 0
    },
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'job-3',
    name: 'Market Analysis Update',
    description: 'Update market analysis data for property valuation',
    sourceId: 'source-2',
    targetId: 'target-3',
    transformationIds: ['rule-1', 'rule-5'],
    status: 'warning',
    schedule: {
      frequency: 'daily',
      timeOfDay: '01:15',
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    metrics: {
      executionTimeMs: 78900,
      cpuUtilization: 45,
      memoryUsageMb: 384,
      rowsProcessed: 15000,
      bytesProcessed: 8250000,
      errorCount: 0,
      warningCount: 8,
      dataQualityScore: 89.5,
      bottlenecks: [
        {
          type: 'transformation',
          severity: 'medium',
          details: 'Slow transformation performance on large text fields'
        }
      ]
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'job-4',
    name: 'Geographic Coordinate Processing',
    description: 'Process and normalize geographic coordinates for properties',
    sourceId: 'source-4',
    targetId: 'target-2',
    transformationIds: ['rule-6'],
    status: 'failed',
    schedule: {
      frequency: 'daily',
      timeOfDay: '00:30',
      lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000)
    },
    metrics: {
      executionTimeMs: 23400,
      cpuUtilization: 78,
      memoryUsageMb: 192,
      rowsProcessed: 5000,
      bytesProcessed: 2500000,
      errorCount: 3,
      warningCount: 5,
      dataQualityScore: 72.5,
      bottlenecks: [
        {
          type: 'memory',
          severity: 'high',
          details: 'Memory limit exceeded during coordinate transformation'
        }
      ]
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  },
  {
    id: 'job-5',
    name: 'Historical Property Data Archive',
    description: 'Archive historical property data to long-term storage',
    sourceId: 'source-1',
    targetId: 'target-4',
    transformationIds: ['rule-7'],
    status: 'idle',
    schedule: {
      frequency: 'monthly',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      timeOfDay: '04:00',
      lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000)
    },
    metrics: {
      executionTimeMs: 135000,
      cpuUtilization: 35,
      memoryUsageMb: 768,
      rowsProcessed: 250000,
      bytesProcessed: 125000000,
      errorCount: 0,
      warningCount: 12,
      dataQualityScore: 94.2
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
];

// Sample dashboard metrics
const sampleDashboardMetrics: ETLDashboardMetrics = {
  dailyJobs: [
    { date: '2023-06-01', successful: 8, failed: 1, warning: 2 },
    { date: '2023-06-02', successful: 9, failed: 0, warning: 1 },
    { date: '2023-06-03', successful: 7, failed: 2, warning: 3 },
    { date: '2023-06-04', successful: 10, failed: 0, warning: 0 },
    { date: '2023-06-05', successful: 8, failed: 1, warning: 1 },
    { date: '2023-06-06', successful: 9, failed: 0, warning: 0 },
    { date: '2023-06-07', successful: 6, failed: 3, warning: 1 }
  ],
  resourceUtilization: [
    { timestamp: '08:00', cpu: 25, memory: 30 },
    { timestamp: '09:00', cpu: 40, memory: 45 },
    { timestamp: '10:00', cpu: 65, memory: 60 },
    { timestamp: '11:00', cpu: 80, memory: 75 },
    { timestamp: '12:00', cpu: 90, memory: 85 },
    { timestamp: '13:00', cpu: 75, memory: 80 },
    { timestamp: '14:00', cpu: 60, memory: 65 },
    { timestamp: '15:00', cpu: 45, memory: 50 }
  ],
  dataVolume: [
    { timestamp: '08:00', bytesProcessed: 2500000, rowsProcessed: 5000 },
    { timestamp: '09:00', bytesProcessed: 4000000, rowsProcessed: 8000 },
    { timestamp: '10:00', bytesProcessed: 6500000, rowsProcessed: 13000 },
    { timestamp: '11:00', bytesProcessed: 8000000, rowsProcessed: 16000 },
    { timestamp: '12:00', bytesProcessed: 9500000, rowsProcessed: 19000 },
    { timestamp: '13:00', bytesProcessed: 7500000, rowsProcessed: 15000 },
    { timestamp: '14:00', bytesProcessed: 6000000, rowsProcessed: 12000 },
    { timestamp: '15:00', bytesProcessed: 4500000, rowsProcessed: 9000 }
  ]
};

// Helper component to display job status badge
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'success':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Check className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    case 'running':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Play className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    case 'warning':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <X className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'idle':
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          <Clock className="h-3 w-3 mr-1" />
          Idle
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
  }
};

export function ETLDashboard() {
  const [selectedJob, setSelectedJob] = useState<ETLJob | null>(null);
  const [metrics, setMetrics] = useState<ETLDashboardMetrics>(sampleDashboardMetrics);
  const [jobs, setJobs] = useState<ETLJob[]>(sampleJobs);
  const [activeMetricsTab, setActiveMetricsTab] = useState('jobs');
  
  useEffect(() => {
    // In a real implementation, we would fetch this data from an API
    // For now, we're using the sample data
    
    // Select the first job by default
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);
  
  // Calculate summary statistics
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(job => job.status === 'running').length;
  const successfulJobs = jobs.filter(job => job.status === 'success').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;
  const warningJobs = jobs.filter(job => job.status === 'warning').length;
  
  // Format time display
  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <h3 className="text-2xl font-bold">{totalJobs}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
              <Database className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Running</p>
              <h3 className="text-2xl font-bold">{runningJobs}</h3>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <Play className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Issues</p>
              <h3 className="text-2xl font-bold">{failedJobs + warningJobs}</h3>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <h3 className="text-2xl font-bold">
                {totalJobs > 0 ? `${Math.round((successfulJobs / totalJobs) * 100)}%` : '0%'}
              </h3>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>ETL Jobs</CardTitle>
              <CardDescription>
                All configured ETL jobs and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card 
                    key={job.id}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedJob?.id === job.id ? 'bg-gray-50 border-blue-300' : ''
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{job.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {job.description}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <StatusBadge status={job.status} />
                            
                            {job.status === 'running' && (
                              <div className="flex items-center">
                                <Progress value={65} className="w-20 h-2 mr-2" />
                                <span className="text-xs text-gray-500">65%</span>
                              </div>
                            )}
                            
                            {job.schedule && job.schedule.lastRun && (
                              <span className="text-xs text-gray-500">
                                Last: {formatDate(job.schedule.lastRun)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          {job.status === 'running' ? (
                            <Button size="sm" variant="outline" className="h-8">
                              <StopCircle className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8">
                              <Play className="h-4 w-4 mr-1" />
                              Run
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {selectedJob ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedJob.name}</CardTitle>
                      <CardDescription>
                        {selectedJob.description}
                      </CardDescription>
                    </div>
                    <StatusBadge status={selectedJob.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {selectedJob.metrics && (
                      <>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Timer className="h-5 w-5 text-blue-500 mr-2" />
                            <p className="text-sm font-medium">Execution Time</p>
                          </div>
                          <p className="text-xl font-bold mt-1">
                            {formatExecutionTime(selectedJob.metrics.executionTimeMs)}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Cpu className="h-5 w-5 text-indigo-500 mr-2" />
                            <p className="text-sm font-medium">CPU Utilization</p>
                          </div>
                          <p className="text-xl font-bold mt-1">
                            {selectedJob.metrics.cpuUtilization}%
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <HardDrive className="h-5 w-5 text-amber-500 mr-2" />
                            <p className="text-sm font-medium">Memory Usage</p>
                          </div>
                          <p className="text-xl font-bold mt-1">
                            {selectedJob.metrics.memoryUsageMb} MB
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Server className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-sm font-medium">Rows Processed</p>
                          </div>
                          <p className="text-xl font-bold mt-1">
                            {selectedJob.metrics.rowsProcessed.toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {selectedJob.metrics && selectedJob.metrics.bottlenecks && selectedJob.metrics.bottlenecks.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2">Performance Bottlenecks</h3>
                      {selectedJob.metrics.bottlenecks.map((bottleneck, index) => (
                        <div key={index} className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-2">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium text-amber-800">
                                {bottleneck.type.charAt(0).toUpperCase() + bottleneck.type.slice(1)} Issue ({bottleneck.severity})
                              </p>
                              <p className="text-sm text-amber-700 mt-1">
                                {bottleneck.details}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Job Details</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div className="font-medium">Source</div>
                        <div>{selectedJob.sourceId}</div>
                        
                        <div className="font-medium">Target</div>
                        <div>{selectedJob.targetId}</div>
                        
                        <div className="font-medium">Transformations</div>
                        <div>{selectedJob.transformationIds.join(', ')}</div>
                        
                        {selectedJob.schedule && (
                          <>
                            <div className="font-medium">Frequency</div>
                            <div className="capitalize">{selectedJob.schedule.frequency}</div>
                            
                            {selectedJob.schedule.nextRun && (
                              <>
                                <div className="font-medium">Next Run</div>
                                <div>{formatDate(selectedJob.schedule.nextRun)}</div>
                              </>
                            )}
                          </>
                        )}
                        
                        <div className="font-medium">Created</div>
                        <div>{formatDate(selectedJob.createdAt)}</div>
                        
                        <div className="font-medium">Last Updated</div>
                        <div>{formatDate(selectedJob.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Database className="h-12 w-12 mx-auto text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium">No Job Selected</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Select a job from the list to view its details and metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  System-wide ETL performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeMetricsTab} onValueChange={setActiveMetricsTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="jobs">Job Execution</TabsTrigger>
                    <TabsTrigger value="resources">Resource Usage</TabsTrigger>
                    <TabsTrigger value="data">Data Volume</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="jobs">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.dailyJobs}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="successful" name="Successful" fill="#4ade80" />
                          <Bar dataKey="warning" name="Warning" fill="#facc15" />
                          <Bar dataKey="failed" name="Failed" fill="#f87171" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="resources">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.resourceUtilization}>
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="cpu" 
                            name="CPU %" 
                            stroke="#6366f1" 
                            strokeWidth={2} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="memory" 
                            name="Memory %" 
                            stroke="#8b5cf6" 
                            strokeWidth={2} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="data">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.dataVolume}>
                          <XAxis dataKey="timestamp" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="bytesProcessed" 
                            name="Bytes Processed" 
                            stroke="#0ea5e9" 
                            strokeWidth={2} 
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="rowsProcessed" 
                            name="Rows Processed" 
                            stroke="#14b8a6" 
                            strokeWidth={2} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}