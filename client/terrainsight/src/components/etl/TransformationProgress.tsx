import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TransformationAnimation } from "./TransformationAnimation";
import { TransformationType } from "../../services/etl/ETLTypes";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface TransformationProgressProps {
  steps: {
    id: string;
    name?: string; // Keep for backward compatibility
    title?: string; // Add this for new components
    type: TransformationType;
    description?: string;
  }[];
  isRunning: boolean;
  currentStep?: number;
  progress?: number;
  onComplete?: () => void;
  errors?: string[];
  speed?: "slow" | "normal" | "fast";
}

/**
 * Component to display the progress of multiple transformation steps
 */
export const TransformationProgress: React.FC<TransformationProgressProps> = ({
  steps,
  isRunning,
  currentStep = 0,
  progress = 0,
  onComplete,
  errors = [],
  speed = "normal"
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Reset state when isRunning changes to false
  useEffect(() => {
    if (!isRunning) {
      setActiveStep(0);
      setCompletedSteps([]);
      setAnimationComplete(false);
    }
  }, [isRunning]);
  
  // Update active step based on progress or current step
  useEffect(() => {
    if (!isRunning) return;
    
    if (currentStep >= 0 && currentStep < steps.length) {
      setActiveStep(currentStep);
    }
  }, [currentStep, isRunning, steps.length]);
  
  // Handle step completion
  const handleStepComplete = (stepId: string, index: number) => {
    if (completedSteps.includes(stepId)) return;
    
    setCompletedSteps((prev) => [...prev, stepId]);
    
    // Move to next step if available
    if (index < steps.length - 1) {
      setActiveStep(index + 1);
    } else {
      // All steps completed
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  };
  
  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (progress > 0) {
      return progress;
    }
    
    return Math.min(100, (completedSteps.length / steps.length) * 100);
  };
  
  // Check if a step has an error
  const hasError = (stepId: string) => {
    return errors.some(err => err.includes(stepId));
  };
  
  // Get status badge for a step
  const getStepStatus = (step: { id: string }, index: number) => {
    if (hasError(step.id)) {
      return (
        <Badge variant="destructive" className="ml-2 font-normal">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    }
    
    if (completedSteps.includes(step.id)) {
      return (
        <Badge variant="outline" className="ml-2 font-normal bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    }
    
    if (activeStep === index && isRunning) {
      return (
        <Badge variant="outline" className="ml-2 font-normal bg-blue-100 text-blue-800">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mr-1"
          >
            <Clock className="w-3 h-3" />
          </motion.div>
          Running
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="ml-2 font-normal text-gray-500">
        Pending
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">Overall Progress</div>
          <div className="text-sm text-gray-500">
            {completedSteps.length} of {steps.length} completed
          </div>
        </div>
        <Progress value={calculateOverallProgress()} className="h-2" />
      </div>
      
      {/* Current animation */}
      {isRunning && !animationComplete && activeStep < steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 p-4 rounded-md border"
        >
          <TransformationAnimation
            transformationType={steps[activeStep].type}
            isActive={isRunning}
            speed={speed}
            showText={true}
            onComplete={() => handleStepComplete(steps[activeStep].id, activeStep)}
          />
          <div className="text-center mt-3 text-sm font-medium">
            Processing: {steps[activeStep].title || steps[activeStep].name}
          </div>
          {steps[activeStep].description && (
            <div className="text-center mt-1 text-xs text-gray-500">
              {steps[activeStep].description}
            </div>
          )}
        </motion.div>
      )}
      
      {/* Step list */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Transformation Steps</div>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center p-3 rounded-md border 
                ${activeStep === index && isRunning ? 'bg-blue-50 border-blue-200' : ''}
                ${completedSteps.includes(step.id) ? 'bg-green-50 border-green-200' : ''}
                ${hasError(step.id) ? 'bg-red-50 border-red-200' : ''}
              `}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="font-medium">{step.title || step.name}</div>
                  {getStepStatus(step, index)}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                )}
                {hasError(step.id) && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.find(err => err.includes(step.id))}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 ml-4">
                <TransformationAnimation
                  transformationType={step.type}
                  isActive={activeStep === index && isRunning}
                  showText={false}
                  size="sm"
                  speed={speed}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Error summary */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 p-4 rounded-md border border-red-200"
        >
          <div className="font-medium text-red-800 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Transformation Errors ({errors.length})
          </div>
          <ul className="mt-2 text-sm text-red-700 space-y-1 list-disc pl-5">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </motion.div>
      )}
      
      {/* Completion message */}
      {completedSteps.length === steps.length && steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 p-4 rounded-md border border-green-200 text-center"
        >
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="font-medium text-green-800">All transformations completed successfully!</div>
          <div className="text-sm text-green-600 mt-1">
            {steps.length} transformation {steps.length === 1 ? 'step' : 'steps'} processed
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransformationProgress;