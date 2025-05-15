import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { StepProgressAnimation } from "./StepProgressAnimation";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Database,
  FileText,
  RefreshCw,
  Server,
  Globe,
  Upload,
  Download,
  Settings,
  Filter,
  Layers,
  Table,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ETLJob, 
  DataSource, 
  Transformation, 
  JobStatus, 
  DataSourceType, 
  TransformationType, 
  ETLJobRun,
  JobFrequency
} from "../../services/etl/ETLTypes";
import { LoadingAnimation } from "../ui/loading-animation";
import { TransformationAnimation } from "./TransformationAnimation";

interface ETLProcessWizardProps {
  onFinish: (jobConfig: Partial<ETLJob>) => void;
  onCancel: () => void;
  dataSources: DataSource[];
  transformationRules: Transformation[];
  isSubmitting?: boolean;
}

// Steps in the wizard
export enum WizardStep {
  BASIC_INFO = 0,
  DATA_SOURCES = 1,
  TRANSFORMATIONS = 2,
  DESTINATION = 3,
  SCHEDULING = 4,
  REVIEW = 5,
  SUCCESS = 6
}

const ETLProcessWizard: React.FC<ETLProcessWizardProps> = ({
  onFinish,
  onCancel,
  dataSources,
  transformationRules,
  isSubmitting
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BASIC_INFO);
  const [processing, setProcessing] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  // Job configuration state
  const [jobConfig, setJobConfig] = useState<Partial<ETLJob>>({
    name: "",
    description: "",
    sources: [],
    destinations: [],
    transformations: [],
    enabled: true,
    schedule: {
      frequency: JobFrequency.MANUAL,
      startTime: "",
      daysOfWeek: [],
    }
  });

  // Step status tracking
  const [stepsCompleted, setStepsCompleted] = useState<boolean[]>([
    false, // Basic Info
    false, // Data Sources
    false, // Transformations
    false, // Destination
    false, // Scheduling
    false  // Review
  ]);

  // Smart suggestions
  const [suggestions, setSuggestions] = useState({
    recommendedSources: [] as number[],
    recommendedTransformations: [] as number[],
    recommendedSchedule: "",
    optimizationTips: [] as string[]
  });

  // Calculate overall progress
  const calculateProgress = (): number => {
    const completedSteps = stepsCompleted.filter(Boolean).length;
    return (completedSteps / stepsCompleted.length) * 100;
  };

  // Generate smart suggestions based on current selections
  useEffect(() => {
    // This would normally call an AI service or backend algorithm
    // For now, we'll simulate some basic suggestions

    // Recommend data sources based on selected transformations
    const recommendedSources: number[] = [];
    if (jobConfig.transformations?.includes(1)) { // If geographic transformation is selected
      const geoSources = dataSources
        .filter(ds => ds.type === DataSourceType.GEOSPATIAL)
        .map(ds => ds.id);
      recommendedSources.push(...geoSources);
    }

    // Recommend transformations based on selected data sources
    const recommendedTransformations: number[] = [];
    if (jobConfig.sources?.some(id => {
      const source = dataSources.find(ds => ds.id === id);
      return source?.type === DataSourceType.FILE_CSV;
    })) {
      // For CSV files, recommend data cleaning and validation transformations
      const cleaningRules = transformationRules
        .filter(tr => tr.type === TransformationType.CLEAN || tr.type === TransformationType.VALIDATE)
        .map(tr => tr.id);
      recommendedTransformations.push(...cleaningRules);
    }

    // Recommend schedule based on data volume/type
    let recommendedSchedule = "manual";
    if (jobConfig.sources && jobConfig.sources.length > 2) {
      recommendedSchedule = "daily"; // If many sources, daily might be better than real-time
    }

    // Generate optimization tips
    const optimizationTips: string[] = [];
    if (jobConfig.transformations && jobConfig.transformations.length > 3) {
      optimizationTips.push("Consider combining similar transformations to improve performance");
    }
    if (jobConfig.sources && jobConfig.sources.length > 0 && (!jobConfig.transformations || jobConfig.transformations.length === 0)) {
      optimizationTips.push("Add validation transformations to ensure data quality");
    }

    setSuggestions({
      recommendedSources,
      recommendedTransformations,
      recommendedSchedule,
      optimizationTips
    });
  }, [jobConfig.sources, jobConfig.transformations, dataSources, transformationRules]);

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    switch (currentStep) {
      case WizardStep.BASIC_INFO:
        if (!jobConfig.name) {
          errors.name = "Job name is required";
        } else if (jobConfig.name.length < 3) {
          errors.name = "Job name must be at least 3 characters";
        }
        break;
        
      case WizardStep.DATA_SOURCES:
        if (!jobConfig.sources || jobConfig.sources.length === 0) {
          errors.sources = "At least one data source must be selected";
        }
        break;
        
      case WizardStep.DESTINATION:
        if (!jobConfig.destinations || jobConfig.destinations.length === 0) {
          errors.destinations = "At least one destination must be selected";
        }
        break;
        
      // Other steps validation as needed
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Move to next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      // Update steps completed
      const newStepsCompleted = [...stepsCompleted];
      newStepsCompleted[currentStep] = true;
      setStepsCompleted(newStepsCompleted);
      
      setCurrentStep((prev) => prev + 1 as WizardStep);
    }
  };

  // Move to previous step
  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1 as WizardStep);
  };

  // Handle form submission
  const handleFinish = () => {
    if (validateCurrentStep()) {
      // If using external isSubmitting prop, don't need to manage local state
      if (!isSubmitting) {
        setProcessing(true);
      }
      
      // Update steps completed
      const newStepsCompleted = [...stepsCompleted];
      newStepsCompleted[WizardStep.REVIEW] = true;
      setStepsCompleted(newStepsCompleted);
      
      // Call the onFinish callback with the job configuration
      onFinish(jobConfig);
      
      // If using isSubmitting, the parent component manages the state
      // Otherwise, move to success after a delay for loading animation
      if (!isSubmitting) {
        setTimeout(() => {
          setProcessing(false);
          setCurrentStep(WizardStep.SUCCESS);
        }, 2000);
      }
    }
  };

  // Render helper for source/destination selection
  const renderDataSourceSelection = (selectionType: 'source' | 'destination') => {
    const isSource = selectionType === 'source';
    const selectedIds = isSource ? jobConfig.sources || [] : jobConfig.destinations || [];
    const filteredSources = dataSources.filter(source => 
      isSource ? !source.config.options?.target : source.config.options?.target
    );
    
    const handleSourceToggle = (id: number, checked: boolean) => {
      const currentSelected = isSource ? jobConfig.sources || [] : jobConfig.destinations || [];
      
      let newSelected = currentSelected.slice();
      if (checked) {
        newSelected.push(id);
      } else {
        newSelected = newSelected.filter(sourceId => sourceId !== id);
      }
      
      setJobConfig({
        ...jobConfig,
        ...(isSource ? { sources: newSelected } : { destinations: newSelected })
      });
    };

    return (
      <div className="space-y-4">
        <div className="font-medium text-sm">
          {isSource ? 'Select Data Sources' : 'Select Destinations'}
        </div>
        
        {validationErrors[isSource ? 'sources' : 'destinations'] && (
          <div className="text-red-500 text-sm mb-2">
            {validationErrors[isSource ? 'sources' : 'destinations']}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map(source => (
            <div key={source.id} className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
              <Checkbox 
                id={`${selectionType}-${source.id}`}
                checked={selectedIds.includes(source.id)}
                onCheckedChange={(checked) => handleSourceToggle(source.id, checked === true)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor={`${selectionType}-${source.id}`}
                  className="font-medium"
                >
                  {source.name}
                </Label>
                {source.description && (
                  <p className="text-sm text-gray-500">{source.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {source.type}
                  </Badge>
                  {suggestions.recommendedSources.includes(source.id) && isSource && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredSources.length === 0 && (
            <div className="col-span-2 text-center p-4 text-gray-500">
              No {isSource ? 'data sources' : 'destinations'} available
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render transformation selection
  const renderTransformationSelection = () => {
    const handleTransformationToggle = (id: number, checked: boolean) => {
      const currentSelected = jobConfig.transformations || [];
      
      let newSelected = currentSelected.slice();
      if (checked) {
        newSelected.push(id);
      } else {
        newSelected = newSelected.filter(trId => trId !== id);
      }
      
      setJobConfig({
        ...jobConfig,
        transformations: newSelected
      });
    };

    return (
      <div className="space-y-4">
        <div className="font-medium text-sm">Select Transformations</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transformationRules.map(rule => (
            <div key={rule.id} className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
              <Checkbox 
                id={`transformation-${rule.id}`}
                checked={(jobConfig.transformations || []).includes(rule.id)}
                onCheckedChange={(checked) => handleTransformationToggle(rule.id, checked === true)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor={`transformation-${rule.id}`}
                  className="font-medium"
                >
                  {rule.name}
                </Label>
                {rule.description && (
                  <p className="text-sm text-gray-500">{rule.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {rule.type}
                  </Badge>
                  {suggestions.recommendedTransformations.includes(rule.id) && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {transformationRules.length === 0 && (
            <div className="col-span-2 text-center p-4 text-gray-500">
              No transformation rules available
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render scheduling options
  const renderSchedulingOptions = () => {
    return (
      <div className="space-y-4">
        <div className="font-medium text-sm mb-2">Job Scheduling</div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedule-frequency">Frequency</Label>
              <Select 
                value={jobConfig.schedule?.frequency || 'manual'} 
                onValueChange={(value) => {
                  setJobConfig({
                    ...jobConfig,
                    schedule: {
                      ...jobConfig.schedule,
                      frequency: value
                    }
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={JobFrequency.MANUAL}>Manual (On-demand)</SelectItem>
                  <SelectItem value={JobFrequency.HOURLY}>Hourly</SelectItem>
                  <SelectItem value={JobFrequency.DAILY}>Daily</SelectItem>
                  <SelectItem value={JobFrequency.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={JobFrequency.MONTHLY}>Monthly</SelectItem>
                </SelectContent>
              </Select>
              
              {suggestions.recommendedSchedule && suggestions.recommendedSchedule !== (jobConfig.schedule?.frequency || 'manual') && (
                <div className="mt-1 text-xs text-green-600 flex items-center">
                  <span className="mr-1">Recommendation:</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">{suggestions.recommendedSchedule}</Badge>
                </div>
              )}
            </div>
            
            {jobConfig.schedule?.frequency !== JobFrequency.MANUAL && (
              <div>
                <Label htmlFor="schedule-time">Run Time</Label>
                <Input 
                  id="schedule-time" 
                  type="time" 
                  value={(jobConfig.schedule?.startTime as string) || ''}
                  onChange={(e) => {
                    setJobConfig({
                      ...jobConfig,
                      schedule: {
                        ...jobConfig.schedule,
                        startTime: e.target.value
                      }
                    });
                  }}
                />
              </div>
            )}
          </div>
          
          {jobConfig.schedule?.frequency === JobFrequency.WEEKLY && (
            <div>
              <Label className="mb-2 block">Days of the Week</Label>
              <div className="flex space-x-2 flex-wrap gap-y-2">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                  <div key={day} className="flex items-center space-x-1">
                    <Checkbox 
                      id={`day-${index}`}
                      checked={(jobConfig.schedule?.daysOfWeek || []).includes(index)}
                      onCheckedChange={(checked) => {
                        const currentDays = jobConfig.schedule?.daysOfWeek || [];
                        let newDays = [...currentDays];
                        
                        if (checked) {
                          if (!newDays.includes(index)) {
                            newDays.push(index);
                          }
                        } else {
                          newDays = newDays.filter(d => d !== index);
                        }
                        
                        setJobConfig({
                          ...jobConfig,
                          schedule: {
                            ...jobConfig.schedule,
                            daysOfWeek: newDays
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`day-${index}`} className="text-sm">{day.slice(0, 3)}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="job-enabled"
              checked={jobConfig.enabled !== false}
              onCheckedChange={(checked) => {
                setJobConfig({
                  ...jobConfig,
                  enabled: checked === true
                });
              }}
            />
            <Label htmlFor="job-enabled">Enable job after creation</Label>
          </div>
        </div>
      </div>
    );
  };

  // Render the review step
  const renderReview = () => {
    // Find data source and transformation names
    const sourceNames = (jobConfig.sources || []).map(id => {
      const source = dataSources.find(s => s.id === id);
      return source?.name || `Source #${id}`;
    });
    
    const destinationNames = (jobConfig.destinations || []).map(id => {
      const dest = dataSources.find(s => s.id === id);
      return dest?.name || `Destination #${id}`;
    });
    
    const transformationNames = (jobConfig.transformations || []).map(id => {
      const transform = transformationRules.find(t => t.id === id);
      return transform?.name || `Transformation #${id}`;
    });

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Review ETL Job Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Basic Information</h4>
              <div className="mt-1">
                <div className="font-medium">{jobConfig.name}</div>
                <div className="text-sm text-gray-600">{jobConfig.description}</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Data Sources</h4>
              <div className="mt-1">
                {sourceNames.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {sourceNames.map((name, i) => (
                      <li key={i} className="text-sm">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-600">No data sources selected</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Destinations</h4>
              <div className="mt-1">
                {destinationNames.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {destinationNames.map((name, i) => (
                      <li key={i} className="text-sm">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-600">No destinations selected</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Transformations</h4>
              <div className="mt-1">
                {transformationNames.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {transformationNames.map((name, i) => (
                      <li key={i} className="text-sm">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-600">No transformations selected</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Schedule</h4>
              <div className="mt-1">
                <div className="text-sm">
                  Frequency: <span className="font-medium">{jobConfig.schedule?.frequency || 'Manual'}</span>
                </div>
                
                {jobConfig.schedule?.frequency !== JobFrequency.MANUAL && jobConfig.schedule?.startTime && (
                  <div className="text-sm">
                    Time: <span className="font-medium">{jobConfig.schedule.startTime}</span>
                  </div>
                )}
                
                {jobConfig.schedule?.frequency === JobFrequency.WEEKLY && jobConfig.schedule?.daysOfWeek && jobConfig.schedule.daysOfWeek.length > 0 && (
                  <div className="text-sm">
                    Days: <span className="font-medium">
                      {jobConfig.schedule.daysOfWeek.map(day => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}
                    </span>
                  </div>
                )}
                
                <div className="text-sm mt-1">
                  Status: <span className={`font-medium ${jobConfig.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {jobConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {suggestions.optimizationTips.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800">Optimization Suggestions</h4>
            <ul className="list-disc list-inside mt-2">
              {suggestions.optimizationTips.map((tip, i) => (
                <li key={i} className="text-sm text-blue-700">{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render success step
  const renderSuccessStep = () => {
    return (
      <div className="text-center py-6">
        <div className="bg-green-50 inline-flex rounded-full p-4 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-xl font-medium">ETL Job Created Successfully!</h3>
        <p className="text-gray-500 mt-2 mb-6">Your ETL job has been created and is ready to run.</p>
        
        <div className="flex flex-col space-y-4 items-center">
          <Button onClick={onCancel}>
            Return to ETL Dashboard
          </Button>
          
          <Button variant="outline">
            View Job Details
          </Button>
        </div>
      </div>
    );
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.BASIC_INFO:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-name">Job Name</Label>
              <Input 
                id="job-name" 
                value={jobConfig.name || ''} 
                onChange={(e) => setJobConfig({ ...jobConfig, name: e.target.value })}
                error={validationErrors.name}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job-description">Description</Label>
              <textarea 
                id="job-description" 
                className="w-full min-h-[100px] p-2 border rounded-md" 
                value={jobConfig.description || ''} 
                onChange={(e) => setJobConfig({ ...jobConfig, description: e.target.value })}
              />
            </div>
          </div>
        );
        
      case WizardStep.DATA_SOURCES:
        return renderDataSourceSelection('source');
        
      case WizardStep.TRANSFORMATIONS:
        return renderTransformationSelection();
        
      case WizardStep.DESTINATION:
        return renderDataSourceSelection('destination');
        
      case WizardStep.SCHEDULING:
        return renderSchedulingOptions();
        
      case WizardStep.REVIEW:
        return renderReview();
        
      case WizardStep.SUCCESS:
        return renderSuccessStep();
        
      default:
        return null;
    }
  };

  // Navigation buttons
  const renderNavButtons = () => {
    if (currentStep === WizardStep.SUCCESS) {
      return null;
    }
    
    return (
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === WizardStep.BASIC_INFO ? onCancel : handlePreviousStep}
          disabled={processing || isSubmitting}
        >
          {currentStep === WizardStep.BASIC_INFO ? (
            "Cancel"
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </>
          )}
        </Button>
        
        {currentStep === WizardStep.REVIEW ? (
          <Button 
            onClick={handleFinish}
            disabled={processing || isSubmitting}
          >
            {processing || isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Create Job
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNextStep}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    );
  };

  // Step indicator
  const renderStepIndicator = () => {
    if (currentStep === WizardStep.SUCCESS) {
      return null;
    }
    
    // Create steps array from step titles matching the Step interface from StepProgressAnimation
    const steps = stepTitles.slice(0, -1).map((title, index) => ({
      id: index.toString(),
      title: title, // Changed from 'name' to 'title' to match StepProgressAnimation Step interface
      description: `Step ${index + 1}`,
    }));
    
    // Calculate completed steps indices
    const completedStepsIndices = stepsCompleted
      .map((isComplete, idx) => isComplete ? idx : -1)
      .filter(idx => idx !== -1);
      
    return (
      <div className="mb-6">
        <StepProgressAnimation 
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedStepsIndices}
          vertical={false}
          animated={processing || isSubmitting}
          speed="normal"
        />
      </div>
    );
  };

  const stepTitles = [
    "Basic Information",
    "Select Data Sources",
    "Configure Transformations",
    "Choose Destinations",
    "Schedule Job",
    "Review Configuration",
    "Success"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {currentStep !== WizardStep.SUCCESS ? 
            "Intelligent ETL Process Wizard" : 
            "ETL Job Created"
          }
        </CardTitle>
        {currentStep !== WizardStep.SUCCESS && (
          <CardDescription>
            {stepTitles[currentStep]} ({currentStep + 1}/{stepTitles.length - 1})
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {renderStepIndicator()}
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex flex-col">
        {renderNavButtons()}
      </CardFooter>
    </Card>
  );
};

export default ETLProcessWizard;