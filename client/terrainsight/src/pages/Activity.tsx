import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, Building, FileText, BarChart3, Database, 
  Calendar, Clock, Search, Download, Filter, ChevronDown 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ActivityPage: React.FC = () => {
  // Sample activity data
  const activities = [
    {
      id: 1,
      title: 'Property #PR-10234 Updated',
      time: '2 hours ago',
      user: 'John Smith',
      type: 'property'
    },
    {
      id: 2,
      title: 'Valuation Report Generated',
      time: '5 hours ago',
      user: 'Emma Johnson',
      type: 'report'
    },
    {
      id: 3,
      title: 'Market Analysis Completed',
      time: '1 day ago',
      user: 'Michael Brown',
      type: 'market'
    },
    {
      id: 4,
      title: 'Data Import Completed',
      time: '2 days ago',
      user: 'Sarah Davis',
      type: 'data'
    },
    {
      id: 5,
      title: 'Property #PR-9876 Updated',
      time: '3 days ago',
      user: 'John Smith',
      type: 'property'
    },
    {
      id: 6,
      title: 'Tax Assessment Report Generated',
      time: '4 days ago',
      user: 'Emma Johnson',
      type: 'report'
    },
    {
      id: 7,
      title: 'Neighborhood Analysis Completed',
      time: '5 days ago',
      user: 'Michael Brown',
      type: 'market'
    },
    {
      id: 8,
      title: 'Data Export Completed',
      time: '1 week ago',
      user: 'Sarah Davis',
      type: 'data'
    }
  ];

  // Activity icon component
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
        Icon = Activity;
        bgColor = 'bg-gray-100';
        iconColor = 'text-gray-600';
    }
    
    return (
      <div className={`${bgColor} p-2 rounded-full flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Activity History</h1>
      </div>
      
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search activities" 
                  className="w-full pl-9"
                />
              </div>
            </div>
            
            <div>
              <Select>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Activity Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="property">Property Updates</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                  <SelectItem value="market">Market Analysis</SelectItem>
                  <SelectItem value="data">Data Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Date Range" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort By" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="type">Activity Type</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start p-4 border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ActivityIcon type={activity.type} />
                
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-gray-500">{activity.time}</p>
                        
                        {activity.user && (
                          <>
                            <span className="mx-1 text-gray-300">•</span>
                            <p className="text-xs text-gray-500">By {activity.user}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm">Load More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityPage;