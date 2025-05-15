import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  BarChart3, 
  TrendingUp, 
  Building, 
  Home, 
  Info,
  Download,
  FileText,
  Filter,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NeighborhoodComparisonHeatmap from '../components/neighborhood/NeighborhoodComparisonHeatmap';
import NeighborhoodTimeline from '../components/neighborhood/NeighborhoodTimeline';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { TrendMetric, NeighborhoodTrendGraph } from '../components/neighborhood/NeighborhoodTrendGraph';
import { NeighborhoodProfileComparison } from '../components/neighborhood/NeighborhoodProfileComparison';
import { NeighborhoodPropertyTypeFilter } from '../components/neighborhood/NeighborhoodPropertyTypeFilter';
import { NeighborhoodScoreCard } from '../components/neighborhood/NeighborhoodScoreCard';
import { neighborhoodComparisonReportService, ReportFormat } from '../services/neighborhoodComparisonReportService';
import { NeighborhoodSnapshotButton } from '../components/neighborhood/NeighborhoodSnapshotButton';

const NeighborhoodComparisonPage: React.FC = () => {
  // References for the container element to capture snapshots
  const comparisonContainerRef = useRef<HTMLDivElement>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('heatmap');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('2022');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  
  // Fetch properties to use in visualization
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Update filtered properties when source properties change
  useEffect(() => {
    if (properties) {
      setFilteredProperties(properties);
    }
  }, [properties]);
  
  // Sample neighborhood data for demonstration
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  
  useEffect(() => {
    // This would normally be fetched from a service
    // For demo purposes, we're creating sample data
    const sampleNeighborhoods = [
      {
        id: 'n1',
        name: 'Richland Heights',
        growthRate: 5.2,
        data: [
          { year: '2020', value: 450000, percentChange: 4.2, transactionCount: 32 },
          { year: '2021', value: 472500, percentChange: 5.0, transactionCount: 45 },
          { year: '2022', value: 498000, percentChange: 5.4, transactionCount: 38 }
        ]
      },
      {
        id: 'n2',
        name: 'West Pasco',
        growthRate: 3.8,
        data: [
          { year: '2020', value: 320000, percentChange: 3.1, transactionCount: 27 },
          { year: '2021', value: 335000, percentChange: 4.7, transactionCount: 31 },
          { year: '2022', value: 347000, percentChange: 3.6, transactionCount: 24 }
        ]
      },
      {
        id: 'n3',
        name: 'Kennewick Riverside',
        growthRate: 6.1,
        data: [
          { year: '2020', value: 520000, percentChange: 5.8, transactionCount: 18 },
          { year: '2021', value: 559000, percentChange: 7.5, transactionCount: 22 },
          { year: '2022', value: 595000, percentChange: 6.4, transactionCount: 19 }
        ]
      },
      {
        id: 'n4',
        name: 'Columbia Basin',
        growthRate: 2.9,
        data: [
          { year: '2020', value: 275000, percentChange: 2.2, transactionCount: 42 },
          { year: '2021', value: 284000, percentChange: 3.3, transactionCount: 39 },
          { year: '2022', value: 291000, percentChange: 2.5, transactionCount: 44 }
        ]
      },
      {
        id: 'n5',
        name: 'Finley District',
        growthRate: 4.2,
        data: [
          { year: '2020', value: 310000, percentChange: 3.8, transactionCount: 25 },
          { year: '2021', value: 325000, percentChange: 4.8, transactionCount: 29 },
          { year: '2022', value: 339000, percentChange: 4.3, transactionCount: 31 }
        ]
      }
    ];
    
    setNeighborhoods(sampleNeighborhoods);
    // Select first two neighborhoods by default for demonstration
    setSelectedNeighborhoods(['n1', 'n2']);
  }, []);
  
  // Handle property type filter changes
  const handleFilteredPropertiesChange = (props: Property[]) => {
    setFilteredProperties(props);
  };
  
  // Handle report generation
  const generateReport = async (format: ReportFormat) => {
    if (selectedNeighborhoods.length === 0) {
      alert('Please select at least one neighborhood to generate a report');
      return;
    }
    
    try {
      await neighborhoodComparisonReportService.generateAndDownloadReport({
        neighborhoods,
        selectedNeighborhoods,
        properties: filteredProperties,
        selectedYear,
        metric: 'value',
        format,
        includeProperties: true
      });
      
      setIsReportMenuOpen(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl" ref={comparisonContainerRef}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Neighborhood Comparison</h1>
          <p className="text-muted-foreground">
            Compare neighborhoods using interactive visualizations to identify trends and patterns.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <NeighborhoodSnapshotButton
            neighborhoods={neighborhoods}
            selectedNeighborhoods={selectedNeighborhoods}
            properties={filteredProperties}
            selectedYear={selectedYear}
            containerRef={comparisonContainerRef}
          />
          
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            {isReportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <button
                  onClick={() => generateReport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download CSV
                </button>
                <button
                  onClick={() => generateReport('excel')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Excel
                </button>
                <button
                  onClick={() => generateReport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="heatmap" value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Heatmap</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
          <TabsTrigger value="scorecard" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Score Card</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>About</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="heatmap" className="mt-0">
          <NeighborhoodComparisonHeatmap properties={filteredProperties || []} />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-0">
          <NeighborhoodTimeline />
        </TabsContent>
        
        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <NeighborhoodPropertyTypeFilter 
                  properties={properties || []}
                  onFilterChange={handleFilteredPropertiesChange}
                  className="mb-4"
                />
                
                <div className="mt-6">
                  <h3 className="text-base font-medium mb-2">Year</h3>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Neighborhood Profile Comparison</CardTitle>
                <CardDescription>Detailed neighborhood-level statistics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                {neighborhoods.length > 0 ? (
                  <NeighborhoodProfileComparison 
                    neighborhoods={neighborhoods}
                    selectedNeighborhoods={selectedNeighborhoods}
                    properties={filteredProperties || []}
                    selectedYear={selectedYear}
                  />
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <p>Select neighborhoods to compare their profiles.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Neighborhood Value Trends</CardTitle>
                <CardDescription>Average property values over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {neighborhoods.length > 0 ? (
                  <NeighborhoodTrendGraph 
                    neighborhoods={neighborhoods}
                    selectedNeighborhoods={selectedNeighborhoods}
                    metric={TrendMetric.VALUE}
                    height={300}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select neighborhoods to view trends
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Growth Rates</CardTitle>
                <CardDescription>Annual property value growth rates</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {neighborhoods.length > 0 ? (
                  <NeighborhoodTrendGraph 
                    neighborhoods={neighborhoods}
                    selectedNeighborhoods={selectedNeighborhoods}
                    metric={TrendMetric.PERCENT_CHANGE}
                    height={230}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select neighborhoods to view trends
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Volume</CardTitle>
                <CardDescription>Number of property transactions by year</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {neighborhoods.length > 0 ? (
                  <NeighborhoodTrendGraph 
                    neighborhoods={neighborhoods}
                    selectedNeighborhoods={selectedNeighborhoods}
                    metric={TrendMetric.TRANSACTION_COUNT}
                    height={230}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select neighborhoods to view trends
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Per Square Foot</CardTitle>
                <CardDescription>Average price per square foot trends</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {neighborhoods.length > 0 ? (
                  <NeighborhoodTrendGraph 
                    neighborhoods={neighborhoods}
                    selectedNeighborhoods={selectedNeighborhoods}
                    metric={TrendMetric.VALUE}
                    height={230}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select neighborhoods to view trends
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="scorecard" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Neighborhood Score Card</CardTitle>
              <CardDescription>
                Customizable color-coded ratings for neighborhoods based on key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeighborhoodScoreCard 
                neighborhoods={neighborhoods}
                selectedNeighborhoods={selectedNeighborhoods}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <AboutNeighborhoodComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AboutNeighborhoodComparison: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            <span>Heatmap Analysis</span>
          </CardTitle>
          <CardDescription>
            Interactive geospatial visualization for neighborhood value patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            The neighborhood comparison heatmap allows you to visualize property values and trends across different neighborhoods on a geographic map. This powerful tool helps you:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-2">
            <li>Identify value hotspots and emerging high-growth areas</li>
            <li>Compare market performance across neighborhood boundaries</li>
            <li>Detect patterns in property value distribution</li>
            <li>Analyze neighborhood-level market trends over time</li>
            <li>Discover undervalued areas with growth potential</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>Timeline Analysis</span>
          </CardTitle>
          <CardDescription>
            Historical value trends and growth rate comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            The neighborhood timeline visualization provides historical context for property values and growth rates across neighborhoods. This feature enables you to:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-2">
            <li>Track property value trends across multiple years</li>
            <li>Compare historical performance between neighborhoods</li>
            <li>Identify neighborhoods with consistent growth patterns</li>
            <li>Evaluate the impact of economic events on different areas</li>
            <li>Project future value trends based on historical data</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <span>Using Neighborhood Analysis for Property Valuation</span>
          </CardTitle>
          <CardDescription>
            Best practices for incorporating neighborhood-level data into your valuation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Neighborhood-level analysis provides essential context for property valuation that goes beyond individual property characteristics. Here's how to effectively use this data in your valuation process:
          </p>
          
          <h3 className="text-base font-medium mt-4 mb-2">Valuation Applications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Home className="h-4 w-4" />
                <span>Comparative Market Analysis</span>
              </h4>
              <p className="text-xs">
                Use neighborhood trend data to adjust comparable property values based on location-specific growth patterns. Properties in high-growth neighborhoods may warrant premium adjustments compared to similar properties in slower-growth areas.
              </p>
            </div>
            
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                <span>Investment Analysis</span>
              </h4>
              <p className="text-xs">
                Identify neighborhoods with emerging value patterns or consistent growth for investment opportunities. The heatmap can reveal undervalued areas adjacent to high-value neighborhoods that may represent growth potential.
              </p>
            </div>
          </div>
          
          <h3 className="text-base font-medium mt-4 mb-2">Implementation Strategies</h3>
          <ul className="text-sm list-disc pl-5 space-y-2">
            <li>Use the timeline view to identify neighborhoods with consistent growth patterns versus those with high volatility</li>
            <li>Look for emerging "value clusters" in the heatmap that may indicate neighborhood revitalization</li>
            <li>Compare year-over-year changes to identify neighborhoods recovering from value declines</li>
            <li>Analyze transaction volume alongside value changes to identify liquid markets</li>
            <li>Create neighborhood-based adjustment factors for your appraisal models using the comparative data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NeighborhoodComparisonPage;