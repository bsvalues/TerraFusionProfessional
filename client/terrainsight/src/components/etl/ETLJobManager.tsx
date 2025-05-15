/**
 * ETLJobManager.tsx
 * 
 * Component for managing ETL jobs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, Pause, Clock, RotateCcw, Calendar, Edit, Trash2, Plus, Settings, MoreHorizontal, 
  AlertOctagon, ArrowRight, Database, GitBranch, Terminal, AlarmClock, CalendarClock, 
  PanelRight, Check
} from 'lucide-react';
import { JobStatus, JobFrequency } from '../../services/etl/ETLTypes';

const ETLJobManager: React.FC = () => {
  // State for ETL jobs
  const [jobs, setJobs] = useState([
    { 
      id: 1, 
      name: 'Daily Property Import', 
      description: 'Import property data from main database daily',
      sourceId: 1,
      sourceName: 'Property Database',
      destinationId: 3,
      destinationName: 'Analytics Data Warehouse',
      transformationRuleIds: [1, 2],
      status: JobStatus.COMPLETED,
      schedule: {
        frequency: JobFrequency.DAILY,
        startTime: '2025-01-01T08:00:00',
      },
      lastRun: '2025-04-04T08:00:00',
      nextRun: '2025-04-05T08:00:00',
      lastRunDuration: 332, // seconds
      lastRunRecordsProcessed: 1250
    },
    { 
      id: 2, 
      name: 'Weekly Market Analysis', 
      description: 'Process and transform market data for analytics',
      sourceId: 2,
      sourceName: 'Market API',
      destinationId: 3,
      destinationName: 'Analytics Data Warehouse',
      transformationRuleIds: [2, 3, 4],
      status: JobStatus.RUNNING,
      schedule: {
        frequency: JobFrequency.WEEKLY,
        startTime: '2025-01-05T09:00:00',
        daysOfWeek: [5], // Friday
      },
      lastRun: '2025-04-04T09:15:00',
      nextRun: '2025-04-11T09:00:00',
      lastRunDuration: 765, // seconds
      lastRunRecordsProcessed: 782
    },
    { 
      id: 3, 
      name: 'Property Value Update', 
      description: 'Update property values based on latest market data',
      sourceId: 2,
      sourceName: 'Market API',
      destinationId: 1,
      destinationName: 'Property Database',
      transformationRuleIds: [4],
      status: JobStatus.FAILED,
      schedule: {
        frequency: JobFrequency.DAILY,
        startTime: '2025-01-01T22:00:00',
      },
      lastRun: '2025-04-03T22:30:00',
      nextRun: '2025-04-04T22:00:00',
      lastRunDuration: 75, // seconds
      lastRunRecordsProcessed: 0
    },
    { 
      id: 4, 
      name: 'Monthly Census Update', 
      description: 'Import and process latest census data',
      sourceId: 3,
      sourceName: 'Census Data CSV',
      destinationId: 3,
      destinationName: 'Analytics Data Warehouse',
      transformationRuleIds: [1, 2, 3],
      status: JobStatus.SCHEDULED,
      schedule: {
        frequency: JobFrequency.MONTHLY,
        startTime: '2025-01-15T02:00:00',
        dayOfMonth: 15,
      },
      lastRun: '2025-03-15T02:00:00',
      nextRun: '2025-04-15T02:00:00',
      lastRunDuration: 2450, // seconds
      lastRunRecordsProcessed: 5280
    },
  ]);

  // State for showing add/edit dialog
  const [showDialog, setShowDialog] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<JobFrequency | ''>('');

  // State for tabs
  const [activeTab, setActiveTab] = useState('all');

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

  // Function to get status icon
  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING: return <Clock className="h-4 w-4 text-amber-500" />;
      case JobStatus.RUNNING: return <Play className="h-4 w-4 text-blue-500" />;
      case JobStatus.COMPLETED: return <Check className="h-4 w-4 text-green-500" />;
      case JobStatus.FAILED: return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case JobStatus.SCHEDULED: return <CalendarClock className="h-4 w-4 text-purple-500" />;
      default: return null;
    }
  };

  // Function to format frequency
  const formatFrequency = (schedule: any) => {
    if (!schedule) return 'One-time';
    
    switch (schedule.frequency) {
      case JobFrequency.ONCE: return 'One-time';
      case JobFrequency.HOURLY: return 'Hourly';
      case JobFrequency.DAILY: return 'Daily';
      case JobFrequency.WEEKLY: {
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return `Weekly (${schedule.daysOfWeek.map((d: number) => days[d]).join(', ')})`;
        }
        return 'Weekly';
      }
      case JobFrequency.MONTHLY: {
        if (schedule.dayOfMonth) {
          return `Monthly (Day ${schedule.dayOfMonth})`;
        }
        return 'Monthly';
      }
      case JobFrequency.CUSTOM: return 'Custom';
      default: return schedule.frequency;
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

  // Function to handle adding a new job
  const handleAddJob = () => {
    setCurrentJob(null);
    setSelectedFrequency('');
    setShowDialog(true);
  };

  // Function to handle editing a job
  const handleEditJob = (job: any) => {
    setCurrentJob(job);
    setSelectedFrequency(job.schedule?.frequency || '');
    setShowDialog(true);
  };

  // Function to handle running a job
  const handleRunJob = (id: number) => {
    console.log(`Running job ID: ${id}`);
    // In a real implementation, this would call the ETLPipeline or JobExecutionService
    
    // Update job status to running for demo
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: JobStatus.RUNNING } : job
    ));
  };

  // Function to handle stopping a job
  const handleStopJob = (id: number) => {
    console.log(`Stopping job ID: ${id}`);
    // In a real implementation, this would call the ETLPipeline or JobExecutionService
    
    // Update job status to pending for demo
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: JobStatus.PENDING } : job
    ));
  };

  // Function to handle deleting a job
  const handleDeleteJob = (id: number) => {
    if (confirm('Are you sure you want to delete this ETL job?')) {
      setJobs(jobs.filter(job => job.id !== id));
    }
  };

  // Function to handle saving a job
  const handleSaveJob = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, this would save the job to the backend
    setShowDialog(false);
  };

  // Filter jobs based on active tab
  const getFilteredJobs = () => {
    if (activeTab === 'all') {
      return jobs;
    }
    
    return jobs.filter(job => {
      if (activeTab === 'active' && job.status === JobStatus.RUNNING) {
        return true;
      }
      if (activeTab === 'scheduled' && job.status === JobStatus.SCHEDULED) {
        return true;
      }
      if (activeTab === 'completed' && job.status === JobStatus.COMPLETED) {
        return true;
      }
      if (activeTab === 'failed' && job.status === JobStatus.FAILED) {
        return true;
      }
      return false;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ETL Jobs</h2>
          <p className="text-muted-foreground">
            Configure and manage ETL job executions
          </p>
        </div>
        <Button onClick={handleAddJob}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Job
        </Button>
      </div>

      {/* Job Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge className="ml-2 bg-blue-500">{jobs.filter(j => j.status === JobStatus.RUNNING).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled
            <Badge className="ml-2 bg-purple-500">{jobs.filter(j => j.status === JobStatus.SCHEDULED).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge className="ml-2 bg-green-500">{jobs.filter(j => j.status === JobStatus.COMPLETED).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            <Badge className="ml-2 bg-red-500">{jobs.filter(j => j.status === JobStatus.FAILED).length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>ETL Jobs</CardTitle>
          <CardDescription>
            Data processing and transformation jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Source → Destination</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredJobs().map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <span className="ml-2">{job.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 ml-6">
                        {job.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <span>{job.sourceName}</span>
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <span>{job.destinationName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatFrequency(job.schedule)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.lastRun ? (
                      <div className="text-sm">
                        <div>{new Date(job.lastRun).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {formatDuration(job.lastRunDuration)} • {job.lastRunRecordsProcessed.toLocaleString()} records
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never run</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.nextRun ? (
                      <div className="text-sm">
                        <div>{new Date(job.nextRun).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {new Date(job.nextRun).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(job.status)} text-white`}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {job.status !== JobStatus.RUNNING ? (
                        <Button size="sm" variant="ghost" onClick={() => handleRunJob(job.id)}>
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Run</span>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleStopJob(job.id)}>
                          <Pause className="h-4 w-4" />
                          <span className="sr-only">Stop</span>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleEditJob(job)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteJob(job.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{currentJob ? 'Edit ETL Job' : 'Create New ETL Job'}</DialogTitle>
            <DialogDescription>
              Configure the job properties and scheduling
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveJob}>
            <div className="grid gap-4 py-4">
              {/* Job Details */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Job Details</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    defaultValue={currentJob?.name || ''}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    defaultValue={currentJob?.description || ''}
                    className="col-span-3"
                  />
                </div>
              </div>

              {/* Source & Destination */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Source & Destination</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">
                    Source
                  </Label>
                  <Select
                    defaultValue={currentJob?.sourceId?.toString() || ''}
                  >
                    <SelectTrigger id="source" className="col-span-3">
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Property Database</SelectItem>
                      <SelectItem value="2">Market API</SelectItem>
                      <SelectItem value="3">Census Data CSV</SelectItem>
                      <SelectItem value="4">Legacy Property System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destination" className="text-right">
                    Destination
                  </Label>
                  <Select
                    defaultValue={currentJob?.destinationId?.toString() || ''}
                  >
                    <SelectTrigger id="destination" className="col-span-3">
                      <SelectValue placeholder="Select a destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Property Database</SelectItem>
                      <SelectItem value="2">Market API</SelectItem>
                      <SelectItem value="3">Analytics Data Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scheduling */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Scheduling</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Frequency
                  </Label>
                  <Select
                    value={selectedFrequency}
                    onValueChange={(value) => setSelectedFrequency(value as JobFrequency)}
                  >
                    <SelectTrigger id="frequency" className="col-span-3">
                      <SelectValue placeholder="Select job frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={JobFrequency.ONCE}>Once</SelectItem>
                      <SelectItem value={JobFrequency.HOURLY}>Hourly</SelectItem>
                      <SelectItem value={JobFrequency.DAILY}>Daily</SelectItem>
                      <SelectItem value={JobFrequency.WEEKLY}>Weekly</SelectItem>
                      <SelectItem value={JobFrequency.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={JobFrequency.CUSTOM}>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditionally show additional scheduling options */}
                {selectedFrequency && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startTime" className="text-right">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      defaultValue={currentJob?.schedule?.startTime ? new Date(currentJob.schedule.startTime).toISOString().slice(0, 16) : ''}
                      className="col-span-3"
                    />
                  </div>
                )}

                {selectedFrequency === JobFrequency.WEEKLY && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Days of Week
                    </Label>
                    <div className="col-span-3 flex flex-wrap gap-3">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${index}`} 
                            defaultChecked={currentJob?.schedule?.daysOfWeek?.includes(index)}
                          />
                          <label htmlFor={`day-${index}`} className="text-sm font-medium leading-none">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFrequency === JobFrequency.MONTHLY && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dayOfMonth" className="text-right">
                      Day of Month
                    </Label>
                    <Input
                      id="dayOfMonth"
                      type="number"
                      min="1"
                      max="31"
                      defaultValue={currentJob?.schedule?.dayOfMonth || '1'}
                      className="col-span-3"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Options</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="continueOnError" className="text-right">
                    Validation
                  </Label>
                  <div className="flex items-center col-span-3">
                    <Checkbox
                      id="continueOnError"
                      defaultChecked={currentJob?.continueOnValidationError}
                    />
                    <label htmlFor="continueOnError" className="ml-2 text-sm">
                      Continue on validation errors
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notifications" className="text-right">
                    Notifications
                  </Label>
                  <div className="flex items-center space-x-4 col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifySuccess"
                        defaultChecked={currentJob?.notifyOnSuccess}
                      />
                      <label htmlFor="notifySuccess" className="text-sm">
                        On success
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyFailure"
                        defaultChecked={currentJob?.notifyOnFailure ?? true}
                      />
                      <label htmlFor="notifyFailure" className="text-sm">
                        On failure
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{currentJob ? 'Save Changes' : 'Create Job'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ETLJobManager;