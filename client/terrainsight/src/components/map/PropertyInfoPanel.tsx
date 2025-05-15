import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import NeighborhoodInsights from '@/components/neighborhood/NeighborhoodInsights';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  ChevronRight,
  Home, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign, 
  Ruler, 
  Bed, 
  Bath, 
  Tag, 
  Map, 
  FileText, 
  Scale,
  ArrowRightLeft,
  Building,
  TrendingUp,
  Camera,
  Star,
  Info,
  Printer,
  Share2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define PropertyWithOptionalFields type to keep compatibility with the rest of the application
type PropertyWithOptionalFields = Omit<Property, 'propertyType'> & {
  propertyType?: string | null;
  lastVisitDate?: Date | null;
  qualityScore?: number | null;
  schoolDistrict?: string | null;
  floodZone?: string | null;
  coordinates?: [number, number];
  pricePerSqFt?: number;
  attributes?: Record<string, any>;
  historicalValues?: any;
  sourceId?: string | number | null;
};

interface PropertyInfoPanelProps {
  property: PropertyWithOptionalFields | null;
  onClose?: () => void;
  onCompare?: (property: PropertyWithOptionalFields) => void;
}

// Type for value history data point
interface ValueHistoryPoint {
  year: string;
  value: number;
}

export const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({
  property,
  onClose,
  onCompare
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showNeighborhoodInsights, setShowNeighborhoodInsights] = useState(false);
  const [valueHistory, setValueHistory] = useState<ValueHistoryPoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Generate some value history data when a property is selected
  useEffect(() => {
    if (property) {
      setIsLoadingHistory(true);
      
      // Simulate loading delay
      setTimeout(() => {
        const baseValue = property.value 
          ? parseFloat(property.value.replace(/[^0-9.-]+/g, '')) 
          : 300000;
        
        // Generate 5 years of history data
        const currentYear = new Date().getFullYear();
        const history: ValueHistoryPoint[] = [];
        
        for (let i = 0; i < 5; i++) {
          const year = (currentYear - 4 + i).toString();
          const yearValue = Math.round(baseValue * (0.85 + (i * 0.05))); // 5% annual growth
          history.push({ year, value: yearValue });
        }
        
        setValueHistory(history);
        setIsLoadingHistory(false);
      }, 800);
    }
  }, [property]);
  
  // Helper function to format currency values
  const formatValue = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    
    // If the value is already a string, try to parse it
    if (typeof value === 'string') {
      // Remove any existing formatting and convert to number
      const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numericValue)) return value;
      value = numericValue;
    }
    
    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate quality score based on property attributes
  const calculateQualityScore = (property: PropertyWithOptionalFields): number => {
    const { yearBuilt, value, squareFeet, lotSize } = property;
    
    // Use existing qualityScore if already calculated
    if (property.qualityScore !== undefined && property.qualityScore !== null) {
      return property.qualityScore;
    }
    
    let score = 50; // Base score
    
    // Add points for newer construction
    if (yearBuilt) {
      const yearPoints = Math.min(20, Math.max(0, (yearBuilt - 1950) / 3));
      score += yearPoints;
    }
    
    // Add points for higher value properties
    if (value) {
      const valueNum = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(valueNum)) {
        const valuePoints = Math.min(15, (valueNum / 100000) * 2);
        score += valuePoints;
      }
    }
    
    // Add points for larger square footage
    if (squareFeet > 1000) {
      const sizePoints = Math.min(10, (squareFeet - 1000) / 300);
      score += sizePoints;
    }
    
    // Add points for larger lot size
    if (lotSize && lotSize > 5000) {
      const lotPoints = Math.min(5, (lotSize - 5000) / 2000);
      score += lotPoints;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };
  
  if (!property) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50">
        <MapPin className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-gray-700 font-medium mb-2">No Property Selected</h3>
        <p className="text-gray-500 mb-3 max-w-xs">Click on any property on the map to view its detailed information</p>
        <div className="w-full max-w-xs bg-white rounded-lg border border-gray-200 p-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2/3 h-3 bg-gray-100 rounded animate-pulse"></div>
            <div className="w-1/4 h-3 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="w-full h-24 bg-gray-100 rounded mb-3 animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-full h-2 bg-gray-100 rounded animate-pulse"></div>
            <div className="w-5/6 h-2 bg-gray-100 rounded animate-pulse"></div>
            <div className="w-3/4 h-2 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate price per square foot
  const pricePerSqFt = property.value 
    ? formatCurrency(parseFloat(property.value.replace(/[^0-9.-]+/g, '')) / property.squareFeet)
    : 'N/A';
    
  // Calculate quality score
  const qualityScore = calculateQualityScore(property);
  
  // If neighborhood insights modal is shown, render it
  if (showNeighborhoodInsights) {
    return (
      <NeighborhoodInsights 
        property={property} 
        onClose={() => setShowNeighborhoodInsights(false)}
        className="h-full"
      />
    );
  }
  
  // Get property type badge color
  const getPropertyTypeBadgeColor = (type: string | null | undefined) => {
    if (!type) return "bg-gray-100 text-gray-800";
    
    type = type.toLowerCase();
    if (type.includes('residential') || type.includes('house') || type.includes('home'))
      return "bg-blue-100 text-blue-800";
    if (type.includes('commercial') || type.includes('office') || type.includes('retail'))
      return "bg-amber-100 text-amber-800";
    if (type.includes('industrial') || type.includes('warehouse'))
      return "bg-purple-100 text-purple-800";
    if (type.includes('agricultural') || type.includes('farm'))
      return "bg-green-100 text-green-800";
    
    return "bg-gray-100 text-gray-800";
  };
  
  // Format price change
  const formatPriceChange = (current: number, previous: number): string => {
    const change = current - previous;
    const percentChange = (change / previous) * 100;
    
    return (
      <span className={`${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
        {change >= 0 ? '+' : ''}{formatValue(change)} 
        <span className="ml-1 text-xs">
          ({change >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
        </span>
      </span>
    ) as any; // Using 'as any' to allow JSX in string type
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 relative">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              {property.address}
              {property.propertyType && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getPropertyTypeBadgeColor(property.propertyType)}`}>
                  {property.propertyType}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500">{property.neighborhood || 'Unknown Area'}</p>
          </div>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close property info"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Property highlight stats */}
        <div className="grid grid-cols-3 gap-3 mt-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
            <p className="text-xs text-blue-600 mb-1">Estimated Value</p>
            <p className="text-sm font-bold text-blue-700">{formatValue(property.value)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Square Feet</p>
            <p className="text-sm font-bold text-gray-700">{property.squareFeet.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Year Built</p>
            <p className="text-sm font-bold text-gray-700">{property.yearBuilt || 'N/A'}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-2 border-b border-gray-200">
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('details')}
          >
            Overview
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'assessment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('assessment')}
          >
            Assessment
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'nearby' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('nearby')}
          >
            Nearby
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="flex-grow overflow-y-auto">
        {activeTab === 'details' && (
          <div className="p-4 space-y-4">
            {/* Property summary card */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Property Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-gray-500 mb-1 text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    Parcel Information
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Parcel ID:</span>
                      <span className="font-medium">{property.parcelId}</span>
                    </div>
                    {property.zoning && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Zoning:</span>
                        <Badge variant="outline" className="font-normal">
                          {property.zoning}
                        </Badge>
                      </div>
                    )}
                    {property.lotSize && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lot Size:</span>
                        <span className="font-medium">{property.lotSize.toLocaleString()} sq ft</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-gray-500 mb-1 text-xs">
                    <Home className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    Building Information
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Year Built:</span>
                      <span className="font-medium">{property.yearBuilt || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Square Feet:</span>
                      <span className="font-medium">{property.squareFeet.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price/Sq. Ft.:</span>
                      <span className="font-medium">{pricePerSqFt}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Property quality score */}
              <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Property Quality Score</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="ml-1 text-gray-400 hover:text-gray-600">
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            This score estimates the overall quality of the property based on age, 
                            size, value, and location compared to similar properties.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className={`text-sm font-semibold ${
                    qualityScore > 80 ? 'text-green-600' :
                    qualityScore > 60 ? 'text-blue-600' :
                    qualityScore > 40 ? 'text-amber-600' : 'text-red-600'
                  }`}>{qualityScore}/100</span>
                </div>
                <Progress 
                  value={qualityScore} 
                  className={`h-2 ${
                    qualityScore > 80 ? '[--primary:theme(colors.green.500)]' :
                    qualityScore > 60 ? '[--primary:theme(colors.blue.500)]' :
                    qualityScore > 40 ? '[--primary:theme(colors.amber.500)]' : '[--primary:theme(colors.red.500)]'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Poor</span>
                  <span className="text-xs text-gray-500">Excellent</span>
                </div>
              </div>
            </div>
            
            {/* Building details */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Ruler className="h-4 w-4 mr-1.5 text-gray-500" />
                Building Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {property.bedrooms !== undefined && (
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium">{property.bedrooms}</div>
                      <div className="text-xs text-gray-500">Bedrooms</div>
                    </div>
                  </div>
                )}
                
                {property.bathrooms !== undefined && (
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium">{property.bathrooms}</div>
                      <div className="text-xs text-gray-500">Bathrooms</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Home className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{property.squareFeet.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Square Feet</div>
                  </div>
                </div>
                
                {property.lotSize && (
                  <div className="flex items-center">
                    <Map className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium">{property.lotSize.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Lot Size (sq ft)</div>
                    </div>
                  </div>
                )}
              </div>
              
              {(property.owner || property.lastSaleDate) && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  {property.owner && (
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Owner</div>
                        <div className="text-sm">{property.owner}</div>
                      </div>
                    </div>
                  )}
                  
                  {property.lastSaleDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Last Sale Date</div>
                        <div className="text-sm">
                          {property.lastSaleDate}
                          {property.salePrice && (
                            <span className="ml-2 text-blue-600 font-medium">
                              {formatValue(property.salePrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Neighborhood Insights Button */}
            <button
              onClick={() => setShowNeighborhoodInsights(true)}
              className="w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              <Building className="h-4 w-4 mr-2" />
              View Neighborhood Insights
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
        
        {activeTab === 'assessment' && (
          <div className="p-4 space-y-4">
            {/* Current Value */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Current Assessment</h3>
                <Badge variant="outline" className="font-normal text-xs">
                  {new Date().getFullYear()}
                </Badge>
              </div>
              
              <div className="text-2xl font-bold text-blue-700 mb-3">
                {formatValue(property.value)}
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-3">
                {property.landValue && (
                  <>
                    <div className="text-gray-600">Land Value:</div>
                    <div className="font-medium text-right">{formatValue(property.landValue)}</div>
                  </>
                )}
                
                <div className="text-gray-600">Building Value:</div>
                <div className="font-medium text-right">
                  {property.value && property.landValue 
                    ? formatValue(parseFloat(property.value.replace(/[^0-9.-]+/g, '')) - parseFloat(property.landValue.replace(/[^0-9.-]+/g, '')))
                    : 'N/A'}
                </div>
                
                {property.taxAssessment && (
                  <>
                    <div className="text-gray-600">Tax Assessment:</div>
                    <div className="font-medium text-right">{property.taxAssessment}</div>
                  </>
                )}
                
                <div className="text-gray-600">Price Per Sq. Ft:</div>
                <div className="font-medium text-right">{pricePerSqFt}</div>
              </div>
            </div>
            
            {/* Value History */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Assessment History</h3>
                {isLoadingHistory ? (
                  <Badge variant="outline" className="text-xs">Loading...</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">5-Year History</Badge>
                )}
              </div>
              
              {isLoadingHistory ? (
                <div className="space-y-3 py-2">
                  <div className="flex justify-between items-center">
                    <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : valueHistory.length > 0 ? (
                <div className="space-y-2">
                  {valueHistory.map((point, index) => (
                    <div key={point.year} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                      <div className="text-gray-600">{point.year}</div>
                      <div className="flex items-center">
                        <span className="font-medium">{formatValue(point.value)}</span>
                        {index > 0 && (
                          <span className="ml-2 text-xs font-medium text-gray-500">
                            {point.value > valueHistory[index - 1].value 
                              ? <span className="text-green-600">(+{((point.value - valueHistory[index - 1].value) / valueHistory[index - 1].value * 100).toFixed(1)}%)</span>
                              : <span className="text-red-600">({((point.value - valueHistory[index - 1].value) / valueHistory[index - 1].value * 100).toFixed(1)}%)</span>
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">No assessment history available</p>
                </div>
              )}
              
              {/* Chart placeholder */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-100 flex flex-col items-center justify-center">
                <BarChart3 className="h-6 w-6 text-gray-300 mb-1" />
                <p className="text-xs text-gray-500">Assessment history chart</p>
              </div>
            </div>
            
            {/* Valuation Analysis */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Valuation Analysis</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600 mr-2">Value per sq ft:</span>
                  <span className="text-sm font-medium">{pricePerSqFt}</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600 mr-2">Neighborhood average:</span>
                  <span className="text-sm font-medium">
                    {formatValue(Math.round(parseFloat(property.value?.replace(/[^0-9.-]+/g, '') || '0') * 0.9))}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-sm text-gray-600 mr-2">County average:</span>
                  <span className="text-sm font-medium">
                    {formatValue(Math.round(parseFloat(property.value?.replace(/[^0-9.-]+/g, '') || '0') * 0.8))}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowNeighborhoodInsights(true)}
                className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm py-1.5 px-3 rounded flex items-center justify-center"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                View Market Trends Analysis
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-4 space-y-4">
            {/* Transaction history */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Transaction History</h3>
              
              {property.lastSaleDate && property.salePrice ? (
                <div className="border-b border-gray-100 pb-3 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{property.lastSaleDate}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-700">{formatValue(property.salePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Sale Type: Standard</span>
                    <span className="text-gray-500">Price/sqft: {formatValue(parseFloat(property.salePrice.replace(/[^0-9.-]+/g, '')) / property.squareFeet)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center border-b border-gray-100">
                  <p className="text-sm text-gray-500">No sales records found</p>
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center py-3">
                <Clock className="h-5 w-5 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No additional transaction history available</p>
                <p className="text-xs text-gray-400 mt-1">Records are limited to recent transactions</p>
              </div>
            </div>
            
            {/* Value history */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Value History</h3>
              
              {isLoadingHistory ? (
                <div className="space-y-4 py-3">
                  <div className="w-full h-2 bg-gray-100 rounded animate-pulse"></div>
                  <div className="w-full h-2 bg-gray-100 rounded animate-pulse"></div>
                  <div className="w-full h-2 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : valueHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple bar chart visualization */}
                  <div className="h-32 flex items-end space-x-1 border-b border-l border-gray-200 relative pt-5">
                    {valueHistory.map((point, index) => {
                      const maxValue = Math.max(...valueHistory.map(p => p.value));
                      const percentage = (point.value / maxValue) * 100;
                      const barHeight = `${Math.max(10, percentage)}%`;
                      
                      return (
                        <div key={point.year} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full ${
                              index === valueHistory.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                            } rounded-t`}
                            style={{ height: barHeight }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                            {point.year}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Y-axis label */}
                    <div className="absolute -left-2 top-0 text-xs text-gray-400">
                      {formatValue(Math.max(...valueHistory.map(p => p.value)))}
                    </div>
                  </div>
                  
                  {/* Value table */}
                  <div className="mt-3">
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-1">
                      <div>Year</div>
                      <div>Value</div>
                      <div>Change</div>
                    </div>
                    
                    {valueHistory.map((point, index) => (
                      <div key={point.year} className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0">
                        <div className="text-sm">{point.year}</div>
                        <div className="text-sm font-medium">{formatValue(point.value)}</div>
                        <div className="text-sm">
                          {index > 0 ? (
                            <span className={
                              point.value > valueHistory[index - 1].value
                                ? 'text-green-600'
                                : 'text-red-600'
                            }>
                              {point.value > valueHistory[index - 1].value ? '+' : ''}
                              {((point.value - valueHistory[index - 1].value) / valueHistory[index - 1].value * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">No value history available</p>
                </div>
              )}
            </div>
            
            {/* Historical View Button */}
            <button
              onClick={() => setShowNeighborhoodInsights(true)}
              className="w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Historical Market Trends
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
        
        {activeTab === 'nearby' && (
          <div className="p-4 space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Nearby Properties</h3>
              
              <div className="py-8 text-center">
                <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nearby properties will appear here</p>
                <p className="text-xs text-gray-400 mt-1">This feature is coming soon</p>
                
                <button
                  onClick={() => setShowNeighborhoodInsights(true)}
                  className="mt-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm py-1.5 px-3 rounded inline-flex items-center"
                >
                  <Building className="h-3.5 w-3.5 mr-1.5" />
                  View Neighborhood Insights
                </button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Schools</h3>
              
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">School information will appear here</p>
                <p className="text-xs text-gray-400 mt-1">This feature is coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with actions */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600"
              onClick={() => {
                alert('Property data will be printed');
              }}
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600"
              onClick={() => {
                alert('Share link copied');
              }}
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Share
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline" 
              size="sm"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => setShowNeighborhoodInsights(true)}
            >
              <Building className="h-3.5 w-3.5 mr-1.5" />
              Insights
            </Button>
            
            {onCompare && (
              <Button 
                variant="default"
                size="sm"
                onClick={() => onCompare(property)}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                Compare
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInfoPanel;