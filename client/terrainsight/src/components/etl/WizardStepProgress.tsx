import React from "react";
import { StepProgressAnimation, Step } from "./StepProgressAnimation";

export interface WizardStep {
  id: string | number;
  name: string;  // Keep for backward compatibility
  title?: string; // Add this for new components
  description?: string;
}

interface WizardStepProgressProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps?: number[];
  vertical?: boolean;
  className?: string;
}

/**
 * WizardStepProgress - Compatibility wrapper for StepProgressAnimation
 * 
 * This component wraps the more advanced StepProgressAnimation component to maintain
 * backward compatibility with the existing ETLProcessWizard component.
 */
export const WizardStepProgress: React.FC<WizardStepProgressProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  vertical = false,
  className
}) => {
  // Convert WizardStep interface to Step interface for StepProgressAnimation
  const convertedSteps: Step[] = steps.map(step => ({
    id: String(step.id), // Ensure id is a string
    title: step.title || step.name, // Use title if available, otherwise fall back to name
    description: step.description
  }));
  
  return (
    <StepProgressAnimation
      steps={convertedSteps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      vertical={vertical}
      animated={false}
      className={className}
    />
  );
};

export default WizardStepProgress;