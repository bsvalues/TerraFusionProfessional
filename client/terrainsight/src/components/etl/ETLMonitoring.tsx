/**
 * ETLMonitoring.tsx
 * 
 * Component for monitoring ETL job execution and performance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, Clock, RefreshCw, Check, XCircle, AlertOctagon, BarChart3, TimerReset, 
  BarChart4, ArrowBigUp, ArrowBigDown, Calendar, Download, Cpu, HardDrive, LineChart
} from 'lucide-react';
import { JobStatus } from '../../services/etl/ETLTypes';

const ETLMonitoring: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('history');
  const [timeframeFilter, setTimeframeFilter] = useState('24h');

  // Mock data for job execution history
  const jobExecutions = [
    { 
      id: 1, 
      jobId: 1,
      jobName: 'Daily Property Import',
      startTime: '2025-04-04T08:00:00',
      endTime: '2025-04-04T08:05:32',
      status: JobStatus.COMPLETED,
      recordsProcessed: 1250,
      duration: 332, // seconds
      metrics: { 
        cpuUsage: 25,
        memoryUsage: 120,
        throughput: 3.76
      }
    },
    { 
      id: 2, 
      jobId: 2,
      jobName: 'Weekly Market Analysis',
      startTime: '2025-04-04T09:15:00',
      endTime: null, // still running
      status: JobStatus.RUNNING,
      recordsProcessed: 450,
      duration: 1200, // seconds so far
      metrics: { 
        cpuUsage: 42,
        memoryUsage: 280,
        throughput: 0.38
      }
    },
    { 
      id: 3, 
      jobId: 3,
      jobName: 'Property Value Update',
      startTime: '2025-04-03T22:30:00',
      endTime: '2025-04-03T22:31:15',
      status: JobStatus.FAILED,
      recordsProcessed: 0,
      duration: 75, // seconds
      metrics: { 
        cpuUsage: 15,
        memoryUsage: 80,
        throughput: 0
      }
    },
    { 
      id: 4, 
      jobId: 1,
      jobName: 'Daily Property Import',
      startTime: '2025-04-03T08:00:00',
      endTime: '2025-04-03T08:04:45',
      status: JobStatus.COMPLETED,
      recordsProcessed: 1230,
      duration: 285, // seconds
      metrics: { 
        cpuUsage: 22,
        memoryUsage: 115,
        throughput: 4.31
      }
    },
    { 
      id: 5, 
      jobId: 4,
      jobName: 'Neighborhood Data Sync',
      startTime: '2025-04-03T18:45:00',
      endTime: '2025-04-03T18:53:20',
      status: JobStatus.COMPLETED,
      recordsProcessed: 456,
      duration: 500, // seconds
      metrics: { 
        cpuUsage: 18,
        memoryUsage: 95,
        throughput: 0.91
      }
    }
  ];

  // Alerts data
  const alerts = [
    { 
      id: 1, 
      jobId: 3,
      jobName: 'Property Value Update',
      type: 'ERROR',
      message: 'Database connection failed: Connection refused',
      timestamp: '2025-04-03T22:31:15',
      acknowledged: false
    },
    { 
      id: 2, 
      jobId: 2,
      jobName: 'Weekly Market Analysis',
      type: 'WARNING',
      message: 'Job is taking longer than usual to complete (avg: 10m, current: 20m)',
      timestamp: '2025-04-04T09:25:00',
      acknowledged: false
    },
    { 
      id: 3, 
      jobId: 5,
      jobName: 'Census Data Import',
      type: 'WARNING',
      message: 'Found 12 records with validation warnings',
      timestamp: '2025-04-02T14:36:10',
      acknowledged: true
    },
    { 
      id: 4, 
      jobId: 1,
      jobName: 'Daily Property Import',
      type: 'INFO',
      message: 'Job completed 15% faster than average',
      timestamp: '2025-04-04T08:05:32',
      acknowledged: true
    }
  ];

  // Optimization suggestions
  const optimizationSuggestions = [
    {
      id: 1,
      jobId: 2,
      jobName: 'Weekly Market Analysis',
      type: 'PERFORMANCE',
      description: 'Adding an index on "market_date" could improve query performance',
      impact: 'HIGH',
      implemented: false
    },
    {
      id: 2,
      jobId: 1,
      jobName: 'Daily Property Import',
      type: 'QUALITY',
      description: 'Consider adding validation rules for property address fields',
      impact: 'MEDIUM',
      implemented: false
    },
    {
      id: 3,
      jobId: 3,
      jobName: 'Property Value Update',
      type: 'RELIABILITY',
      description: 'Add retry logic for API connections',
      impact: 'HIGH',
      implemented: true
    }
  ];

  // Performance metrics
  const performanceMetrics = {
    averageDuration: 278, // seconds
    successRate: 85, // percentage
    totalRecordsProcessed: 125350,
    avgThroughput: 3.2, // records per second
    systemLoad: {
      cpu: 28, // percentage
      memory: 45, // percentage
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING: return <Clock className="h-4 w-4 text-amber-500" />;
      case JobStatus.RUNNING: return <Play className="h-4 w-4 text-blue-500" />;
      case JobStatus.COMPLETED: return <Check className="h-4 w-4 text-green-500" />;
      case JobStatus.FAILED: return <XCircle className="h-4 w-4 text-red-500" />;
      case JobStatus.SCHEDULED: return <Calendar className="h-4 w-4 text-purple-500" />;
      default: return null;
    }
  };

  // Function to get status color
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING: return 'bg-amber-500';
      case JobStatus.RUNNING: return 'bg-blue-500';
      case JobStatus.COMPLETED: return 'bg-green-500';
      case JobStatus.FAILED: return 'bg-red-500';
      case JobStatus.SCHEDULED: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Function to format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${remainingSeconds}s`;
    
    return result;
  };

  // Function to get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'ERROR': return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'WARNING': return <AlertOctagon className="h-4 w-4 text-amber-500" />;
      case 'INFO': return <AlertOctagon className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  // Function to get impact badge color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Function to handle acknowledging alerts
  const handleAcknowledgeAlert = (id: number) => {
    // In a real implementation, this would update the alert in the backend
    console.log(`Acknowledging alert ID: ${id}`);
  };

  // Function to handle implementing suggestions
  const handleImplementSuggestion = (id: number) => {
    // In a real implementation, this would update the suggestion in the backend
    console.log(`Implementing suggestion ID: ${id}`);
  };

  // Function to handle exporting data
  const handleExportData = (format: string) => {
    console.log(`Exporting data in ${format} format`);
    // In a real implementation, this would generate and download a file
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ETL Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor ETL job execution and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeframeFilter}
            onValueChange={setTimeframeFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TimerReset className="h-5 w-5 mr-2 text-blue-500" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(performanceMetrics.averageDuration)}</div>
            <p className="text-muted-foreground text-sm mt-1">Average job execution time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Check className="h-5 w-5 mr-2 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{performanceMetrics.successRate}%</div>
            <p className="text-muted-foreground text-sm mt-1">Job completion success rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{performanceMetrics.avgThroughput}/s</div>
            <p className="text-muted-foreground text-sm mt-1">Records processed per second</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Cpu className="h-5 w-5 mr-2 text-amber-500" />
              System Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{performanceMetrics.systemLoad.cpu}%</div>
            <p className="text-muted-foreground text-sm mt-1">Average CPU utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            <Badge className="ml-2 bg-red-500">{alerts.filter(a => !a.acknowledged).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        {/* Execution History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Execution History</CardTitle>
              <CardDescription>
                Recent ETL job executions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobExecutions.map(execution => (
                    <TableRow key={execution.id}>
                      <TableCell className="font-medium">
                        {execution.jobName}
                      </TableCell>
                      <TableCell>
                        {new Date(execution.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {execution.endTime ? formatDuration(execution.duration) : 'Running...'}
                      </TableCell>
                      <TableCell>
                        {execution.recordsProcessed.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(execution.status)} text-white`}>
                          {execution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-4 w-4 text-blue-500" />
                          <span>{execution.metrics.cpuUsage}%</span>
                          <HardDrive className="h-4 w-4 text-purple-500 ml-2" />
                          <span>{execution.metrics.memoryUsage}MB</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost">
                          <BarChart4 className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Show More
              </Button>
              <Select
                defaultValue="csv"
                onValueChange={handleExportData}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Export Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export as CSV</SelectItem>
                  <SelectItem value="json">Export as JSON</SelectItem>
                  <SelectItem value="excel">Export as Excel</SelectItem>
                </SelectContent>
              </Select>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ETL Alerts</CardTitle>
              <CardDescription>
                System alerts and notifications for ETL jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map(alert => (
                    <TableRow key={alert.id} className={alert.acknowledged ? '' : 'bg-muted/50'}>
                      <TableCell>
                        <div className="flex items-center">
                          {getAlertIcon(alert.type)}
                          <span className="ml-2">{alert.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {alert.jobName}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {alert.message}
                      </TableCell>
                      <TableCell>
                        {new Date(alert.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {alert.acknowledged ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Acknowledged
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            Unacknowledged
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!alert.acknowledged && (
                          <Button size="sm" variant="ghost" onClick={() => handleAcknowledgeAlert(alert.id)}>
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Acknowledge</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>
                AI-powered recommendations to improve ETL performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Suggestion</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimizationSuggestions.map(suggestion => (
                    <TableRow key={suggestion.id}>
                      <TableCell className="font-medium">
                        {suggestion.jobName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {suggestion.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {suggestion.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={getImpactColor(suggestion.impact)}>
                          {suggestion.impact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {suggestion.implemented ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Implemented
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!suggestion.implemented && (
                          <Button size="sm" variant="ghost" onClick={() => handleImplementSuggestion(suggestion.id)}>
                            <Check className="h-4 w-4" />
                            <span className="ml-2">Implement</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ETL Pipeline Analysis</CardTitle>
              <CardDescription>
                Performance analysis of your ETL pipelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Performance Bottlenecks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Weekly Market Analysis</div>
                        <Badge className="bg-red-500">High</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Transformation phase is taking 85% of total execution time
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Census Data Import</div>
                        <Badge className="bg-amber-500">Medium</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Data validation is causing 45% of processing time
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Resource Utilization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{performanceMetrics.systemLoad.cpu}%</div>
                      <div className="text-sm text-muted-foreground">Average CPU</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{performanceMetrics.systemLoad.memory}%</div>
                      <div className="text-sm text-muted-foreground">Memory Usage</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">1.2 GB</div>
                      <div className="text-sm text-muted-foreground">Disk I/O (per hour)</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Historical performance metrics for ETL jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              {/* In a real implementation, this would be a chart */}
              <div className="text-center text-muted-foreground">
                <LineChart className="h-10 w-10 mx-auto mb-2" />
                <p>Performance trend charts would be displayed here</p>
                <p className="text-sm">Showing execution time, throughput, and resource usage over time</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Performance Comparison</CardTitle>
                <CardDescription>
                  Comparison of ETL job performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
                {/* In a real implementation, this would be a chart */}
                <div className="text-center text-muted-foreground">
                  <BarChart4 className="h-8 w-8 mx-auto mb-2" />
                  <p>Job comparison chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>
                  System resource usage during ETL operations
                </CardDescription>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
                {/* In a real implementation, this would be a chart */}
                <div className="text-center text-muted-foreground">
                  <Cpu className="h-8 w-8 mx-auto mb-2" />
                  <p>Resource utilization chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ETLMonitoring;