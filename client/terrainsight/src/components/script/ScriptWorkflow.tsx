import React, { useState } from 'react';
import { 
  Workflow, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Code, 
  Play,
  Plus,
  Check,
  Clock,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScriptGroup, ScriptStep } from '@/shared/types';

interface ScriptWorkflowProps {
  scriptGroups: ScriptGroup[];
  scriptSteps: ScriptStep[];
  onSelectStep?: (stepId: string) => void;
  onAddStep?: (groupId?: string) => void;
  onAddGroup?: () => void;
  onRunStep?: (stepId: string) => void;
  onRunGroup?: (groupId: string) => void;
  onDeleteStep?: (stepId: string) => void;
  selectedStepId?: string;
}

const ScriptWorkflow: React.FC<ScriptWorkflowProps> = ({
  scriptGroups,
  scriptSteps,
  onSelectStep,
  onAddStep,
  onAddGroup,
  onRunStep,
  onRunGroup,
  onDeleteStep,
  selectedStepId
}) => {
  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    // Initialize with all active groups expanded
    scriptGroups.reduce((acc, group) => {
      acc[group.id] = group.active;
      return acc;
    }, {} as Record<string, boolean>)
  );
  
  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Get the steps for a specific group
  const getStepsByGroup = (groupId: string) => {
    return scriptSteps.filter(step => step.groupId === groupId);
  };
  
  // Get steps not assigned to any group
  const getUngroupedSteps = () => {
    return scriptSteps.filter(step => !step.groupId);
  };
  
  // Get icon for step status
  const getStepIcon = (step: ScriptStep) => {
    switch (step.status) {
      case 'complete':
        return <Check size={14} className="text-green-500" />;
      case 'active':
        return <Play size={14} className="text-blue-500" />;
      case 'pending':
        return <Clock size={14} className="text-gray-400" />;
      default:
        return <AlertTriangle size={14} className="text-yellow-500" />;
    }
  };
  
  // Run all steps in a group
  const handleRunGroup = (groupId: string) => {
    if (onRunGroup) {
      onRunGroup(groupId);
    } else {
      // If no group run handler, run each step in sequence
      const steps = getStepsByGroup(groupId);
      steps.forEach(step => {
        if (onRunStep) onRunStep(step.id);
      });
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center text-gray-800">
          <Workflow size={16} className="mr-2 text-blue-500" />
          Script Workflow
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={onAddGroup}
        >
          <PlusCircle size={14} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {/* Script Groups */}
        {scriptGroups.map(group => (
          <div key={group.id} className="mb-2">
            <div 
              className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-200 ${
                group.active ? 'bg-gray-200' : ''
              }`}
              onClick={() => toggleGroup(group.id)}
            >
              {expandedGroups[group.id] ? 
                <ChevronDown size={14} className="mr-1 text-gray-600" /> : 
                <ChevronRight size={14} className="mr-1 text-gray-600" />
              }
              <Folder size={14} className="mr-2 text-yellow-500" />
              <span className="text-sm truncate flex-1 text-gray-800">{group.name}</span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddStep) onAddStep(group.id);
                  }}
                >
                  <Plus size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunGroup(group.id);
                  }}
                >
                  <Play size={12} />
                </Button>
              </div>
            </div>
            
            {/* Group Steps */}
            {expandedGroups[group.id] && (
              <div className="pl-5 space-y-1 mt-1">
                {getStepsByGroup(group.id).map(step => (
                  <div 
                    key={step.id}
                    className={`flex items-center p-2 rounded text-sm cursor-pointer ${
                      selectedStepId === step.id ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => onSelectStep && onSelectStep(step.id)}
                  >
                    <div className="w-4 mr-2 flex justify-center">
                      {getStepIcon(step)}
                    </div>
                    <FileText size={12} className="mr-2 text-gray-600" />
                    <span className="truncate flex-1">{step.name}</span>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRunStep) onRunStep(step.id);
                        }}
                      >
                        <Play size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteStep) onDeleteStep(step.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Ungrouped Steps */}
        {getUngroupedSteps().length > 0 && (
          <div className="mb-2">
            <div className="mt-2">
              <div className="p-2 text-xs text-gray-500 uppercase font-medium">Independent Steps</div>
              <div className="space-y-1">
                {getUngroupedSteps().map(step => (
                  <div 
                    key={step.id}
                    className={`flex items-center p-2 rounded text-sm cursor-pointer ${
                      selectedStepId === step.id ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => onSelectStep && onSelectStep(step.id)}
                  >
                    <div className="w-4 mr-2 flex justify-center">
                      {getStepIcon(step)}
                    </div>
                    <Code size={12} className="mr-2 text-gray-600" />
                    <span className="truncate flex-1">{step.name}</span>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRunStep) onRunStep(step.id);
                        }}
                      >
                        <Play size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteStep) onDeleteStep(step.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* New Step Button */}
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center bg-white hover:bg-gray-50"
          onClick={() => onAddStep && onAddStep()}
        >
          <Plus size={14} className="mr-1" />
          New Step
        </Button>
      </div>
    </div>
  );
};

export default ScriptWorkflow;