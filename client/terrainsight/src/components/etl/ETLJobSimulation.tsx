import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TransformationProgress } from "./TransformationProgress";
import { TransformationType, JobStatus } from "../../services/etl/ETLTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, XCircle, Clock, BarChart3, Database, ArrowDownToLine, FileSearch, RefreshCw } from "lucide-react";
import { StepProgressAnimation, Step } from "./StepProgressAnimation";

interface ETLJobSimulationProps {
  jobName?: string;
  showJobMetrics?: boolean;
  autoStart?: boolean;
  presetScenario?: "success" | "partial_success" | "failure";
  onComplete?: (success: boolean, metrics: any) => void;
}

/**
 * ETL Job Simulation Component
 * 
 * Demonstrates a realistic ETL job execution with animated visuals of the process
 * including data extraction, transformation, loading, and proper error handling
 */
export const ETLJobSimulation: React.FC<ETLJobSimulationProps> = ({
  jobName = "Property Data ETL Process",
  showJobMetrics = true,
  autoStart = false,
  presetScenario = "success",
  onComplete
}) => {
  // ETL job state
  const [jobStatus, setJobStatus] = useState<JobStatus>(JobStatus.IDLE);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [jobStartTime, setJobStartTime] = useState<Date | null>(null);
  const [jobEndTime, setJobEndTime] = useState<Date | null>(null);
  const [dataVolume, setDataVolume] = useState<number>(1000);
  const [showNarrative, setShowNarrative] = useState<boolean>(true);
  const [processingSpeed, setProcessingSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [currentTab, setCurrentTab] = useState<string>("process");
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    recordsTotal: dataVolume,
    recordsProcessed: 0,
    recordsSuccess: 0,
    recordsError: 0,
    recordsSkipped: 0,
    extractionTimeMs: 0,
    transformationTimeMs: 0,
    loadingTimeMs: 0,
    totalTimeMs: 0,
    progress: 0
  });
  
  // Step definitions for the ETL process
  const processSteps = [
    {
      id: "connect",
      name: "Connect to Source", // Keep for backward compatibility
      title: "Connect to Source", // Add for new components
      type: TransformationType.TRANSFORM,
      description: "Connecting to SQL database"
    },
    {
      id: "extract",
      name: "Extract Property Data", // Keep for backward compatibility
      title: "Extract Property Data", // Add for new components
      type: TransformationType.TRANSFORM,
      description: "Retrieving property records"
    },
    {
      id: "validate",
      name: "Validate Data Format", // Keep for backward compatibility
      title: "Validate Data Format", // Add for new components
      type: TransformationType.VALIDATE,
      description: "Checking data integrity"
    },
    {
      id: "clean",
      name: "Clean Property Records", // Keep for backward compatibility
      title: "Clean Property Records", // Add for new components
      type: TransformationType.CLEAN,
      description: "Standardizing address formats"
    },
    {
      id: "transform",
      name: "Transform to Target Schema", // Keep for backward compatibility
      title: "Transform to Target Schema", // Add for new components
      type: TransformationType.TRANSFORM,
      description: "Mapping to target fields"
    },
    {
      id: "enrich",
      name: "Enrich with Geocoding", // Keep for backward compatibility
      title: "Enrich with Geocoding", // Add for new components
      type: TransformationType.ENRICH,
      description: "Adding coordinate data"
    },
    {
      id: "load",
      name: "Load to Target System", // Keep for backward compatibility
      title: "Load to Target System", // Add for new components
      type: TransformationType.TRANSFORM,
      description: "Storing in property database"
    }
  ];
  
  // Convert process steps to workflow steps
  const workflowSteps: Step[] = [
    {
      id: "initialize",
      title: "Initialize",
      description: "Job setup",
    },
    {
      id: "extract_data",
      title: "Extract",
      description: "Get source data",
    },
    {
      id: "process_data",
      title: "Process",
      description: "Transform data",
    },
    {
      id: "validate_results",
      title: "Validate",
      description: "Check quality",
    },
    {
      id: "load_data",
      title: "Load",
      description: "Store results",
    },
    {
      id: "finalize",
      title: "Finalize",
      description: "Complete job",
    }
  ];
  
  // Job narrative based on steps
  const getNarrative = (stepIndex: number): string => {
    switch (stepIndex) {
      case 0:
        return "Establishing connection to SQL Server data source...";
      case 1:
        return `Extracting ${metrics.recordsTotal.toLocaleString()} property records from source database...`;
      case 2:
        return "Validating data format and integrity. Checking for missing required fields...";
      case 3:
        return "Standardizing address formats and normalizing text fields...";
      case 4:
        return "Transforming source data schema to target format. Mapping fields and converting types...";
      case 5:
        return "Enriching records with geocoding data. Adding latitude and longitude...";
      case 6:
        return "Loading processed data to target database. Creating indices...";
      default:
        return "Processing data...";
    }
  };
  
  // Get the error message based on the preset scenario
  const getErrorForScenario = (stepIndex: number): string | null => {
    if (presetScenario === "failure" && stepIndex === 1) {
      return "extract: Failed to connect to source database after 3 attempts";
    }
    
    if (presetScenario === "partial_success" && stepIndex === 5) {
      return "enrich: Geocoding API rate limit exceeded for 127 records";
    }
    
    return null;
  };
  
  // Calculate workflow step from process step
  const getWorkflowStep = (processStepIndex: number): number => {
    if (processStepIndex <= 0) return 0; // Initialize
    if (processStepIndex === 1) return 1; // Extract
    if (processStepIndex >= 2 && processStepIndex <= 4) return 2; // Process
    if (processStepIndex === 5) return 3; // Validate
    if (processStepIndex === 6) return 4; // Load
    return 5; // Finalize
  };
  
  // Handle starting the ETL job
  const startJob = useCallback(() => {
    setJobStatus(JobStatus.RUNNING);
    setJobStartTime(new Date());
    setJobEndTime(null);
    setCurrentStep(0);
    setErrors([]);
    setMetrics({
      ...metrics,
      recordsTotal: dataVolume,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 0,
      recordsSkipped: 0,
      extractionTimeMs: 0,
      transformationTimeMs: 0,
      loadingTimeMs: 0,
      totalTimeMs: 0,
      progress: 0
    });
  }, [dataVolume, metrics]);
  
  // Handle canceling the ETL job
  const cancelJob = () => {
    setJobStatus(JobStatus.CANCELLED);
    setJobEndTime(new Date());
    
    if (onComplete) {
      onComplete(false, metrics);
    }
  };
  
  // Handle step completion
  const handleStepComplete = (stepId: string, stepIndex: number) => {
    // Check if there should be an error based on the scenario
    const errorMessage = getErrorForScenario(stepIndex);
    
    if (errorMessage) {
      setErrors(prev => [...prev, errorMessage]);
      setJobStatus(JobStatus.ERROR);
      setJobEndTime(new Date());
      
      if (onComplete) {
        onComplete(false, metrics);
      }
      return;
    }
    
    // Update metrics based on step
    let newMetrics = { ...metrics };
    
    if (stepIndex === 1) { // Extract
      newMetrics.extractionTimeMs = getRandomDuration(500, 2000);
      newMetrics.recordsProcessed = Math.floor(dataVolume * 0.2);
    } else if (stepIndex >= 2 && stepIndex <= 5) { // Transform steps
      const stepProgress = (stepIndex - 1) / (processSteps.length - 2);
      newMetrics.transformationTimeMs += getRandomDuration(300, 1500);
      newMetrics.recordsProcessed = Math.floor(dataVolume * Math.min(0.2 + stepProgress * 0.6, 0.8));
      
      // Add some errors for partial success
      if (presetScenario === "partial_success") {
        const errorCount = Math.floor(dataVolume * 0.05);
        newMetrics.recordsError = errorCount;
        newMetrics.recordsSuccess = newMetrics.recordsProcessed - errorCount;
      } else {
        newMetrics.recordsSuccess = newMetrics.recordsProcessed;
      }
    } else if (stepIndex === 6) { // Load
      newMetrics.loadingTimeMs = getRandomDuration(400, 1800);
      newMetrics.recordsProcessed = dataVolume;
      
      if (presetScenario === "partial_success") {
        const errorCount = Math.floor(dataVolume * 0.05);
        const skippedCount = Math.floor(dataVolume * 0.03);
        newMetrics.recordsError = errorCount;
        newMetrics.recordsSkipped = skippedCount;
        newMetrics.recordsSuccess = dataVolume - errorCount - skippedCount;
      } else {
        newMetrics.recordsSuccess = dataVolume;
      }
      
      newMetrics.totalTimeMs = newMetrics.extractionTimeMs + newMetrics.transformationTimeMs + newMetrics.loadingTimeMs;
      
      // Complete job
      setJobStatus(JobStatus.SUCCESS);
      setJobEndTime(new Date());
      
      if (onComplete) {
        onComplete(true, newMetrics);
      }
    }
    
    // Update progress percentage
    newMetrics.progress = Math.round((stepIndex + 1) / processSteps.length * 100);
    
    setMetrics(newMetrics);
    
    // Move to next step if not at the end
    if (stepIndex < processSteps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };
  
  // Helper to get random duration (simulating varying processing times)
  const getRandomDuration = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
  
  // Get duration in MS between job start and end
  const getJobDuration = (): number => {
    if (!jobStartTime) return 0;
    const endTime = jobEndTime || new Date();
    return endTime.getTime() - jobStartTime.getTime();
  };
  
  // Format duration in a readable format
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Auto-start the job if enabled
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        startJob();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, startJob]);
  
  // Get step delay based on processing speed
  const getStepDelay = (): number => {
    switch (processingSpeed) {
      case "slow": return 5000;
      case "fast": return 1500;
      default: return 3000;
    }
  };
  
  // Render job status badge
  const renderStatusBadge = () => {
    switch (jobStatus) {
      case JobStatus.IDLE:
        return <Badge variant="outline" className="text-gray-500"><Clock className="w-3 h-3 mr-1" /> Ready</Badge>;
      case JobStatus.RUNNING:
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>;
      case JobStatus.SUCCESS:
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>;
      case JobStatus.ERROR:
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case JobStatus.CANCELLED:
        return <Badge className="bg-amber-100 text-amber-800"><XCircle className="w-3 h-3 mr-1" /> Canceled</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500"><Clock className="w-3 h-3 mr-1" /> Unknown</Badge>;
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{jobName}</CardTitle>
            <CardDescription>ETL Process Simulation</CardDescription>
          </div>
          {renderStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Job Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startJob}
            disabled={jobStatus === JobStatus.RUNNING}
            className="flex-shrink-0"
          >
            Start Job
          </Button>
          
          <Button
            onClick={cancelJob}
            disabled={jobStatus !== JobStatus.RUNNING}
            variant="outline"
            className="flex-shrink-0"
          >
            Cancel Job
          </Button>
          
          <div className="flex-grow">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Select
                  value={processingSpeed}
                  onValueChange={(value: "slow" | "normal" | "fast") => setProcessingSpeed(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="data-volume" className="flex-shrink-0 w-24">Data Volume:</Label>
                  <Slider
                    id="data-volume"
                    defaultValue={[1000]}
                    min={100}
                    max={10000}
                    step={100}
                    onValueChange={(values) => setDataVolume(values[0])}
                    className="flex-grow"
                    disabled={jobStatus === JobStatus.RUNNING}
                  />
                  <div className="w-16 text-right text-sm text-gray-500">{dataVolume.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Configuration toggles */}
        <div className="flex flex-wrap gap-4 pb-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-narrative"
              checked={showNarrative}
              onCheckedChange={setShowNarrative}
            />
            <Label htmlFor="show-narrative">Show Narrative</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-metrics"
              checked={showJobMetrics}
              onCheckedChange={setShowNarrative}
              disabled
            />
            <Label htmlFor="show-metrics">Show Metrics</Label>
          </div>
        </div>
        
        <Separator />
        
        {/* Process visualization tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="process">Process Steps</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="process" className="mt-4">
            {/* Narrative */}
            {showNarrative && jobStatus === JobStatus.RUNNING && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-200"
              >
                {getNarrative(currentStep)}
              </motion.div>
            )}
            
            {/* Transformation steps visualization */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <TransformationProgress
                steps={processSteps}
                isRunning={jobStatus === JobStatus.RUNNING}
                currentStep={currentStep}
                speed={processingSpeed}
                errors={errors}
                onComplete={() => console.log("Process complete")}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="workflow" className="mt-4">
            {/* Workflow step visualization */}
            <div className="bg-gray-50 p-6 rounded-md border mb-4">
              <StepProgressAnimation
                steps={workflowSteps}
                currentStep={jobStatus === JobStatus.RUNNING ? getWorkflowStep(currentStep) : 0}
                animated={jobStatus === JobStatus.RUNNING}
                size="md"
                speed={processingSpeed}
              />
            </div>
            
            {/* Current workflow stage description */}
            {jobStatus === JobStatus.RUNNING && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="font-medium">
                  {workflowSteps[getWorkflowStep(currentStep)].title} Stage
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  {currentStep === 0 && "Preparing job and connection to source systems"}
                  {currentStep === 1 && "Extracting data from source database"}
                  {currentStep >= 2 && currentStep <= 4 && "Processing and transforming data"}
                  {currentStep === 5 && "Validating transformed data quality and integrity"}
                  {currentStep === 6 && "Loading data to target systems"}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Metrics */}
        {showJobMetrics && (
          <>
            <Separator />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-md border">
                <div className="text-sm text-gray-500">Records</div>
                <div className="text-2xl font-semibold">{metrics.recordsProcessed.toLocaleString()}</div>
                <div className="text-xs text-gray-500">of {metrics.recordsTotal.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border">
                <div className="text-sm text-gray-500">Success</div>
                <div className="text-2xl font-semibold text-green-600">
                  {metrics.recordsSuccess.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {metrics.recordsTotal > 0 
                    ? Math.round((metrics.recordsSuccess / metrics.recordsTotal) * 100) 
                    : 0}%
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border">
                <div className="text-sm text-gray-500">Errors</div>
                <div className="text-2xl font-semibold text-red-600">
                  {metrics.recordsError.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {metrics.recordsTotal > 0 
                    ? Math.round((metrics.recordsError / metrics.recordsTotal) * 100) 
                    : 0}%
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="text-2xl font-semibold">
                  {formatDuration(getJobDuration())}
                </div>
                <div className="text-xs text-gray-500">
                  {jobStatus === JobStatus.RUNNING ? "In progress" : "Total time"}
                </div>
              </div>
            </div>
            
            {/* Timing breakdown */}
            {(jobStatus === JobStatus.SUCCESS || jobStatus === JobStatus.ERROR) && (
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <FileSearch className="text-blue-500 w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium">Extract</div>
                    <div className="text-xs text-gray-500">{formatDuration(metrics.extractionTimeMs)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RefreshCw className="text-purple-500 w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium">Transform</div>
                    <div className="text-xs text-gray-500">{formatDuration(metrics.transformationTimeMs)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ArrowDownToLine className="text-green-500 w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium">Load</div>
                    <div className="text-xs text-gray-500">{formatDuration(metrics.loadingTimeMs)}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ETLJobSimulation;