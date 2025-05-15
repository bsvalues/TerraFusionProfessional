import React, { useState } from 'react';
import { Workflow, FileText, CheckCircle, Circle, Play, Sliders, Code, Save, Copy, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScriptGroup, ScriptStep } from '@/shared/types';
import ScriptWorkflow from '../script/ScriptWorkflow';
import ScriptEditor from '../script/ScriptEditor';
import { Property } from '@shared/schema';

interface ScriptData {
  scriptGroups: ScriptGroup[];
  scriptSteps: ScriptStep[];
  sqlQueries: { name: string; description: string; }[];
}

interface ScriptPanelProps {
  properties?: Property[];
}

const ScriptPanel: React.FC<ScriptPanelProps> = ({ properties = [] }) => {
  // Sample script data
  const [scriptData, setScriptData] = useState<ScriptData>({
    scriptGroups: [
      { id: 'data-review', name: 'Data Review', active: false },
      { id: 'sales-review', name: 'Sales Review', active: false },
      { id: 'modeling-prep', name: 'Modeling Prep', active: true },
      { id: 'regression-analysis', name: 'Regression Analysis', active: false },
      { id: 'comp-analysis', name: 'Comparable Analysis', active: false },
      { id: 'report-generation', name: 'Report Generation', active: false }
    ],
    scriptSteps: [
      { id: 'compute-bppsf', name: 'Compute BPPSF', status: 'complete', type: 'compute', groupId: 'modeling-prep' },
      { id: 'compute-useablesale', name: 'Compute UseableSale', status: 'complete', type: 'compute', groupId: 'modeling-prep' },
      { id: 'compute-sizerange', name: 'Compute SIZERANGE', status: 'active', type: 'compute', groupId: 'modeling-prep' },
      { id: 'compute-outliertag', name: 'Compute OutlierTag', status: 'pending', type: 'compute', groupId: 'modeling-prep' },
      { id: 'group-by-neighborhood', name: 'Group By Neighborhood', status: 'pending', type: 'group', groupId: 'modeling-prep' },
      { id: 'combine-quality-condition', name: 'Combine Quality & Condition', status: 'pending', type: 'combine', groupId: 'modeling-prep' }
    ],
    sqlQueries: [
      { name: 'Prop Data SQL', description: 'Prop Data SQL' },
      { name: 'Property', description: 'Property' },
      { name: 'Permits', description: 'Permits' },
      { name: 'Land', description: 'Land' },
      { name: 'Property Links', description: 'Property Links' },
      { name: 'Field Work', description: 'Field Work' },
      { name: 'Sales', description: 'Sales' },
      { name: 'Base Tax Due', description: 'Base Tax Due' }
    ]
  });
  
  const [activeStep, setActiveStep] = useState<string>('compute-sizerange');
  const [runningScript, setRunningScript] = useState<boolean>(false);
  const [editorView, setEditorView] = useState<'script' | 'metadata'>('script');
  
  // Current script step code (sample)
  const currentStepCode = `' Create a SIZERANGE variable
If ([SQUAREFEET] < 1500) Then
    Return "Small"
ElseIf ([SQUAREFEET] >= 1500 And [SQUAREFEET] < 2500) Then
    Return "Medium"
ElseIf ([SQUAREFEET] >= 2500 And [SQUAREFEET] < 3500) Then
    Return "Large"
Else
    Return "Very Large"
End If`;
  
  // Get the active step details
  const currentStep = scriptData.scriptSteps.find(step => step.id === activeStep);
  
  // Function to run the script
  const runScript = () => {
    setRunningScript(true);
    setTimeout(() => {
      setRunningScript(false);
      
      // Update the active step and next step status
      const updatedSteps = [...scriptData.scriptSteps];
      const currentIndex = updatedSteps.findIndex(step => step.id === activeStep);
      
      if (currentIndex < updatedSteps.length - 1) {
        updatedSteps[currentIndex].status = 'complete';
        updatedSteps[currentIndex + 1].status = 'active';
        setActiveStep(updatedSteps[currentIndex + 1].id);
      } else {
        updatedSteps[currentIndex].status = 'complete';
      }
      
      setScriptData({
        ...scriptData,
        scriptSteps: updatedSteps
      });
    }, 2000);
  };
  
  // Handle script save
  const handleSaveScript = (code: string) => {
    console.log('Saving script:', code);
    // In a real application, this would update the script in the database
  };
  
  // Add a new script step
  const handleAddStep = (groupId?: string) => {
    const newStep: ScriptStep = {
      id: `step-${Date.now()}`,
      name: 'New Step',
      status: 'pending',
      type: 'compute',
      groupId: groupId,
    };
    
    setScriptData({
      ...scriptData,
      scriptSteps: [...scriptData.scriptSteps, newStep]
    });
    
    setActiveStep(newStep.id);
  };
  
  // Add a new script group
  const handleAddGroup = () => {
    const newGroup: ScriptGroup = {
      id: `group-${Date.now()}`,
      name: 'New Group',
      active: false
    };
    
    setScriptData({
      ...scriptData,
      scriptGroups: [...scriptData.scriptGroups, newGroup]
    });
  };
  
  // Delete a script step
  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = scriptData.scriptSteps.filter(step => step.id !== stepId);
    
    setScriptData({
      ...scriptData,
      scriptSteps: updatedSteps
    });
    
    // If we deleted the active step, select another one
    if (activeStep === stepId && updatedSteps.length > 0) {
      setActiveStep(updatedSteps[0].id);
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Left sidebar - Script workflow */}
      <div className="w-72 border-r border-border">
        <ScriptWorkflow 
          scriptGroups={scriptData.scriptGroups}
          scriptSteps={scriptData.scriptSteps}
          onSelectStep={setActiveStep}
          onAddStep={handleAddStep}
          onAddGroup={handleAddGroup}
          onRunStep={runScript}
          onDeleteStep={handleDeleteStep}
          selectedStepId={activeStep}
        />
      </div>
      
      {/* Main content - Script editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Code size={20} className="mr-2 text-primary" />
              Script Step: {currentStep?.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStep?.type === 'compute' && 'Creates a new variable based on existing data'}
              {currentStep?.type === 'group' && 'Groups records based on a common attribute'}
              {currentStep?.type === 'combine' && 'Combines multiple attributes into a new attribute'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={runningScript ? "outline" : "default"}
              disabled={runningScript}
              onClick={runScript}
              className="flex items-center"
            >
              {runningScript ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" />
                  <span>Run Step</span>
                </>
              )}
            </Button>
            <Button variant="outline" className="flex items-center">
              <Sliders size={16} className="mr-1" />
              <span>Configure</span>
            </Button>
          </div>
        </div>
        
        {/* Script content */}
        <div className="flex-1 overflow-hidden grid grid-cols-3 bg-muted/10">
          {/* Script Editor (2/3 width) */}
          <div className="col-span-2 p-4 overflow-auto border-r border-border">
            <ScriptEditor 
              initialCode={currentStepCode}
              onSave={handleSaveScript}
              onRun={runScript}
              scriptName={currentStep?.name}
            />
          </div>
          
          {/* Metadata panel (1/3 width) */}
          <div className="p-4 overflow-auto">
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Step Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Script Type:</div>
                    <div>Compute Field</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Output Field:</div>
                    <div>SIZERANGE</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Dependencies:</div>
                    <div>SQUAREFEET</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Last Run:</div>
                    <div>March 28, 2025</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Run Count:</div>
                    <div>12</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Execution Results</h3>
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p className="text-muted-foreground">Run this step to see execution results...</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Available SQL Queries</h3>
                <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                  {scriptData.sqlQueries.map((query, index) => (
                    <div key={index} className="px-2 py-1 rounded hover:bg-muted cursor-pointer flex items-center">
                      <Database size={12} className="mr-1.5 text-muted-foreground" />
                      <span>{query.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptPanel;