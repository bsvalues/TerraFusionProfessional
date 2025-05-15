import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Property } from '../../shared/schema';
import { 
  createPropertyClusters, 
  PropertyCluster, 
  formatClusterStatistics 
} from '../../services/spatialClusteringService';
import { ClusteringMap } from './ClusteringMap';
import { formatCurrency } from '../../lib/utils';

interface ClusteringPanelProps {
  properties: Property[];
  className?: string;
}

export function ClusteringPanel({ properties, className }: ClusteringPanelProps) {
  const [clusters, setClusters] = useState<PropertyCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<PropertyCluster | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [numClusters, setNumClusters] = useState<number>(5);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Create clusters whenever the number of clusters or properties change
  useEffect(() => {
    const validProperties = properties.filter(p => p.latitude && p.longitude);
    if (validProperties.length === 0) return;
    
    const newClusters = createPropertyClusters(validProperties, numClusters);
    setClusters(newClusters);
    setSelectedCluster(null);
    setSelectedProperty(null);
  }, [properties, numClusters]);
  
  const handleClusterSelect = (cluster: PropertyCluster) => {
    setSelectedCluster(cluster);
    setSelectedProperty(null);
    setIsDetailsOpen(true);
  };
  
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };
  
  const formatPropertyValue = (property: Property) => {
    if (!property.value) return 'N/A';
    
    try {
      const numValue = parseFloat(String(property.value).replace(/[^0-9.]/g, ''));
      return isNaN(numValue) ? property.value : formatCurrency(numValue);
    } catch {
      return property.value;
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Spatial Clustering Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Group properties into clusters based on location and attributes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Number of Clusters</span>
            <div className="flex items-center gap-4 w-[180px]">
              <Slider
                value={[numClusters]}
                min={2}
                max={10}
                step={1}
                onValueChange={(value) => setNumClusters(value[0])}
                className="w-32"
              />
              <span className="font-mono w-6 text-center">{numClusters}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-hidden">
        {/* Map visualization (larger on left) */}
        <div className="lg:col-span-3 h-full rounded-lg overflow-hidden border">
          <ClusteringMap
            clusters={clusters}
            onClusterSelect={handleClusterSelect}
            onPropertySelect={handlePropertySelect}
            selectedCluster={selectedCluster}
            selectedProperty={selectedProperty}
            className="h-full"
          />
        </div>
        
        {/* Cluster information (smaller on right) */}
        <div className="flex flex-col gap-4 h-full overflow-auto">
          {selectedCluster ? (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge 
                    style={{ backgroundColor: selectedCluster.color, color: 'white' }}
                    className="text-xs px-2"
                  >
                    Cluster {selectedCluster.id + 1}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedCluster(null)}
                  >
                    View All
                  </Button>
                </div>
                <CardTitle className="text-lg">
                  {selectedCluster.properties.length} Properties
                </CardTitle>
                <CardDescription>
                  Centered at {selectedCluster.centroid[0].toFixed(6)}, {selectedCluster.centroid[1].toFixed(6)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-auto p-3">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Cluster Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted rounded p-2">
                        <div className="text-muted-foreground">Avg. Value</div>
                        <div className="font-medium">{formatCurrency(selectedCluster.statistics.avgValue)}</div>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <div className="text-muted-foreground">Avg. Size</div>
                        <div className="font-medium">{Math.round(selectedCluster.statistics.avgSquareFeet).toLocaleString()} sqft</div>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <div className="text-muted-foreground">Avg. Year Built</div>
                        <div className="font-medium">{Math.round(selectedCluster.statistics.avgYearBuilt)}</div>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <div className="text-muted-foreground">Property Count</div>
                        <div className="font-medium">{selectedCluster.statistics.propertyCount}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Properties in Cluster</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Address</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCluster.properties.slice(0, 50).map((property) => (
                            <TableRow 
                              key={property.id.toString()}
                              className={selectedProperty?.id === property.id ? 'bg-muted' : undefined}
                              onClick={() => handlePropertySelect(property)}
                            >
                              <TableCell className="font-medium truncate max-w-[150px]">
                                {property.address}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPropertyValue(property)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedCluster.properties.length > 50 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                                {selectedCluster.properties.length - 50} more properties...
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Cluster Overview</CardTitle>
                <CardDescription>
                  {clusters.length} clusters created from {properties.filter(p => p.latitude && p.longitude).length} properties
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-auto p-3">
                {clusters.length > 0 ? (
                  <div className="space-y-3">
                    {clusters.map((cluster) => (
                      <Card 
                        key={cluster.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleClusterSelect(cluster)}
                      >
                        <CardHeader className="p-3 pb-0">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: cluster.color }}
                            />
                            <h4 className="text-sm font-medium">Cluster {cluster.id + 1}</h4>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-muted-foreground">Properties:</span>
                            <span>{cluster.statistics.propertyCount}</span>
                            
                            <span className="text-muted-foreground">Avg. Value:</span>
                            <span>{formatCurrency(cluster.statistics.avgValue)}</span>
                            
                            <span className="text-muted-foreground">Avg. Sq Ft:</span>
                            <span>{Math.round(cluster.statistics.avgSquareFeet).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No clusters available. Adjust clustering parameters or ensure properties have location data.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}