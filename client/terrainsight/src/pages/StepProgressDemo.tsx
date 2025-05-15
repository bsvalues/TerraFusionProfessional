import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StepProgressAnimation, Step } from "../components/etl/StepProgressAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const StepProgressDemo = () => {
  // Demo configuration
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [animated, setAnimated] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [variant, setVariant] = useState<"horizontal" | "vertical">("horizontal");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [errorStep, setErrorStep] = useState<string | null>(null);
  
  // Steps for the ETL process example
  const steps: Step[] = [
    {
      id: "connect",
      title: "Connect",
      description: "Connect to data source",
      error: errorStep === "connect" ? "Connection failed" : undefined
    },
    {
      id: "extract",
      title: "Extract",
      description: "Extract source data",
      error: errorStep === "extract" ? "Extraction failed" : undefined
    },
    {
      id: "validate",
      title: "Validate",
      description: "Validate data quality",
      error: errorStep === "validate" ? "Validation failed" : undefined
    },
    {
      id: "transform",
      title: "Transform",
      description: "Transform data format",
      error: errorStep === "transform" ? "Transformation failed" : undefined
    },
    {
      id: "enrich",
      title: "Enrich",
      description: "Add additional data",
      error: errorStep === "enrich" ? "Enrichment failed" : undefined
    },
    {
      id: "load",
      title: "Load",
      description: "Load into target system",
      error: errorStep === "load" ? "Loading failed" : undefined
    }
  ];
  
  // Custom onboarding steps example
  const onboardingSteps: Step[] = [
    {
      id: "welcome",
      title: "Welcome",
      description: "Introduction to the system",
    },
    {
      id: "configure",
      title: "Configure",
      description: "Set up your preferences",
    },
    {
      id: "connect-data",
      title: "Connect Data",
      description: "Link your data sources",
    },
    {
      id: "finish",
      title: "Complete",
      description: "Start using the system",
    }
  ];
  
  // Progress the demo automatically
  useEffect(() => {
    if (errorStep) return;
    
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        clearInterval(interval);
      }
    }, speed === "slow" ? 3000 : speed === "fast" ? 1000 : 2000);
    
    return () => clearInterval(interval);
  }, [currentStep, speed, steps.length, errorStep]);
  
  // Restart the demo
  const handleRestart = () => {
    setCurrentStep(0);
    setErrorStep(null);
  };
  
  // Simulate an error
  const handleSimulateError = () => {
    const stepIndex = Math.min(currentStep, steps.length - 1);
    setErrorStep(steps[stepIndex].id);
  };
  
  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Step Progress Components</h1>
        <p className="text-gray-500 mb-8">Interactive components for visualizing ETL process steps and workflows</p>
        
        <div className="grid grid-cols-1 gap-8">
          {/* ETL Process Example */}
          <Card>
            <CardHeader>
              <CardTitle>ETL Process Flow</CardTitle>
              <CardDescription>Visualize the status of each step in an ETL pipeline process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-md border overflow-x-auto">
                <StepProgressAnimation
                  steps={showDescription ? steps : steps.map(step => ({ ...step, description: undefined })) }
                  currentStep={currentStep}
                  animated={animated}
                  speed={speed}
                  vertical={variant === "vertical"}
                  size={size}
                  onComplete={() => console.log("Process complete!")}
                />
              </div>
              
              <Separator />
              
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="variant">Layout Variant</Label>
                  <Select
                    value={variant}
                    onValueChange={(value: "horizontal" | "vertical") => setVariant(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                      <SelectItem value="vertical">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={size}
                    onValueChange={(value: "sm" | "md" | "lg") => setSize(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="speed">Animation Speed</Label>
                  <Select
                    value={speed}
                    onValueChange={(value: "slow" | "normal" | "fast") => setSpeed(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="animated"
                    checked={animated}
                    onCheckedChange={setAnimated}
                  />
                  <Label htmlFor="animated">Enable Animation</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="description"
                    checked={showDescription}
                    onCheckedChange={setShowDescription}
                  />
                  <Label htmlFor="description">Show Descriptions</Label>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleRestart}
                  variant="default"
                >
                  Restart Demo
                </Button>
                <Button
                  onClick={handleSimulateError}
                  variant="outline"
                >
                  Simulate Error
                </Button>
                <Button
                  onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length))}
                  variant="outline"
                >
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Onboarding Example */}
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Wizard Example</CardTitle>
              <CardDescription>A common pattern for user onboarding experiences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Usage Example</AlertTitle>
                <AlertDescription>
                  This example shows how the component can be used for onboarding flows, product tours, or setup wizards.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 p-6 rounded-md border overflow-x-auto">
                <StepProgressAnimation
                  steps={showDescription ? onboardingSteps : onboardingSteps.map(step => ({ ...step, description: undefined }))}
                  currentStep={Math.min(currentStep, onboardingSteps.length)}
                  animated={animated}
                  speed={speed}
                  vertical={false}
                  size={size}
                />
              </div>
              
              <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium">Onboarding Step Content</h3>
                <p className="text-gray-500 text-sm">
                  {currentStep < onboardingSteps.length 
                    ? `This area would contain the content for the "${onboardingSteps[currentStep].title}" step.`
                    : "Onboarding complete!"
                  }
                </p>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    disabled={currentStep >= onboardingSteps.length}
                    onClick={() => setCurrentStep(prev => Math.min(prev + 1, onboardingSteps.length))}
                  >
                    {currentStep >= onboardingSteps.length - 1 ? "Finish" : "Next"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default StepProgressDemo;