/**
 * ETL Manager component for managing ETL jobs and pipelines
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightIcon, ClockIcon, DatabaseIcon, FilterIcon, PlayIcon, PlusIcon, SettingsIcon, TableIcon, ZapIcon } from 'lucide-react';
import ETLOptimizationPanel from './ETLOptimizationPanel';
import { etlPipeline as ETLPipeline } from '../../services/etl/ETLPipeline';
import { DataSource, DataTransformation, ETLJob, JobRun, getScheduleString } from '../../services/etl/ETLTypes';
import Scheduler from '../../services/etl/Scheduler';

/**
 * A button for scheduling a job with a cron expression
 */
interface ScheduleJobButtonProps {
  jobId: string;
  currentSchedule?: string;
  onSchedule: (jobId: string, cronExpression: string) => void;
}

const ScheduleJobButton: React.FC<ScheduleJobButtonProps> = ({ 
  jobId, 
  currentSchedule,
  onSchedule 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cronExpression, setCronExpression] = useState(currentSchedule || '');
  const { toast } = useToast();
  
  const handleSave = () => {
    try {
      onSchedule(jobId, cronExpression);
      setIsOpen(false);
      toast({
        title: 'Schedule Updated',
        description: `Job schedule has been updated to "${cronExpression}"`
      });
    } catch (error) {
      toast({
        title: 'Schedule Error',
        description: error instanceof Error ? error.message : 'Failed to schedule job',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        <ClockIcon className="h-3.5 w-3.5" />
        Schedule
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule ETL Job</DialogTitle>
            <DialogDescription>
              Set a cron expression to schedule when this job should run.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cron-input">Cron Expression</Label>
              <Input 
                id="cron-input"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="*/30 * * * *"
              />
              <p className="text-xs text-muted-foreground">
                Examples: <span className="font-mono">*/30 * * * *</span> (every 30 minutes),{' '}
                <span className="font-mono">0 */2 * * *</span> (every 2 hours)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Common Patterns</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start text-xs"
                  onClick={() => setCronExpression('*/5 * * * *')}
                >
                  Every 5 minutes
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-xs"
                  onClick={() => setCronExpression('*/30 * * * *')}
                >
                  Every 30 minutes
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-xs"
                  onClick={() => setCronExpression('0 */1 * * *')}
                >
                  Hourly
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-xs"
                  onClick={() => setCronExpression('0 0 * * *')}
                >
                  Daily at midnight
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-xs"
                  onClick={() => setCronExpression('0 9 * * 1-5')}
                >
                  Weekdays at 9 AM
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-xs"
                  onClick={() => setCronExpression('0 0 * * 0')}
                >
                  Weekly (Sundays)
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Job status badge component
 */
const JobStatusBadge: React.FC<{ status: ETLJob['status'] }> = ({ status }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  
  switch (status) {
    case 'running':
      variant = 'default';
      break;
    case 'completed':
      variant = 'secondary';
      break;
    case 'failed':
      variant = 'destructive';
      break;
    default:
      variant = 'outline';
  }
  
  return <Badge variant={variant}>{status}</Badge>;
};

const ETLManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [transformations, setTransformations] = useState<DataTransformation[]>([]);
  const [jobRuns, setJobRuns] = useState<Record<string, JobRun[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    enabled: true,
    sources: [] as string[],
    transformations: [] as string[]
  });
  
  const { toast } = useToast();
  
  // Load data when component mounts
  useEffect(() => {
    loadETLData();
    
    // Start the scheduler
    Scheduler.start();
    
    // Clean up when component unmounts
    return () => {
      Scheduler.stop();
    };
  }, []);
  
  // Load ETL data from the pipeline
  const loadETLData = () => {
    setLoading(true);
    
    try {
      // Get jobs, sources, and transformations
      const etlJobs = ETLPipeline.getJobs();
      const etlSources = ETLPipeline.getDataSources();
      const etlTransformations = ETLPipeline.getTransformations();
      
      // Get job runs for each job
      const allJobRuns: Record<string, JobRun[]> = {};
      etlJobs.forEach(job => {
        allJobRuns[job.id] = ETLPipeline.getJobRuns(job.id);
      });
      
      // Update state
      setJobs(etlJobs);
      setSources(etlSources);
      setTransformations(etlTransformations);
      setJobRuns(allJobRuns);
    } catch (error) {
      console.error('Error loading ETL data:', error);
      toast({
        title: 'Data Loading Error',
        description: 'Failed to load ETL data. Please refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Run a job
  const handleRunJob = (jobId: string) => {
    setLoading(true);
    
    ETLPipeline.runJob(jobId)
      .then(() => {
        toast({
          title: 'Job Started',
          description: 'ETL job has been started successfully.'
        });
        
        // Reload data after a short delay to show updated status
        setTimeout(loadETLData, 500);
      })
      .catch(error => {
        console.error('Error running job:', error);
        toast({
          title: 'Job Error',
          description: 'Failed to start ETL job.',
          variant: 'destructive'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Schedule a job
  const handleScheduleJob = (jobId: string, cronExpression: string) => {
    try {
      Scheduler.scheduleJob(jobId, cronExpression);
      loadETLData(); // Reload to show updated schedule
    } catch (error) {
      console.error('Error scheduling job:', error);
      throw error;
    }
  };
  
  // Toggle job enabled state
  const toggleJobEnabled = (jobId: string, currentState: boolean) => {
    try {
      ETLPipeline.updateJob(jobId, { enabled: !currentState });
      
      // Update state to reflect the change
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, enabled: !currentState } : job
      ));
      
      toast({
        title: 'Job Updated',
        description: `Job has been ${!currentState ? 'enabled' : 'disabled'}.`
      });
    } catch (error) {
      console.error('Error toggling job state:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to update job state.',
        variant: 'destructive'
      });
    }
  };
  
  // Create a new job
  const handleCreateJob = () => {
    if (!newJob.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Job name is required.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const createdJob = ETLPipeline.createJob({
        name: newJob.name,
        description: newJob.description,
        sources: newJob.sources,
        transformations: newJob.transformations,
        enabled: newJob.enabled,
        status: 'idle'
      });
      
      // Reset form and close dialog
      setNewJob({
        name: '',
        description: '',
        enabled: true,
        sources: [],
        transformations: []
      });
      setShowNewJobDialog(false);
      
      // Reload data
      loadETLData();
      
      toast({
        title: 'Job Created',
        description: 'New ETL job has been created successfully.'
      });
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Creation Error',
        description: 'Failed to create new ETL job.',
        variant: 'destructive'
      });
    }
  };
  
  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5 text-primary" />
          ETL Pipeline Manager
        </CardTitle>
        <CardDescription>
          Manage automated data extraction, transformation, and loading processes
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="jobs" className="flex-1">
              <TableIcon className="h-4 w-4 mr-2" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex-1">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="transformations" className="flex-1">
              <FilterIcon className="h-4 w-4 mr-2" />
              Transformations
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex-1">
              <ZapIcon className="h-4 w-4 mr-2" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="jobs" className="m-0 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">ETL Jobs</h3>
              <Button
                onClick={() => setShowNewJobDialog(true)}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                New Job
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No ETL jobs found. Create a new job to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card key={job.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <h4 className="font-medium">{job.name}</h4>
                          {job.description && (
                            <p className="text-sm text-muted-foreground">{job.description}</p>
                          )}
                        </div>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={job.enabled} 
                          onCheckedChange={() => toggleJobEnabled(job.id, job.enabled)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRunJob(job.id)}
                          disabled={job.status === 'running' || !job.enabled}
                        >
                          <PlayIcon className="h-3.5 w-3.5 mr-1" />
                          Run Now
                        </Button>
                        <ScheduleJobButton 
                          jobId={job.id}
                          currentSchedule={getScheduleString(job.schedule)}
                          onSchedule={handleScheduleJob}
                        />
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Schedule</h5>
                        <p className="text-sm">
                          {job.schedule ? getScheduleString(job.schedule) : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">Next Run</h5>
                        <p className="text-sm">
                          {job.nextRun ? formatDate(job.nextRun) : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">Last Run</h5>
                        <p className="text-sm">
                          {job.lastRun ? formatDate(job.lastRun) : 'Never'}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">Created</h5>
                        <p className="text-sm">{formatDate(job.createdAt)}</p>
                      </div>
                    </div>
                    
                    {/* Job Runs (recent history) */}
                    {jobRuns[job.id] && jobRuns[job.id].length > 0 && (
                      <div className="p-4 border-t">
                        <h5 className="text-sm font-medium mb-2">Recent Runs</h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 font-medium">Start Time</th>
                                <th className="text-left py-2 px-2 font-medium">Duration</th>
                                <th className="text-left py-2 px-2 font-medium">Status</th>
                                <th className="text-left py-2 px-2 font-medium">Records</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jobRuns[job.id].slice(0, 3).map(run => (
                                <tr key={run.id} className="border-b last:border-0">
                                  <td className="py-2 px-2">
                                    {formatDate(run.startTime)}
                                  </td>
                                  <td className="py-2 px-2">
                                    {run.endTime 
                                      ? `${Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000)}s` 
                                      : 'Running...'}
                                  </td>
                                  <td className="py-2 px-2">
                                    <JobStatusBadge status={run.status} />
                                  </td>
                                  <td className="py-2 px-2">
                                    {`${run.records.processed} processed, ${run.records.succeeded} succeeded, ${run.records.failed} failed`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sources" className="m-0 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Data Sources</h3>
              <Button variant="outline" className="flex items-center gap-1" disabled>
                <PlusIcon className="h-4 w-4" />
                Add Source
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No data sources configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sources.map(source => (
                  <Card key={source.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{source.name}</h4>
                        <p className="text-sm text-muted-foreground">Type: {source.type}</p>
                        {source.url && <p className="text-sm mt-1">URL: {source.url}</p>}
                        {source.path && <p className="text-sm mt-1">Path: {source.path}</p>}
                      </div>
                      <Switch checked={source.enabled} disabled />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transformations" className="m-0 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Transformations</h3>
              <Button variant="outline" className="flex items-center gap-1" disabled>
                <PlusIcon className="h-4 w-4" />
                Add Transformation
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : transformations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transformations configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transformations.map(transformation => (
                  <Card key={transformation.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{transformation.name}</h4>
                        <p className="text-sm text-muted-foreground">Type: {transformation.type}</p>
                        <p className="text-sm mt-1">Source: {transformation.sourceName}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded text-xs">Order: {transformation.order}</span>
                          {transformation.target && <span>→ Target: {transformation.target}</span>}
                        </div>
                      </div>
                      <Switch checked={transformation.enabled} disabled />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="optimization" className="m-0 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">AI-Powered ETL Optimization</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse">Loading suggestions...</div>
              </div>
            ) : (
              <ETLOptimizationPanel 
                onApplySuggestion={(job) => {
                  // Update jobs state after a suggestion is applied
                  setJobs(prev => prev.map(j => j.id === job.id ? job : j));
                  toast({
                    title: 'Job Updated',
                    description: 'The job has been updated based on the optimization suggestion.'
                  });
                }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="m-0 px-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Scheduler Settings</h3>
              
              <div className="grid gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="check-interval">Check Interval (ms)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="check-interval"
                      type="number"
                      defaultValue="60000"
                      min="1000"
                      step="1000"
                    />
                    <Button variant="outline" disabled>
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How frequently the scheduler should check for jobs that need to be run.
                    Minimum 1000ms (1 second).
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="scheduler-active" defaultChecked />
                  <Label htmlFor="scheduler-active">Scheduler active</Label>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">ETL Pipeline Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 border rounded">
                    <span>Active Jobs</span>
                    <span>{jobs.filter(j => j.enabled).length} / {jobs.length}</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Running Jobs</span>
                    <span>{jobs.filter(j => j.status === 'running').length}</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Scheduled Jobs</span>
                    <span>{jobs.filter(j => j.schedule).length}</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Enabled Data Sources</span>
                    <span>{sources.filter(s => s.enabled).length} / {sources.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      {/* New Job Dialog */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New ETL Job</DialogTitle>
            <DialogDescription>
              Configure a new job for extracting, transforming, and loading data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="job-name">Job Name *</Label>
              <Input 
                id="job-name"
                value={newJob.name}
                onChange={(e) => setNewJob(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Property Data Processing"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job-description">Description</Label>
              <Input 
                id="job-description"
                value={newJob.description}
                onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Process and validate property data from external API"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data Sources</Label>
              <Select
                disabled={sources.length === 0}
                value={newJob.sources[0] || ''}
                onValueChange={(value) => setNewJob(prev => ({ ...prev, sources: [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sources.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No data sources available. Add data sources first.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Transformations</Label>
              <Select
                disabled={transformations.length === 0}
                value={newJob.transformations[0] || ''}
                onValueChange={(value) => setNewJob(prev => ({ ...prev, transformations: [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transformation" />
                </SelectTrigger>
                <SelectContent>
                  {transformations.map(transform => (
                    <SelectItem key={transform.id} value={transform.id}>
                      {transform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transformations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No transformations available. Add transformations first.
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="job-enabled" 
                checked={newJob.enabled}
                onCheckedChange={(checked) => setNewJob(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="job-enabled">Enable job after creation</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateJob}>Create Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ETLManager;