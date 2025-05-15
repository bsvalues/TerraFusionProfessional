import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  DownloadCloud, Loader2, CheckCircle2, AlertCircle, Database,
  Server, MapPin, Building, Home, Map, ChevronDown, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// ArcGIS REST API datasets from the existing system
const ARCGIS_DATASETS = {
  PARCELS: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels/FeatureServer/0/query',
  PARCELS_AND_ASSESS: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0/query',
  COUNTY_BOUNDARY: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/CountyBoundaries/FeatureServer/0/query',
  SCHOOL_DISTRICT: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/SchoolDistricts/FeatureServer/0/query',
};

const DATASET_ICONS = {
  PARCELS: <MapPin className="h-5 w-5" />,
  PARCELS_AND_ASSESS: <Database className="h-5 w-5" />,
  COUNTY_BOUNDARY: <Map className="h-5 w-5" />,
  SCHOOL_DISTRICT: <Building className="h-5 w-5" />,
};

// Data structure for connection settings
interface ConnectionSettings {
  ftpHost: string;
  ftpUsername: string;
  ftpPassword: string;
  ftpPath: string;
}

const ArcGISDataImportPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState<string>('PARCELS_AND_ASSESS');
  const [activeTab, setActiveTab] = useState<string>('arcgis');
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fetchedData, setFetchedData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>({
    ftpHost: 'ftp.bentoncounty.gov',
    ftpUsername: '',
    ftpPassword: '',
    ftpPath: '/property-data',
  });
  const [limitResults, setLimitResults] = useState(3000);
  const [stats, setStats] = useState<{
    totalRecords: number;
    propertyCounts: Record<string, number>;
    valueRange: { min: number; max: number };
    dataFields: string[];
  } | null>(null);
  const [dataFieldsVisible, setDataFieldsVisible] = useState(false);
  const [showRawDataModal, setShowRawDataModal] = useState(false);
  const [selectedRawProperty, setSelectedRawProperty] = useState<any>(null);

  // Handle fetching data from ArcGIS REST API
  const fetchFromArcGIS = async () => {
    setIsFetching(true);
    setFetchedData([]);
    setProgress(10);
    setErrorMessage(null);
    setIsSuccess(false);
    
    try {
      // Get the selected dataset URL
      const datasetUrl = ARCGIS_DATASETS[selectedDataset as keyof typeof ARCGIS_DATASETS];
      
      if (!datasetUrl) {
        throw new Error(`Invalid dataset: ${selectedDataset}`);
      }
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        returnGeometry: 'true',
        f: 'json',
        resultRecordCount: limitResults.toString()
      });
      
      const fullUrl = `${datasetUrl}?${queryParams.toString()}`;
      
      toast({
        title: 'Fetching Data',
        description: `Retrieving data from ${selectedDataset} dataset...`,
      });
      
      // Fetch the data
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setProgress(50);
      
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid response format: No features array found');
      }
      
      // Process the data to match the property schema while preserving all original fields
      const processedData = data.features.map((feature: any) => {
        const attributes = feature.attributes || {};
        
        // Keep all original attributes
        const rawAttributes = { ...attributes };
        
        // Extract coordinates from the geometry if available
        let coordinates = null;
        let latitude = null;
        let longitude = null;
        
        // Handle centroid points if available (common in ArcGIS data)
        if (attributes.CENTROID_X && attributes.CENTROID_Y) {
          longitude = parseFloat(attributes.CENTROID_X);
          latitude = parseFloat(attributes.CENTROID_Y);
          coordinates = [longitude, latitude];
        }
        // Otherwise try to extract from geometry
        else if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings[0] && feature.geometry.rings[0][0]) {
            longitude = feature.geometry.rings[0][0][0]; 
            latitude = feature.geometry.rings[0][0][1];
            coordinates = [longitude, latitude];
          } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            longitude = feature.geometry.x;
            latitude = feature.geometry.y;
            coordinates = [longitude, latitude];
          }
        }
        
        // Add standard property fields for our system with proper mapping for Parcels_and_Assess dataset
        const properties = {
          // Core fields with proper Parcels_and_Assess mappings
          parcelId: attributes.Parcel_ID || attributes.geo_id || attributes.APN || attributes.PARCEL_ID || attributes.PIN || attributes.OBJECTID?.toString() || 'UNKNOWN',
          address: attributes.situs_address || attributes.SITUS_ADDRESS || attributes.ADDRESS || attributes.FULLADDR || 'Unknown Address',
          squareFeet: parseFloat(attributes.land_sqft || attributes.BLDG_SQFT || attributes.SHAPE_AREA || 0),
          owner: attributes.owner_name || attributes.OWNERNME1 || attributes.OWNER || attributes.OWNER_NAME || 'Unknown Owner',
          value: attributes.appraised_val || attributes.TOTAL_VALUE || attributes.ASSESSED_VALUE || attributes.IMPROVEVAL || null,
          yearBuilt: attributes.year_blt || attributes.YEAR_BUILT || null,
          propertyType: attributes.primary_use || attributes.PROPERTY_TYPE || attributes.PROPTYPE || attributes.USE_CODE || 'Unknown',
          
          // Location data
          coordinates: coordinates,
          latitude: latitude !== null ? String(latitude) : null,
          longitude: longitude !== null ? String(longitude) : null,
          
          // Other standard fields with specialized mappings for Parcels_and_Assess
          neighborhood: attributes.neighborhood_name || attributes.neighborhood_code || attributes.NEIGHBORHOOD || attributes.CENSUS_TRACT || null,
          lotSize: parseFloat(attributes.legal_acres ? (attributes.legal_acres * 43560) : attributes.LOT_SIZE || attributes.ACRES || 0),
          bedrooms: attributes.BEDROOMS || null,
          bathrooms: attributes.BATHROOMS || null,
          
          // Agricultural use value if available
          agUseValue: attributes.ag_use_val || null,
          
          // Tax code area if available 
          taxCodeArea: attributes.tax_code_area || null,
          
          // Store all raw attributes to ensure we don't lose any data
          rawAttributes
        };
        
        return properties;
      });
      
      setFetchedData(processedData);
      setProgress(80);
      
      // Calculate statistics for the fetched data
      const propertyTypes: Record<string, number> = {};
      let minValue = Number.MAX_VALUE;
      let maxValue = 0;
      const fields = new Set<string>();
      
      processedData.forEach((property: any) => {
        // Count property types
        const type = property.propertyType || 'Unknown';
        propertyTypes[type] = (propertyTypes[type] || 0) + 1;
        
        // Calculate value range
        if (property.value) {
          const numValue = parseFloat(property.value);
          if (!isNaN(numValue)) {
            minValue = Math.min(minValue, numValue);
            maxValue = Math.max(maxValue, numValue);
          }
        }
        
        // Get all available fields
        Object.keys(property).forEach(key => fields.add(key));
      });
      
      setStats({
        totalRecords: processedData.length,
        propertyCounts: propertyTypes,
        valueRange: { min: minValue === Number.MAX_VALUE ? 0 : minValue, max: maxValue },
        dataFields: Array.from(fields)
      });
      
      toast({
        title: 'Data Fetched Successfully',
        description: `Retrieved ${processedData.length} properties from ${selectedDataset}`,
      });
      
      setProgress(100);
    } catch (error: any) {
      console.error('Error fetching ArcGIS data:', error);
      setErrorMessage(error.message);
      
      toast({
        variant: 'destructive',
        title: 'Error Fetching Data',
        description: error.message,
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Handle importing data to database
  const importToDatabase = async () => {
    setIsImporting(true);
    setProgress(0);
    setErrorMessage(null);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 300);
    
    try {
      // Prepare the request body
      const requestBody = {
        data: fetchedData,
        source: `arcgis-${selectedDataset.toLowerCase()}`,
        fileType: 'json'
      };
      
      // Send the data to the server
      const response = await fetch('/api/etl/import/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to import data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setImportResult(result);
      setIsSuccess(true);
      
      toast({
        title: 'Import Successful',
        description: `Imported ${result.successCount || 0} properties. ${result.errorCount || 0} errors.`,
      });
    } catch (error: any) {
      console.error('Error importing data:', error);
      setErrorMessage(error.message);
      
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message,
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(isSuccess ? 100 : 0);
      setIsImporting(false);
    }
  };

  // Handle FTP connection
  const connectToFTP = async () => {
    setIsFetching(true);
    setProgress(10);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/etl/ftp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: connectionSettings.ftpHost,
          port: 21,
          username: connectionSettings.ftpUsername,
          password: connectionSettings.ftpPassword,
          secure: true,
          path: connectionSettings.ftpPath
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to connect to FTP: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to connect to FTP server');
      }
      
      // Display success message
      toast({
        title: 'FTP Connection Successful',
        description: result.message,
      });
      
      // Navigate to the FTP data migration page which already has the full implementation
      window.location.href = '/ftp-data-migration';
      
    } catch (error: any) {
      console.error('Error connecting to FTP:', error);
      setErrorMessage(error.message);
      
      toast({
        variant: 'destructive',
        title: 'FTP Connection Failed',
        description: error.message,
      });
    } finally {
      setIsFetching(false);
      setProgress(0);
    }
  };

  // Handle connection setting changes
  const handleConnectionChange = (field: keyof ConnectionSettings, value: string) => {
    setConnectionSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle showing raw data dialog
  const handleViewRawData = (property: any) => {
    setSelectedRawProperty(property);
    setShowRawDataModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        heading="ArcGIS & FTP Data Import"
        description="Import real property data from ArcGIS REST API endpoints or FTP servers into your database."
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="arcgis">ArcGIS REST API</TabsTrigger>
          <TabsTrigger value="ftp">FTP Server</TabsTrigger>
        </TabsList>
        
        <TabsContent value="arcgis">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>ArcGIS Data Source</CardTitle>
                <CardDescription>
                  Select the ArcGIS REST API dataset to import property data from.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dataset</label>
                  <Select
                    value={selectedDataset}
                    onValueChange={setSelectedDataset}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ARCGIS_DATASETS).map((datasetKey) => (
                        <SelectItem key={datasetKey} value={datasetKey}>
                          <div className="flex items-center">
                            {DATASET_ICONS[datasetKey as keyof typeof DATASET_ICONS]}
                            <span className="ml-2">{datasetKey.replace(/_/g, ' ')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Result Limit</label>
                  <Input
                    type="number"
                    value={limitResults}
                    onChange={(e) => setLimitResults(parseInt(e.target.value) || 1000)}
                    min={1}
                    max={10000}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of properties to fetch (1-10,000)
                  </p>
                </div>
                
                <Button
                  onClick={fetchFromArcGIS}
                  disabled={isFetching}
                  className="w-full"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching Data...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="mr-2 h-4 w-4" />
                      Fetch Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {fetchedData.length > 0 ? 'Data Preview' : 'Data Import'}
                </CardTitle>
                <CardDescription>
                  {fetchedData.length > 0 
                    ? `${fetchedData.length} properties fetched from ArcGIS REST API` 
                    : 'Fetch data from ArcGIS REST API to preview and import'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isFetching && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fetching data...</span>
                      <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {fetchedData.length > 0 && (
                  <>
                    {/* Data Summary */}
                    {stats && (
                      <div className="mb-4 p-4 bg-gray-50 border rounded-md">
                        <h3 className="text-lg font-medium mb-2">Data Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Total Records</h4>
                            <p className="text-2xl font-bold">{stats.totalRecords}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Property Value Range</h4>
                            <p className="text-sm">
                              <span className="font-medium">Min:</span> ${stats.valueRange.min.toLocaleString()}
                              <br />
                              <span className="font-medium">Max:</span> ${stats.valueRange.max.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Property Types</h4>
                            <div className="text-sm">
                              {Object.entries(stats.propertyCounts)
                                .slice(0, 3)
                                .map(([type, count]) => (
                                  <div key={type} className="flex justify-between">
                                    <span>{type}:</span>
                                    <span className="font-medium">{count}</span>
                                  </div>
                                ))}
                              {Object.keys(stats.propertyCounts).length > 3 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  + {Object.keys(stats.propertyCounts).length - 3} more types
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <button 
                            onClick={() => setDataFieldsVisible(!dataFieldsVisible)}
                            className="text-sm flex items-center text-blue-600 hover:text-blue-800"
                          >
                            {dataFieldsVisible ? (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Hide Available Fields
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-4 w-4 mr-1" />
                                Show Available Fields ({stats.dataFields.length})
                              </>
                            )}
                          </button>
                          
                          {dataFieldsVisible && (
                            <div className="mt-2 p-2 bg-gray-100 rounded-md">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {stats.dataFields.map(field => (
                                  <div key={field} className="text-xs bg-white px-2 py-1 rounded border">
                                    {field}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  
                    {/* Data Preview Table */}
                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcel ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">All Raw Fields</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fetchedData.slice(0, 10).map((property, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{property.parcelId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{property.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{property.propertyType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{property.value}</td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex space-x-2">
                                    <details className="cursor-pointer">
                                      <summary className="text-sm text-blue-600 hover:text-blue-800">
                                        Quick view
                                      </summary>
                                      <div className="mt-2 bg-gray-50 p-2 rounded border text-xs overflow-x-auto">
                                        <pre className="whitespace-pre-wrap break-all">
                                          {JSON.stringify(property.rawAttributes, null, 2)}
                                        </pre>
                                      </div>
                                    </details>
                                    <button 
                                      onClick={() => handleViewRawData(property)}
                                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Full view
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {fetchedData.length > 10 && (
                        <div className="px-6 py-2 border-t text-sm text-gray-500">
                          Showing 10 of {fetchedData.length} properties
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Importing to database...</span>
                      <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                {isSuccess && (
                  <Alert variant="default" className="bg-green-50 border-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Successfully imported {importResult?.successCount || 0} properties.
                      {importResult?.errorCount > 0 && ` There were ${importResult.errorCount} errors.`}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {fetchedData.length > 0 && (
                  <Button 
                    onClick={importToDatabase} 
                    disabled={isImporting || fetchedData.length === 0}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Import to Database
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ftp">
          <Card>
            <CardHeader>
              <CardTitle>FTP Connection</CardTitle>
              <CardDescription>
                Connect to an FTP server to import property data files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">FTP Host</label>
                  <Input
                    value={connectionSettings.ftpHost}
                    onChange={(e) => handleConnectionChange('ftpHost', e.target.value)}
                    placeholder="ftp.example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remote Path (Optional)</label>
                  <Input
                    value={connectionSettings.ftpPath}
                    onChange={(e) => handleConnectionChange('ftpPath', e.target.value)}
                    placeholder="/property-data"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={connectionSettings.ftpUsername}
                    onChange={(e) => handleConnectionChange('ftpUsername', e.target.value)}
                    placeholder="username"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={connectionSettings.ftpPassword}
                    onChange={(e) => handleConnectionChange('ftpPassword', e.target.value)}
                    placeholder="password"
                  />
                </div>
              </div>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {isFetching && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connecting to FTP...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={connectToFTP}
                disabled={isFetching || !connectionSettings.ftpHost || !connectionSettings.ftpUsername || !connectionSettings.ftpPassword}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Server className="mr-2 h-4 w-4" />
                    Connect to FTP
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog for displaying raw data in full */}
      <Dialog open={showRawDataModal} onOpenChange={setShowRawDataModal}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Raw Geospatial Data</DialogTitle>
            <DialogDescription>
              Complete unfiltered data attributes from the ArcGIS REST API. This includes all fields and values as received from the data source.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRawProperty && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="text-sm font-medium">Parcel ID</h3>
                  <p className="text-lg">{selectedRawProperty.parcelId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Address</h3>
                  <p className="text-lg">{selectedRawProperty.address}</p>
                </div>
              </div>
              
              <div className="border rounded-md">
                <div className="px-4 py-2 bg-gray-100 border-b">
                  <h3 className="font-medium">Raw Attributes (Original Fields)</h3>
                </div>
                <div className="p-4 bg-gray-50 overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(selectedRawProperty.rawAttributes, null, 2)}
                  </pre>
                </div>
              </div>
              
              {selectedRawProperty.coordinates && (
                <div className="border rounded-md">
                  <div className="px-4 py-2 bg-gray-100 border-b">
                    <h3 className="font-medium">Geographic Information</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h4 className="text-sm font-medium">Latitude</h4>
                        <p>{selectedRawProperty.latitude}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Longitude</h4>
                        <p>{selectedRawProperty.longitude}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRawDataModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArcGISDataImportPage;