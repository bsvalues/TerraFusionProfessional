import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Milestone, 
  CheckCircle2, 
  GitPullRequestDraft, 
  GitMerge, 
  Clock, 
  AlertCircle, 
  BarChart,
  Plus,
  Download,
  Upload,
  Share,
  RefreshCcw,
  Printer,
  History
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

// Define our project task types
interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  category: string;
  assignee?: string;
  dueDate?: Date;
  dependencies?: string[];
  created: Date;
  updated: Date;
  changeHistory?: ActivityLogItem[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate?: Date;
  created: Date;
  updated: Date;
  tasks: TaskItem[];
}

interface ActivityLogItem {
  id: string;
  timestamp: Date;
  actionType: 'create' | 'update' | 'delete' | 'status-change' | 'milestone-change' | 'export' | 'import' | 'reset';
  description: string;
  entityId: string;
  entityType: 'task' | 'milestone' | 'project' | 'system';
  previousValue?: string;
  newValue?: string;
  user?: string;
  icon?: string; // Icon name for visual representation
  category?: string; // Category for grouping or filtering
}

interface Category {
  id: string;
  name: string;
  color: string;
}

// Sample categories
const projectCategories: Category[] = [
  { id: '1', name: 'Core ETL', color: 'blue' },
  { id: '2', name: 'UI Components', color: 'green' },
  { id: '3', name: 'Data Validation', color: 'purple' },
  { id: '4', name: 'Testing', color: 'orange' },
  { id: '5', name: 'Documentation', color: 'gray' },
  { id: '6', name: 'Error Handling', color: 'red' },
  { id: '7', name: 'Database Integration', color: 'teal' },
  { id: '8', name: 'Security', color: 'amber' },
  { id: '9', name: 'Performance', color: 'indigo' },
];

// Default initial milestones and tasks
const initialMilestones: Milestone[] = [
  {
    id: '1',
    title: 'ETL Core Components',
    description: 'Implement the core ETL pipeline components and services',
    progress: 90,
    created: new Date(2023, 3, 1),
    updated: new Date(2023, 3, 15),
    tasks: [
      {
        id: '1-1',
        title: 'ETLPipelineManager Implementation',
        description: 'Create the manager class that orchestrates ETL operations',
        status: 'completed',
        priority: 'high',
        category: '1',
        created: new Date(2023, 3, 1),
        updated: new Date(2023, 3, 5)
      },
      {
        id: '1-2',
        title: 'DataConnector Service',
        description: 'Implement data source and destination connection handlers',
        status: 'completed',
        priority: 'high',
        category: '1',
        created: new Date(2023, 3, 2),
        updated: new Date(2023, 3, 6)
      },
      {
        id: '1-3',
        title: 'Transformation Service',
        description: 'Build data transformation capabilities (filter, map, etc.)',
        status: 'completed',
        priority: 'high',
        category: '1',
        created: new Date(2023, 3, 3),
        updated: new Date(2023, 3, 7)
      },
      {
        id: '1-4',
        title: 'Scheduler Implementation',
        description: 'Create the job scheduling system with various frequencies',
        status: 'completed',
        priority: 'medium',
        category: '1',
        created: new Date(2023, 3, 4),
        updated: new Date(2023, 3, 8)
      },
      {
        id: '1-5',
        title: 'AlertService Implementation',
        description: 'Build the notification and alerting subsystem',
        status: 'completed',
        priority: 'medium',
        category: '1',
        created: new Date(2023, 3, 5),
        updated: new Date(2023, 3, 9)
      },
      {
        id: '1-6',
        title: 'Fix Map constructor in browser environment',
        description: 'Ensure compatibility with browser JS engines for Map usage',
        status: 'in-progress',
        priority: 'high',
        category: '6',
        created: new Date(2023, 3, 15),
        updated: new Date(2023, 3, 15)
      }
    ]
  },
  {
    id: '2',
    title: 'ETL Management UI',
    description: 'Create the user interface for managing ETL processes',
    progress: 75,
    created: new Date(2023, 3, 10),
    updated: new Date(2023, 3, 14),
    tasks: [
      {
        id: '2-1',
        title: 'ETL Dashboard Component',
        description: 'Main dashboard showing ETL status and metrics',
        status: 'completed',
        priority: 'high',
        category: '2',
        created: new Date(2023, 3, 10),
        updated: new Date(2023, 3, 12)
      },
      {
        id: '2-2',
        title: 'Job Management UI',
        description: 'Interface for creating, updating, and scheduling jobs',
        status: 'completed',
        priority: 'high',
        category: '2',
        created: new Date(2023, 3, 11),
        updated: new Date(2023, 3, 13)
      },
      {
        id: '2-3',
        title: 'Data Source Configuration UI',
        description: 'Interface for managing data sources and connections',
        status: 'in-progress',
        priority: 'medium',
        category: '2',
        created: new Date(2023, 3, 12),
        updated: new Date(2023, 3, 14)
      },
      {
        id: '2-4',
        title: 'Transformation Rule Editor',
        description: 'UI for creating and editing transformation rules',
        status: 'planned',
        priority: 'medium',
        category: '2',
        created: new Date(2023, 3, 13),
        updated: new Date(2023, 3, 13)
      }
    ]
  },
  {
    id: '3',
    title: 'Data Quality & Validation',
    description: 'Implement data quality checks and validation services',
    progress: 60,
    created: new Date(2023, 3, 14),
    updated: new Date(2023, 3, 17),
    tasks: [
      {
        id: '3-1',
        title: 'Data Quality Service',
        description: 'Create service for analyzing and reporting data quality',
        status: 'completed',
        priority: 'high',
        category: '3',
        created: new Date(2023, 3, 14),
        updated: new Date(2023, 3, 16)
      },
      {
        id: '3-2',
        title: 'Schema Validation',
        description: 'Implement schema-based validation for data sources',
        status: 'in-progress',
        priority: 'medium',
        category: '3',
        created: new Date(2023, 3, 15),
        updated: new Date(2023, 3, 17)
      },
      {
        id: '3-3',
        title: 'Anomaly Detection',
        description: 'Add anomaly detection for identifying data issues',
        status: 'planned',
        priority: 'medium',
        category: '3',
        created: new Date(2023, 3, 16),
        updated: new Date(2023, 3, 16)
      },
      {
        id: '3-4',
        title: 'Data Quality Dashboard',
        description: 'Create UI for displaying data quality metrics',
        status: 'planned',
        priority: 'low',
        category: '2',
        created: new Date(2023, 3, 17),
        updated: new Date(2023, 3, 17)
      }
    ]
  },
  {
    id: '4',
    title: 'Testing & Production Readiness',
    description: 'Ensure the ETL system is thoroughly tested and ready for production',
    progress: 40,
    created: new Date(2023, 3, 18), 
    updated: new Date(2023, 3, 22),
    tasks: [
      {
        id: '4-1',
        title: 'Unit Tests for ETL Services',
        description: 'Complete unit tests for all ETL services',
        status: 'in-progress',
        priority: 'high',
        category: '4',
        created: new Date(2023, 3, 18),
        updated: new Date(2023, 3, 20)
      },
      {
        id: '4-2',
        title: 'Integration Tests',
        description: 'Create tests for full ETL pipeline integration',
        status: 'planned',
        priority: 'high',
        category: '4',
        created: new Date(2023, 3, 19),
        updated: new Date(2023, 3, 19)
      },
      {
        id: '4-3',
        title: 'Performance Benchmarking',
        description: 'Measure and optimize ETL performance',
        status: 'planned',
        priority: 'medium',
        category: '9',
        created: new Date(2023, 3, 20),
        updated: new Date(2023, 3, 20)
      },
      {
        id: '4-4',
        title: 'Error Handling Improvements',
        description: 'Enhance error handling and recovery mechanisms',
        status: 'planned',
        priority: 'medium',
        category: '6',
        created: new Date(2023, 3, 21),
        updated: new Date(2023, 3, 21)
      },
      {
        id: '4-5',
        title: 'Documentation',
        description: 'Complete user and developer documentation',
        status: 'planned',
        priority: 'low',
        category: '5',
        created: new Date(2023, 3, 22),
        updated: new Date(2023, 3, 22)
      }
    ]
  }
];

// Format date for display
const formatDate = (date?: Date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

// Status badge component
const StatusBadge: React.FC<{ status: TaskItem['status'] }> = ({ status }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let icon = null;
  
  switch (status) {
    case 'completed':
      variant = 'default';
      icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'in-progress':
      variant = 'secondary';
      icon = <GitPullRequestDraft className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'planned':
      variant = 'outline';
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'blocked':
      variant = 'destructive';
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      break;
  }
  
  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {status.replace('-', ' ')}
    </Badge>
  );
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: TaskItem['priority'] }> = ({ priority }) => {
  let className = 'text-xs';
  
  switch (priority) {
    case 'high':
      className += ' text-red-500';
      break;
    case 'medium':
      className += ' text-amber-500';
      break;
    case 'low':
      className += ' text-green-500';
      break;
  }
  
  return <span className={className}>{priority}</span>;
};

// Category badge component
const CategoryBadge: React.FC<{ categoryId: string }> = ({ categoryId }) => {
  const category = projectCategories.find(c => c.id === categoryId);
  
  if (!category) return null;
  
  // Get color class based on category color
  let colorClass = '';
  switch (category.color) {
    case 'blue':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'green':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'purple':
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    case 'orange':
      colorClass = 'bg-orange-100 text-orange-800';
      break;
    case 'gray':
      colorClass = 'bg-gray-100 text-gray-800';
      break;
    case 'red':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'teal':
      colorClass = 'bg-teal-100 text-teal-800';
      break;
    case 'amber':
      colorClass = 'bg-amber-100 text-amber-800';
      break;
    case 'indigo':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {category.name}
    </span>
  );
};

// Local storage keys
const STORAGE_KEYS = {
  MILESTONES: 'spatialest-project-milestones',
  ACTIVE_TAB: 'spatialest-project-active-tab',
  FILTER_STATUS: 'spatialest-project-filter-status',
  FILTER_CATEGORY: 'spatialest-project-filter-category',
  ACTIVITY_LOG: 'spatialest-project-activity-log'
};

// Load data from localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) as T : defaultValue;
  } catch (error) {
    console.warn(`Error loading data from localStorage for key ${key}:`, error);
    return defaultValue;
  }
};

// Save data to localStorage
const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving data to localStorage for key ${key}:`, error);
  }
};

export function ProjectTracker() {
  // Load initial state from localStorage or use defaults
  const [milestones, setMilestones] = useState<Milestone[]>(
    loadFromStorage(STORAGE_KEYS.MILESTONES, initialMilestones)
  );
  const [activeTab, setActiveTab] = useState(
    loadFromStorage(STORAGE_KEYS.ACTIVE_TAB, 'overview')
  );
  const [filterStatus, setFilterStatus] = useState<TaskItem['status'] | 'all'>(
    loadFromStorage(STORAGE_KEYS.FILTER_STATUS, 'all')
  );
  const [filterCategory, setFilterCategory] = useState<string>(
    loadFromStorage(STORAGE_KEYS.FILTER_CATEGORY, 'all')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [newTaskData, setNewTaskData] = useState<Partial<TaskItem>>({
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    category: '1',
  });
  const [newMilestoneData, setNewMilestoneData] = useState<Partial<Milestone>>({
    title: '',
    description: '',
  });
  
  // Activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(
    loadFromStorage(STORAGE_KEYS.ACTIVITY_LOG, [])
  );

  // Persist state changes to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
  }, [milestones]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILTER_STATUS, filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILTER_CATEGORY, filterCategory);
  }, [filterCategory]);
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOG, activityLogs);
  }, [activityLogs]);
  
  // Helper function to add an activity log entry
  const logActivity = (
    actionType: ActivityLogItem['actionType'],
    description: string,
    entityId: string,
    entityType: ActivityLogItem['entityType'],
    previousValue?: string,
    newValue?: string,
    icon?: string
  ) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      actionType,
      description,
      entityId,
      entityType,
      previousValue,
      newValue,
      icon,
      user: 'System'
    };
    
    setActivityLogs(currentLogs => [newLog, ...currentLogs].slice(0, 100)); // Keep last 100 logs
  };
  
  // Calculate overall project progress
  const overallProgress = Math.round(
    milestones.reduce((sum, ms) => sum + ms.progress, 0) / milestones.length
  );
  
  // Count tasks by status
  const taskCounts = {
    all: milestones.flatMap(m => m.tasks).length,
    completed: milestones.flatMap(m => m.tasks).filter(t => t.status === 'completed').length,
    'in-progress': milestones.flatMap(m => m.tasks).filter(t => t.status === 'in-progress').length,
    planned: milestones.flatMap(m => m.tasks).filter(t => t.status === 'planned').length,
    blocked: milestones.flatMap(m => m.tasks).filter(t => t.status === 'blocked').length
  };
  
  // Count tasks by priority
  const allTasks = milestones.flatMap(m => m.tasks);
  const priorityCounts = {
    high: allTasks.filter(t => t.priority === 'high').length,
    medium: allTasks.filter(t => t.priority === 'medium').length,
    low: allTasks.filter(t => t.priority === 'low').length
  };
  
  // Calculate completion rate by priority
  const priorityCompletionRate = {
    high: priorityCounts.high > 0 
      ? Math.round((allTasks.filter(t => t.priority === 'high' && t.status === 'completed').length / priorityCounts.high) * 100)
      : 0,
    medium: priorityCounts.medium > 0 
      ? Math.round((allTasks.filter(t => t.priority === 'medium' && t.status === 'completed').length / priorityCounts.medium) * 100)
      : 0,
    low: priorityCounts.low > 0 
      ? Math.round((allTasks.filter(t => t.priority === 'low' && t.status === 'completed').length / priorityCounts.low) * 100)
      : 0
  };
  
  // Count tasks by category
  const categoryCounts = allTasks.reduce((counts, task) => {
    counts[task.category] = (counts[task.category] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Filter tasks based on current filters and search query
  const filteredTasks = milestones.flatMap(milestone => 
    milestone.tasks.map(task => ({ ...task, milestone: milestone.title }))
  ).filter(task => {
    // Apply status filter
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    
    // Apply category filter
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    
    // Apply search filter (match title or description)
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort tasks by status and then by priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First by status (in-progress first, then planned, then completed)
    const statusOrder = { 'in-progress': 0, 'planned': 1, 'blocked': 2, 'completed': 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by priority (high first, then medium, then low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Handle updating a task's status
  const updateTaskStatus = (taskId: string, newStatus: TaskItem['status']) => {
    // Find the task to get its details for logging
    let taskTitle = '';
    let oldStatus = '';
    let milestoneTitle = '';
    
    milestones.forEach(milestone => {
      const task = milestone.tasks.find(t => t.id === taskId);
      if (task) {
        taskTitle = task.title;
        oldStatus = task.status;
        milestoneTitle = milestone.title;
      }
    });
    
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => ({
        ...milestone,
        tasks: milestone.tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updated: new Date() }
            : task
        ),
        // Recalculate milestone progress
        progress: Math.round(
          (milestone.tasks.map(task => 
            task.id === taskId 
              ? (newStatus === 'completed' ? 1 : 0) 
              : (task.status === 'completed' ? 1 : 0)
          ).reduce((sum: number, val: number) => sum + val, 0) / milestone.tasks.length) * 100
        )
      }))
    );
    
    // Log the status change
    if (taskTitle) {
      logActivity(
        'status-change',
        `Task "${taskTitle}" status changed from "${oldStatus}" to "${newStatus}"`,
        taskId,
        'task',
        oldStatus,
        newStatus,
        newStatus === 'completed' ? 'CheckCircle2' : 
        newStatus === 'in-progress' ? 'GitPullRequestDraft' :
        newStatus === 'blocked' ? 'AlertCircle' : 'Clock'
      );
    }
  };
  
  // Handle adding a new task
  const addNewTask = (milestoneId: string, task: Omit<TaskItem, 'id' | 'created' | 'updated'>) => {
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      created: new Date(),
      updated: new Date()
    };
    
    // Find milestone name for the log
    const milestoneName = milestones.find(m => m.id === milestoneId)?.title || 'Unknown Milestone';
    
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => 
        milestone.id === milestoneId 
          ? {
              ...milestone,
              tasks: [...milestone.tasks, newTask],
              // Recalculate milestone progress
              progress: Math.round(
                ((milestone.tasks.filter(t => t.status === 'completed').length + 
                  (newTask.status === 'completed' ? 1 : 0)) / 
                  (milestone.tasks.length + 1)) * 100
              )
            }
          : milestone
      )
    );
    
    // Log the task creation
    logActivity(
      'create',
      `Added new task "${task.title}" to milestone "${milestoneName}"`,
      newTask.id,
      'task',
      undefined,
      undefined,
      'Plus'
    );
    
    // Close the add task modal
    setIsAddTaskModalOpen(false);
  };
  
  // Handle adding a new milestone
  const addNewMilestone = (milestone: Omit<Milestone, 'id' | 'tasks' | 'progress' | 'created' | 'updated'>) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
      tasks: [],
      progress: 0,
      created: new Date(),
      updated: new Date()
    };
    
    setMilestones(currentMilestones => [...currentMilestones, newMilestone]);
    
    // Log the milestone creation
    logActivity(
      'create',
      `Added new milestone "${milestone.title}"`,
      newMilestone.id,
      'milestone',
      undefined,
      undefined,
      'Milestone'
    );
    
    // Close the add milestone modal
    setIsAddMilestoneModalOpen(false);
  };
  
  // Handle editing a task
  const editTask = (taskId: string, updatedTask: Partial<TaskItem>) => {
    // Find the task to get its details for logging
    let taskTitle = '';
    let oldTask: TaskItem | null = null;
    let milestoneTitle = '';
    
    // First, find the task to get its original details for logging
    milestones.forEach(milestone => {
      const task = milestone.tasks.find(t => t.id === taskId);
      if (task) {
        taskTitle = task.title;
        oldTask = { ...task }; // Make a copy to ensure we have the original values
        milestoneTitle = milestone.title;
      }
    });
    
    // Update the milestones state with the updated task
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => ({
        ...milestone,
        tasks: milestone.tasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updatedTask, updated: new Date() }
            : task
        ),
        // Recalculate milestone progress if status changed
        progress: updatedTask.status 
          ? Math.round(
              (milestone.tasks.map(task => 
                task.id === taskId 
                  ? (updatedTask.status === 'completed' ? 1 : 0) 
                  : (task.status === 'completed' ? 1 : 0)
              ).reduce((sum: number, val: number) => sum + val, 0) / milestone.tasks.length) * 100
            )
          : milestone.progress
      }))
    );
    
    // Log the task edit if we found the original task
    if (oldTask) {
      // Check what changed
      const changes: string[] = [];
      
      // Use type assertion to ensure TypeScript knows oldTask is not null
      const originalTask = oldTask as TaskItem;
      
      if (updatedTask.title && updatedTask.title !== originalTask.title) 
        changes.push(`title from "${originalTask.title}" to "${updatedTask.title}"`);
      
      if (updatedTask.description && updatedTask.description !== originalTask.description) 
        changes.push(`description`);
      
      if (updatedTask.status && updatedTask.status !== originalTask.status) 
        changes.push(`status from "${originalTask.status}" to "${updatedTask.status}"`);
      
      if (updatedTask.priority && updatedTask.priority !== originalTask.priority) 
        changes.push(`priority from "${originalTask.priority}" to "${updatedTask.priority}"`);
      
      if (updatedTask.category && updatedTask.category !== originalTask.category) {
        const oldCategoryName = projectCategories.find(c => c.id === originalTask.category)?.name || 'Unknown';
        const newCategoryName = projectCategories.find(c => c.id === updatedTask.category)?.name || 'Unknown';
        changes.push(`category from "${oldCategoryName}" to "${newCategoryName}"`);
      }
      
      if (changes.length > 0) {
        logActivity(
          'update',
          `Updated task "${taskTitle}" in milestone "${milestoneTitle}": changed ${changes.join(', ')}`,
          taskId,
          'task',
          JSON.stringify(originalTask),
          JSON.stringify({ ...originalTask, ...updatedTask }),
          'Pencil'
        );
      }
    }
    
    // Clear the editing task
    setEditingTask(null);
  };
  
  // Handle deleting a task
  const deleteTask = (taskId: string) => {
    // Find the task to get its details for logging
    let taskTitle = '';
    let task: TaskItem | null = null;
    let milestoneTitle = '';
    
    milestones.forEach(milestone => {
      const foundTask = milestone.tasks.find(t => t.id === taskId);
      if (foundTask) {
        task = foundTask;
        taskTitle = foundTask.title;
        milestoneTitle = milestone.title;
      }
    });
    
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => {
        // Check if this milestone contains the task
        const taskIndex = milestone.tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          // Task not in this milestone
          return milestone;
        }
        
        // Remove the task
        const updatedTasks = [...milestone.tasks];
        updatedTasks.splice(taskIndex, 1);
        
        // Recalculate milestone progress
        const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
        const newProgress = updatedTasks.length > 0 
          ? Math.round((completedCount / updatedTasks.length) * 100)
          : 0;
        
        return {
          ...milestone,
          tasks: updatedTasks,
          progress: newProgress
        };
      })
    );
    
    // Log the task deletion
    if (task) {
      logActivity(
        'delete',
        `Deleted task "${taskTitle}" from milestone "${milestoneTitle}"`,
        taskId,
        'task',
        JSON.stringify(task),
        undefined,
        'Trash'
      );
    }
  };
  
  // Handle deleting a milestone
  const deleteMilestone = (milestoneId: string) => {
    // Find the milestone to get its details for logging
    const milestone = milestones.find(m => m.id === milestoneId);
    
    setMilestones(currentMilestones => 
      currentMilestones.filter(milestone => milestone.id !== milestoneId)
    );
    
    // Log the milestone deletion
    if (milestone) {
      logActivity(
        'delete',
        `Deleted milestone "${milestone.title}" with ${milestone.tasks.length} tasks`,
        milestoneId,
        'milestone',
        JSON.stringify(milestone),
        undefined,
        'Trash'
      );
    }
  };
  
  // Handle resetting the project tracker to initial state
  const resetTracker = () => {
    if (window.confirm("Are you sure you want to reset the project tracker? This will delete all your progress data.")) {
      // Log the reset operation before changing the state
      const tasksCount = milestones.flatMap(m => m.tasks).length;
      
      logActivity(
        'reset',
        `Reset project tracker (deleted ${milestones.length} milestones and ${tasksCount} tasks)`,
        'system',
        'system',
        JSON.stringify(milestones),
        JSON.stringify(initialMilestones),
        'RefreshCcw'
      );
      
      // Reset state
      setMilestones(initialMilestones);
      setActiveTab('overview');
      setFilterStatus('all');
      setFilterCategory('all');
      setSearchQuery('');
      
      // This will not be shown in activity log since we're emptying the log too
      setActivityLogs([]);
    }
  };
  
  // Export project data to JSON
  const exportData = () => {
    const data = {
      milestones,
      exportDate: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const filename = `project-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Log the export operation
    logActivity(
      'export',
      `Exported project data (${milestones.length} milestones, ${milestones.flatMap(m => m.tasks).length} tasks)`,
      'system',
      'system',
      undefined,
      undefined,
      'Download'
    );
  };
  
  // Import project data from JSON
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data && Array.isArray(data.milestones)) {
          setMilestones(data.milestones);
          
          // Log the import operation
          const importedTaskCount = data.milestones.reduce((count: number, m: any) => count + (m.tasks?.length || 0), 0);
          logActivity(
            'import',
            `Imported project data (${data.milestones.length} milestones, ${importedTaskCount} tasks) from ${file.name}`,
            'system',
            'system',
            undefined,
            undefined,
            'Upload'
          );
        } else {
          alert("Invalid file format. Expected a valid project tracker export file.");
        }
      } catch (error) {
        alert("Failed to parse the import file. Please ensure it's a valid JSON file.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    
    // Clear the input value to allow re-import of the same file
    event.target.value = '';
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Milestone className="h-5 w-5 text-primary" />
          Project Tracker
        </CardTitle>
        <CardDescription>
          Track the progress of the ETL system implementation
        </CardDescription>
        
        {/* Project Actions Toolbar */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedMilestoneId('');
                setNewMilestoneData({
                  title: '',
                  description: '',
                });
                setIsAddMilestoneModalOpen(true);
              }}
              className="flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Milestone
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetTracker}
              className="flex items-center gap-1 text-red-500"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset Tracker
            </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Share className="h-3.5 w-3.5" />
                Export/Import
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={exportData}
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export Data
                </Button>
                
                <label htmlFor="import-file" className="cursor-pointer">
                  <div className="flex w-full items-center justify-start rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Import Data
                  </div>
                  <input 
                    id="import-file" 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={importData}
                  />
                </label>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3.5 w-3.5 mr-2" />
                  Print Report
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1">
              <GitPullRequestDraft className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex-1">
              <Milestone className="h-4 w-4 mr-2" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              <History className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0 px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Progress Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Project Completion</span>
                        <span className="font-medium">{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Completed Tasks</span>
                        <span className="font-medium">{taskCounts.completed} / {taskCounts.all}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">In Progress</span>
                        <span className="font-medium">{taskCounts['in-progress']}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Planned</span>
                        <span className="font-medium">{taskCounts.planned}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Blocked</span>
                        <span className="font-medium">{taskCounts.blocked}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Milestones Summary Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {milestones.map(milestone => (
                      <div key={milestone.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{milestone.title}</span>
                          <span className="text-sm">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {milestone.tasks.filter(t => t.status === 'completed').length} of {milestone.tasks.length} tasks completed
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Project Statistics */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Project Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Task Status Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Task Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-2">
                      {/* Visual task status distribution */}
                      <div className="w-32 h-32 rounded-full flex items-center justify-center relative">
                        {/* Completed segment */}
                        <div 
                          className="absolute inset-0 bg-green-500" 
                          style={{
                            clipPath: taskCounts.all > 0 
                              ? `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(2 * Math.PI * taskCounts.completed / taskCounts.all)}% ${50 - 50 * Math.cos(2 * Math.PI * taskCounts.completed / taskCounts.all)}%, 50% 50%)`
                              : 'none'
                          }}
                        />
                        {/* In-progress segment */}
                        <div 
                          className="absolute inset-0 bg-blue-500" 
                          style={{
                            clipPath: taskCounts.all > 0 
                              ? `polygon(50% 50%, ${50 + 50 * Math.sin(2 * Math.PI * taskCounts.completed / taskCounts.all)}% ${50 - 50 * Math.cos(2 * Math.PI * taskCounts.completed / taskCounts.all)}%, ${50 + 50 * Math.sin(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress']) / taskCounts.all)}% ${50 - 50 * Math.cos(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress']) / taskCounts.all)}%, 50% 50%)`
                              : 'none'
                          }}
                        />
                        {/* Planned segment */}
                        <div 
                          className="absolute inset-0 bg-amber-500" 
                          style={{
                            clipPath: taskCounts.all > 0 
                              ? `polygon(50% 50%, ${50 + 50 * Math.sin(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress']) / taskCounts.all)}% ${50 - 50 * Math.cos(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress']) / taskCounts.all)}%, ${50 + 50 * Math.sin(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress'] + taskCounts.planned) / taskCounts.all)}% ${50 - 50 * Math.cos(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress'] + taskCounts.planned) / taskCounts.all)}%, 50% 50%)`
                              : 'none'
                          }}
                        />
                        {/* Blocked segment */}
                        <div 
                          className="absolute inset-0 bg-red-500" 
                          style={{
                            clipPath: taskCounts.all > 0 
                              ? `polygon(50% 50%, ${50 + 50 * Math.sin(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress'] + taskCounts.planned) / taskCounts.all)}% ${50 - 50 * Math.cos(2 * Math.PI * (taskCounts.completed + taskCounts['in-progress'] + taskCounts.planned) / taskCounts.all)}%, ${50 + 50 * Math.sin(2 * Math.PI)}% ${50 - 50 * Math.cos(2 * Math.PI)}%, 50% 50%)`
                              : 'none'
                          }}
                        />
                        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center z-10">
                          <span className="font-medium">{taskCounts.all} Tasks</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Completed</span>
                      </div>
                      <div className="text-right">{taskCounts.all > 0 ? Math.round(taskCounts.completed / taskCounts.all * 100) : 0}%</div>
                      
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>In Progress</span>
                      </div>
                      <div className="text-right">{taskCounts.all > 0 ? Math.round(taskCounts['in-progress'] / taskCounts.all * 100) : 0}%</div>
                      
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span>Planned</span>
                      </div>
                      <div className="text-right">{taskCounts.all > 0 ? Math.round(taskCounts.planned / taskCounts.all * 100) : 0}%</div>
                      
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Blocked</span>
                      </div>
                      <div className="text-right">{taskCounts.all > 0 ? Math.round(taskCounts.blocked / taskCounts.all * 100) : 0}%</div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Priority Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Task Priorities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* High Priority Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-red-500">High Priority</span>
                          <span>{priorityCounts.high} tasks</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-red-500 h-2.5 rounded-full" 
                            style={{ width: `${taskCounts.all > 0 ? (priorityCounts.high / taskCounts.all) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Medium Priority Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-amber-500">Medium Priority</span>
                          <span>{priorityCounts.medium} tasks</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-amber-500 h-2.5 rounded-full" 
                            style={{ width: `${taskCounts.all > 0 ? (priorityCounts.medium / taskCounts.all) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Low Priority Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-green-500">Low Priority</span>
                          <span>{priorityCounts.low} tasks</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${taskCounts.all > 0 ? (priorityCounts.low / taskCounts.all) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-2 border-t border-gray-100">
                        <div className="text-xs text-muted-foreground">Completion by Priority</div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="text-center">
                            <div className="text-lg font-medium text-red-500">{priorityCompletionRate.high}%</div>
                            <div className="text-xs">High</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-medium text-amber-500">{priorityCompletionRate.medium}%</div>
                            <div className="text-xs">Medium</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-medium text-green-500">{priorityCompletionRate.low}%</div>
                            <div className="text-xs">Low</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Category Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {Object.entries(categoryCounts)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .slice(0, 5)
                        .map(([categoryId, count]) => {
                          const category = projectCategories.find(c => c.id === categoryId);
                          if (!category) return null;
                          
                          // Get percentage for this category
                          const percentage = taskCounts.all > 0 ? Math.round((count / taskCounts.all) * 100) : 0;
                          
                          // Get color class
                          let bgColorClass = '';
                          switch (category.color) {
                            case 'blue': bgColorClass = 'bg-blue-500'; break;
                            case 'green': bgColorClass = 'bg-green-500'; break;
                            case 'purple': bgColorClass = 'bg-purple-500'; break;
                            case 'orange': bgColorClass = 'bg-orange-500'; break;
                            case 'red': bgColorClass = 'bg-red-500'; break;
                            case 'amber': bgColorClass = 'bg-amber-500'; break;
                            case 'teal': bgColorClass = 'bg-teal-500'; break;
                            case 'indigo': bgColorClass = 'bg-indigo-500'; break;
                            default: bgColorClass = 'bg-gray-500';
                          }
                          
                          return (
                            <div key={categoryId}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{category.name}</span>
                                <span>{count} tasks ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div 
                                  className={`${bgColorClass} h-2.5 rounded-full`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      }
                      
                      {Object.keys(categoryCounts).length > 5 && (
                        <div className="text-xs text-center text-muted-foreground pt-2">
                          +{Object.keys(categoryCounts).length - 5} more categories
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Project Timeline */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Project Timeline</h3>
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {milestones.map((milestone, index) => {
                      // Calculate milestone status color
                      let statusColor = "bg-gray-200";
                      if (milestone.progress === 100) {
                        statusColor = "bg-green-500";
                      } else if (milestone.progress > 0) {
                        statusColor = "bg-blue-500";
                      } else if (milestone.tasks.some(t => t.status === 'blocked')) {
                        statusColor = "bg-red-500";
                      }
                      
                      return (
                        <div key={milestone.id} className="flex">
                          <div className="w-9 flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full ${statusColor} flex items-center justify-center text-white font-medium`}>
                              {index + 1}
                            </div>
                            {index < milestones.length - 1 && (
                              <div className="w-px h-full bg-gray-200 mx-auto mt-1"></div>
                            )}
                          </div>
                          
                          <div className="ml-4 -mt-0.5 pb-8 flex-1">
                            <h4 className="font-medium text-base">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {milestone.description}
                            </p>
                            
                            <div className="mt-2 flex items-center gap-2">
                              <Progress value={milestone.progress} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{milestone.progress}%</span>
                            </div>
                            
                            <div className="mt-3 flex gap-2 flex-wrap">
                              {milestone.tasks.length > 0 ? (
                                <>
                                  <Badge variant="outline" className="bg-green-50">
                                    {milestone.tasks.filter(t => t.status === 'completed').length} Completed
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {milestone.tasks.filter(t => t.status === 'in-progress').length} In Progress
                                  </Badge>
                                  <Badge variant="outline" className="bg-amber-50">
                                    {milestone.tasks.filter(t => t.status === 'planned').length} Planned
                                  </Badge>
                                  <Badge variant="outline" className="bg-red-50">
                                    {milestone.tasks.filter(t => t.status === 'blocked').length} Blocked
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">No tasks yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.slice(0, 5).map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">{task.milestone}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>{formatDate(task.updated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tasks Tab */}
          <TabsContent value="tasks" className="m-0 px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:w-1/3"
              />
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All ({taskCounts.all})
                </Button>
                <Button
                  variant={filterStatus === 'in-progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('in-progress')}
                >
                  In Progress ({taskCounts['in-progress']})
                </Button>
                <Button
                  variant={filterStatus === 'planned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('planned')}
                >
                  Planned ({taskCounts.planned})
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed ({taskCounts.completed})
                </Button>
                <Button
                  variant={filterStatus === 'blocked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('blocked')}
                >
                  Blocked ({taskCounts.blocked})
                </Button>
              </div>
              
              <div className="ml-auto">
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {projectCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Project Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Project Timeline</h3>
              <div className="relative overflow-x-auto bg-gray-50 p-4 rounded-md">
                {/* Timeline headers */}
                <div className="flex border-b pb-2 mb-4">
                  <div className="w-1/4 font-medium">Milestone</div>
                  <div className="w-3/4 flex">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex-1 text-center text-xs font-medium">
                        Phase {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Timeline rows */}
                <div className="space-y-6">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center">
                      <div className="w-1/4 pr-4 font-medium text-sm truncate" title={milestone.title}>
                        {milestone.title}
                      </div>
                      <div className="w-3/4 flex items-center">
                        {/* Timeline bar */}
                        <div className="w-full bg-gray-200 h-5 rounded-full relative">
                          {/* Progress indicator */}
                          <div 
                            className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${milestone.progress}%` }}
                          >
                            {milestone.progress > 15 && (
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                {milestone.progress}%
                              </span>
                            )}
                          </div>
                          {milestone.progress <= 15 && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                              {milestone.progress}%
                            </span>
                          )}
                          
                          {/* Task markers */}
                          {milestone.tasks.map((task) => {
                            // Calculate position based on status (completed tasks go to the right)
                            let position;
                            switch(task.status) {
                              case 'completed': 
                                position = Math.min(95, Math.max(milestone.progress - 5, 0)); 
                                break;
                              case 'in-progress': 
                                position = Math.min(Math.max(milestone.progress - 15, 0), 85);
                                break;
                              case 'planned':
                                position = Math.min(Math.max(milestone.progress + 10, 0), 80);
                                break;
                              case 'blocked':
                                position = Math.min(Math.max(milestone.progress - 10, 0), 70);
                                break;
                              default:
                                position = 50;
                            }
                            
                            // Get color based on status
                            let bgColor;
                            switch(task.status) {
                              case 'completed': bgColor = 'bg-green-500'; break;
                              case 'in-progress': bgColor = 'bg-blue-500'; break;
                              case 'planned': bgColor = 'bg-amber-500'; break;
                              case 'blocked': bgColor = 'bg-red-500'; break;
                              default: bgColor = 'bg-gray-500';
                            }
                            
                            return (
                              <div 
                                key={task.id}
                                className={`absolute top-0 w-3 h-3 rounded-full ${bgColor} border-2 border-white transform -translate-y-1/2`}
                                style={{ left: `${position}%` }}
                                title={`${task.title} (${task.status})`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 mt-4 justify-end">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs">In Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs">Planned</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Blocked</span>
                  </div>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {sortedTasks.length > 0 ? (
                  sortedTasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-base">{task.title}</h4>
                              <StatusBadge status={task.status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 ml-4">
                            <PriorityBadge priority={task.priority} />
                            <span className="text-xs text-muted-foreground">
                              Updated: {formatDate(task.updated)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Milestone: {task.milestone}
                            </span>
                          </div>
                          <CategoryBadge categoryId={task.category} />
                        </div>
                        
                        {/* Task Actions */}
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                          {task.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                          
                          {task.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            >
                              <GitPullRequestDraft className="h-3.5 w-3.5 mr-1" />
                              Reopen
                            </Button>
                          )}
                          
                          {task.status === 'planned' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            >
                              <GitPullRequestDraft className="h-3.5 w-3.5 mr-1" />
                              Start Task
                            </Button>
                          )}
                          
                          {task.status === 'blocked' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            >
                              <GitMerge className="h-3.5 w-3.5 mr-1" />
                              Unblock
                            </Button>
                          )}
                          
                          {task.status === 'in-progress' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'blocked')}
                            >
                              <AlertCircle className="h-3.5 w-3.5 mr-1" />
                              Block
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8" 
                            onClick={() => setEditingTask(task)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-red-500 hover:text-red-700" 
                            onClick={() => deleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks match your filters. Try adjusting your search criteria.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Milestones Tab */}
          <TabsContent value="milestones" className="m-0 px-6 py-4">
            <div className="space-y-6">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {milestone.progress}% Complete
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-red-500 hover:text-red-700" 
                          onClick={() => deleteMilestone(milestone.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Progress value={milestone.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="col-span-1">
                        <span className="text-sm font-medium">Total Tasks</span>
                        <p className="text-lg">{milestone.tasks.length}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">Completed</span>
                        <p className="text-lg">{milestone.tasks.filter(t => t.status === 'completed').length}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">In Progress</span>
                        <p className="text-lg">{milestone.tasks.filter(t => t.status === 'in-progress').length}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">Remaining</span>
                        <p className="text-lg">{milestone.tasks.filter(t => ['planned', 'blocked'].includes(t.status)).length}</p>
                      </div>
                    </div>
                    
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {milestone.tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={task.status === 'completed'} 
                                  disabled 
                                />
                              </TableCell>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>
                                <StatusBadge status={task.status} />
                              </TableCell>
                              <TableCell>
                                <PriorityBadge priority={task.priority} />
                              </TableCell>
                              <TableCell>
                                <CategoryBadge categoryId={task.category} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Activity Timeline Tab */}
          <TabsContent value="activity" className="m-0 px-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
                <CardDescription>
                  Recent activity and changes to the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-0 before:h-full before:w-[2px] before:bg-muted">
                  {/* Task Status Changes */}
                  <div className="relative pl-4 pb-10">
                    <div className="absolute left-[-30px] top-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="mb-1 text-sm font-medium">Task Status Updated</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold">Schema Validation</span> marked as <span className="text-blue-500 font-medium">in-progress</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      April 03, 2023 • 3:45 PM
                    </div>
                  </div>
                  
                  {/* Task Created */}
                  <div className="relative pl-4 pb-10">
                    <div className="absolute left-[-30px] top-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                      <Plus className="h-3 w-3" />
                    </div>
                    <div className="mb-1 text-sm font-medium">New Task Created</div>
                    <div className="text-sm text-muted-foreground">
                      Added <span className="font-semibold">Fix Map constructor in browser environment</span> to <span className="text-blue-500 font-medium">ETL Core Components</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      April 02, 2023 • 10:23 AM
                    </div>
                  </div>
                  
                  {/* Milestone Progress */}
                  <div className="relative pl-4 pb-10">
                    <div className="absolute left-[-30px] top-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                      <GitPullRequestDraft className="h-3 w-3" />
                    </div>
                    <div className="mb-1 text-sm font-medium">Milestone Progress Update</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold">ETL Management UI</span> progress updated to <span className="text-green-500 font-medium">75%</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      April 01, 2023 • 4:12 PM
                    </div>
                  </div>
                  
                  {/* Task Completed */}
                  <div className="relative pl-4 pb-10">
                    <div className="absolute left-[-30px] top-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="mb-1 text-sm font-medium">Task Completed</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold">Data Quality Service</span> marked as <span className="text-green-500 font-medium">completed</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      March 31, 2023 • 1:20 PM
                    </div>
                  </div>
                  
                  {/* New Milestone */}
                  <div className="relative pl-4 pb-10">
                    <div className="absolute left-[-30px] top-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                      <Milestone className="h-3 w-3" />
                    </div>
                    <div className="mb-1 text-sm font-medium">New Milestone Created</div>
                    <div className="text-sm text-muted-foreground">
                      Added new milestone <span className="font-semibold">Data Quality & Validation</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      March 30, 2023 • 9:40 AM
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="bg-muted/30 px-6 py-4 border-t">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {formatDate(new Date())}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddMilestoneModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Milestone
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-1" />
                  Export/Import
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3">
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="h-4 w-4 mr-1" />
                    Export to JSON
                  </Button>
                  <Label htmlFor="import-file" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full p-2 rounded bg-primary-50 border border-dashed border-primary-200 hover:bg-primary-100 transition-colors">
                      <Upload className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-sm text-primary">Import from JSON</span>
                      <Input 
                        id="import-file" 
                        type="file" 
                        accept=".json" 
                        onChange={importData} 
                        className="hidden"
                      />
                    </div>
                  </Label>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetTracker} 
                      className="w-full text-red-500 hover:text-red-700"
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      Reset Tracker
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />
              Print Report
            </Button>
          </div>
        </div>
      </CardFooter>
      
      {/* Add Task Modal */}
      <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for the selected milestone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select
                value={selectedMilestoneId}
                onValueChange={setSelectedMilestoneId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newTaskData.status} 
                  onValueChange={(value: TaskItem['status']) => 
                    setNewTaskData({ ...newTaskData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newTaskData.priority} 
                  onValueChange={(value: TaskItem['priority']) => 
                    setNewTaskData({ ...newTaskData, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newTaskData.category} 
                onValueChange={(value) => 
                  setNewTaskData({ ...newTaskData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {projectCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (selectedMilestoneId && newTaskData.title) {
                  addNewTask(selectedMilestoneId, newTaskData as Omit<TaskItem, 'id' | 'created' | 'updated'>);
                  // Reset form data
                  setNewTaskData({
                    title: '',
                    description: '',
                    status: 'planned',
                    priority: 'medium',
                    category: '1',
                  });
                  setSelectedMilestoneId('');
                }
              }}
              disabled={!selectedMilestoneId || !newTaskData.title}
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Milestone Modal */}
      <Dialog open={isAddMilestoneModalOpen} onOpenChange={setIsAddMilestoneModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>
              Create a new milestone to group related tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="milestone-title">Title</Label>
              <Input
                id="milestone-title"
                value={newMilestoneData.title}
                onChange={(e) => setNewMilestoneData({ ...newMilestoneData, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                value={newMilestoneData.description}
                onChange={(e) => setNewMilestoneData({ ...newMilestoneData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (newMilestoneData.title) {
                  addNewMilestone(newMilestoneData as Omit<Milestone, 'id' | 'tasks' | 'progress'>);
                  // Reset form data
                  setNewMilestoneData({
                    title: '',
                    description: '',
                  });
                }
              }}
              disabled={!newMilestoneData.title}
            >
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and save changes.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editingTask.status} 
                    onValueChange={(value: TaskItem['status']) => 
                      setEditingTask({ ...editingTask, status: value })
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select 
                    value={editingTask.priority} 
                    onValueChange={(value: TaskItem['priority']) => 
                      setEditingTask({ ...editingTask, priority: value })
                    }
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={editingTask.category} 
                  onValueChange={(value) => 
                    setEditingTask({ ...editingTask, category: value })
                  }
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (editingTask && editingTask.id) {
                  editTask(editingTask.id, editingTask);
                }
              }}
              disabled={!editingTask?.title}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}