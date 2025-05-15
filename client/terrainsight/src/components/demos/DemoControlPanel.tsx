/**
 * Demo Control Panel
 * 
 * This component provides an interface for launching and controlling
 * demo scenarios for presentations and stakeholder demonstrations.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Square, SkipForward, RotateCw } from 'lucide-react';
import { demoScenarios, DemoScenario, DemoStep } from '../../utils/demoScenarios';

export interface DemoControlPanelProps {
  onScenarioSelect?: (scenario: DemoScenario) => void;
  onStepExecute?: (scenario: DemoScenario, step: DemoStep) => void;
  onDemoComplete?: (scenario: DemoScenario) => void;
  className?: string;
}

export function DemoControlPanel({ 
  onScenarioSelect, 
  onStepExecute, 
  onDemoComplete,
  className 
}: DemoControlPanelProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const selectedScenario = demoScenarios.find(s => s.id === selectedScenarioId);
  
  // Calculate progress percentage based on current step
  useEffect(() => {
    if (selectedScenario && activeStep >= 0) {
      const totalSteps = selectedScenario.steps.length;
      const newProgress = Math.round(((activeStep + 1) / totalSteps) * 100);
      setProgress(newProgress);
    } else {
      setProgress(0);
    }
  }, [selectedScenario, activeStep]);
  
  // Handle scenario selection
  const handleScenarioSelect = (id: string) => {
    setSelectedScenarioId(id);
    setActiveStep(-1);
    setIsRunning(false);
    setIsPaused(false);
    setProgress(0);
    setStatusMessage(`Selected scenario: ${demoScenarios.find(s => s.id === id)?.name}`);
    
    const scenario = demoScenarios.find(s => s.id === id);
    if (scenario && onScenarioSelect) {
      onScenarioSelect(scenario);
    }
  };
  
  // Start running the demo
  const handleStartDemo = async () => {
    if (!selectedScenario) return;
    
    setIsRunning(true);
    setIsPaused(false);
    setActiveStep(0);
    setStatusMessage(`Starting demo: ${selectedScenario.name}`);
    
    // Run through steps automatically
    for (let i = 0; i < selectedScenario.steps.length; i++) {
      if (!isRunning || isPaused) break;
      
      setActiveStep(i);
      const step = selectedScenario.steps[i];
      setStatusMessage(`Executing: ${step.title}`);
      
      // Execute the step
      step.action();
      if (onStepExecute) {
        onStepExecute(selectedScenario, step);
      }
      
      // Pause between steps
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Demo complete
    setIsRunning(false);
    setStatusMessage(`Demo complete: ${selectedScenario.name}`);
    if (onDemoComplete) {
      onDemoComplete(selectedScenario);
    }
  };
  
  // Pause the demo
  const handlePauseDemo = () => {
    setIsPaused(true);
    setStatusMessage('Demo paused');
  };
  
  // Resume the demo
  const handleResumeDemo = () => {
    setIsPaused(false);
    setStatusMessage('Demo resumed');
  };
  
  // Stop the demo
  const handleStopDemo = () => {
    setIsRunning(false);
    setIsPaused(false);
    setActiveStep(-1);
    setProgress(0);
    setStatusMessage('Demo stopped');
  };
  
  // Execute next step manually
  const handleNextStep = () => {
    if (!selectedScenario) return;
    
    const nextStep = activeStep + 1;
    if (nextStep < selectedScenario.steps.length) {
      setActiveStep(nextStep);
      const step = selectedScenario.steps[nextStep];
      setStatusMessage(`Executing: ${step.title}`);
      step.action();
      
      if (onStepExecute) {
        onStepExecute(selectedScenario, step);
      }
    } else {
      setIsRunning(false);
      setStatusMessage(`Demo complete: ${selectedScenario.name}`);
      
      if (onDemoComplete) {
        onDemoComplete(selectedScenario);
      }
    }
  };
  
  // Reset the demo
  const handleResetDemo = () => {
    setActiveStep(-1);
    setIsRunning(false);
    setIsPaused(false);
    setProgress(0);
    setStatusMessage(`Reset demo: ${selectedScenario?.name}`);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Demo Control Panel
          {isRunning && <Badge variant="outline" className="ml-2 bg-green-100">Running</Badge>}
          {isPaused && <Badge variant="outline" className="ml-2 bg-yellow-100">Paused</Badge>}
        </CardTitle>
        <CardDescription>
          Launch and control demonstration scenarios for presentations
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Scenario Selection */}
          <div className="space-y-2">
            <label htmlFor="scenario-select" className="text-sm font-medium">
              Select Demo Scenario
            </label>
            <Select 
              value={selectedScenarioId}
              onValueChange={handleScenarioSelect}
              disabled={isRunning}
            >
              <SelectTrigger id="scenario-select">
                <SelectValue placeholder="Choose a scenario" />
              </SelectTrigger>
              <SelectContent>
                {demoScenarios.map(scenario => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Selected Scenario Info */}
          {selectedScenario && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">{selectedScenario.name}</h3>
              <p className="text-sm text-gray-600">{selectedScenario.description}</p>
              <Separator className="my-2" />
              <div className="text-sm">
                <span className="font-medium">Steps: </span>
                {selectedScenario.steps.length}
              </div>
            </div>
          )}
          
          {/* Progress Bar */}
          {selectedScenario && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
          
          {/* Current Step */}
          {selectedScenario && activeStep >= 0 && activeStep < selectedScenario.steps.length && (
            <div className="space-y-1 p-3 bg-blue-50 rounded-md">
              <span className="text-xs text-blue-600">Current Step:</span>
              <h4 className="font-medium">{selectedScenario.steps[activeStep].title}</h4>
              <p className="text-sm">{selectedScenario.steps[activeStep].description}</p>
            </div>
          )}
          
          {/* Status Message */}
          {statusMessage && (
            <Alert variant="default" className="bg-gray-50">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          {/* Start/Resume Button */}
          {!isRunning && !isPaused && (
            <Button onClick={handleStartDemo} disabled={!selectedScenario}>
              <Play className="mr-1 h-4 w-4" />
              Start Demo
            </Button>
          )}
          
          {/* Pause Button */}
          {isRunning && !isPaused && (
            <Button variant="outline" onClick={handlePauseDemo}>
              <Pause className="mr-1 h-4 w-4" />
              Pause
            </Button>
          )}
          
          {/* Resume Button */}
          {isRunning && isPaused && (
            <Button variant="outline" onClick={handleResumeDemo}>
              <Play className="mr-1 h-4 w-4" />
              Resume
            </Button>
          )}
          
          {/* Stop Button */}
          {(isRunning || isPaused) && (
            <Button variant="destructive" onClick={handleStopDemo}>
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          )}
        </div>
        
        <div className="space-x-2">
          {/* Next Step Button */}
          <Button 
            variant="outline" 
            onClick={handleNextStep} 
            disabled={!selectedScenario || activeStep >= (selectedScenario?.steps.length || 0) - 1}
          >
            <SkipForward className="mr-1 h-4 w-4" />
            Next Step
          </Button>
          
          {/* Reset Button */}
          <Button 
            variant="outline" 
            onClick={handleResetDemo} 
            disabled={!selectedScenario}
          >
            <RotateCw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}