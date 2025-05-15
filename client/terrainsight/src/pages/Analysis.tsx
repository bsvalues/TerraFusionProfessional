import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, BarChart, TrendingUp, Landmark, PieChart, LineChart, ArrowRight, Map, FileDown as FileDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import MarketTrendsHeatMap from '@/components/map/MarketTrendsHeatMap';
import PropertyValuationTrendHeatMap from '@/components/valuation/PropertyValuationTrendHeatMap';
import { OneClickExport } from '@/components/export/OneClickExport';
import { CostApproachPanel } from '@/components/cost/CostApproachPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

// Helper component to get map instance
const MapController = ({ setMap }: { setMap: (map: L.Map | null) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    console.log("Map instance ready");
    setMap(map);
    
    // Cleanup function to handle component unmount
    return () => {
      console.log("Cleaning up map instance");
      // We don't need to call setMap(null) here as the
      // component unmount already means the map is gone
    };
  }, [map, setMap]);
  
  return null;
};

const AnalysisPage = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [analysisType, setAnalysisType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Function to handle opening different analysis types
  const handleOpenAnalysis = (type: string) => {
    setAnalysisType(type);
    setDialogOpen(true);
  };
  
  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      // Ensure map is properly cleaned up on page navigation
      if (map) {
        console.log("Cleaning up map on page unmount");
        // No need to call map.remove() here as React-Leaflet handles this
      }
    };
  }, [map]);
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Property Analysis</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Statistical analysis tools for property valuation</p>
        </div>
        
        <div className="flex mt-4 sm:mt-0">
          <Button>New Analysis</Button>
        </div>
      </div>
      
      <Tabs defaultValue="valuation" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 min-w-[300px] sm:max-w-[600px]">
            <TabsTrigger value="valuation" className="flex items-center justify-center sm:justify-start py-2">
              <Calculator className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Valuation Models</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center justify-center sm:justify-start py-2">
              <TrendingUp className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Market Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center justify-center sm:justify-start py-2">
              <BarChart className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Analysis Reports</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Valuation Models</CardTitle>
                <CardDescription>
                  Property valuation calculation models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] rounded-md">
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-start sm:items-center">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                            <Landmark className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Income Approach</h3>
                            <p className="text-sm text-muted-foreground mt-1">Valuation based on income generation potential</p>
                          </div>
                        </div>
                        <Button size="sm" className="self-end sm:self-auto" onClick={() => handleOpenAnalysis('income')}>Run Analysis</Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-start sm:items-center">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                            <BarChart className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Comparable Sales</h3>
                            <p className="text-sm text-muted-foreground mt-1">Valuation based on similar property sales</p>
                          </div>
                        </div>
                        <Button size="sm" className="self-end sm:self-auto" onClick={() => handleOpenAnalysis('comparable')}>Run Analysis</Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-start sm:items-center">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                            <Calculator className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Cost Approach</h3>
                            <p className="text-sm text-muted-foreground mt-1">Valuation based on replacement cost</p>
                          </div>
                        </div>
                        <Button size="sm" className="self-end sm:self-auto" onClick={() => handleOpenAnalysis('cost')}>Run Analysis</Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-start sm:items-center">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                            <LineChart className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Regression Analysis</h3>
                            <p className="text-sm text-muted-foreground mt-1">Statistical model using property attributes</p>
                          </div>
                        </div>
                        <Button size="sm" className="self-end sm:self-auto" onClick={() => handleOpenAnalysis('regression')}>Run Analysis</Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>
                  Recently run valuation models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      name: "Income Analysis - Hotels",
                      date: "April 1, 2024",
                      type: "Income Approach"
                    },
                    {
                      name: "Downtown Commercial",
                      date: "March 28, 2024",
                      type: "Regression Analysis"
                    },
                    {
                      name: "Residential Q1 2024",
                      date: "March 20, 2024",
                      type: "Comparable Sales"
                    }
                  ].map((analysis, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{analysis.name}</p>
                        <p className="text-xs text-muted-foreground">{analysis.date}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Map className="h-5 w-5 mr-2" />
                      Interactive Heat Map
                    </CardTitle>
                    <CardDescription>
                      Visualize property market trends geospatially
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Map container using react-leaflet */}
                <div className="h-[400px] w-full rounded-md border mb-4">
                  <MapContainer 
                    center={[46.2085, -119.1372]} 
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController setMap={setMap} />
                  </MapContainer>
                </div>
                
                {/* Market Trends Heat Map */}
                <Tabs defaultValue="marketTrends" className="mt-4">
                  <TabsList className="mb-4">
                    <TabsTrigger value="marketTrends">Market Trends</TabsTrigger>
                    <TabsTrigger value="valuationTrends">Valuation Trends</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="marketTrends">
                    <MarketTrendsHeatMap map={map} />
                  </TabsContent>
                  
                  <TabsContent value="valuationTrends">
                    <PropertyValuationTrendHeatMap map={map} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>
                  Property market movement analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Average Price Growth</p>
                    <p className="text-xl font-bold text-primary mt-1">+4.8%</p>
                    <p className="text-xs text-muted-foreground">Year over year</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Sales Volume</p>
                    <p className="text-xl font-bold mt-1">1,241</p>
                    <p className="text-xs text-muted-foreground">Last 12 months</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Avg. Days on Market</p>
                    <p className="text-xl font-bold mt-1">26</p>
                    <p className="text-xs text-muted-foreground">Last 90 days</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Avg. Price / Sq Ft</p>
                    <p className="text-xl font-bold mt-1">$246</p>
                    <p className="text-xs text-muted-foreground">County-wide</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View Detailed Market Analysis</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Property Type Distribution</CardTitle>
                <CardDescription>
                  Distribution of property values by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-4">
                    <PieChart className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Property distribution chart will appear here</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Residential</span>
                    </div>
                    <span className="text-sm font-medium">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Commercial</span>
                    </div>
                    <span className="text-sm font-medium">18%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-sm">Industrial</span>
                    </div>
                    <span className="text-sm font-medium">7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      <span className="text-sm">Agricultural</span>
                    </div>
                    <span className="text-sm font-medium">3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Analysis Reports</CardTitle>
                  <CardDescription>
                    Generated property analysis reports
                  </CardDescription>
                </div>
                <OneClickExport 
                  text="One-Click Export"
                  variant="default"
                  size="sm"
                  icon={<FileDownIcon className="h-4 w-4 mr-1" />}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-md">
                <div className="space-y-4">
                  {[
                    {
                      title: "Hotel/Motel Income Analysis 2024",
                      description: "Income approach analysis for lodging properties",
                      date: "April 1, 2024",
                      author: "Jane Analyst",
                      tags: ["Income Approach", "Hotel/Motel", "2024"]
                    },
                    {
                      title: "Commercial Property Valuation Q1 2024",
                      description: "First quarter commercial property valuation analysis",
                      date: "March 31, 2024",
                      author: "John Admin",
                      tags: ["Commercial", "Q1 2024", "Multiple Approaches"]
                    },
                    {
                      title: "Residential Market Trends Annual Report",
                      description: "Annual analysis of residential property market trends",
                      date: "March 15, 2024",
                      author: "Sarah Manager",
                      tags: ["Residential", "Annual Report", "Market Analysis"]
                    },
                    {
                      title: "Downtown Commercial Growth Report",
                      description: "Analysis of property value growth in downtown area",
                      date: "February 28, 2024",
                      author: "Jane Analyst",
                      tags: ["Downtown", "Commercial", "Growth Analysis"]
                    },
                    {
                      title: "Industrial Property Valuation Update",
                      description: "Updated valuations for industrial properties",
                      date: "February 15, 2024",
                      author: "John Admin",
                      tags: ["Industrial", "Valuation Update", "Cost Approach"]
                    }
                  ].map((report, index) => (
                    <div key={index} className="border rounded-md p-4 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{report.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          <div className="flex flex-col sm:flex-row text-xs text-muted-foreground mt-2 gap-2 sm:gap-4">
                            <span><span className="font-medium">Date:</span> {report.date}</span>
                            <span><span className="font-medium">Author:</span> {report.author}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {report.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <Button size="sm" variant="outline">Download</Button>
                          <Button size="sm">View</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Analysis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {analysisType === 'cost' && "Cost Approach Analysis"}
              {analysisType === 'income' && "Income Approach Analysis"}
              {analysisType === 'comparable' && "Comparable Sales Analysis"}
              {analysisType === 'regression' && "Regression Analysis"}
            </DialogTitle>
            <DialogDescription>
              {analysisType === 'cost' && "Property valuation based on replacement cost and depreciation"}
              {analysisType === 'income' && "Property valuation based on income generation potential"}
              {analysisType === 'comparable' && "Property valuation based on similar property sales"}
              {analysisType === 'regression' && "Statistical property valuation using multiple attributes"}
            </DialogDescription>
          </DialogHeader>
          
          {analysisType === 'cost' && (
            <CostApproachPanel 
              onAnalysisComplete={(result) => {
                console.log("Cost approach analysis complete:", result);
                // Here you could save the result to a database or state
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalysisPage;