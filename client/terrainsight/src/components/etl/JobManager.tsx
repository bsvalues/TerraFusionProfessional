import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ETLJob, 
  JobStatus, 
  DataSource, 
  TransformationRule,
  JobSchedule
} from '../../services/etl/ETLTypes';
import { 
  JobRun
} from '../../services/etl/ETLPipelineManager';
import { JobScheduleImpl } from '../../services/etl/JobScheduleImpl';
import { getScheduleString } from '../../services/etl/ETLTypes';
import { 
  Play, 
  AlertCircle, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  RotateCw,
  Pause,
  Square as Stop,
  Copy,
  MoreVertical,
  List,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JobManagerProps {
  jobs: ETLJob[];
  jobRuns: JobRun[];
  dataSources: DataSource[];
  transformations: TransformationRule[];
  runningJobs: string[];
  onAddJob: (job: ETLJob) => void;
  onUpdateJob: (job: ETLJob) => void;
  onDeleteJob: (id: string) => void;
  onRunJob: (id: string) => void;
  onCancelJob: (id: string) => void;
  onScheduleJob: (id: string, schedule: JobSchedule) => void;
  onUnscheduleJob: (id: string) => void;
  onEnableJob: (id: string) => void;
  onDisableJob: (id: string) => void;
  onViewJobRuns: (id: string) => void;
}

const JobManager: React.FC<JobManagerProps> = ({
  jobs,
  jobRuns,
  dataSources,
  transformations,
  runningJobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onRunJob,
  onCancelJob,
  onScheduleJob,
  onUnscheduleJob,
  onEnableJob,
  onDisableJob,
  onViewJobRuns
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isRunDetailsDialogOpen, setIsRunDetailsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ETLJob | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [schedulingJobId, setSchedulingJobId] = useState<string | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<JobRun | null>(null);
  const [activeTab, setActiveTab] = useState("jobs");
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    sources: [] as string[],
    transformations: [] as string[],
    destinations: [] as string[],
    schedule: undefined as JobSchedule | undefined,
    enabled: true,
    continueOnError: false,
    cronExpression: "",
    scheduleType: "none" as "none" | "cron" | "recurring" | "once",
    recurringInterval: "daily",
    recurringTime: "00:00",
    scheduledDate: ""
  });
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingJob(null);
      resetForm();
    }
  }, [isDialogOpen]);
  
  // Initialize form when editing a job
  useEffect(() => {
    if (editingJob) {
      // Get schedule string if present
      const scheduleStr = editingJob.schedule ? getScheduleString(editingJob.schedule) : undefined;
      let scheduleType: "none" | "cron" | "recurring" | "once" = "none";
      let cronExpression = "";
      let recurringInterval = "daily";
      let recurringTime = "00:00";
      let scheduledDate = "";
      
      if (scheduleStr) {
        if (scheduleStr.includes('@once')) {
          scheduleType = "once";
          // Try to extract date from job metadata or set to tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          scheduledDate = tomorrow.toISOString().split('T')[0];
        } else if (scheduleStr.includes('@hourly') || scheduleStr.includes('@daily') || scheduleStr.includes('@weekly') || scheduleStr.includes('@monthly')) {
          scheduleType = "recurring";
          if (scheduleStr.includes('@hourly')) recurringInterval = "hourly";
          else if (scheduleStr.includes('@daily')) recurringInterval = "daily";
          else if (scheduleStr.includes('@weekly')) recurringInterval = "weekly";
          else if (scheduleStr.includes('@monthly')) recurringInterval = "monthly";
          
          // Try to extract time
          const timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            recurringTime = timeMatch[0];
          }
        } else {
          scheduleType = "cron";
          cronExpression = scheduleStr;
        }
      }
      
      setFormValues({
        name: editingJob.name,
        description: editingJob.description || "",
        sources: editingJob.sources?.map(id => id.toString()) || [],
        transformations: editingJob.transformations?.map(id => id.toString()) || [],
        destinations: editingJob.destinations?.map(id => id.toString()) || [],
        schedule: editingJob.schedule,
        enabled: editingJob.enabled,
        continueOnError: editingJob.continueOnError || false,
        cronExpression,
        scheduleType,
        recurringInterval,
        recurringTime,
        scheduledDate
      });
    }
  }, [editingJob]);
  
  // Initialize schedule form when opening the schedule dialog
  useEffect(() => {
    if (isScheduleDialogOpen && schedulingJobId) {
      const job = jobs.find(j => j.id === schedulingJobId);
      if (job) {
        // Get schedule string if present
        const scheduleStr = job.schedule ? getScheduleString(job.schedule) : undefined;
        let scheduleType: "none" | "cron" | "recurring" | "once" = "none";
        let cronExpression = "";
        let recurringInterval = "daily";
        let recurringTime = "00:00";
        let scheduledDate = "";
        
        if (scheduleStr) {
          if (scheduleStr.includes('@once')) {
            scheduleType = "once";
            // Try to extract date from job metadata or set to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            scheduledDate = tomorrow.toISOString().split('T')[0];
          } else if (scheduleStr.includes('@hourly') || scheduleStr.includes('@daily') || scheduleStr.includes('@weekly') || scheduleStr.includes('@monthly')) {
            scheduleType = "recurring";
            if (scheduleStr.includes('@hourly')) recurringInterval = "hourly";
            else if (scheduleStr.includes('@daily')) recurringInterval = "daily";
            else if (scheduleStr.includes('@weekly')) recurringInterval = "weekly";
            else if (scheduleStr.includes('@monthly')) recurringInterval = "monthly";
            
            // Try to extract time
            const timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              recurringTime = timeMatch[0];
            }
          } else {
            scheduleType = "cron";
            cronExpression = scheduleStr;
          }
        }
        
        setFormValues(prev => ({
          ...prev,
          schedule: job.schedule,
          cronExpression,
          scheduleType,
          recurringInterval,
          recurringTime,
          scheduledDate
        }));
      }
    }
  }, [isScheduleDialogOpen, schedulingJobId, jobs]);
  
  /**
   * Reset form state
   */
  const resetForm = () => {
    setFormValues({
      name: "",
      description: "",
      sources: [],
      transformations: [],
      destinations: [],
      schedule: undefined,
      enabled: true,
      continueOnError: false,
      cronExpression: "",
      scheduleType: "none",
      recurringInterval: "daily",
      recurringTime: "00:00",
      scheduledDate: ""
    });
  };
  
  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  /**
   * Handle select change
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  /**
   * Handle checkbox change
   */
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };
  
  /**
   * Handle multi-select change
   */
  const handleMultiSelectChange = (name: string, value: string[]) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  /**
   * Handle schedule type change
   */
  const handleScheduleTypeChange = (value: string) => {
    setFormValues(prev => ({
      ...prev,
      scheduleType: value as "none" | "cron" | "recurring" | "once",
      schedule: undefined // Reset schedule when changing type
    }));
  };
  
  /**
   * Generate a schedule from the form values
   */
  const generateSchedule = (): JobSchedule | undefined => {
    switch (formValues.scheduleType) {
      case "none":
        return undefined;
      
      case "cron":
        if (!formValues.cronExpression) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid cron expression",
            variant: "destructive"
          });
          return undefined;
        }
        return JobScheduleImpl.fromCronExpression(formValues.cronExpression);
      
      case "recurring":
        let cronExpression = "";
        const [hours, minutes] = formValues.recurringTime.split(':');
        
        switch (formValues.recurringInterval) {
          case "hourly":
            cronExpression = `${minutes} * * * *`;
            break;
          case "daily":
            cronExpression = `${minutes} ${hours} * * *`;
            break;
          case "weekly":
            cronExpression = `${minutes} ${hours} * * 1`; // Monday
            break;
          case "monthly":
            cronExpression = `${minutes} ${hours} 1 * *`; // 1st of month
            break;
        }
        
        return JobScheduleImpl.fromCronExpression(cronExpression);
      
      case "once":
        if (!formValues.scheduledDate) {
          toast({
            title: "Validation Error",
            description: "Please select a date",
            variant: "destructive"
          });
          return undefined;
        }
        
        return JobScheduleImpl.once(new Date(formValues.scheduledDate));
    }
  };
  
  /**
   * Handle form submission for job creation/update
   */
  const handleSubmit = () => {
    // Validate form
    if (!formValues.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Job name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (formValues.sources.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one source is required",
        variant: "destructive"
      });
      return;
    }
    
    if (formValues.destinations.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one destination is required",
        variant: "destructive"
      });
      return;
    }
    
    // Generate schedule if needed
    const schedule = generateSchedule();
    
    // Create job object
    const job: ETLJob = {
      id: editingJob?.id || `job-${Date.now()}`,
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      sources: formValues.sources.map(id => parseInt(id, 10)),
      transformations: formValues.transformations.map(id => parseInt(id, 10)),
      destinations: formValues.destinations.map(id => parseInt(id, 10)),
      schedule,
      enabled: formValues.enabled,
      continueOnError: formValues.continueOnError
    };
    
    // Save job
    if (editingJob) {
      onUpdateJob(job);
      toast({
        title: "Job Updated",
        description: `Job "${job.name}" has been updated successfully.`
      });
    } else {
      onAddJob(job);
      toast({
        title: "Job Added",
        description: `Job "${job.name}" has been added successfully.`
      });
    }
    
    // Close dialog
    setIsDialogOpen(false);
  };
  
  /**
   * Handle schedule submission
   */
  const handleScheduleSubmit = () => {
    if (!schedulingJobId) return;
    
    // Generate schedule
    const schedule = generateSchedule();
    
    if (schedule) {
      onScheduleJob(schedulingJobId, schedule);
      toast({
        title: "Job Scheduled",
        description: `Job has been scheduled successfully.`
      });
    } else if (formValues.scheduleType === "none") {
      onUnscheduleJob(schedulingJobId);
      toast({
        title: "Job Unscheduled",
        description: `Job schedule has been removed.`
      });
    }
    
    // Close dialog
    setIsScheduleDialogOpen(false);
    setSchedulingJobId(null);
  };
  
  /**
   * Handle delete button click
   */
  const handleDeleteClick = (id: string) => {
    setDeletingJobId(id);
    setIsDeleteDialogOpen(true);
  };
  
  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = () => {
    if (deletingJobId) {
      onDeleteJob(deletingJobId);
      toast({
        title: "Job Deleted",
        description: "The job has been deleted successfully."
      });
      setIsDeleteDialogOpen(false);
      setDeletingJobId(null);
    }
  };
  
  /**
   * Handle job run action
   */
  const handleRunJob = (id: string) => {
    onRunJob(id);
    toast({
      title: "Job Started",
      description: "The job is now running."
    });
  };
  
  /**
   * Handle job cancel action
   */
  const handleCancelJob = (id: string) => {
    onCancelJob(id);
    toast({
      title: "Job Cancelled",
      description: "The job has been cancelled."
    });
  };
  
  /**
   * Handle enable/disable job
   */
  const toggleJobEnabled = (job: ETLJob) => {
    if (job.enabled) {
      onDisableJob(job.id);
      toast({
        title: "Job Disabled",
        description: `Job "${job.name}" has been disabled.`
      });
    } else {
      onEnableJob(job.id);
      toast({
        title: "Job Enabled",
        description: `Job "${job.name}" has been enabled.`
      });
    }
  };
  
  /**
   * Handle viewing job runs
   */
  const handleViewJobRuns = (id: string) => {
    onViewJobRuns(id);
    setActiveTab("runs");
  };
  
  /**
   * Handle opening run details
   */
  const handleViewRunDetails = (run: JobRun) => {
    setSelectedRunDetails(run);
    setIsRunDetailsDialogOpen(true);
  };
  
  /**
   * Duplicate a job
   */
  const duplicateJob = (job: ETLJob) => {
    const newJob: ETLJob = {
      ...job,
      id: `job-${Date.now()}`,
      name: `${job.name} (Copy)`,
      enabled: false, // Disable by default
      schedule: undefined // Remove schedule from copy
    };
    
    onAddJob(newJob);
    toast({
      title: "Job Duplicated",
      description: `Job "${job.name}" has been duplicated.`
    });
  };
  
  /**
   * Get job status badge
   */
  const getJobStatusBadge = (jobId: string) => {
    // Check if job is currently running
    if (runningJobs.includes(jobId)) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <RotateCw className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    }
    
    // Get the latest run for this job
    const latestRun = jobRuns
      .filter(run => run.jobId === jobId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
    
    if (!latestRun) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Never Run
        </Badge>
      );
    }
    
    // Return badge based on status
    switch (latestRun.status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Square className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };
  
  /**
   * Get run status badge
   */
  const getRunStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <RotateCw className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Square className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };
  
  /**
   * Format schedule for display
   */
  const formatSchedule = (schedule?: JobSchedule): string => {
    if (!schedule) return 'Not scheduled';
    
    const scheduleStr = getScheduleString(schedule);
    
    if (scheduleStr.includes('@once')) {
      return 'Run once';
    } else if (scheduleStr.includes('@hourly')) {
      return 'Hourly';
    } else if (scheduleStr.includes('@daily')) {
      return 'Daily';
    } else if (scheduleStr.includes('@weekly')) {
      return 'Weekly';
    } else if (scheduleStr.includes('@monthly')) {
      return 'Monthly';
    } else {
      return `Cron: ${scheduleStr}`;
    }
  };
  
  /**
   * Format date for display
   */
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleString();
  };
  
  /**
   * Format duration
   */
  const formatDuration = (startTime: Date | string, endTime?: Date | string): string => {
    if (!endTime) return 'In progress';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
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
   * Render job form dialog
   */
  const renderJobFormDialog = () => {
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingJob ? "Edit Job" : "Add Job"}</DialogTitle>
          <DialogDescription>
            Configure an ETL job to extract, transform, and load data
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Job Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                placeholder="Description (optional)"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sources">Data Sources</Label>
            <Select
              value={formValues.sources.join(',')}
              onValueChange={(value) => handleMultiSelectChange("sources", value.split(',').filter(v => v !== ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data sources" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((source) => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2">
              {formValues.sources.map((sourceId) => {
                const source = dataSources.find(s => s.id.toString() === sourceId);
                return source ? (
                  <Badge key={sourceId} className="mr-2 mb-2">
                    {source.name}
                    <button 
                      className="ml-1 hover:text-red-500"
                      onClick={() => handleMultiSelectChange(
                        "sources", 
                        formValues.sources.filter(id => id !== sourceId)
                      )}
                    >
                      ×
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transformations">Transformations</Label>
            <Select
              value={formValues.transformations.join(',')}
              onValueChange={(value) => handleMultiSelectChange("transformations", value.split(',').filter(v => v !== ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transformations" />
              </SelectTrigger>
              <SelectContent>
                {transformations.map((transformation) => (
                  <SelectItem key={transformation.id} value={transformation.id.toString()}>
                    {transformation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2">
              {formValues.transformations.map((transformationId) => {
                const transformation = transformations.find(t => t.id.toString() === transformationId);
                return transformation ? (
                  <Badge key={transformationId} className="mr-2 mb-2">
                    {transformation.name}
                    <button 
                      className="ml-1 hover:text-red-500"
                      onClick={() => handleMultiSelectChange(
                        "transformations", 
                        formValues.transformations.filter(id => id !== transformationId)
                      )}
                    >
                      ×
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destinations">Destinations</Label>
            <Select
              value={formValues.destinations.join(',')}
              onValueChange={(value) => handleMultiSelectChange("destinations", value.split(',').filter(v => v !== ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destinations" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((source) => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2">
              {formValues.destinations.map((destinationId) => {
                const destination = dataSources.find(s => s.id.toString() === destinationId);
                return destination ? (
                  <Badge key={destinationId} className="mr-2 mb-2">
                    {destination.name}
                    <button 
                      className="ml-1 hover:text-red-500"
                      onClick={() => handleMultiSelectChange(
                        "destinations", 
                        formValues.destinations.filter(id => id !== destinationId)
                      )}
                    >
                      ×
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleType">Schedule</Label>
              <Select
                value={formValues.scheduleType}
                onValueChange={handleScheduleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Schedule</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="once">Run Once</SelectItem>
                  <SelectItem value="cron">Custom (Cron)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              {formValues.scheduleType === "cron" && (
                <>
                  <Label htmlFor="cronExpression">Cron Expression</Label>
                  <Input
                    id="cronExpression"
                    name="cronExpression"
                    value={formValues.cronExpression}
                    onChange={handleInputChange}
                    placeholder="* * * * *"
                  />
                </>
              )}
              
              {formValues.scheduleType === "recurring" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="recurringInterval">Interval</Label>
                    <Select
                      value={formValues.recurringInterval}
                      onValueChange={(value) => handleSelectChange("recurringInterval", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="recurringTime">Time</Label>
                    <Input
                      id="recurringTime"
                      name="recurringTime"
                      type="time"
                      value={formValues.recurringTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
              
              {formValues.scheduleType === "once" && (
                <>
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    value={formValues.scheduledDate}
                    onChange={handleInputChange}
                  />
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={formValues.enabled}
                onCheckedChange={(checked) => handleCheckboxChange("enabled", !!checked)}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="continueOnError"
                checked={formValues.continueOnError}
                onCheckedChange={(checked) => handleCheckboxChange("continueOnError", !!checked)}
              />
              <Label htmlFor="continueOnError">Continue on Error</Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingJob ? "Update" : "Add"} Job
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };
  
  /**
   * Render schedule dialog
   */
  const renderScheduleDialog = () => {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Job</DialogTitle>
          <DialogDescription>
            Configure when this job should run
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="scheduleType">Schedule Type</Label>
            <Select
              value={formValues.scheduleType}
              onValueChange={handleScheduleTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select schedule type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Schedule</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="once">Run Once</SelectItem>
                <SelectItem value="cron">Custom (Cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formValues.scheduleType === "cron" && (
            <div className="space-y-2">
              <Label htmlFor="cronExpression">Cron Expression</Label>
              <Input
                id="cronExpression"
                name="cronExpression"
                value={formValues.cronExpression}
                onChange={handleInputChange}
                placeholder="* * * * *"
              />
              <p className="text-xs text-gray-500">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          )}
          
          {formValues.scheduleType === "recurring" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="recurringInterval">Interval</Label>
                <Select
                  value={formValues.recurringInterval}
                  onValueChange={(value) => handleSelectChange("recurringInterval", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recurringTime">Time</Label>
                <Input
                  id="recurringTime"
                  name="recurringTime"
                  type="time"
                  value={formValues.recurringTime}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
          
          {formValues.scheduleType === "once" && (
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                value={formValues.scheduledDate}
                onChange={handleInputChange}
              />
            </div>
          )}
          
          {formValues.scheduleType === "none" && (
            <div className="py-2 text-gray-500 text-sm">
              The job will not be scheduled and can only be run manually.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleScheduleSubmit}>
            {formValues.scheduleType === "none" ? "Remove Schedule" : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };
  
  /**
   * Render run details dialog
   */
  const renderRunDetailsDialog = () => {
    if (!selectedRunDetails) return null;
    
    const job = jobs.find(j => j.id === selectedRunDetails.jobId);
    
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run Details</DialogTitle>
          <DialogDescription>
            {job ? job.name : 'Job'} - Run {selectedRunDetails.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">Status</h4>
              <div className="mt-1">{getRunStatusBadge(selectedRunDetails.status)}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Duration</h4>
              <div className="mt-1">
                {formatDuration(selectedRunDetails.startTime, selectedRunDetails.endTime)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">Start Time</h4>
              <div className="mt-1">{formatDate(selectedRunDetails.startTime)}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">End Time</h4>
              <div className="mt-1">
                {selectedRunDetails.endTime ? formatDate(selectedRunDetails.endTime) : 'In progress'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">Records Processed</h4>
              <div className="mt-1">{selectedRunDetails.recordsProcessed}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Records Loaded</h4>
              <div className="mt-1">{selectedRunDetails.recordsLoaded || 'N/A'}</div>
            </div>
          </div>
          
          {selectedRunDetails.errors && selectedRunDetails.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-600">Errors</h4>
              <ScrollArea className="h-24 border rounded mt-1 p-2">
                <ul className="list-disc pl-5 text-sm text-red-600">
                  {selectedRunDetails.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
          
          {selectedRunDetails.warnings && selectedRunDetails.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-600">Warnings</h4>
              <ScrollArea className="h-24 border rounded mt-1 p-2">
                <ul className="list-disc pl-5 text-sm text-yellow-600">
                  {selectedRunDetails.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
          
          {selectedRunDetails.logs && selectedRunDetails.logs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium">Logs</h4>
              <ScrollArea className="h-40 border rounded mt-1 p-2 font-mono text-xs whitespace-pre">
                {selectedRunDetails.logs.join('\n')}
              </ScrollArea>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRunDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>ETL Jobs</CardTitle>
          <CardDescription>Manage and schedule ETL jobs</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="runs">History</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {activeTab === 'jobs' && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="jobs" className="mt-0">
          {jobs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No jobs added yet. Click "Add Job" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sources</TableHead>
                  <TableHead>Transformations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className={!job.enabled ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="font-medium">{job.name}</div>
                      {job.description && (
                        <div className="text-sm text-gray-500">{job.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatSchedule(job.schedule)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getJobStatusBadge(job.id)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.sources?.length || 0} source(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.transformations?.length || 0} transformation(s)
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          
                          {runningJobs.includes(job.id) ? (
                            <DropdownMenuItem onClick={() => handleCancelJob(job.id)}>
                              <Square className="w-4 h-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRunJob(job.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Run Now
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => {
                            setSchedulingJobId(job.id);
                            setIsScheduleDialogOpen(true);
                          }}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => toggleJobEnabled(job)}>
                            {job.enabled ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleViewJobRuns(job.id)}>
                            <List className="w-4 h-4 mr-2" />
                            View Runs
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => {
                            setEditingJob(job);
                            setIsDialogOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => duplicateJob(job)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(job.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="runs" className="mt-0">
          {jobRuns.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No job runs yet. Run a job to see its history.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...jobRuns]
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((run) => {
                    const job = jobs.find(j => j.id === run.jobId);
                    
                    return (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="font-medium">
                            {job?.name || `Job ${run.jobId}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(run.startTime)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(run.startTime, run.endTime)}
                        </TableCell>
                        <TableCell>
                          {getRunStatusBadge(run.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span>{run.recordsProcessed}</span>
                            {run.recordsLoaded && (
                              <span className="text-sm text-gray-500">
                                / {run.recordsLoaded} loaded
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRunDetails(run)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </CardContent>
      
      {isDialogOpen && renderJobFormDialog()}
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        {renderScheduleDialog()}
      </Dialog>
      
      <Dialog open={isRunDetailsDialogOpen} onOpenChange={setIsRunDetailsDialogOpen}>
        {renderRunDetailsDialog()}
      </Dialog>
    </Card>
  );
};

export default JobManager;