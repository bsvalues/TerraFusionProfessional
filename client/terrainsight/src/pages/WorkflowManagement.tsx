import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  CheckCircle2,
  ClipboardList,
  LineChart,
  Clock,
  Workflow,
  Activity,
  PanelRight,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Workflow types
export type WorkflowType = 'assessment' | 'valuation' | 'compliance' | 'appeals' | 'reports';
export type WorkflowStatus = 'not_started' | 'in_progress' | 'completed' | 'error' | 'paused';

interface WorkflowItem {
  type: WorkflowType;
  name: string;
  description: string;
  status: WorkflowStatus;
  progress: number;
  lastUpdated: Date;
  nextAction?: string;
}

const sampleWorkflows: WorkflowItem[] = [
  {
    type: 'assessment',
    name: 'Property Assessment Workflow',
    description: 'Comprehensive property value assessment process',
    status: 'in_progress',
    progress: 65,
    lastUpdated: new Date(2025, 3, 15),
    nextAction: 'Validate property characteristics'
  },
  {
    type: 'valuation',
    name: 'Automated Valuation Model',
    description: 'AI-powered property valuation process',
    status: 'paused',
    progress: 30,
    lastUpdated: new Date(2025, 3, 10),
    nextAction: 'Run regression analysis'
  },
  {
    type: 'compliance',
    name: 'Legal Compliance Check',
    description: 'Property tax law compliance verification',
    status: 'not_started',
    progress: 0,
    lastUpdated: new Date(2025, 3, 5)
  },
  {
    type: 'appeals',
    name: 'Appeals Processing',
    description: 'Property tax appeal management workflow',
    status: 'completed',
    progress: 100,
    lastUpdated: new Date(2025, 3, 1)
  },
  {
    type: 'reports',
    name: 'Quarterly Reports Generation',
    description: 'Automated reports for county assessors',
    status: 'error',
    progress: 45,
    lastUpdated: new Date(2025, 3, 20),
    nextAction: 'Fix data aggregation issue'
  }
];

const WorkflowManagementPage: React.FC = () => {
  const { currentWorkflow, setCurrentWorkflow } = useWorkflow();
  const [activeTab, setActiveTab] = useState('all');
  
  const breadcrumbs = [
    { label: 'Workflows', href: '/workflows' }
  ];

  const getWorkflowIcon = (workflowType: WorkflowType) => {
    switch (workflowType) {
      case 'assessment': return <ClipboardList className="h-5 w-5" />;
      case 'valuation': return <LineChart className="h-5 w-5" />;
      case 'compliance': return <CheckCircle2 className="h-5 w-5" />;
      case 'appeals': return <AlertCircle className="h-5 w-5" />;
      case 'reports': return <Activity className="h-5 w-5" />;
      default: return <Workflow className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline">Not Started</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Paused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleWorkflowSelect = (workflow: WorkflowItem) => {
    setCurrentWorkflow({
      id: workflow.type,
      name: workflow.name,
      status: workflow.status,
      progress: workflow.progress
    });
  };

  const handleWorkflowReset = (workflow: WorkflowItem) => {
    // In a real app, this would call an API to reset the workflow
    console.log(`Resetting workflow: ${workflow.name}`);
  };

  const filteredWorkflows = activeTab === 'all' 
    ? sampleWorkflows 
    : sampleWorkflows.filter(w => {
        if (activeTab === 'active') return w.status === 'in_progress';
        if (activeTab === 'completed') return w.status === 'completed';
        if (activeTab === 'issues') return w.status === 'error';
        return true;
      });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Workflow Management"
        description="Monitor and manage assessment workflows"
        breadcrumbs={breadcrumbs}
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Workflows</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredWorkflows.length === 0 ? (
            <Alert>
              <AlertTitle>No workflows found</AlertTitle>
              <AlertDescription>
                There are no workflows matching the selected filter.
              </AlertDescription>
            </Alert>
          ) : (
            filteredWorkflows.map((workflow) => (
              <Card key={workflow.type} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getWorkflowIcon(workflow.type)}
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(workflow.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start lg:items-center justify-between">
                    <div className="w-full max-w-md space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{workflow.progress}%</span>
                      </div>
                      <Progress value={workflow.progress} />
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Updated {workflow.lastUpdated.toLocaleDateString()}</span>
                      </div>
                      
                      {workflow.nextAction && (
                        <div className="flex items-center gap-1">
                          <PanelRight className="h-4 w-4" />
                          <span>Next: {workflow.nextAction}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleWorkflowReset(workflow)}
                      >
                        <RotateCw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleWorkflowSelect(workflow)}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowManagementPage;