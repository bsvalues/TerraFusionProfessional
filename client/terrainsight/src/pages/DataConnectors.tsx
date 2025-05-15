import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleMapsConnectorPanel from '../components/etl/GoogleMapsConnectorPanel';
import { DatabaseIcon, GlobeIcon, Map, Info } from 'lucide-react';

// Import existing components that would be reused
const DataConnectorsPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Data Connectors</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Connect to and import data from various sources</p>
        </div>
      </div>
      
      <Tabs defaultValue="googlemaps" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 min-w-[300px] sm:max-w-[400px]">
            <TabsTrigger value="googlemaps" className="flex items-center justify-center sm:justify-start py-2">
              <Map className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Google Maps</span>
            </TabsTrigger>
            <TabsTrigger value="zillow" className="flex items-center justify-center sm:justify-start py-2">
              <GlobeIcon className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Zillow</span>
            </TabsTrigger>
            <TabsTrigger value="countygis" className="flex items-center justify-center sm:justify-start py-2">
              <DatabaseIcon className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">County GIS</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="googlemaps" className="space-y-4">
          <GoogleMapsConnectorPanel />
        </TabsContent>
        
        <TabsContent value="zillow" className="space-y-4">
          <div className="p-4 sm:p-6 text-center border rounded-lg bg-card">
            <Info className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-base sm:text-lg font-medium">Zillow Data Connector</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Switch to the Google Maps tab to see the active connector implementation.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="countygis" className="space-y-4">
          <div className="p-4 sm:p-6 text-center border rounded-lg bg-card">
            <Info className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-base sm:text-lg font-medium">County GIS Data Connector</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Switch to the Google Maps tab to see the active connector implementation.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataConnectorsPage;