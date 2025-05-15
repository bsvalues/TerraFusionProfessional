import React, { useState } from "react";
import { TransformationAnimation } from "../components/etl/TransformationAnimation";
import { TransformationProgress } from "../components/etl/TransformationProgress";
import { TransformationType } from "../services/etl/ETLTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const ETLAnimationDemo = () => {
  // Animation type state
  const [selectedTransformType, setSelectedTransformType] = useState<TransformationType>(TransformationType.TRANSFORM);
  const [isActive, setIsActive] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [showLabel, setShowLabel] = useState(true);
  const [selectedSize, setSelectedSize] = useState<"sm" | "md" | "lg">("md");
  
  // Progress component state
  const [isProgressActive, setIsProgressActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Example transformation steps
  const transformationSteps = [
    {
      id: "extract",
      name: "Extract from Database",
      type: TransformationType.TRANSFORM,
      description: "Pulling data from SQL Server"
    },
    {
      id: "clean",
      name: "Clean Property Data",
      type: TransformationType.CLEAN,
      description: "Removing invalid entries"
    },
    {
      id: "validate",
      name: "Validate Address Format",
      type: TransformationType.VALIDATE,
      description: "Checking address structure"
    },
    {
      id: "enrich",
      name: "Enrich with Geocoding",
      type: TransformationType.ENRICH,
      description: "Adding latitude and longitude"
    },
    {
      id: "transform",
      name: "Transform to Standard Format",
      type: TransformationType.TRANSFORM,
      description: "Converting to standard property schema"
    }
  ];
  
  // Handle starting and progressing through transformation steps
  const startTransformationProcess = () => {
    setIsProgressActive(true);
    setCurrentStep(0);
    setErrors([]);
    
    // Simulate progress through steps
    const progressInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < transformationSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(progressInterval);
          return prev;
        }
      });
    }, animationSpeed === "slow" ? 5000 : animationSpeed === "fast" ? 2000 : 3000);
    
    // Clear on unmount
    return () => clearInterval(progressInterval);
  };
  
  // Add a simulated error
  const addRandomError = () => {
    const stepIndex = Math.floor(Math.random() * transformationSteps.length);
    const step = transformationSteps[stepIndex];
    setErrors(prev => [...prev, `Error in ${step.id}: Failed to process data`]);
  };
  
  // Reset demo state
  const resetDemo = () => {
    setIsActive(false);
    setIsProgressActive(false);
    setCurrentStep(0);
    setErrors([]);
  };

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">ETL Animation Components</h1>
        <p className="text-gray-500 mb-8">Interactive components for ETL processes visualization</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Single animation demo */}
          <Card>
            <CardHeader>
              <CardTitle>Single Transformation Animation</CardTitle>
              <CardDescription>Visualize a single data transformation step</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md border flex items-center justify-center min-h-[180px]">
                <TransformationAnimation
                  transformationType={selectedTransformType}
                  isActive={isActive}
                  speed={animationSpeed}
                  showText={showLabel}
                  size={selectedSize}
                  onComplete={() => console.log("Animation complete!")}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transform-type">Transformation Type</Label>
                  <Select
                    value={selectedTransformType}
                    onValueChange={(value: TransformationType) => setSelectedTransformType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransformationType.TRANSFORM}>Transform</SelectItem>
                      <SelectItem value={TransformationType.CLEAN}>Clean</SelectItem>
                      <SelectItem value={TransformationType.VALIDATE}>Validate</SelectItem>
                      <SelectItem value={TransformationType.ENRICH}>Enrich</SelectItem>
                      <SelectItem value={TransformationType.FILTER}>Filter</SelectItem>
                      <SelectItem value={TransformationType.JOIN}>Join</SelectItem>
                      <SelectItem value={TransformationType.MAP}>Map</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="animation-speed">Animation Speed</Label>
                  <Select
                    value={animationSpeed}
                    onValueChange={(value: "slow" | "normal" | "fast") => setAnimationSpeed(value)}
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
                
                <div>
                  <Label htmlFor="animation-size">Size</Label>
                  <Select
                    value={selectedSize}
                    onValueChange={(value: "sm" | "md" | "lg") => setSelectedSize(value)}
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
                
                <div className="flex items-end space-x-2">
                  <Button
                    variant={isActive ? "outline" : "default"}
                    onClick={() => setIsActive(!isActive)}
                  >
                    {isActive ? "Stop" : "Start"} Animation
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowLabel(!showLabel)}
                  >
                    {showLabel ? "Hide" : "Show"} Label
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Process animation demo */}
          <Card>
            <CardHeader>
              <CardTitle>ETL Process Animation</CardTitle>
              <CardDescription>Visualize a complete ETL workflow with multiple steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TransformationProgress
                steps={transformationSteps}
                isRunning={isProgressActive}
                currentStep={currentStep}
                errors={errors}
                speed={animationSpeed}
                onComplete={() => console.log("Process complete!")}
              />
              
              <Separator />
              
              <div className="flex space-x-2">
                <Button
                  variant={isProgressActive ? "outline" : "default"}
                  onClick={isProgressActive ? resetDemo : startTransformationProcess}
                >
                  {isProgressActive ? "Reset" : "Start Process"}
                </Button>
                <Button
                  variant="outline"
                  onClick={addRandomError}
                  disabled={!isProgressActive}
                >
                  Simulate Error
                </Button>
                <div className="flex-1"></div>
                <Select
                  value={animationSpeed}
                  onValueChange={(value: "slow" | "normal" | "fast") => setAnimationSpeed(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default ETLAnimationDemo;