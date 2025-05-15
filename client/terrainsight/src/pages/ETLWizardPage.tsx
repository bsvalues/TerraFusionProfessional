import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import ETLProcessWizard from "../components/etl/ETLProcessWizard";
import { ETLJob, DataSource, Transformation, JobStatus } from "../services/etl/ETLTypes";
import { etlPipelineManager } from "../services/etl/ETLPipelineManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 as LoaderIcon, CheckCircle as CheckCircleIcon, XCircle as XCircleIcon } from "lucide-react";

const ETLWizardPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [transformationRules, setTransformationRules] = useState<Transformation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<{ status: 'idle' | 'creating' | 'success' | 'error', message?: string }>({ status: 'idle' });
  
  useEffect(() => {
    // Fetch data sources and transformation rules
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get data sources and transformations
        const sources = await etlPipelineManager.getAllDataSources();
        const transformations = await etlPipelineManager.getAllTransformationRules();
        
        setDataSources(sources);
        setTransformationRules(transformations);
      } catch (error) {
        console.error("Error loading ETL configuration data:", error);
        setError("Failed to load ETL configuration data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const handleFinishWizard = async (jobConfig: Partial<ETLJob>) => {
    setCreationStatus({ status: 'creating' });
    
    try {
      // Enable the job by default
      const completeConfig: Partial<ETLJob> = {
        ...jobConfig,
        enabled: true,
      };
      
      // Create new job
      const newJob = await etlPipelineManager.createJob(completeConfig);
      console.log("Created new ETL job:", newJob);
      
      setCreationStatus({ 
        status: 'success', 
        message: `Job "${completeConfig.name}" created successfully!` 
      });
      
      // Navigate back after a short delay to show the success screen
      setTimeout(() => {
        setLocation("/etl-management");
      }, 3000);
    } catch (error) {
      console.error("Error creating ETL job:", error);
      setCreationStatus({ 
        status: 'error', 
        message: `Failed to create ETL job: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };
  
  const handleCancelWizard = () => {
    setLocation("/etl-management");
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="w-full shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[400px]">
            <LoaderIcon className="h-16 w-16 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-medium">Loading ETL Configuration...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we prepare the wizard</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="w-full shadow-lg border-destructive">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[400px]">
            <XCircleIcon className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-medium">Error Loading Configuration</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button 
              variant="ghost" 
              className="mt-2"
              onClick={() => setLocation("/etl-management")}
            >
              Return to ETL Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (creationStatus.status === 'success') {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="w-full shadow-lg border-success">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[400px]">
            <CheckCircleIcon className="h-16 w-16 text-success mb-4" />
            <h2 className="text-2xl font-medium">ETL Job Created Successfully!</h2>
            <p className="text-muted-foreground mt-2">{creationStatus.message}</p>
            <p className="text-sm text-muted-foreground mt-4">Redirecting to ETL Management...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New ETL Process</h1>
        <Button 
          variant="outline"
          onClick={handleCancelWizard}
        >
          Cancel
        </Button>
      </div>
      
      {creationStatus.status === 'error' && (
        <Card className="w-full shadow-lg border-destructive mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <XCircleIcon className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Failed to Create ETL Job</h3>
                <p className="text-sm text-muted-foreground">{creationStatus.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <ETLProcessWizard
        onFinish={handleFinishWizard}
        onCancel={handleCancelWizard}
        dataSources={dataSources}
        transformationRules={transformationRules}
        isSubmitting={creationStatus.status === 'creating'}
      />
    </div>
  );
};

export default ETLWizardPage;