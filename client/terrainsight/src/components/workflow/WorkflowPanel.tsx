import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  HelpCircle, 
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  useWorkflow, 
  WorkflowType, 
  WorkflowStep as WorkflowStepType 
} from '@/contexts/WorkflowContext';
import { cn } from '@/lib/utils';

interface WorkflowStepProps {
  step: WorkflowStepType;
  isActive: boolean;
  onClick?: () => void;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ step, isActive, onClick }) => {
  const [, navigate] = useLocation();
  
  // Get status icon
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-primary" />;
      case 'error':
        return <Info className="h-5 w-5 text-destructive" />;
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center py-2 px-3 rounded-md gap-3 transition-colors",
        isActive && "bg-accent",
        step.path && "cursor-pointer hover:bg-accent/50",
        step.status === 'current' && "border-l-2 border-primary pl-[10px]"
      )}
      onClick={() => {
        if (step.path) {
          navigate(step.path);
        }
        if (onClick) {
          onClick();
        }
      }}
    >
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      <div className="flex-grow">
        <div className={cn(
          "text-sm font-medium",
          step.status === 'current' && "text-primary"
        )}>
          {step.label}
        </div>
        {step.description && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {step.description}
          </div>
        )}
      </div>
      {step.path && (
        <div className="flex-shrink-0">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

interface WorkflowPanelProps {
  className?: string;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ className }) => {
  const { workflows, activeWorkflow, updateWorkflowStep } = useWorkflow();
  const [open, setOpen] = React.useState(true);
  
  // If no active workflow, show nothing
  if (!activeWorkflow) {
    return null;
  }
  
  const workflow = workflows[activeWorkflow];
  const currentStep = workflow.steps.find(step => step.id === workflow.currentStepId);
  
  const handleStepClick = (stepId: string) => {
    updateWorkflowStep(activeWorkflow, stepId);
  };
  
  return (
    <Card className={cn("border shadow-sm", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{workflow.title}</CardTitle>
              <CardDescription className="text-xs">{workflow.description}</CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {open ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle workflow panel</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          
          {/* Show current step even when collapsed */}
          {!open && currentStep && (
            <div className="flex items-center mt-2 p-2 bg-accent rounded-md">
              <Clock className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm">Current: <span className="font-medium">{currentStep.label}</span></span>
            </div>
          )}
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-1">
              {workflow.steps.map((step) => (
                <WorkflowStep
                  key={step.id}
                  step={step}
                  isActive={step.id === workflow.currentStepId}
                  onClick={() => handleStepClick(step.id)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default WorkflowPanel;