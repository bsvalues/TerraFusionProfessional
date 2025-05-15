import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Map, 
  Code, 
  Database, 
  TrendingUp, 
  Settings,
  BarChart,
  Calendar,
  AlertCircle,
  Globe,
  Building,
  FileText,
  ChevronRight,
  ExternalLink,
  Info,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Layers,
  BarChart2,
  CandlestickChart,
  LineChart,
  GitCompare,
  ArrowRight,
  Check,
  Download,
  RefreshCw,
  Upload
} from 'lucide-react';
import { PropertyInsightsReport } from '@/components/export/PropertyInsightsReport';
import { MapPanel } from './panels/MapPanel';
import ScriptPanel from './panels/ScriptPanel';
import { SpatialAnalysisPanel } from './panels/SpatialAnalysisPanel';
import { RegressionPanel } from './panels/RegressionPanel';
import { PropertyComparisonPanel } from './panels/PropertyComparisonPanel';
import { PredictiveModelingPanel } from './panels/PredictiveModelingPanel';
import { TimeSeriesAnalysisPanel } from './panels/TimeSeriesAnalysisPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ReportGenerator } from '@/components/export/ReportGenerator';
import { KPIDashboardPanel } from './KPIDashboardPanel';
import { AdvancedAnalyticsPanel } from './ml/AdvancedAnalyticsPanel';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import TabNavigation from './TabNavigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CSVImportDialog } from '../components/import/CSVImportDialog';

export interface DashboardProps {
  className?: string;
  initialTab?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Fetch properties data
  const { data: properties = [], refetch: refetchProperties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Also fetch trend properties to ensure we have visualization data
  const { data: trendData } = useQuery<{ properties: Property[], years: string[] }>({
    queryKey: ['/api/properties/trends'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Use trend properties data if main properties fetch is empty
  const allPropertiesData = properties.length > 0 ? properties : 
    (trendData?.properties ? trendData.properties : []);

  return (
    <div className={`min-h-screen flex flex-col ${className} bg-white`} data-testid="dashboard-container">
      {/* Tab navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} data-tour="app-navigation" />

      {/* Panel content */}
      <div className="flex-grow relative w-full overflow-visible mx-auto px-0">

        {activeTab === 'overview' && (
          <div className="h-full p-6 overflow-visible relative z-10" data-tour="overview-panel">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 mt-6">
                <div data-tour="welcome-message">
                  <h1 className="text-2xl font-medium text-gray-900 mb-2">
                    Benton County Property Assessment
                  </h1>
                  <p className="text-gray-600 max-w-3xl">
                    Advanced property analysis and valuation system
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <PropertyInsightsReport 
                    buttonText="Generate Report"
                    className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-md text-sm"
                    showDialog={true}
                  />
                </div>
              </div>

              {/* Quick Stats - Minimalist Approach */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 mb-10"
                  data-tour="quick-stats">
                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Properties</p>
                      <div className="flex items-baseline">
                        <h3 className="text-2xl font-medium text-gray-900">8,432</h3>
                        <span className="ml-2 text-xs font-medium text-green-600">+156</span>
                      </div>
                    </div>
                    <div className="bg-neutral-100 p-2 rounded-md">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Average Value</p>
                      <div className="flex items-baseline">
                        <h3 className="text-2xl font-medium text-gray-900">$324,500</h3>
                        <span className="ml-2 text-xs font-medium text-green-600">+2.3%</span>
                      </div>
                    </div>
                    <div className="bg-neutral-100 p-2 rounded-md">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Median Value</p>
                      <div className="flex items-baseline">
                        <h3 className="text-2xl font-medium text-gray-900">$298,750</h3>
                        <span className="ml-2 text-xs font-medium text-green-600">+1.8%</span>
                      </div>
                    </div>
                    <div className="bg-neutral-100 p-2 rounded-md">
                      <PieChart className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Data Points</p>
                      <div className="flex items-baseline">
                        <h3 className="text-2xl font-medium text-gray-900">142,580</h3>
                        <span className="ml-2 text-xs font-medium text-green-600">+12.4K</span>
                      </div>
                    </div>
                    <div className="bg-neutral-100 p-2 rounded-md">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Analysis Cards - Minimalist Design */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Property Statistics Card */}
                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-medium text-gray-900 flex items-center">
                      <BarChart className="h-4 w-4 text-primary mr-2" />
                      Property Statistics
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                      <span className="text-sm text-gray-600">Total Properties</span>
                      <span className="font-medium text-gray-900">8,432</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                      <span className="text-sm text-gray-600">Average Value</span>
                      <span className="font-medium text-gray-900">$324,500</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                      <span className="text-sm text-gray-600">Median Value</span>
                      <span className="font-medium text-gray-900">$298,750</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                      <span className="text-sm text-gray-600">Property Count</span>
                      <span className="font-medium text-gray-900">6,284</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                      <span className="text-sm text-gray-600">Avg. Land Size</span>
                      <span className="font-medium text-gray-900">0.34 acres</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Year Built</span>
                      <span className="font-medium text-gray-900">1992</span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <button className="text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center">
                      View detailed statistics
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Value Distribution Card */}
                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-medium text-gray-900 flex items-center">
                      <TrendingUp className="h-4 w-4 text-primary mr-2" />
                      Value Distribution
                    </h2>
                  </div>
                  <div className="h-48 flex items-center justify-center bg-neutral-50 rounded-md border border-neutral-100">
                    <div className="text-center">
                      <BarChart className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                        Property value distribution by category
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary mr-1.5"></span>
                      <span className="text-xs text-gray-600">Residential</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-sm bg-neutral-500 mr-1.5"></span>
                      <span className="text-xs text-gray-600">Commercial</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-sm bg-neutral-700 mr-1.5"></span>
                      <span className="text-xs text-gray-600">Agricultural</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-sm bg-neutral-900 mr-1.5"></span>
                      <span className="text-xs text-gray-600">Industrial</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-white border border-neutral-200 rounded-md p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-medium text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 text-primary mr-2" />
                      Recent Activity
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start text-sm">
                      <div className="bg-neutral-100 p-1 rounded-sm mr-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm bg-primary block"></span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Property analysis completed</p>
                        <p className="text-xs text-gray-500">Today, 2:30 PM</p>
                      </div>
                    </li>
                    <li className="flex items-start text-sm">
                      <div className="bg-neutral-100 p-1 rounded-sm mr-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm bg-primary block"></span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">12 new properties added</p>
                        <p className="text-xs text-gray-500">Today, 1:15 PM</p>
                      </div>
                    </li>
                    <li className="flex items-start text-sm">
                      <div className="bg-neutral-100 p-1 rounded-sm mr-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm bg-primary block"></span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Regression model updated</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </li>
                    <li className="flex items-start text-sm">
                      <div className="bg-neutral-100 p-1 rounded-sm mr-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm bg-primary block"></span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Data export completed</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-5">
                    <button className="text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center">
                      View all activity
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Alert Card - Minimalist Design */}
              <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-md mb-10">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-amber-100 p-2 rounded-md mr-4">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">Data Update Available</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      New property data for Benton County is available with 156 new properties and 
                      78 revised valuations.
                    </p>
                    <div className="flex space-x-3">
                      <Button 
                        className="bg-primary text-white hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm"
                        onClick={() => setIsImportDialogOpen(true)}
                      >
                        Import Data
                      </Button>
                      <Button 
                        variant="outline"
                        className="border border-neutral-300 text-gray-700 hover:bg-neutral-100 px-3 py-1.5 rounded-md text-sm"
                        onClick={() => setIsDetailsDialogOpen(true)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access Cards - Minimalist Design */}
              <h2 className="text-lg font-medium text-gray-900 mb-4 mt-2">
                Quick Access
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                data-tour="feature-cards">
                <button 
                  onClick={() => setActiveTab('map')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                  data-tour="map-feature"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <Map className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Property Map</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Interactive geospatial property visualization</p>
                </button>

                <button 
                  onClick={() => setActiveTab('analysis')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <BarChart2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Spatial Analysis</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Analyze property patterns and relationships</p>
                </button>

                <button 
                  onClick={() => setActiveTab('comparison')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <GitCompare className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Comparison</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Compare properties and value metrics</p>
                </button>

                <button 
                  onClick={() => setActiveTab('modeling')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <LineChart className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Modeling</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Create and test valuation models</p>
                </button>
              </div>

              {/* Additional Tools */}
              <h2 className="text-lg font-medium text-gray-900 mb-4 mt-8">
                Advanced Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                data-tour="advanced-features">
                <button 
                  onClick={() => setActiveTab('regression')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <CandlestickChart className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Regression</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Statistical modeling and analysis</p>
                </button>

                <button 
                  onClick={() => setActiveTab('scripts')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <Code className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Custom Scripts</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Write and execute analysis scripts</p>
                </button>

                <button 
                  onClick={() => setActiveTab('reporting')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Reports</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Generate property valuation reports</p>
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className="p-4 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-neutral-100 p-2 rounded-md mr-3">
                      <Settings className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Configure application preferences</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[calc(100vh-3.5rem)] w-full p-0 overflow-visible relative z-10">
            <MapPanel properties={allPropertiesData} className="h-full w-full" />
          </div>
        )}
        {activeTab === 'analysis' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <SpatialAnalysisPanel properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'comparison' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <PropertyComparisonPanel properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'regression' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <RegressionPanel properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'modeling' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <PredictiveModelingPanel properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'timeseries' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <TimeSeriesAnalysisPanel properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'scripts' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <ScriptPanel properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'reporting' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <ReportGenerator properties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'kpi' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <KPIDashboardPanel taxYear="2025" />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <AdvancedAnalyticsPanel allProperties={allPropertiesData} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="h-full p-4 overflow-visible relative z-10">
            <SettingsPanel />
          </div>
        )}
      </div>

      {/* Import Data Dialog */}
      <CSVImportDialog isOpen={isImportDialogOpen} onClose={() => setIsImportDialogOpen(false)} />

      {/* Details Dialog - Minimalist Design */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900 flex items-center">
              <Database className="h-4 w-4 text-primary mr-2" />
              Data Update Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Property valuation data available for import
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-3 text-sm border-b border-neutral-200 pb-4">
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-600">New Properties:</span>
                <span className="font-medium text-gray-900">156</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-600">Revised Valuations:</span>
                <span className="font-medium text-gray-900">78</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-600">Data Source:</span>
                <span className="font-medium text-gray-900">Benton County Assessor</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-600">Date Generated:</span>
                <span className="font-medium text-gray-900">April 01, 2025</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium text-gray-900">CSV (27.3MB)</span>
              </div>
            </div>
            
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Property Types</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-sm"></span>
                  <span className="text-gray-700">Residential (114)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neutral-500 rounded-sm"></span>
                  <span className="text-gray-700">Commercial (23)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neutral-700 rounded-sm"></span>
                  <span className="text-gray-700">Agricultural (12)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neutral-900 rounded-sm"></span>
                  <span className="text-gray-700">Industrial (7)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Neighborhoods</h3>
              <p className="text-sm text-gray-600 mb-3">
                Includes properties from 14 neighborhoods
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 text-xs bg-neutral-100 text-gray-700 rounded">Richland Heights</span>
                <span className="px-2 py-0.5 text-xs bg-neutral-100 text-gray-700 rounded">West Kennewick</span>
                <span className="px-2 py-0.5 text-xs bg-neutral-100 text-gray-700 rounded">Prosser Valley</span>
                <span className="px-2 py-0.5 text-xs bg-neutral-100 text-gray-700 rounded">Badger Mountain</span>
                <span className="px-2 py-0.5 text-xs bg-neutral-100 text-gray-700 rounded">+10 more</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              className="bg-primary text-white hover:bg-primary/90 px-3 py-1.5 text-sm rounded-md"
              onClick={() => {
                setIsDetailsDialogOpen(false);
                setIsImportDialogOpen(true);
              }}
            >
              Import Data
            </Button>
            <Button
              variant="outline"
              className="border border-neutral-300 text-gray-700 hover:bg-neutral-50 px-3 py-1.5 text-sm rounded-md"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;