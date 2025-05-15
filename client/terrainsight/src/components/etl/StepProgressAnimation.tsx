import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { 
  Circle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowDown, 
  AlertCircle 
} from "lucide-react";

export interface Step {
  id: string;
  title: string;
  description?: string;
  error?: string;
  isCritical?: boolean;
}

export interface StepProgressAnimationProps {
  steps: Step[];
  currentStep?: number;
  completedSteps?: number[];
  failedSteps?: number[];
  vertical?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  speed?: "slow" | "normal" | "fast";
  onComplete?: () => void;
  onError?: (stepIndex: number, error: string) => void;
  className?: string;
}

// Define step icon variants (using class-variance-authority)
const stepIconVariants = cva(
  "flex items-center justify-center rounded-full border transition-all duration-300",
  {
    variants: {
      size: {
        sm: "w-6 h-6 text-xs",
        md: "w-8 h-8 text-sm",
        lg: "w-10 h-10 text-base"
      },
      state: {
        pending: "border-gray-300 bg-white text-gray-400",
        active: "border-blue-500 bg-blue-50 text-blue-500 animate-pulse shadow-sm",
        success: "border-green-500 bg-green-50 text-green-500",
        error: "border-red-500 bg-red-50 text-red-500"
      }
    },
    defaultVariants: {
      size: "md",
      state: "pending"
    }
  }
);

// Define step connector variants
const connectorVariants = cva(
  "transition-all duration-300",
  {
    variants: {
      size: {
        sm: "h-0.5 w-8",
        md: "h-0.5 w-12",
        lg: "h-0.5 w-16"
      },
      orientation: {
        horizontal: "",
        vertical: ""
      },
      state: {
        pending: "bg-gray-200",
        active: "bg-blue-300",
        success: "bg-green-300",
        error: "bg-red-300"
      }
    },
    defaultVariants: {
      size: "md",
      orientation: "horizontal",
      state: "pending"
    }
  }
);

// Define step label variants
const stepLabelVariants = cva(
  "font-medium transition-colors duration-300",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base"
      },
      state: {
        pending: "text-gray-500",
        active: "text-blue-700",
        success: "text-green-700",
        error: "text-red-700"
      }
    },
    defaultVariants: {
      size: "md",
      state: "pending"
    }
  }
);

// Define step description variants
const stepDescVariants = cva(
  "transition-colors duration-300 whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-xs",
        lg: "text-sm"
      },
      state: {
        pending: "text-gray-400",
        active: "text-blue-600",
        success: "text-green-600",
        error: "text-red-600"
      }
    },
    defaultVariants: {
      size: "md",
      state: "pending"
    }
  }
);

/**
 * Step Progress Animation
 * 
 * A component that displays a series of steps with animated transitions between them.
 * Supports both horizontal and vertical layouts and multiple size options.
 */
export const StepProgressAnimation: React.FC<StepProgressAnimationProps> = ({
  steps = [],
  currentStep = 0,
  completedSteps = [],
  failedSteps = [],
  vertical = false,
  size = "md",
  animated = true,
  speed = "normal",
  onComplete,
  onError,
  className
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [completedStepsList, setCompletedStepsList] = useState<number[]>(completedSteps);
  const [failedStepsList, setFailedStepsList] = useState<number[]>(failedSteps);
  
  // Set transition delays based on speed
  const getTransitionDelay = () => {
    switch (speed) {
      case "slow": return 3000; // 3 seconds
      case "fast": return 800; // 0.8 seconds
      default: return 1500; // 1.5 seconds (normal)
    }
  };
  
  // Update internal state when props change
  useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);
  
  useEffect(() => {
    setCompletedStepsList(completedSteps);
  }, [completedSteps]);
  
  useEffect(() => {
    setFailedStepsList(failedSteps);
  }, [failedSteps]);
  
  // Auto-progress if animated
  useEffect(() => {
    if (!animated) return;
    
    // Set up progress timer
    const timeout = setTimeout(() => {
      const currentActive = activeStep;
      const isCompleted = completedStepsList.includes(currentActive);
      const isFailed = failedStepsList.includes(currentActive);
      
      // If not already completed or failed, mark as completed
      if (!isCompleted && !isFailed) {
        // Check if there is a defined error for this step
        const step = steps[currentActive];
        if (step?.error) {
          // Handle error
          setFailedStepsList(prev => [...prev, currentActive]);
          if (onError) {
            onError(currentActive, step.error);
          }
        } else {
          // Mark as completed 
          setCompletedStepsList(prev => [...prev, currentActive]);
        }
      }
      
      // Move to next step if not at end and not failed
      if (currentActive < steps.length - 1 && !isFailed) {
        setActiveStep(currentActive + 1);
      } else if (currentActive === steps.length - 1 && !isFailed) {
        // If at last step and completed, call onComplete
        if (onComplete && !isFailed) {
          onComplete();
        }
      }
    }, getTransitionDelay());
    
    return () => clearTimeout(timeout);
  }, [activeStep, animated, completedStepsList, failedStepsList, onComplete, onError, steps]);
  
  // Determine step state
  const getStepState = (index: number): "pending" | "active" | "success" | "error" => {
    if (failedStepsList.includes(index)) return "error";
    if (completedStepsList.includes(index)) return "success";
    if (index === activeStep) return "active";
    return "pending";
  };
  
  // Determine connector state
  const getConnectorState = (index: number): "pending" | "active" | "success" | "error" => {
    if (index >= steps.length - 1) return "pending"; // No connector after last step
    
    if (failedStepsList.includes(index)) return "error";
    if (completedStepsList.includes(index)) return "success";
    if (index === activeStep) return "active";
    return "pending";
  };
  
  // Determine connector position class based on orientation
  const getConnectorPositionClass = () => {
    return vertical 
      ? "flex-col items-center" // For vertical layout
      : "flex-row items-center"; // For horizontal layout
  };
  
  // Determine connector element based on orientation
  const renderConnector = (index: number) => {
    if (index >= steps.length - 1) return null;
    
    const state = getConnectorState(index);
    
    // For vertical connectors, use a taller line
    const verticalSizeMap = {
      sm: "w-0.5 h-8",
      md: "w-0.5 h-12", 
      lg: "w-0.5 h-16"
    };
    
    // Render arrow based on orientation
    const Arrow = vertical ? ArrowDown : ArrowRight;
    
    return (
      <div 
        className={`flex ${getConnectorPositionClass()} transition-all duration-500`}
      >
        {/* Line connector */}
        <div 
          className={cn(
            connectorVariants({ 
              size, 
              state,
              orientation: vertical ? "vertical" : "horizontal"
            }),
            vertical ? verticalSizeMap[size] : "", // Apply height for vertical orientation
          )}
        />
        
        {/* Animated arrow for active step */}
        {state === "active" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: vertical ? 0 : [0, 4, 0],
              y: vertical ? [0, 4, 0] : 0
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="absolute"
          >
            <Arrow 
              className={cn(
                "text-blue-500",
                size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
              )} 
            />
          </motion.div>
        )}
      </div>
    );
  };
  
  // Render step icon based on state
  const renderStepIcon = (step: Step, index: number) => {
    const state = getStepState(index);
    
    // Animation variants
    const circleVariants = {
      pending: { scale: 1 },
      active: { scale: [1, 1.1, 1], transition: { duration: 2, repeat: Infinity } },
      success: { scale: 1 },
      error: { scale: 1 }
    };
    
    // Size mapping for icons
    const iconSizeMap = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5"
    };
    
    return (
      <motion.div
        variants={circleVariants}
        animate={state}
        className={cn(
          stepIconVariants({ size, state }),
          "relative"
        )}
      >
        {state === "pending" && (
          <Circle className={iconSizeMap[size]} />
        )}
        
        {state === "active" && (
          <>
            <span className={`${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"} font-medium`}>
              {index + 1}
            </span>
            <motion.span 
              className="absolute inset-0 rounded-full border-2 border-blue-500"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
          </>
        )}
        
        {state === "success" && (
          <CheckCircle className={iconSizeMap[size]} />
        )}
        
        {state === "error" && (
          <>
            {step.isCritical ? (
              <XCircle className={iconSizeMap[size]} />
            ) : (
              <AlertCircle className={iconSizeMap[size]} />
            )}
          </>
        )}
      </motion.div>
    );
  };
  
  // Main render function
  return (
    <div className={cn(
      "flex",
      vertical ? "flex-col space-y-1" : "flex-row space-x-1 overflow-x-auto pb-2",
      className
    )}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id || index}>
          {/* Step content */}
          <div className={`flex ${vertical ? "flex-row items-start space-x-3" : "flex-col items-center"}`}>
            {/* Step icon */}
            {renderStepIcon(step, index)}
            
            {/* Step label & description (oriented based on layout) */}
            <div className={vertical ? "flex flex-col space-y-0.5 pt-0.5" : "mt-2 text-center max-w-[100px]"}>
              <div className={cn(
                stepLabelVariants({ 
                  size, 
                  state: getStepState(index)
                })
              )}>
                {step.title}
              </div>
              
              {step.description && (
                <div className={cn(
                  stepDescVariants({ 
                    size, 
                    state: getStepState(index)
                  })
                )}>
                  {step.description}
                </div>
              )}
              
              {/* Error message - only show for failed steps */}
              <AnimatePresence>
                {getStepState(index) === "error" && step.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-600 mt-1 max-w-[140px]"
                  >
                    {step.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Connector between steps */}
          {renderConnector(index)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepProgressAnimation;