import React from 'react';
import { Property } from '@shared/schema';
import { NeighborhoodTimeline, NeighborhoodDataPoint } from '../../services/neighborhoodComparisonReportService';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Building, Ruler, Calendar, TrendingUp, Users } from 'lucide-react';

interface NeighborhoodProfileComparisonProps {
  neighborhoods: NeighborhoodTimeline[];
  selectedNeighborhoods: string[];
  properties: Property[];
  selectedYear: string;
  className?: string;
}

// Helper function to calculate average based on a property key
const calculateAverage = (items: any[], key: string): number => {
  if (!items.length) return 0;
  const sum = items.reduce((acc, item) => acc + (parseFloat(item[key]) || 0), 0);
  return sum / items.length;
};

export const NeighborhoodProfileComparison: React.FC<NeighborhoodProfileComparisonProps> = ({
  neighborhoods,
  selectedNeighborhoods,
  properties,
  selectedYear,
  className = ''
}) => {
  // Filter neighborhoods based on selection
  const filteredNeighborhoods = neighborhoods.filter(n => selectedNeighborhoods.includes(n.id));
  
  // If no neighborhoods selected, show selection prompt
  if (filteredNeighborhoods.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        Please select at least one neighborhood to view profile data.
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {filteredNeighborhoods.map(neighborhood => {
        // Get data for the selected year
        const yearData = neighborhood.data.find((d: NeighborhoodDataPoint) => d.year === selectedYear);
        
        // Filter properties in this neighborhood
        const neighborhoodProperties = properties.filter(p => 
          p.neighborhood === neighborhood.id || p.neighborhood === neighborhood.name
        );
        
        // Calculate neighborhood metrics
        const avgSquareFeet = calculateAverage(neighborhoodProperties, 'squareFeet');
        const avgBedrooms = calculateAverage(neighborhoodProperties, 'bedrooms');
        const avgBathrooms = calculateAverage(neighborhoodProperties, 'bathrooms');
        const avgYearBuilt = calculateAverage(neighborhoodProperties, 'yearBuilt');
        
        return (
          <Card key={neighborhood.id} className="overflow-hidden">
            <div className="bg-primary text-primary-foreground p-4">
              <h3 className="text-xl font-bold">{neighborhood.name}</h3>
              <p className="text-sm opacity-90">
                {neighborhoodProperties.length} properties • {yearData?.value ? `$${yearData.value.toLocaleString()}` : 'N/A'} avg value
              </p>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-500">PROPERTY CHARACTERISTICS</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Average Size</p>
                        <p className="text-lg">{avgSquareFeet.toLocaleString()} sq ft</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Avg. Beds/Baths</p>
                        <p className="text-lg">{avgBedrooms.toFixed(1)} beds / {avgBathrooms.toFixed(1)} baths</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Average Year Built</p>
                        <p className="text-lg">{avgYearBuilt.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-500">MARKET PERFORMANCE</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Price per Sq Ft</p>
                        <p className="text-lg">
                          ${yearData && avgSquareFeet 
                            ? (yearData.value / avgSquareFeet).toFixed(2) 
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Annual Growth</p>
                        <p className="text-lg">
                          {yearData 
                            ? `${yearData.percentChange.toFixed(2)}%` 
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Transactions</p>
                        <p className="text-lg">
                          {yearData 
                            ? yearData.transactionCount 
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-500">PROPERTY DISTRIBUTION</h4>
                  
                  <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                    {/* This would be replaced with an actual chart in a real implementation */}
                    Distribution chart would display here
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">
                      <span className="font-medium">Top property type:</span> Single Family
                    </p>
                    <p>
                      <span className="font-medium">Predominant age:</span> 1980s-1990s
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-sm text-gray-500 mb-3">NEIGHBORHOOD HIGHLIGHTS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium mb-1">Growth Pattern</p>
                    <p className="text-sm text-gray-600">
                      {neighborhood.growthRate > 3 
                        ? 'Strong consistent growth above market average'
                        : neighborhood.growthRate > 0
                          ? 'Stable growth tracking with market average'
                          : 'Below market average growth pattern'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium mb-1">Transaction Volume</p>
                    <p className="text-sm text-gray-600">
                      {yearData && yearData.transactionCount > 20
                        ? 'High turnover - active market with good liquidity'
                        : yearData && yearData.transactionCount > 10
                          ? 'Moderate activity - typical transaction volume'
                          : 'Low turnover - residents tend to stay long-term'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};