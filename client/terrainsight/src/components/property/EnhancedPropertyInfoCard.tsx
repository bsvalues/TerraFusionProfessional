import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { 
  MapPin, 
  Home, 
  Calendar, 
  DollarSign, 
  Square, 
  BedDouble, 
  Bath, 
  Ruler, 
  ChevronUp, 
  ChevronDown, 
  X, 
  BarChart,
  FileText,
  Clock,
  Plus,
  Scale,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/custom-tooltip';
import PropertySparkline from '@/components/comparison/PropertySparkline';

// Define static mock comparison data (in a real app, this would come from an API)
const mockHistoricalValues = [
  { year: 2020, value: 380000 },
  { year: 2021, value: 402000 },
  { year: 2022, value: 425000 },
  { year: 2023, value: 440000 },
  { year: 2024, value: 450000 }
];

// Define neighborhood average (in a real app, this would come from an API)
const neighborhoodAverage = 425000;

interface EnhancedPropertyInfoCardProps {
  property: Property | null;
  onClose: () => void;
  onAddToCompare: (property: Property) => void;
  className?: string;
}

const EnhancedPropertyInfoCard: React.FC<EnhancedPropertyInfoCardProps> = ({
  property,
  onClose,
  onAddToCompare,
  className
}) => {
  // State for expanded sections in accordion
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'property-details': false,
    'location': false,
    'tax-assessment': false,
    'sale-history': false
  });
  
  // Currently selected tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // Reset expanded sections when property changes
  useEffect(() => {
    setExpandedSections({
      'property-details': false,
      'location': false,
      'tax-assessment': false,
      'sale-history': false
    });
    setActiveTab('overview');
  }, [property?.id]);
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Helper to get value comparison status
  const getValueStatus = () => {
    if (!property?.value) return 'neutral';
    
    // Extract numeric value
    const numericValue = parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
    
    if (numericValue > neighborhoodAverage * 1.1) return 'above';
    if (numericValue < neighborhoodAverage * 0.9) return 'below';
    return 'average';
  };
  
  // Helper to get status color and text
  const getStatusInfo = () => {
    const status = getValueStatus();
    
    if (status === 'above') {
      return { color: 'bg-amber-500', text: 'Above Average', description: 'This property is valued above the neighborhood average' };
    } else if (status === 'below') {
      return { color: 'bg-emerald-500', text: 'Below Average', description: 'This property is valued below the neighborhood average' };
    }
    return { color: 'bg-blue-500', text: 'Average Value', description: 'This property is valued near the neighborhood average' };
  };
  
  const statusInfo = getStatusInfo();
  
  // If no property is selected, show empty state
  if (!property) {
    return (
      <div className={cn("h-full w-full flex flex-col items-center justify-center p-8 text-gray-400", className)}>
        <div className="flex items-center justify-center rounded-full bg-muted p-6 mb-4">
          <Home className="h-16 w-16 opacity-30" />
        </div>
        <div className="w-full max-w-md">
          <p className="text-lg font-medium text-center">No property selected</p>
          <p className="text-sm text-center">Click on a property marker on the map to view its details</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("h-full overflow-visible relative z-10", className)}>
      {/* Property header with close button */}
      <div className="sticky top-0 bg-white z-20 border-b px-4 pt-3 pb-2 flex justify-between">
        <div>
          <h3 className="font-medium text-base truncate pr-4">{property.address}</h3>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <span className="truncate">{property.neighborhood || 'Unknown neighborhood'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"
          aria-label="Close property information"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Property value with visual indicator */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Estimated Value</div>
            <div className="text-2xl font-semibold">{property.value || 'N/A'}</div>
          </div>
          <div>
            <Tooltip
              content={statusInfo.description}
              side="top"
            >
              <div 
                data-testid="value-indicator"
                className={cn("px-2 py-1 rounded-full text-xs font-medium text-white flex items-center", statusInfo.color)}
              >
                <Scale className="h-3 w-3 mr-1" />
                {statusInfo.text}
              </div>
            </Tooltip>
          </div>
        </div>
        
        <div className="mt-2">
          <PropertySparkline 
            data={mockHistoricalValues} 
            width={280} 
            height={40} 
            property={property}
          />
        </div>
      </div>
      
      {/* Key property details */}
      <div className="px-4 py-2 border-b flex justify-between text-sm">
        <div className="flex items-center">
          <BedDouble className="h-4 w-4 text-gray-400 mr-1" />
          <span>{property.bedrooms || '?'} beds</span>
        </div>
        <div className="flex items-center">
          <Bath className="h-4 w-4 text-gray-400 mr-1" />
          <span>{property.bathrooms || '?'} baths</span>
        </div>
        <div className="flex items-center">
          <Ruler className="h-4 w-4 text-gray-400 mr-1" />
          <span>{property.squareFeet?.toLocaleString() || '?'} sq.ft.</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
          <span>{property.yearBuilt || '?'}</span>
        </div>
      </div>
      
      {/* Actions row */}
      <div className="px-4 py-2 border-b flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onAddToCompare(property)}
          className="flex-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add to Compare
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 text-xs"
        >
          <FileText className="h-3.5 w-3.5 mr-1" /> Export Report
        </Button>
      </div>
      
      {/* Tabbed content */}
      <div className="px-4 py-2">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" data-testid="overview-tab-content">
            <div className="space-y-3 py-3">
              {/* Property type and zoning */}
              <div className="space-y-1">
                <div className="flex items-start space-x-1">
                  <Home className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Property Type</div>
                    <div className="text-sm text-gray-600">{property.propertyType || 'Unknown'}</div>
                    {property.zoning && (
                      <Badge variant="outline" className="mt-1">
                        Zoning: {property.zoning}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection('location')}
                  className="w-full flex items-center justify-between text-left py-1"
                >
                  <div className="flex items-start space-x-1">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-gray-600">{property.neighborhood || property.address}</div>
                    </div>
                  </div>
                  {expandedSections['location'] ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </button>
                
                {expandedSections['location'] && (
                  <div className="pl-5 pt-2">
                    <div data-testid="map-preview" className="bg-gray-100 rounded-md h-32 w-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                      <span className="text-sm text-gray-500 ml-2">Map preview would appear here</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <div><span className="font-medium">Latitude:</span> {property.latitude !== null && property.latitude !== undefined && typeof property.latitude === 'number' ? property.latitude.toFixed(6) : (property.latitude || 'N/A')}</div>
                      <div><span className="font-medium">Longitude:</span> {property.longitude !== null && property.longitude !== undefined && typeof property.longitude === 'number' ? property.longitude.toFixed(6) : (property.longitude || 'N/A')}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Property Details accordion */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection('property-details')}
                  className="w-full flex items-center justify-between text-left py-1"
                >
                  <div className="flex items-start space-x-1">
                    <Home className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Property Details</div>
                      <div className="text-sm text-gray-600">Size, features, and characteristics</div>
                    </div>
                  </div>
                  {expandedSections['property-details'] ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </button>
                
                {expandedSections['property-details'] && (
                  <div className="pl-5 pt-2 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div><span className="font-medium">Year Built:</span> {property.yearBuilt || 'N/A'}</div>
                      <div><span className="font-medium">Lot Size:</span> {property.lotSize?.toLocaleString() || 'N/A'} sq.ft.</div>
                      <div><span className="font-medium">Bedrooms:</span> {property.bedrooms || 'N/A'}</div>
                      <div><span className="font-medium">Bathrooms:</span> {property.bathrooms || 'N/A'}</div>
                      <div><span className="font-medium">Square Feet:</span> {property.squareFeet?.toLocaleString() || 'N/A'}</div>
                      <div><span className="font-medium">Price/Sq.Ft:</span> {property.pricePerSqFt || 'N/A'}</div>
                    </div>
                    
                    {property.attributes && Object.keys(property.attributes).length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium">Additional Features</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(property.attributes).map(([key, value]) => {
                            // Skip false boolean values or empty values
                            if (value === false || value === '' || value === null || value === undefined) return null;
                            
                            // Format the key for display
                            const formatKey = (key: string) => {
                              return key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase());
                            };
                            
                            // Format the value for display
                            const formatValue = (value: any) => {
                              if (value === true) return '';
                              return String(value);
                            };
                            
                            return (
                              <Badge key={key} variant="outline" className="text-xs">
                                {formatKey(key)}{formatValue(value) ? ': ' + formatValue(value) : ''}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Tax & Assessment accordion */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection('tax-assessment')}
                  className="w-full flex items-center justify-between text-left py-1"
                >
                  <div className="flex items-start space-x-1">
                    <DollarSign className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Tax & Assessment</div>
                      <div className="text-sm text-gray-600">Tax information and property assessment</div>
                    </div>
                  </div>
                  {expandedSections['tax-assessment'] ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </button>
                
                {expandedSections['tax-assessment'] && (
                  <div className="pl-5 pt-2 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div><span className="font-medium">Tax Assessment:</span> {property.taxAssessment || 'N/A'}</div>
                      <div><span className="font-medium">Land Value:</span> {property.landValue || 'N/A'}</div>
                      <div><span className="font-medium">Value:</span> {property.value || 'N/A'}</div>
                      <div><span className="font-medium">Last Sale Price:</span> {property.salePrice || 'N/A'}</div>
                    </div>
                    
                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                      <div className="text-xs text-gray-500">
                        Tax assessment data is for informational purposes only. Contact local tax authorities for official information.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" data-testid="details-tab-content">
            <div className="py-3 space-y-4">
              {/* Full property details in a formatted table */}
              <div className="space-y-3">
                <div className="font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Property Specifications
                </div>
                
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Parcel ID</td>
                      <td className="py-1.5 text-right">{property.parcelId}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Property Type</td>
                      <td className="py-1.5 text-right">{property.propertyType || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Zoning</td>
                      <td className="py-1.5 text-right">{property.zoning || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Year Built</td>
                      <td className="py-1.5 text-right">{property.yearBuilt || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Square Feet</td>
                      <td className="py-1.5 text-right">{property.squareFeet?.toLocaleString() || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Lot Size</td>
                      <td className="py-1.5 text-right">{property.lotSize?.toLocaleString() || 'N/A'} sq.ft.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Bedrooms</td>
                      <td className="py-1.5 text-right">{property.bedrooms || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">Bathrooms</td>
                      <td className="py-1.5 text-right">{property.bathrooms || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Features and attributes */}
              {property.attributes && Object.keys(property.attributes).length > 0 && (
                <div className="space-y-3">
                  <div className="font-medium flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    Features & Attributes
                  </div>
                  
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(property.attributes).map(([key, value]) => {
                        // Skip undefined/null values
                        if (value === undefined || value === null) return null;
                        
                        // Format the key for display
                        const formatKey = (key: string) => {
                          return key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase());
                        };
                        
                        return (
                          <tr key={key} className="border-b">
                            <td className="py-1.5 font-medium">{formatKey(key)}</td>
                            <td className="py-1.5 text-right">
                              {value === true ? 'Yes' : 
                               value === false ? 'No' : 
                               String(value)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Owner information if available */}
              {property.owner && (
                <div className="space-y-3">
                  <div className="font-medium flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Ownership Information
                  </div>
                  
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5 font-medium">Current Owner</td>
                        <td className="py-1.5 text-right">{property.owner}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" data-testid="history-tab-content">
            <div className="py-3 space-y-4">
              {/* Property valuation history */}
              <div className="space-y-3">
                <div className="font-medium flex items-center">
                  <BarChart className="h-4 w-4 mr-1" />
                  Value History
                </div>
                
                <div className="h-48 bg-gray-50 rounded-md p-3 flex items-center justify-center">
                  <PropertySparkline 
                    data={mockHistoricalValues} 
                    width={280} 
                    height={120} 
                    property={property}
                    showAxis={true}
                  />
                </div>
                
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium">Year</th>
                      <th className="text-right py-2 px-2 font-medium">Value</th>
                      <th className="text-right py-2 px-2 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistoricalValues.map((entry, index) => {
                      // Calculate year-over-year change
                      const previousValue = index > 0 ? mockHistoricalValues[index - 1].value : entry.value;
                      const change = ((entry.value - previousValue) / previousValue) * 100;
                      
                      return (
                        <tr key={entry.year} className="border-b">
                          <td className="py-1.5 px-2">{entry.year}</td>
                          <td className="py-1.5 px-2 text-right">{formatCurrency(entry.value)}</td>
                          <td className="py-1.5 px-2 text-right">
                            {index === 0 ? (
                              '—'
                            ) : (
                              <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Sale history */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('sale-history')}
                  className="w-full flex items-center justify-between text-left py-1"
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <div className="font-medium">Sale History</div>
                  </div>
                  {expandedSections['sale-history'] ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </button>
                
                {expandedSections['sale-history'] && (
                  <div className="space-y-2">
                    {property.lastSaleDate && property.salePrice ? (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-2 font-medium">Date</th>
                            <th className="text-right py-2 px-2 font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-1.5 px-2">{property.lastSaleDate}</td>
                            <td className="py-1.5 px-2 text-right">{property.salePrice}</td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                        No sale history available for this property.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedPropertyInfoCard;