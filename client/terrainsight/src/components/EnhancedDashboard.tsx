import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ArrowRight,
  BarChart3,
  Building,
  Calculator,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  Home,
  Info,
  Layers,
  LineChart,
  Map,
  MapPin,
  Pencil,
  Shield,
  TrendingUp,
  Activity,
  DollarSign,
  PieChart
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { InteractiveMetricCard } from '@/components/ui/interactive-metric-card';
import { InteractiveActivityCard } from '@/components/ui/interactive-activity-card';
import { useAppMode } from '../contexts/AppModeContext';
import Dashboard from './Dashboard';
import { useToast } from '@/hooks/use-toast';

// Dashboard data
const dashboardData = {
  keyMetrics: {
    properties: {
      count: 24786,
      label: "Total properties analyzed"
    },
    updates: {
      count: 1257,
      label: "New property updates this month"
    },
    accuracy: {
      percentage: 94.3,
      label: "Valuation accuracy rate" 
    },
    trends: {
      count: 16,
      label: "Market trends identified"
    }
  },
  recentActivity: [
    { id: 1, type: 'property', title: 'Commercial Property #7842', time: '3 mins ago', user: 'Admin' },
    { id: 2, type: 'report', title: 'Q2 Valuation Report', time: '17 mins ago', user: 'Admin' },
    { id: 3, type: 'market', title: 'Neighborhood Market Trends', time: '45 mins ago', user: 'Admin' },
    { id: 4, type: 'data', title: 'Property Data Import', time: '2 hours ago', user: 'Admin' }
  ],
  newFeatures: [
    {
      id: 1,
      title: "Enhanced Property Comparison",
      description: "Compare multiple properties with side-by-side visualization and automatic insights generation."
    },
    {
      id: 2,
      title: "Neighborhood Market Analysis",
      description: "Analyze market trends at the neighborhood level with demographic insights and price predictions."
    }
  ],
  upcomingTasks: [
    { 
      id: 1, 
      title: 'Annual Property Reassessment', 
      dueText: 'Due: next week',
      status: 'pending'
    },
    { 
      id: 2, 
      title: 'Market Analysis Report', 
      dueText: 'Due: tomorrow',
      status: 'urgent'
    },
    { 
      id: 3, 
      title: 'Data Quality Audit', 
      dueText: 'Due: today',
      status: 'in-progress'
    }
  ]
};

/**
 * Enhanced dashboard with cleaner UI based on the mockup
 * Now includes the standard Dashboard with map functionality via tab navigation
 */
export const EnhancedDashboard: React.FC = () => {
  const { isStandalone } = useAppMode();
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast(); // Add toast hook at component level

  // If showMap is true, render the Dashboard component with map tab
  if (showMap) {
    return <Dashboard initialTab="map" />;
  }

  return (
    <div>
      {/* Map Access Button */}
      <div className="mb-5 flex justify-end space-x-3">
        <Button 
          onClick={() => setShowMap(true)}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <Map className="h-4 w-4" />
          Open Interactive Map
        </Button>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (3/4 width on large screens) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Key Metrics Section */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Key Metrics</h2>
              <p className="text-sm text-gray-500">Current performance statistics and insights</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Properties Card */}
              <InteractiveMetricCard
                title="Properties"
                value={dashboardData.keyMetrics.properties.count.toLocaleString()}
                description={dashboardData.keyMetrics.properties.label}
                icon={<Building className="h-5 w-5" />}
                cardColor="blue"
                linkTo="/properties"
                onClick={() => {
                  toast({
                    title: "Properties Dashboard",
                    description: "Navigating to detailed property data view..."
                  });
                  // Navigation will happen through the InteractiveMetricCard linkTo prop
                }}
              />

              {/* Updates Card */}
              <InteractiveMetricCard
                title="Updates"
                value={`+${dashboardData.keyMetrics.updates.count}`}
                description={dashboardData.keyMetrics.updates.label}
                icon={<Pencil className="h-5 w-5" />}
                cardColor="green"
                trend={{
                  value: 12.5,
                  direction: 'up',
                  label: '%'
                }}
                linkTo="/updates"
                onClick={() => {
                  toast({
                    title: "Property Updates",
                    description: "Viewing recent property updates and changes..."
                  });
                  // Navigation will happen through the InteractiveMetricCard linkTo prop
                }}
              />

              {/* Accuracy Card */}
              <InteractiveMetricCard
                title="Accuracy"
                value={`${dashboardData.keyMetrics.accuracy.percentage}%`}
                description={dashboardData.keyMetrics.accuracy.label}
                icon={<Shield className="h-5 w-5" />}
                cardColor="purple"
                trend={{
                  value: 2.1,
                  direction: 'up',
                  label: '%'
                }}
                linkTo="/accuracy"
                onClick={() => {
                  toast({
                    title: "Valuation Accuracy",
                    description: "Analyzing valuation accuracy metrics..."
                  });
                  // Navigation will happen through the InteractiveMetricCard linkTo prop
                }}
              />

              {/* Trends Card */}
              <InteractiveMetricCard
                title="Trends"
                value={dashboardData.keyMetrics.trends.count}
                description={dashboardData.keyMetrics.trends.label}
                icon={<TrendingUp className="h-5 w-5" />}
                cardColor="yellow"
                linkTo="/trends"
                onClick={() => {
                  toast({
                    title: "Market Trends",
                    description: "Analyzing market trend indicators..."
                  });
                  // Navigation will happen through the InteractiveMetricCard linkTo prop
                }}
              />
            </div>
          </section>

          {/* Recent Activity Section */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-gray-500">Latest updates and actions in the system</p>
            </div>

            <Card className="bg-white">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {dashboardData.recentActivity.map((activity) => (
                    <InteractiveActivityCard
                      key={activity.id}
                      item={{
                        id: activity.id,
                        title: activity.title,
                        time: activity.time,
                        user: activity.user,
                        icon: <ActivityIcon type={activity.type} />,
                        detailsLink: `/activity/${activity.id}`,
                        status: activity.type === 'property' ? 'completed' : (activity.type === 'report' ? 'pending' : undefined)
                      }}
                      onClick={() => {
                        toast({
                          title: `Activity Details: ${activity.title}`,
                          description: `Viewing details for activity from ${activity.time}`,
                          variant: "default"
                        });
                        // Navigation will happen through the InteractiveActivityCard detailsLink prop
                      }}
                    />
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-4 py-2 flex justify-end">
                <Link href="/activity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center text-xs"
                    onClick={() => {
                      toast({
                        title: "Activity History",
                        description: "Loading complete activity history...",
                        variant: "default"
                      });
                    }}
                  >
                    <span>View all activity</span>
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </section>

          {/* New Features Section */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">New Features</h2>
              <p className="text-sm text-gray-500">Recently added capabilities and enhancements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.newFeatures.map(feature => (
                <Link key={feature.id} href={`/features/${feature.id}`}>
                  <motion.div 
                    className="bg-white p-4 rounded-md border cursor-pointer relative overflow-hidden group"
                    whileHover={{ y: -4, scale: 1.01, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      toast({
                        title: `New Feature: ${feature.title}`,
                        description: "Opening feature preview...",
                        variant: "default"
                      });
                    }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-70"></div>
                    <div className="flex items-start">
                      <div className="flex-1 ml-2">
                        <div className="flex items-center mb-2">
                          <h3 className="text-sm font-semibold">{feature.title}</h3>
                          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                            NEW
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{feature.description}</p>
                        
                        <div className="flex items-center mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Try it now</span>
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (1/4 width on large screens) */}
        <div className="space-y-6">
          {/* Quick Navigation Section */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Quick Navigation</CardTitle>
              <p className="text-sm text-gray-500">Frequently used features and tools</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <QuickNavItem
                  icon={<Building className="h-4 w-4" />}
                  label="Properties"
                  description="Manage property data"
                  href="/properties"
                />
                <QuickNavItem
                  icon={<Calculator className="h-4 w-4" />}
                  label="Analysis"
                  description="Valuation tools"
                  href="/analysis"
                />
                <QuickNavItem
                  icon={<Layers className="h-4 w-4" />}
                  label="Map Layers"
                  description="Geographic data"
                  href="/layers"
                />
                <QuickNavItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Reports"
                  description="Generate reports"
                  href="/reports"
                />
                <QuickNavItem
                  icon={<LineChart className="h-4 w-4" />}
                  label="Trends"
                  description="Market analytics"
                  href="/trends"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks Section */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.upcomingTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <motion.div 
                      className="flex items-center justify-between rounded-md border p-3 cursor-pointer"
                      whileHover={{ 
                        backgroundColor: "rgba(249, 250, 251, 0.7)",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        y: -2
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        toast({
                          title: `Task Details: ${task.title}`,
                          description: `Opening task with ${task.status} status`,
                          variant: task.status === 'urgent' ? 'destructive' : 'default'
                        });
                      }}
                    >
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{task.dueText}</p>
                        </div>
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </motion.div>
                  </Link>
                ))}
              </div>
              <Link href="/tasks">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => {
                    toast({
                      title: "Task Management",
                      description: "Opening task management dashboard...",
                      variant: "default"
                    });
                  }}
                >
                  Manage Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Integration Status (Standalone Mode) */}
          {isStandalone && (
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Integration Status</CardTitle>
                <p className="text-xs text-gray-500">Current application operation mode</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium">Standalone Mode</span>
                  <Badge className="ml-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-100">
                    Full functionality enabled
                  </Badge>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  Full functionality enabled in standalone mode
                </p>
                
                <p className="mt-4 text-xs text-gray-500">
                  This application can also operate in integrated mode within a parent system.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for activity icons
const ActivityIcon = ({ type }: { type: string }) => {
  let Icon;
  let bgColor;
  let iconColor;
  
  switch (type) {
    case 'property':
      Icon = Building;
      bgColor = 'bg-blue-100';
      iconColor = 'text-blue-600';
      break;
    case 'report':
      Icon = FileText;
      bgColor = 'bg-purple-100';
      iconColor = 'text-purple-600';
      break;
    case 'market':
      Icon = BarChart3;
      bgColor = 'bg-green-100';
      iconColor = 'text-green-600';
      break;
    case 'data':
      Icon = Database;
      bgColor = 'bg-amber-100';
      iconColor = 'text-amber-600';
      break;
    default:
      Icon = Info;
      bgColor = 'bg-gray-100';
      iconColor = 'text-gray-600';
  }
  
  return (
    <div className={`${bgColor} p-2 rounded-full flex-shrink-0`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </div>
  );
};

// Quick navigation item component
const QuickNavItem = ({ 
  href, 
  icon, 
  label, 
  description 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  description: string;
}) => {
  // Use useContext to access the toast from the parent component
  const { toast } = useToast();
  
  return (
    <Link href={href}>
      <motion.div 
        className="flex items-center p-2 hover:bg-blue-50 rounded-md transition-all group"
        whileHover={{ x: 3, backgroundColor: "rgba(239, 246, 255, 0.8)" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          toast({
            title: `Navigating to ${label}`,
            description: `Opening ${description.toLowerCase()}`,
            variant: "default"
          });
        }}
      >
        <div className="mr-3 p-2 rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium group-hover:text-blue-700 transition-colors">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </Link>
  );
};

// Task status badge
const TaskStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'urgent':
      return (
        <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100">
          Urgent
        </Badge>
      );
    case 'in-progress':
      return (
        <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">
          In Progress
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100">
          Pending
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