import React, { useState, useEffect } from 'react';
import { Property } from '@/shared/types';
import { NeighborhoodData } from '@/services/neighborhoodService';
import { neighborhoodService } from '@/services/neighborhoodService';
import { 
  Home, 
  Users, 
  TrendingUp, 
  MapPin, 
  BarChart2, 
  Briefcase,
  Compass,
  School,
  Coffee,
  ShoppingBag,
  TreePine,
  Star,
  DollarSign,
  Clock,
  Building,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface NeighborhoodInsightsProps {
  property: Property;
  onClose?: () => void;
  className?: string;
}

export const NeighborhoodInsights: React.FC<NeighborhoodInsightsProps> = ({
  property,
  onClose,
  className = ''
}) => {
  const [neighborhoodData, setNeighborhoodData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['amenities', 'marketTrends']));

  useEffect(() => {
    const fetchNeighborhoodData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await neighborhoodService.getNeighborhoodData(property);
        setNeighborhoodData(data);
      } catch (err) {
        console.error('Error fetching neighborhood data:', err);
        setError('Failed to load neighborhood insights.');
      } finally {
        setLoading(false);
      }
    };

    fetchNeighborhoodData();
  }, [property]);

  // Helper to toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Calculate color class based on rating
  const getRatingColorClass = (rating: number): string => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 4.0) return 'text-green-400';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 3.0) return 'text-yellow-400';
    if (rating >= 2.5) return 'text-orange-400';
    return 'text-red-500';
  };

  // Format percentage with sign
  const formatPercentage = (value: number, includeSign = true): string => {
    const sign = value > 0 ? '+' : '';
    return `${includeSign ? sign : ''}${value.toFixed(1)}%`;
  };

  // Get color class for percentage changes
  const getPercentageColorClass = (value: number): string => {
    if (value > 10) return 'text-green-500';
    if (value > 0) return 'text-green-400';
    if (value === 0) return 'text-gray-500';
    if (value > -10) return 'text-orange-400';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Neighborhood Insights</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close neighborhood insights"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading neighborhood data...</span>
        </div>
      </div>
    );
  }

  if (error || !neighborhoodData) {
    return (
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Neighborhood Insights</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close neighborhood insights"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">
            <X className="h-6 w-6 mx-auto" />
          </div>
          <p className="text-gray-700">{error || 'Could not load neighborhood data'}</p>
          <button 
            onClick={() => setLoading(true)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col max-h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-primary/5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            {neighborhoodData.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{neighborhoodData.overview.type} Neighborhood</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            aria-label="Close neighborhood insights"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 px-2 bg-gray-50">
        <button
          className={`px-3 py-2 text-sm font-medium ${activeSection === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${activeSection === 'demographics' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('demographics')}
        >
          Demographics
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${activeSection === 'housing' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('housing')}
        >
          Housing
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${activeSection === 'amenities' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('amenities')}
        >
          Amenities
        </button>
      </div>

      {/* Content area */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {neighborhoodData.overview.description}
              </p>
            </div>

            {/* Ratings */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => toggleSection('ratings')}
              >
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Star className="h-4 w-4 mr-1.5 text-gray-500" />
                  Neighborhood Ratings
                </h3>
                {expandedSections.has('ratings') ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
              
              {expandedSections.has('ratings') && (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Overall Rating</span>
                      <span className={`text-sm font-medium ${getRatingColorClass(neighborhoodData.overview.ratings.overall)}`}>
                        {neighborhoodData.overview.ratings.overall.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(neighborhoodData.overview.ratings.overall / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Safety</span>
                      <span className={`text-sm font-medium ${getRatingColorClass(neighborhoodData.overview.ratings.safety)}`}>
                        {neighborhoodData.overview.ratings.safety.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(neighborhoodData.overview.ratings.safety / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Schools</span>
                      <span className={`text-sm font-medium ${getRatingColorClass(neighborhoodData.overview.ratings.schools)}`}>
                        {neighborhoodData.overview.ratings.schools.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(neighborhoodData.overview.ratings.schools / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Amenities</span>
                      <span className={`text-sm font-medium ${getRatingColorClass(neighborhoodData.overview.ratings.amenities)}`}>
                        {neighborhoodData.overview.ratings.amenities.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(neighborhoodData.overview.ratings.amenities / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Cost of Living</span>
                      <span className={`text-sm font-medium ${getRatingColorClass(neighborhoodData.overview.ratings.costOfLiving)}`}>
                        {neighborhoodData.overview.ratings.costOfLiving.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(neighborhoodData.overview.ratings.costOfLiving / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Outdoor Activities</span>
                      <span className={`text-sm font-medium ${getRatingColorClass(neighborhoodData.overview.ratings.outdoorActivities)}`}>
                        {neighborhoodData.overview.ratings.outdoorActivities.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(neighborhoodData.overview.ratings.outdoorActivities / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Market Trends */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => toggleSection('marketTrends')}
              >
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1.5 text-gray-500" />
                  Market Trends
                </h3>
                {expandedSections.has('marketTrends') ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
              
              {expandedSections.has('marketTrends') && (
                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Median Home Value</p>
                      <p className="text-sm font-medium">{neighborhoodData.housing.medianHomeValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Median Rent</p>
                      <p className="text-sm font-medium">{neighborhoodData.housing.medianRent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg. Days on Market</p>
                      <p className="text-sm font-medium">{neighborhoodData.marketTrends.avgDaysOnMarket} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">List to Sale Ratio</p>
                      <p className="text-sm font-medium">{neighborhoodData.marketTrends.listToSaleRatio}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">1-Year Value Change</p>
                      <p className={`text-sm font-medium ${getPercentageColorClass(neighborhoodData.housing.valueChange.oneYear)}`}>
                        {formatPercentage(neighborhoodData.housing.valueChange.oneYear)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">5-Year Value Change</p>
                      <p className={`text-sm font-medium ${getPercentageColorClass(neighborhoodData.housing.valueChange.fiveYear)}`}>
                        {formatPercentage(neighborhoodData.housing.valueChange.fiveYear)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 mb-1">Price Per Sq. Ft.</p>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">${neighborhoodData.marketTrends.pricePerSqFt.current}</span>
                      <span className={`text-xs ml-2 ${getPercentageColorClass(neighborhoodData.marketTrends.pricePerSqFt.change)}`}>
                        {formatPercentage(neighborhoodData.marketTrends.pricePerSqFt.change)} from last year
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Inventory Level</p>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-1.5 ${
                          neighborhoodData.marketTrends.inventoryLevel === 'Low' ? 'bg-red-500' :
                          neighborhoodData.marketTrends.inventoryLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium">{neighborhoodData.marketTrends.inventoryLevel}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Competition</p>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-1.5 ${
                          neighborhoodData.marketTrends.competitiveIndex === 'High' ? 'bg-red-500' :
                          neighborhoodData.marketTrends.competitiveIndex === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium">{neighborhoodData.marketTrends.competitiveIndex}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Demographics Section */}
        {activeSection === 'demographics' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                Population Statistics
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Population</p>
                  <p className="text-sm font-medium">{neighborhoodData.demographics.population.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Households</p>
                  <p className="text-sm font-medium">{neighborhoodData.demographics.households.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Median Age</p>
                  <p className="text-sm font-medium">{neighborhoodData.demographics.medianAge} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Homeownership</p>
                  <p className="text-sm font-medium">{neighborhoodData.demographics.homeownership}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-1.5 text-gray-500" />
                Income & Education
              </h3>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Median Household Income</p>
                <p className="text-sm font-medium">{neighborhoodData.demographics.medianIncome}</p>
              </div>
              
              <p className="text-xs text-gray-500 mb-2">Education Levels</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">High School Diploma</span>
                    <span className="text-xs">{neighborhoodData.demographics.education.highSchool}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className="h-1.5 bg-blue-300 rounded-full" 
                      style={{ width: `${neighborhoodData.demographics.education.highSchool}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Bachelor's Degree</span>
                    <span className="text-xs">{neighborhoodData.demographics.education.bachelors}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className="h-1.5 bg-blue-500 rounded-full" 
                      style={{ width: `${neighborhoodData.demographics.education.bachelors}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Graduate Degree</span>
                    <span className="text-xs">{neighborhoodData.demographics.education.graduate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className="h-1.5 bg-blue-700 rounded-full" 
                      style={{ width: `${neighborhoodData.demographics.education.graduate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Housing Section */}
        {activeSection === 'housing' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Home className="h-4 w-4 mr-1.5 text-gray-500" />
                Housing Overview
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Median Home Value</p>
                  <p className="text-sm font-medium">{neighborhoodData.housing.medianHomeValue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Median Rent</p>
                  <p className="text-sm font-medium">{neighborhoodData.housing.medianRent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">1-Year Change</p>
                  <p className={`text-sm font-medium ${getPercentageColorClass(neighborhoodData.housing.valueChange.oneYear)}`}>
                    {formatPercentage(neighborhoodData.housing.valueChange.oneYear)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">5-Year Change</p>
                  <p className={`text-sm font-medium ${getPercentageColorClass(neighborhoodData.housing.valueChange.fiveYear)}`}>
                    {formatPercentage(neighborhoodData.housing.valueChange.fiveYear)}
                  </p>
                </div>
              </div>
              
              <h4 className="text-xs font-medium text-gray-600 mb-2">Property Types</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Single Family</span>
                    <span className="text-xs">{neighborhoodData.housing.propertyTypes.singleFamily}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${neighborhoodData.housing.propertyTypes.singleFamily}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Condos</span>
                    <span className="text-xs">{neighborhoodData.housing.propertyTypes.condo}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ width: `${neighborhoodData.housing.propertyTypes.condo}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Townhouses</span>
                    <span className="text-xs">{neighborhoodData.housing.propertyTypes.townhouse}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-purple-500 rounded-full" 
                      style={{ width: `${neighborhoodData.housing.propertyTypes.townhouse}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Apartments</span>
                    <span className="text-xs">{neighborhoodData.housing.propertyTypes.apartment}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-yellow-500 rounded-full" 
                      style={{ width: `${neighborhoodData.housing.propertyTypes.apartment}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <BarChart2 className="h-4 w-4 mr-1.5 text-gray-500" />
                Market Activity
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Avg. Days on Market</p>
                  <p className="text-sm font-medium">{neighborhoodData.marketTrends.avgDaysOnMarket} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">List to Sale Ratio</p>
                  <p className="text-sm font-medium">{neighborhoodData.marketTrends.listToSaleRatio}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price Per Sq. Ft.</p>
                  <p className="text-sm font-medium">
                    ${neighborhoodData.marketTrends.pricePerSqFt.current}
                    <span className={`text-xs ml-1 ${getPercentageColorClass(neighborhoodData.marketTrends.pricePerSqFt.change)}`}>
                      ({formatPercentage(neighborhoodData.marketTrends.pricePerSqFt.change)})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Inventory Level</p>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-1.5 ${
                      neighborhoodData.marketTrends.inventoryLevel === 'Low' ? 'bg-red-500' :
                      neighborhoodData.marketTrends.inventoryLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <p className="text-sm font-medium">{neighborhoodData.marketTrends.inventoryLevel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amenities Section */}
        {activeSection === 'amenities' && (
          <div className="space-y-4">
            {/* Schools */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <School className="h-4 w-4 mr-1.5 text-gray-500" />
                Schools
              </h3>
              {neighborhoodData.amenities.schools.length > 0 ? (
                <div className="space-y-2.5">
                  {neighborhoodData.amenities.schools.map((school, index) => (
                    <div key={index} className="flex justify-between border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{school.name}</p>
                        <p className="text-xs text-gray-500">{school.distance} miles away</p>
                      </div>
                      <div className="flex items-center">
                        <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          school.rating >= 8 ? 'bg-green-100 text-green-800' :
                          school.rating >= 6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {school.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">No school data available</p>
              )}
            </div>
            
            {/* Shopping */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <ShoppingBag className="h-4 w-4 mr-1.5 text-gray-500" />
                Grocery Stores
              </h3>
              {neighborhoodData.amenities.groceryStores.length > 0 ? (
                <div className="space-y-2.5">
                  {neighborhoodData.amenities.groceryStores.map((store, index) => (
                    <div key={index} className="flex justify-between">
                      <p className="text-sm">{store.name}</p>
                      <p className="text-xs text-gray-500">{store.distance} miles</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">No grocery stores found nearby</p>
              )}
            </div>
            
            {/* Restaurants */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Coffee className="h-4 w-4 mr-1.5 text-gray-500" />
                Restaurants
              </h3>
              {neighborhoodData.amenities.restaurants.length > 0 ? (
                <div className="space-y-2.5">
                  {neighborhoodData.amenities.restaurants.map((restaurant, index) => (
                    <div key={index} className="flex justify-between">
                      <p className="text-sm">{restaurant.name}</p>
                      <p className="text-xs text-gray-500">{restaurant.distance} miles</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">No restaurants found nearby</p>
              )}
            </div>
            
            {/* Parks */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <TreePine className="h-4 w-4 mr-1.5 text-gray-500" />
                Parks & Recreation
              </h3>
              {neighborhoodData.amenities.parks.length > 0 ? (
                <div className="space-y-2.5">
                  {neighborhoodData.amenities.parks.map((park, index) => (
                    <div key={index} className="flex justify-between">
                      <p className="text-sm">{park.name}</p>
                      <p className="text-xs text-gray-500">{park.distance} miles</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">No parks found nearby</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeighborhoodInsights;