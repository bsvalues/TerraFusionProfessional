import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Check, Download, FileText, Map, Layers, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

// Interface for GIS datasets 
interface GISDatasetInfo {
  name: string;
  isDownloaded: boolean;
}

// Interface for datasets response
interface DatasetsResponse {
  availableDatasets: string[];
  downloadedDatasets: string[];
}

// Interface for dataset metadata response
interface DatasetMetadataResponse {
  dataset: string;
  featureCount: number;
  attributes: string[];
  boundingBox?: number[];
  isDownloaded: boolean;
}

/**
 * Component for managing and displaying GIS datasets
 */
export function GISDataManager() {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Query to fetch available datasets
  const { 
    data: datasetsData, 
    isLoading: isDatasetsLoading, 
    isError: isDatasetsError 
  } = useQuery({
    queryKey: ['/api/gis/datasets'],
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Query to fetch metadata for the selected dataset
  const { 
    data: datasetMetadata, 
    isLoading: isMetadataLoading, 
    isError: isMetadataError,
    refetch: refetchMetadata
  } = useQuery({
    queryKey: ['/api/gis/datasets', selectedDataset, 'metadata'],
    enabled: !!selectedDataset,
    queryFn: async () => {
      if (!selectedDataset) return null;
      const response = await fetch(`/api/gis/datasets/${selectedDataset}/metadata`);
      if (!response.ok) {
        throw new Error('Failed to fetch dataset metadata');
      }
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Mutation to download a dataset
  const { 
    mutate: downloadDataset, 
    isPending: isDownloading,
    isError: isDownloadError 
  } = useMutation({
    mutationFn: async (dataset: string) => {
      // Send the dataset name in the request body
      return await apiRequest(`/api/gis/datasets/download`, 'POST', { dataset });
    },
    onSuccess: () => {
      // Invalidate queries after successful download
      queryClient.invalidateQueries({ queryKey: ['/api/gis/datasets'] });
      if (selectedDataset) {
        queryClient.invalidateQueries({ queryKey: ['/api/gis/datasets', selectedDataset, 'metadata'] });
        setTimeout(() => {
          refetchMetadata();
        }, 1000);
      }
    }
  });
  
  // Process datasets data into a format for display
  const datasetsResponse = datasetsData as DatasetsResponse;
  const datasets = datasetsResponse?.availableDatasets.map(name => ({
    name,
    isDownloaded: (datasetsResponse?.downloadedDatasets || []).includes(name)
  })) || [];
  
  // Handle selecting a dataset
  const handleSelectDataset = (datasetName: string) => {
    setSelectedDataset(datasetName);
  };
  
  // Handle downloading a dataset
  const handleDownload = () => {
    if (selectedDataset) {
      downloadDataset(selectedDataset);
    }
  };
  
  // Set default selected dataset when data loads
  useEffect(() => {
    if (datasets.length > 0 && !selectedDataset) {
      setSelectedDataset(datasets[0].name);
    }
  }, [datasets, selectedDataset]);
  
  // Determine if current dataset is available locally
  const isDatasetAvailable = !!selectedDataset && 
    !!datasetsResponse?.downloadedDatasets?.includes(selectedDataset);
  
  return (
    <Card className="w-full shadow-lg border border-opacity-50 bg-background/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Benton County GIS Data
        </CardTitle>
        <CardDescription>
          Manage and access geospatial datasets for property analysis
        </CardDescription>
      </CardHeader>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Dataset List Panel */}
        <div className="border-r border-border/50">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold">Available Datasets</h3>
          </CardHeader>
          <CardContent>
            {isDatasetsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : isDatasetsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load available datasets</AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-1">
                  {datasets.map((dataset) => (
                    <Button
                      key={dataset.name}
                      variant={selectedDataset === dataset.name ? "secondary" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => handleSelectDataset(dataset.name)}
                    >
                      <Map className="mr-2 h-4 w-4" />
                      {dataset.name}
                      {dataset.isDownloaded && <Check className="ml-auto h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </div>
        
        {/* Dataset Details Panel */}
        <div className="col-span-2">
          <CardContent className="pt-6">
            {!selectedDataset ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a dataset to view details
              </div>
            ) : isDatasetsLoading || isMetadataLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedDataset.replace(/([A-Z])/g, ' $1').trim()}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isDatasetAvailable ? "default" : "outline"}>
                        {isDatasetAvailable ? (
                          <><Check className="mr-1 h-3 w-3" /> Available</>
                        ) : (
                          "Not Downloaded"
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  {!isDatasetAvailable && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isDownloading ? "Downloading..." : "Download"} 
                    </Button>
                  )}
                </div>
                
                {isDownloadError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to download dataset</AlertDescription>
                  </Alert>
                )}
                
                {isDatasetAvailable ? (
                  isMetadataLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : isMetadataError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>Failed to load dataset information</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Dataset Statistics</h3>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="flex flex-col bg-muted/50 p-3 rounded-md">
                            <span className="text-xs text-muted-foreground">Features</span>
                            <span className="text-xl font-bold">{datasetMetadata?.featureCount || 0}</span>
                          </div>
                          <div className="flex flex-col bg-muted/50 p-3 rounded-md">
                            <span className="text-xs text-muted-foreground">Attributes</span>
                            <span className="text-xl font-bold">{datasetMetadata?.attributes?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {datasetMetadata?.attributes && datasetMetadata.attributes.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-1">Available Attributes</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {datasetMetadata.attributes.slice(0, 15).map((attr: string) => (
                              <Badge key={attr} variant="outline" className="text-xs">
                                {attr}
                              </Badge>
                            ))}
                            {datasetMetadata.attributes.length > 15 && (
                              <Badge variant="outline" className="text-xs">
                                +{datasetMetadata.attributes.length - 15} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Usage</h3>
                        <p className="text-sm text-muted-foreground">
                          This dataset can be used for geospatial analysis and visualization
                          in the property appraisal platform. It provides official Benton County
                          GIS data for accurate property assessment.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-muted/50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Dataset Not Downloaded</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This dataset needs to be downloaded from the Benton County GIS server
                      before it can be used. Click the download button to retrieve this data.
                    </p>
                    <div className="text-sm">
                      <strong>Note:</strong> Downloaded datasets are stored locally for faster access
                      in future sessions.
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </div>
      
      <CardFooter className="bg-muted/20 border-t border-border/50 px-6 py-4">
        <div className="text-xs text-muted-foreground">
          Data source: Official Benton County GIS server • Last updated: April 2023
        </div>
      </CardFooter>
    </Card>
  );
}