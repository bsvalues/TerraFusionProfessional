import React from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, Building, FileText, BarChart3, Database, 
  Calendar, User, ArrowLeft, MessageSquare, ListFilter,
  Clock, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ActivityDetailPage: React.FC = () => {
  // Extract activity ID from the URL
  const [, params] = useRoute('/activity/:id');
  const activityId = params?.id || '1';

  // Sample activity data - in a real app, this would come from an API
  const activities = {
    '1': {
      id: '1',
      title: 'Property #PR-10234 Updated',
      time: '2 hours ago',
      timestamp: 'June 30, 2025 - 10:15 AM',
      user: 'John Smith',
      type: 'property',
      description: 'Property valuation updated based on recent market analysis and comparable sales data.',
      details: [
        { label: 'Previous Value', value: '$425,000' },
        { label: 'New Value', value: '$450,000' },
        { label: 'Change', value: '+$25,000 (5.88%)' },
        { label: 'Reason', value: 'Market adjustment based on comparable sales' }
      ],
      relatedItems: [
        { type: 'property', label: 'Property #PR-10234', link: '/properties/10234' },
        { type: 'report', label: 'Valuation Report #VR-789', link: '/reports/789' }
      ]
    },
    '2': {
      id: '2',
      title: 'Valuation Report Generated',
      time: '5 hours ago',
      timestamp: 'June 30, 2025 - 7:45 AM',
      user: 'Emma Johnson',
      type: 'report',
      description: 'Quarterly valuation report generated for the downtown commercial district.',
      details: [
        { label: 'Report Type', value: 'Quarterly Valuation' },
        { label: 'District', value: 'Downtown Commercial' },
        { label: 'Properties', value: '128' },
        { label: 'Period', value: 'Q2 2025' }
      ],
      relatedItems: [
        { type: 'report', label: 'Download Report', link: '/reports/download/123' },
        { type: 'data', label: 'Source Data', link: '/data/456' }
      ]
    },
    '3': {
      id: '3',
      title: 'Market Analysis Completed',
      time: '1 day ago',
      timestamp: 'June 29, 2025 - 3:30 PM',
      user: 'Michael Brown',
      type: 'market',
      description: 'Comprehensive market analysis completed for the residential sector in the northwest area.',
      details: [
        { label: 'Area', value: 'Northwest Residential' },
        { label: 'Period', value: 'Jan-Jun 2025' },
        { label: 'Trend', value: '+3.2% average value increase' },
        { label: 'Data Points', value: '215 sales, 42 listings' }
      ],
      relatedItems: [
        { type: 'market', label: 'Market Trend Report', link: '/reports/market/789' },
        { type: 'data', label: 'Sales Data', link: '/data/sales/123' }
      ]
    },
    '4': {
      id: '4',
      title: 'Data Import Completed',
      time: '2 days ago',
      timestamp: 'June 28, 2025 - 1:15 PM',
      user: 'Sarah Davis',
      type: 'data',
      description: 'Successfully imported new property data from the county records system.',
      details: [
        { label: 'Source', value: 'County Records System' },
        { label: 'Records', value: '1,245 properties' },
        { label: 'Status', value: 'Complete with validation' },
        { label: 'Errors', value: '0' }
      ],
      relatedItems: [
        { type: 'data', label: 'Import Log', link: '/data/import/456' },
        { type: 'property', label: 'View Updated Properties', link: '/properties?filter=recent' }
      ]
    }
  };

  // Get the activity data for the current ID
  const activity = activities[activityId as keyof typeof activities] || activities['1'];

  // Activity icon component
  const ActivityIcon = ({ type, size = 'md' }: { type: string, size?: 'sm' | 'md' | 'lg' }) => {
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
    
    const sizeClasses = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3'
    };
    
    const iconSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };
    
    return (
      <div className={`${bgColor} ${sizeClasses[size]} rounded-full flex-shrink-0`}>
        <Icon className={`${iconSizeClasses[size]} ${iconColor}`} />
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1" 
            onClick={() => window.location.href = "/activity"}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Activity Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Copy className="h-4 w-4 mr-1" />
            Copy Link
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white">
            <CardHeader className="pb-2 flex flex-row items-start gap-4">
              <ActivityIcon type={activity.type} size="lg" />
              <div className="flex-1">
                <CardTitle className="text-xl">{activity.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.details.map((detail, index) => (
                    <div key={index} className="flex flex-col bg-gray-50 p-3 rounded-md border">
                      <span className="text-xs text-gray-500">{detail.label}</span>
                      <span className="font-medium">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-3">Related Items</h3>
                <div className="space-y-2">
                  {activity.relatedItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center p-2 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                      onClick={() => window.location.href = item.link}
                    >
                      <ActivityIcon type={item.type} size="sm" />
                      <span className="ml-3 text-sm text-blue-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-3">Comments</h3>
                <div className="text-center text-sm text-gray-500 py-4">
                  <MessageSquare className="h-5 w-5 mx-auto text-gray-300 mb-2" />
                  <p>No comments yet</p>
                  <Button variant="link" className="text-xs mt-1">Add a comment</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Activity Type</h4>
                <div className="flex items-center mt-1">
                  <ActivityIcon type={activity.type} size="sm" />
                  <Badge className="ml-2 capitalize">
                    {activity.type}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">User</h4>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{activity.user}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Timestamp</h4>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{activity.timestamp}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">ID</h4>
                <div className="flex items-center mt-1">
                  <ListFilter className="h-4 w-4 mr-2 text-gray-500" />
                  <code className="text-xs bg-gray-100 p-1 rounded">{activity.id}</code>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = "/activity"}>
                <Activity className="h-4 w-4 mr-2" />
                View All Activities
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View by Date
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Filter by User
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailPage;