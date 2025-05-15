import React, { useState, useEffect } from 'react';
import { Property } from '@/shared/schema';
import { usePropertyComparison } from './PropertyComparisonContext';
import { findComparableProperties, ComparablePropertyResult } from '../../services/comparison/comparablesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart2,
  ChevronRight,
  ListFilter,
  RefreshCw,
  Share2,
  ArrowRightLeft,
  Download,
  Home,
  Calendar,
  Square,
  Ruler,
  DollarSign
} from 'lucide-react';
import { PropertyComparisonTable } from './PropertyComparisonTable';
import { MarketPositionScatter } from './MarketPositionScatter';
import { PropertyValueAnalysisCard } from './PropertyValueAnalysisCard';
import { analyzePropertyValue } from '../../services/comparison/valueAnalysisService';

interface OneClickPropertyComparisonProps {
  property: Property;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
  showIcon?: boolean;
}

/**
 * One-click property comparison component
 * This component provides a button that when clicked, automatically finds similar properties
 * and displays a side-by-side comparison in a dialog.
 */
export function OneClickPropertyComparison({
  property,
  buttonText = "Quick Compare",
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonClassName = '',
  showIcon = true
}: OneClickPropertyComparisonProps) {
  const { properties } = usePropertyComparison();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('table');
  const [comparableResults, setComparableResults] = useState<ComparablePropertyResult[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [valueAnalysis, setValueAnalysis] = useState<any>(null);
  
  // Record of similarity scores for properties
  const [similarityScores, setSimilarityScores] = useState<Record<string | number, number>>({});
  
  // Find comparable properties automatically when dialog opens
  useEffect(() => {
    if (isOpen && property) {
      findComparablePropertiesForProperty();
    }
  }, [isOpen, property]);
  
  // Find comparable properties and analyze the property value
  const findComparablePropertiesForProperty = async () => {
    if (!property || !properties || properties.length === 0) return;
    
    setIsLoading(true);
    try {
      // Find 4 most similar properties (plus the base property = 5 total)
      const results = findComparableProperties(property, properties, {}, 4);
      setComparableResults(results);
      
      // Create selected properties array with base property first
      const selectedProps = [property, ...results.map(r => r.property)];
      setSelectedProperties(selectedProps);
      
      // Store similarity scores
      const scoresObj: Record<string | number, number> = {};
      results.forEach(result => {
        scoresObj[result.property.id] = result.similarityScore;
      });
      setSimilarityScores(scoresObj);
      
      // Run property value analysis
      const analysis = analyzePropertyValue(property, properties);
      setValueAnalysis(analysis);
    } catch (error) {
      console.error('Error finding comparable properties:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate property value per sq ft
  const calculatePricePerSqFt = (prop: Property) => {
    if (!prop.value || !prop.squareFeet) return 'N/A';
    const value = typeof prop.value === 'string' 
      ? parseFloat(prop.value.replace(/[^0-9.-]+/g, '')) 
      : 0;
    return formatCurrency(value / prop.squareFeet);
  };
  
  // Simple property card for the base and comparable properties
  const PropertyCard = ({ property: prop }: { property: Property }) => (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{prop.address}</CardTitle>
        <CardDescription className="text-xs">
          {prop.neighborhood || 'Unknown Neighborhood'} · Parcel ID: {prop.parcelId}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Value</span>
            <span className="font-medium">{prop.value ? formatCurrency(parseFloat(prop.value.replace(/[^0-9.-]+/g, ''))) : 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Price/SqFt</span>
            <span className="font-medium">{calculatePricePerSqFt(prop)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Size</span>
            <span>{prop.squareFeet ? `${prop.squareFeet.toLocaleString()} sq ft` : 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Year Built</span>
            <span>{prop.yearBuilt || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Beds/Baths</span>
            <span>
              {prop.bedrooms || 'N/A'} / {prop.bathrooms || 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">Lot Size</span>
            <span>{prop.lotSize ? `${prop.lotSize.toLocaleString()} sq ft` : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        {prop.propertyType && (
          <Badge variant="outline" className="text-xs">
            {prop.propertyType}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={buttonVariant} 
            size={buttonSize} 
            className={buttonClassName}
            onClick={() => setIsOpen(true)}
          >
            {showIcon && <ArrowRightLeft className="h-4 w-4 mr-2" />}
            {buttonText}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="text-xl">Property Comparison</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-500">Finding comparable properties...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pb-3">
                <p className="text-sm text-gray-500">
                  Automatically comparing {property.address} with similar properties
                </p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 border-b">
                  <TabsList className="justify-start">
                    <TabsTrigger value="cards" className="text-sm">Card View</TabsTrigger>
                    <TabsTrigger value="table" className="text-sm">Table View</TabsTrigger>
                    <TabsTrigger value="market" className="text-sm">Market Position</TabsTrigger>
                    <TabsTrigger value="valuation" className="text-sm">Value Analysis</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  {/* Card View */}
                  <TabsContent value="cards" className="h-full m-0 p-6 overflow-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProperties.map((prop, index) => (
                        <div key={prop.id} className={index === 0 ? "md:col-span-2 lg:col-span-1" : ""}>
                          <div className="relative">
                            {index === 0 && (
                              <Badge className="absolute -top-2 -left-2 z-10">Base Property</Badge>
                            )}
                            {index > 0 && (
                              <Badge 
                                variant="outline" 
                                className="absolute -top-2 -right-2 z-10"
                              >
                                {Math.round(similarityScores[prop.id] * 100)}% Similar
                              </Badge>
                            )}
                            <PropertyCard property={prop} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {/* Table View */}
                  <TabsContent value="table" className="h-full m-0 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        {selectedProperties.length > 0 ? (
                          <PropertyComparisonTable
                            baseProperty={property}
                            selectedProperties={selectedProperties}
                            similarityScores={similarityScores}
                          />
                        ) : (
                          <div className="text-center p-8">
                            <p>No properties selected for comparison</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  {/* Market Position View */}
                  <TabsContent value="market" className="h-full m-0 overflow-auto">
                    <div className="p-6 space-y-6">
                      <MarketPositionScatter
                        baseProperty={property}
                        selectedProperties={selectedProperties}
                        allProperties={properties}
                        xAxisProperty="squareFeet"
                      />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MarketPositionScatter
                          baseProperty={property}
                          selectedProperties={selectedProperties}
                          allProperties={properties}
                          xAxisProperty="yearBuilt"
                        />
                        
                        <MarketPositionScatter
                          baseProperty={property}
                          selectedProperties={selectedProperties}
                          allProperties={properties}
                          xAxisProperty="lotSize"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Value Analysis View */}
                  <TabsContent value="valuation" className="h-full m-0 overflow-auto">
                    <div className="p-6">
                      {valueAnalysis ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <PropertyValueAnalysisCard analysis={valueAnalysis} />
                          
                          <div>
                            <h3 className="text-lg font-medium mb-4">Comparable Properties Used</h3>
                            <div className="space-y-3">
                              {valueAnalysis.comparableProperties.slice(0, 3).map((comparable: any) => (
                                <div key={comparable.property.id} className="p-3 border rounded-md bg-gray-50">
                                  <div className="flex justify-between mb-1">
                                    <h4 className="font-medium">{comparable.property.address}</h4>
                                    <div className="text-sm text-gray-500">{comparable.similarityScore}% Similar</div>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <div>
                                      {comparable.property.squareFeet} sq.ft. / Built {comparable.property.yearBuilt}
                                    </div>
                                    <div className="font-medium">
                                      {comparable.property.value ? formatCurrency(parseFloat(comparable.property.value.replace(/[^0-9.-]+/g, ''))) : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <p>No value analysis available</p>
                          <Button onClick={findComparablePropertiesForProperty} className="mt-4">
                            Run Analysis
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
                
                <div className="p-4 border-t flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {selectedProperties.length} properties
                  </div>
                  <div className="flex gap-2">
                    <Tooltip content="Refresh comparable properties">
                      <Button variant="outline" size="sm" onClick={findComparablePropertiesForProperty}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </Tooltip>
                    <Button variant="default" size="sm" onClick={() => setIsOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}