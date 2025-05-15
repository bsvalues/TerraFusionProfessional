import React from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, Clock, AlertTriangle, Calendar, 
  User, BarChart3, Plus, Filter, Search,
  CheckCheck, X, AlarmClock, FileText, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const TasksPage: React.FC = () => {
  // Check if we're on a specific task page
  const [match, params] = useRoute('/tasks/:id');
  
  if (match && params?.id) {
    return <TaskDetailPage taskId={params.id} />;
  }
  
  return <TaskListPage />;
};

// Sample task data
const tasks = [
  {
    id: '1',
    title: 'Review Commercial Property Valuations',
    description: 'Review and finalize the recent commercial property valuations in downtown area.',
    dueDate: 'Tomorrow, 5:00 PM',
    status: 'urgent',
    progress: 45,
    assignedTo: 'John Smith',
    category: 'Valuation'
  },
  {
    id: '2',
    title: 'Complete Residential Assessment Report',
    description: 'Prepare the quarterly residential assessment report for the board review.',
    dueDate: 'Friday, 3:00 PM',
    status: 'in-progress',
    progress: 72,
    assignedTo: 'Emma Johnson',
    category: 'Reporting'
  },
  {
    id: '3',
    title: 'Data Quality Check for New Imports',
    description: 'Verify the quality and accuracy of newly imported property data.',
    dueDate: 'Next Monday, 10:00 AM',
    status: 'pending',
    progress: 0,
    assignedTo: 'Michael Brown',
    category: 'Data Management'
  },
  {
    id: '4',
    title: 'Prepare Tax Roll Submission',
    description: 'Finalize and prepare the annual tax roll submission to the county.',
    dueDate: 'July 15, 12:00 PM',
    status: 'completed',
    progress: 100,
    assignedTo: 'Sarah Davis',
    category: 'Tax Administration'
  },
  {
    id: '5',
    title: 'Update Neighborhood Boundaries',
    description: 'Review and update neighborhood boundary definitions based on recent development.',
    dueDate: 'July 18, 3:00 PM',
    status: 'pending',
    progress: 0,
    assignedTo: 'John Smith',
    category: 'GIS Management'
  },
  {
    id: '6',
    title: 'Analyze Sales Ratio Study Results',
    description: 'Review the results of the latest sales ratio study and prepare recommendations.',
    dueDate: 'July 20, 5:00 PM',
    status: 'in-progress',
    progress: 38,
    assignedTo: 'Emma Johnson',
    category: 'Analysis'
  }
];

// Task List Page Component
const TaskListPage: React.FC = () => {
  // Status badge component
  const TaskStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'urgent':
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Urgent
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100">
            <AlarmClock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">
            <CheckCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Category icon component
  const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'Valuation':
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      case 'Reporting':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'Data Management':
        return <Database className="h-4 w-4 text-green-600" />;
      case 'Tax Administration':
        return <Calculator className="h-4 w-4 text-red-600" />;
      case 'GIS Management':
        return <Map className="h-4 w-4 text-amber-600" />;
      case 'Analysis':
        return <TrendingUp className="h-4 w-4 text-indigo-600" />;
      default:
        return <CheckSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Task Management</h1>
        </div>
        <Button className="flex items-center">
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </div>
      
      <Card className="bg-white mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search tasks..." 
                  className="w-full pl-9"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date Range
              </Button>
              <Button variant="outline" className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Assignee
              </Button>
            </div>
            
            <div className="flex justify-end">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <span>Showing</span>
                <strong>6</strong>
                <span>tasks</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-1" />
            All Tasks
          </TabsTrigger>
          <TabsTrigger value="urgent" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Urgent
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            <AlarmClock className="h-4 w-4 mr-1" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <CheckCheck className="h-4 w-4 mr-1" />
            Completed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className="bg-white hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/tasks/${task.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {task.status === 'completed' ? (
                        <div className="rounded-full bg-green-100 p-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-blue-100 p-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-500">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {task.dueDate}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            {task.assignedTo}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <CategoryIcon category={task.category} />
                            <span className="ml-1">{task.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <TaskStatusBadge status={task.status} />
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {['urgent', 'in-progress', 'pending', 'completed'].map((status) => (
          <TabsContent key={status} value={status} className="mt-0">
            <div className="space-y-4">
              {tasks
                .filter(task => task.status === status)
                .map((task) => (
                  <Card 
                    key={task.id} 
                    className="bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/tasks/${task.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {task.status === 'completed' ? (
                            <div className="rounded-full bg-green-100 p-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-blue-100 p-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.title}</h3>
                            <p className="text-sm text-gray-500">{task.description}</p>
                            
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {task.dueDate}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                {task.assignedTo}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <CategoryIcon category={task.category} />
                                <span className="ml-1">{task.category}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <TaskStatusBadge status={task.status} />
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Progress</span>
                          <span className="text-xs font-medium">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Task Detail Page Component
const TaskDetailPage: React.FC<{ taskId: string }> = ({ taskId }) => {
  // Find the task with the matching ID
  const task = tasks.find(t => t.id === taskId) || tasks[0];

  // Status badge component
  const TaskStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'urgent':
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Urgent
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100">
            <AlarmClock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">
            <CheckCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1" 
            onClick={() => window.location.href = "/tasks"}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Task Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {task.status !== 'completed' ? (
            <Button className="flex items-center bg-green-600 hover:bg-green-700">
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          ) : (
            <Button variant="outline" className="flex items-center">
              <Undo2 className="h-4 w-4 mr-1" />
              Reopen
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{task.title}</CardTitle>
                <TaskStatusBadge status={task.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{task.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <h3 className="font-medium mb-2">Progress</h3>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Completion</span>
                  <span className="text-sm font-medium">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-3" />
                
                <div className="flex items-center space-x-2 mt-4">
                  <Button variant="outline" size="sm" disabled={task.progress <= 0}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={task.progress >= 10}>10%</Button>
                  <Button variant="outline" size="sm" disabled={task.progress >= 25}>25%</Button>
                  <Button variant="outline" size="sm" disabled={task.progress >= 50}>50%</Button>
                  <Button variant="outline" size="sm" disabled={task.progress >= 75}>75%</Button>
                  <Button variant="outline" size="sm" disabled={task.progress >= 100}>100%</Button>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-3">Comments</h3>
                <div className="flex space-x-2">
                  <div className="flex-shrink-0 rounded-full bg-blue-100 h-8 w-8 flex items-center justify-center">
                    <User2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <Input placeholder="Add a comment..." className="flex-1" />
                  <Button>Post</Button>
                </div>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>No comments yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Related Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm text-gray-500 py-4">
                <p>No related items</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                <div className="flex items-center mt-1">
                  <div className="rounded-full bg-blue-100 h-6 w-6 flex items-center justify-center mr-2">
                    <User2 className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>{task.assignedTo}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{task.dueDate}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                <div className="flex items-center mt-1">
                  <CheckSquare className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{task.category}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Created</h4>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>June 30, 2025</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                Share Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Print Details
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { 
  CheckSquare, ArrowLeft, Edit, Undo2, Minus, Share2, 
  Printer, Trash2, User2, Map, TrendingUp, Calculator, 
  Database 
} from 'lucide-react';

export default TasksPage;