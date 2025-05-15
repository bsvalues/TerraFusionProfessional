import React, { useState } from 'react';
import { Database, Search, Download, UploadCloud, Table, MapPin, Home, BarChart } from 'lucide-react';
import { PropertyList } from '../property/PropertyList';
import ValuationDashboard from '../valuation/ValuationDashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const DataPanel: React.FC = () => {
  // Define placeholders for the data tables
  const dataSources = [
    { id: 'properties', name: 'Properties', count: 1250, selected: true },
    { id: 'sales', name: 'Sales', count: 523, selected: false },
    { id: 'permits', name: 'Permits', count: 86, selected: false },
    { id: 'landuse', name: 'Land Use', count: 1250, selected: false },
    { id: 'improvements', name: 'Improvements', count: 1124, selected: false }
  ];
  
  const [dataSourceSearchQuery, setDataSourceSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('properties');
  
  const filteredDataSources = dataSources.filter(source => 
    source.name.toLowerCase().includes(dataSourceSearchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* Data Source Sidebar */}
      <div className="w-64 border-r p-4 flex flex-col">
        <h2 className="font-medium text-lg mb-4 flex items-center">
          <Database size={18} className="mr-2 text-primary" />
          Data Sources
        </h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search data sources..." 
            className="w-full border rounded-md pl-8 py-2 text-sm"
            value={dataSourceSearchQuery}
            onChange={(e) => setDataSourceSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="flex-1">
          {filteredDataSources.map(source => (
            <Button 
              key={source.id}
              variant={source.id === selectedSource ? "default" : "ghost"}
              className="w-full justify-between mb-1"
              onClick={() => setSelectedSource(source.id)}
            >
              <span className="flex items-center">
                {source.id === 'properties' ? (
                  <Home className="mr-2 h-4 w-4" />
                ) : (
                  <Table className="mr-2 h-4 w-4" />
                )}
                {source.name}
              </span>
              <Badge variant="secondary" className="ml-2">
                {source.count}
              </Badge>
            </Button>
          ))}
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t">
          <Button className="w-full mb-2">
            <UploadCloud className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Data Content */}
      <div className="flex-1 flex flex-col">
        {/* Data Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h1 className="text-xl font-medium flex items-center">
              {selectedSource === 'properties' ? (
                <>
                  <Home className="mr-2 h-5 w-5 text-primary" />
                  Property Data
                </>
              ) : (
                <>
                  <Table className="mr-2 h-5 w-5 text-primary" />
                  {dataSources.find(s => s.id === selectedSource)?.name || 'Data'} Records
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {dataSources.find(s => s.id === selectedSource)?.count || 0} records | Last updated: Today, 09:15 AM
            </p>
          </div>
        </div>
        
        {/* Data Content */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="dashboard">
            <div className="flex justify-between items-center p-4 border-b">
              <TabsList>
                <TabsTrigger value="dashboard">
                  <BarChart className="mr-2 h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="list">
                  <Home className="mr-2 h-4 w-4" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="table">
                  <Table className="mr-2 h-4 w-4" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="map">
                  <MapPin className="mr-2 h-4 w-4" />
                  Map View
                </TabsTrigger>
              </TabsList>
              
              {selectedSource === 'properties' && (
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              )}
            </div>
            
            {/* Valuation Dashboard Tab - New Interactive Analytics */}
            <TabsContent value="dashboard" className="m-0 flex-1 h-full">
              {selectedSource === 'properties' ? (
                <ValuationDashboard />
              ) : (
                <div className="flex items-center justify-center h-80 border rounded-lg m-4">
                  <div className="text-center">
                    <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="font-medium">Valuation Dashboard</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      The valuation dashboard is available for property data analysis. 
                      It provides interactive filtering, visualization and drill-through 
                      capabilities for property valuations.
                    </p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => setSelectedSource('properties')}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Switch to Properties
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="m-0 p-4">
              {selectedSource === 'properties' && <PropertyList />}
              {selectedSource !== 'properties' && (
                <div className="flex items-center justify-center h-80 border rounded-lg">
                  <div className="text-center">
                    <h3 className="font-medium">Select Properties Source</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This demo focuses on Properties with neighborhood insights.
                    </p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => setSelectedSource('properties')}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Switch to Properties
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="table" className="m-0 p-4">
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium">Table View</h3>
                <p className="mt-2 text-muted-foreground">
                  Please use the Dashboard tab to view tabular property data with 
                  interactive filtering and sorting capabilities.
                </p>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={() => {
                    const dashboardTab = document.querySelector('[value="dashboard"]') as HTMLElement;
                    if (dashboardTab) dashboardTab.click();
                  }}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="m-0 p-4">
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium">Map View</h3>
                <p className="mt-2 text-muted-foreground">
                  The map view would display properties geographically with neighborhood overlays.
                  <br />Please use the Dashboard tab for detailed property analysis.
                </p>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={() => {
                    const dashboardTab = document.querySelector('[value="dashboard"]') as HTMLElement;
                    if (dashboardTab) dashboardTab.click();
                  }}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
