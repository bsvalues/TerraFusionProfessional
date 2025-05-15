import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { 
  PropertyOutlier, 
  SpatialOutlier, 
  outlierDetectionService 
} from '@/services/analysis/outlierDetectionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { 
  AlertTriangle, 
  BarChart4, 
  Home, 
  MapPin, 
  TrendingDown, 
  TrendingUp 
} from 'lucide-react';

interface OutlierDetectionPanelProps {
  properties: Property[];
  className?: string;
}

export function OutlierDetectionPanel({ properties, className }: OutlierDetectionPanelProps) {
  const [activeTab, setActiveTab] = useState('value');
  const [valueOutliers, setValueOutliers] = useState<PropertyOutlier[]>([]);
  const [spatialOutliers, setSpatialOutliers] = useState<SpatialOutlier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlier, setSelectedOutlier] = useState<PropertyOutlier | null>(null);
  
  useEffect(() => {
    if (properties.length) {
      setLoading(true);
      
      // Detect outliers
      const valueOutliers = outlierDetectionService.detectValueOutliers(properties);
      const spatialOutliers = outlierDetectionService.detectSpatialOutliers(properties);
      
      setValueOutliers(valueOutliers);
      setSpatialOutliers(spatialOutliers);
      setLoading(false);
    }
  }, [properties]);
  
  const getOutlierTypeIcon = (type: PropertyOutlier['outlierType']) => {
    switch (type) {
      case 'value':
        return <BarChart4 className="h-4 w-4" />;
      case 'size':
        return <Home className="h-4 w-4" />;
      case 'age':
        return <TrendingDown className="h-4 w-4" />;
      case 'pricePerSqFt':
        return <TrendingUp className="h-4 w-4" />;
      case 'spatial':
        return <MapPin className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };
  
  const getOutlierSeverityColor = (score: number) => {
    if (score > 5) return 'bg-red-500';
    if (score > 4) return 'bg-red-400';
    if (score > 3) return 'bg-orange-400';
    return 'bg-yellow-400';
  };
  
  const renderOutlierDetails = (outlier: PropertyOutlier | null) => {
    if (!outlier) return null;
    
    const property = outlier.property;
    
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Outlier Property Details</CardTitle>
          <CardDescription>
            {property.address} ({property.parcelId})
            <Badge variant="outline" className="ml-2">
              {property.propertyType || 'Residential'}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Outlier Analysis</h4>
              <div className="text-sm text-muted-foreground">
                <p><strong>Type:</strong> {outlier.outlierType.charAt(0).toUpperCase() + outlier.outlierType.slice(1)} Outlier</p>
                <p><strong>Reason:</strong> {outlier.reason}</p>
                <p><strong>Z-Score:</strong> {outlier.zScore.toFixed(2)}</p>
                
                {/* Spatial outlier specific data */}
                {'spatialDiscrepancy' in outlier && (
                  <>
                    <p><strong>Spatial Discrepancy:</strong> {(outlier.spatialDiscrepancy * 100).toFixed(2)}%</p>
                    <p><strong>Neighborhood Average:</strong> {
                      outlier.outlierType === 'value' 
                        ? formatCurrency(outlier.neighborhoodAverage)
                        : formatNumber(outlier.neighborhoodAverage)
                    }</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1">Property Details</h4>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Value:</strong> {property.value ? formatCurrency(parseFloat(property.value.toString())) : 'N/A'}</p>
                  <p><strong>Square Feet:</strong> {property.squareFeet ? formatNumber(property.squareFeet) : 'N/A'}</p>
                  <p><strong>Year Built:</strong> {property.yearBuilt || 'N/A'}</p>
                  <p><strong>Neighborhood:</strong> {property.neighborhood || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Additional Metrics</h4>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Land Value:</strong> {property.landValue ? formatCurrency(parseFloat(property.landValue.toString())) : 'N/A'}</p>
                  <p><strong>Bedrooms:</strong> {property.bedrooms || 'N/A'}</p>
                  <p><strong>Bathrooms:</strong> {property.bathrooms || 'N/A'}</p>
                  <p><strong>Price per SqFt:</strong> {
                    property.value && property.squareFeet 
                      ? formatCurrency(parseFloat(property.value.toString()) / property.squareFeet) 
                      : 'N/A'
                  }</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className={className}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Outlier Detection</CardTitle>
            <Badge variant="outline">
              {loading ? 'Analyzing...' : `${valueOutliers.length + spatialOutliers.length} Outliers Found`}
            </Badge>
          </div>
          <CardDescription>
            Properties with unusual characteristics compared to the overall market
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-76px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 border-b">
              <TabsList>
                <TabsTrigger value="value" className="flex items-center gap-1">
                  <BarChart4 className="h-4 w-4" />
                  Value Outliers
                </TabsTrigger>
                <TabsTrigger value="spatial" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Spatial Outliers
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="value" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Analyzing properties for outliers...
                    </div>
                  ) : valueOutliers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No value outliers detected in the current data set.
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {valueOutliers.map((outlier, index) => (
                            <TableRow key={`${outlier.property.id}-${index}`}>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  {getOutlierTypeIcon(outlier.outlierType)}
                                  {outlier.outlierType.charAt(0).toUpperCase() + outlier.outlierType.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>{outlier.property.address}</TableCell>
                              <TableCell>
                                {outlier.property.value ? formatCurrency(parseFloat(outlier.property.value.toString())) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${getOutlierSeverityColor(outlier.outlierScore)}`}></div>
                                  <span>{outlier.outlierScore.toFixed(1)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedOutlier(outlier)}
                                >
                                  Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {selectedOutlier && renderOutlierDetails(selectedOutlier)}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="spatial" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Analyzing properties for spatial outliers...
                    </div>
                  ) : spatialOutliers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No spatial outliers detected in the current data set.
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Neighborhood</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Discrepancy</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spatialOutliers.map((outlier, index) => (
                            <TableRow key={`${outlier.property.id}-${index}`}>
                              <TableCell>{outlier.property.neighborhood || 'Unknown'}</TableCell>
                              <TableCell>{outlier.property.address}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {outlier.spatialDiscrepancy > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                  )}
                                  {Math.abs(outlier.spatialDiscrepancy * 100).toFixed(1)}%
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${getOutlierSeverityColor(outlier.outlierScore)}`}></div>
                                  <span>{outlier.outlierScore.toFixed(1)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedOutlier(outlier)}
                                >
                                  Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {selectedOutlier && renderOutlierDetails(selectedOutlier)}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}