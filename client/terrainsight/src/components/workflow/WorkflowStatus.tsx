import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkflowStep = {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
};

export type WorkflowProcess = {
  id: string;
  title: string;
  description?: string;
  steps: WorkflowStep[];
  currentStepId: string;
};

interface WorkflowStatusProps {
  process: WorkflowProcess;
  className?: string;
  onStepClick?: (stepId: string) => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'current':
      return <Clock className="h-5 w-5 text-primary" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
};

export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({ 
  process, 
  className,
  onStepClick 
}) => {
  const { steps, currentStepId } = process;
  
  // Find the index of the current step
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  
  return (
    <div className={cn("bg-background rounded-lg p-4 border", className)}>
      <h3 className="text-base font-medium mb-1">{process.title}</h3>
      {process.description && (
        <p className="text-sm text-muted-foreground mb-4">{process.description}</p>
      )}
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          // Determine if this step is before or after the current step
          const isCompleted = index < currentStepIndex || (index === currentStepIndex && step.status === 'completed');
          const isCurrent = index === currentStepIndex && step.status === 'current';
          const isError = step.status === 'error';
          
          return (
            <div key={step.id} className={cn(
              "flex items-center gap-4 p-3 rounded-md transition-colors",
              (isCurrent || isError) && "bg-muted",
              onStepClick && "cursor-pointer hover:bg-muted/80"
            )} onClick={() => onStepClick && onStepClick(step.id)}>
              <div className="flex-shrink-0">
                <StatusIcon status={step.status} />
              </div>
              
              <div className="flex-grow">
                <div className={cn(
                  "font-medium text-sm",
                  isCurrent && "text-primary",
                  isError && "text-destructive"
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </div>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-shrink-0 text-muted-foreground/30">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStatus;