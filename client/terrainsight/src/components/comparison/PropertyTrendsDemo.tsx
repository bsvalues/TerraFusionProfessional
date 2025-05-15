import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ValuationTrendChart from './ValuationTrendChart';
import PropertySparkline from './PropertySparkline';
import { ValuationDataPoint, formatCurrency } from './ValuationTrendUtils';

// Sample data for demonstration purposes
const demoPropertyData: ValuationDataPoint[] = [
  { year: '2019', value: 250000 },
  { year: '2020', value: 275000 },
  { year: '2021', value: 290000 },
  { year: '2022', value: 315000 },
  { year: '2023', value: 350000 },
];

// Property with a significant growth spike in 2022
const spikePropertyData: ValuationDataPoint[] = [
  { year: '2019', value: 240000 },
  { year: '2020', value: 245000 },
  { year: '2021', value: 252000 },
  { year: '2022', value: 310000 }, // Spike year
  { year: '2023', value: 325000 },
];

const comparablePropertyData: ValuationDataPoint[] = [
  { year: '2019', value: 240000 },
  { year: '2020', value: 260000 },
  { year: '2021', value: 275000 },
  { year: '2022', value: 290000 },
  { year: '2023', value: 320000 },
];

const neighborhoodTrendData: ValuationDataPoint[] = [
  { year: '2019', value: 235000 },
  { year: '2020', value: 255000 },
  { year: '2021', value: 280000 },
  { year: '2022', value: 310000 },
  { year: '2023', value: 340000 },
];

// Examples of different trend patterns
const strongUpwardTrend: ValuationDataPoint[] = [
  { year: '2019', value: 220000 },
  { year: '2020', value: 250000 },
  { year: '2021', value: 290000 },
  { year: '2022', value: 340000 },
  { year: '2023', value: 400000 },
];

const downwardTrend: ValuationDataPoint[] = [
  { year: '2019', value: 350000 },
  { year: '2020', value: 340000 },
  { year: '2021', value: 330000 },
  { year: '2022', value: 325000 },
  { year: '2023', value: 310000 },
];

const volatileTrend: ValuationDataPoint[] = [
  { year: '2019', value: 280000 },
  { year: '2020', value: 320000 },
  { year: '2021', value: 270000 },
  { year: '2022', value: 335000 },
  { year: '2023', value: 305000 },
];

// Simulated properties with different characteristics
const simulatedProperties = [
  {
    id: 1,
    address: '123 Maple Avenue',
    details: '4 bed, 3 bath • 2,450 sqft',
    value: 350000,
    data: demoPropertyData,
    growthRate: 40,
    neighborhood: 'Riverside'
  },
  {
    id: 2,
    address: '456 Oak Street',
    details: '3 bed, 2 bath • 1,850 sqft',
    value: 325000,
    data: spikePropertyData,
    growthRate: 35.4,
    neighborhood: 'Westside'
  },
  {
    id: 3,
    address: '789 Pine Lane',
    details: '5 bed, 3 bath • 3,200 sqft',
    value: 400000,
    data: strongUpwardTrend,
    growthRate: 81.8,
    neighborhood: 'Northridge'
  },
  {
    id: 4,
    address: '321 Cedar Road',
    details: '3 bed, 2.5 bath • 1,950 sqft',
    value: 310000,
    data: downwardTrend,
    growthRate: -11.4,
    neighborhood: 'Southpoint'
  },
  {
    id: 5,
    address: '555 Birch Boulevard',
    details: '4 bed, 2 bath • 2,100 sqft',
    value: 305000,
    data: volatileTrend,
    growthRate: 8.9,
    neighborhood: 'East Hills'
  },
];

const PropertyTrendsDemo: React.FC = () => {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Property Valuation Trends</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Comprehensive visualization of property values over time, following IAAO (International Association of Assessing Officers) standards and USPAP (Uniform Standards of Professional Appraisal Practice) guidelines.
        </p>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="w-full justify-start max-w-md">
          <TabsTrigger value="charts" className="flex-1">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="sparklines" className="flex-1">Compact Visualizations</TabsTrigger>
          <TabsTrigger value="dashboard" className="flex-1">Property Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-8 mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Advanced chart with spike detection */}
            <ValuationTrendChart 
              data={spikePropertyData} 
              title="Property With Significant Market Adjustment" 
              description="Property shows a significant value increase in 2022, potentially due to market changes, improvements, or reassessment"
              showGrowthRate={true}
              showCAGR={true}
            />
            
            {/* Chart with detailed comparison */}
            <ValuationTrendChart 
              data={demoPropertyData} 
              comparisonData={comparablePropertyData}
              comparisonLabel="Similar Property in Area"
              title="Property Comparison Analysis" 
              description="Side-by-side valuation comparison with similar properties for equalization assessment"
              showGrowthRate={true}
            />
            
            {/* Chart with neighborhood trend and future projection */}
            <ValuationTrendChart 
              data={strongUpwardTrend} 
              comparisonData={neighborhoodTrendData}
              comparisonLabel="Neighborhood Median"
              title="Market Trend Analysis with Future Projection" 
              description="Property value outperforming neighborhood median with 3-year projection based on current trends"
              showPrediction={true}
              predictionYears={3}
              showCAGR={true}
              showGrowthRate={true}
            />
          </div>
          
          <div className="bg-slate-50 p-6 rounded-lg mt-8">
            <h2 className="text-lg font-semibold mb-4">About IAAO and USPAP Standards</h2>
            <p className="text-sm text-slate-700 mb-4">
              These visualizations are designed in accordance with professional valuation standards:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              <li><strong>IAAO Mass Appraisal Standards</strong> - Following ratio study guidelines and statistical measures for consistent and equitable valuations</li>
              <li><strong>USPAP Standard 5 & 6</strong> - Adhering to development and reporting requirements for mass appraisal</li>
              <li><strong>Trend Analysis</strong> - Utilizing time series analysis with appropriate adjustment factors for market conditions</li>
              <li><strong>Equalization</strong> - Facilitating comparison to ensure assessments are uniform and equitable across comparable properties</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="sparklines" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enhanced sparkline examples */}
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Trend Sparklines</CardTitle>
                <CardDescription>Compact visualizations for property trend monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Standard Sparkline with Highlights</h3>
                  <PropertySparkline 
                    data={demoPropertyData} 
                    height={50} 
                    showTooltip={true}
                    highlightPoints={true}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">With Current Value Display</h3>
                  <PropertySparkline 
                    data={demoPropertyData} 
                    height={50}
                    showTooltip={true}
                    showCurrentValue={true}
                    highlightPoints={true}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">With Growth Indicator</h3>
                  <PropertySparkline 
                    data={demoPropertyData} 
                    height={50}
                    showTooltip={true}
                    showGrowth={true}
                    color="#10b981" // Emerald green
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Market Spike Detection</h3>
                  <PropertySparkline 
                    data={spikePropertyData} 
                    height={50}
                    showTooltip={true}
                    showGrowth={true}
                    highlightPoints={true}
                    color="#8b5cf6" // Purple
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Strong Growth Pattern</h3>
                  <PropertySparkline 
                    data={strongUpwardTrend} 
                    height={50}
                    showTooltip={true}
                    showGrowth={true}
                    showCurrentValue={true}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Declining Value Pattern</h3>
                  <PropertySparkline 
                    data={downwardTrend}
                    height={50}
                    showTooltip={true}
                    showGrowth={true}
                    showCurrentValue={true}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Volatile Market Pattern</h3>
                  <PropertySparkline 
                    data={volatileTrend}
                    height={50}
                    showTooltip={true}
                    showGrowth={true}
                    highlightPoints={true}
                    color="#f59e0b" // Amber
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Property List Integration</CardTitle>
                <CardDescription>Sparklines in property comparison context</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulatedProperties.map((property) => (
                    <div key={property.id} className="flex items-center p-4 border rounded-md hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{property.address}</h3>
                          <Badge 
                            variant={property.growthRate >= 0 ? "outline" : "secondary"}
                            className={property.growthRate >= 15 ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""}
                          >
                            {property.growthRate >= 0 ? '+' : ''}{property.growthRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{property.details}</p>
                        <p className="text-xs text-muted-foreground">Neighborhood: {property.neighborhood}</p>
                      </div>
                      <div className="w-36 flex flex-col items-end">
                        <span className="text-sm font-medium">{formatCurrency(property.value)}</span>
                        <PropertySparkline 
                          data={property.data} 
                          height={30} 
                          width={80}
                          showTooltip={true}
                          highlightPoints={true}
                          color={property.growthRate >= 0 ? '#3b82f6' : '#ef4444'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main featured property card with full chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>456 Oak Street</CardTitle>
                    <CardDescription>Westside • 3 bed, 2 bath • 1,850 sqft</CardDescription>
                  </div>
                  <Badge className="text-lg shadow-sm">+35.4%</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ValuationTrendChart 
                  data={spikePropertyData} 
                  title="Market Value Trend"
                  showGrowthRate={false}
                  className="border-0 shadow-none"
                />
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Tax Assessment (2023): </span>
                  <span className="font-medium">{formatCurrency(spikePropertyData[spikePropertyData.length-1].value * 0.85)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Inspection: </span>
                  <span className="font-medium">09/15/2022</span>
                </div>
              </CardFooter>
            </Card>
            
            {/* Side panel with property statistics and sparklines */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Value Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Market Value</h3>
                    <p className="text-2xl font-bold">{formatCurrency(spikePropertyData[spikePropertyData.length-1].value)}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">5 Year Change</h3>
                      <p className="text-xl font-semibold text-emerald-600">+35.4%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">CAGR</h3>
                      <p className="text-xl font-semibold">+7.8%</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Value per Sq.Ft.</h3>
                    <div className="flex justify-between items-baseline">
                      <p className="text-xl font-semibold">${(spikePropertyData[spikePropertyData.length-1].value / 1850).toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">+7% vs Neighborhood</Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Significant Events</h3>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                        <p>Value spike in 2022 (+23.0%)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        <p>Renovation permit issued 01/2022</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Comparable Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {simulatedProperties.slice(0, 3).map((property, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                        Photo
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{property.address}</h3>
                        <p className="text-xs text-muted-foreground">{property.details}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-medium">{formatCurrency(property.value)}</span>
                          <PropertySparkline 
                            data={property.data} 
                            height={15} 
                            width={50}
                            color={property.growthRate >= 0 ? '#3b82f6' : '#ef4444'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyTrendsDemo;