import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart2, 
  CheckCircle2, 
  ChevronsRight, 
  CircleDashed, 
  Globe, 
  Home, 
  Map, 
  MapPin, 
  NavigationIcon, 
  Ruler, 
  Zap 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SpatialAnalyticsPanelProps {
  selectedProperty?: Property;
  allProperties: Property[];
  className?: string;
}

interface LocationFactor {
  name: string;
  score: number;  // 0-100
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface SpatialAnalysisResult {
  overallScore: number; // 0-100
  locationFactors: LocationFactor[];
  nearbyProperties: Property[];
  hotspotStatus: 'high' | 'medium' | 'low';
  valuationImpact: number; // percentage impact on valuation
  spatialIndex: number; // Moran's I spatial autocorrelation
  proximityScores: {
    schools: number;
    transportation: number;
    parks: number;
    shopping: number;
    healthcare: number;
  };
}

export function SpatialAnalyticsPanel({ selectedProperty, allProperties, className }: SpatialAnalyticsPanelProps) {
  const [analysisRadius, setAnalysisRadius] = useState(1.0); // miles
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SpatialAnalysisResult | null>(null);
  
  const generateSpatialAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis generation delay
    setTimeout(() => {
      if (!selectedProperty) return;
      
      // Mock location factors with more realistic data
      const locationFactors: LocationFactor[] = [
        {
          name: 'School Proximity',
          score: 85,
          impact: 'positive',
          description: 'Within 0.8 miles of highly rated schools'
        },
        {
          name: 'Transit Access',
          score: 65,
          impact: 'positive',
          description: 'Bus stop within 0.3 miles, limited transit options'
        },
        {
          name: 'Park Access',
          score: 92,
          impact: 'positive',
          description: 'Multiple parks within walking distance'
        },
        {
          name: 'Commercial Proximity',
          score: 75,
          impact: 'positive',
          description: 'Conveniently close to shopping & services'
        },
        {
          name: 'Traffic Noise',
          score: 35,
          impact: 'negative',
          description: 'Moderate traffic noise from nearby arterial road'
        },
        {
          name: 'Walk Score',
          score: 68,
          impact: 'positive',
          description: 'Somewhat walkable neighborhood'
        },
        {
          name: 'Crime Rate',
          score: 82,
          impact: 'positive',
          description: 'Below average crime rate for the area'
        }
      ];
      
      const proximityScores = {
        schools: 85,
        transportation: 65,
        parks: 92,
        shopping: 75,
        healthcare: 70
      };
      
      // Get a few nearby properties for comparison
      const nearbyProperties = allProperties
        .filter(p => p.id !== selectedProperty.id)
        .slice(0, 5);
      
      // Calculate overall score as weighted average
      const weights = {
        schoolProximity: 0.25,
        transitAccess: 0.15,
        parkAccess: 0.1,
        commercialProximity: 0.15,
        trafficNoise: 0.1,
        walkScore: 0.15,
        crimeRate: 0.1
      };
      
      const overallScore = Math.round(
        locationFactors[0].score * weights.schoolProximity +
        locationFactors[1].score * weights.transitAccess +
        locationFactors[2].score * weights.parkAccess +
        locationFactors[3].score * weights.commercialProximity +
        locationFactors[4].score * weights.trafficNoise +
        locationFactors[5].score * weights.walkScore +
        locationFactors[6].score * weights.crimeRate
      );
      
      // Simulate spatial autocorrelation (Moran's I)
      // Range from -1 to 1, where:
      // - positive values indicate clustering
      // - values near 0 indicate random distribution
      // - negative values indicate dispersion
      const spatialIndex = 0.68; 
      
      // Determine hotspot status based on overall score
      let hotspotStatus: 'high' | 'medium' | 'low' = 'medium';
      if (overallScore >= 80) hotspotStatus = 'high';
      else if (overallScore < 60) hotspotStatus = 'low';
      
      // Calculate valuation impact based on location score
      // In real implementation, this would be based on regression models
      const valuationImpact = Math.round((overallScore - 50) / 5);
      
      setAnalysisResult({
        overallScore,
        locationFactors,
        nearbyProperties,
        hotspotStatus,
        valuationImpact,
        spatialIndex,
        proximityScores
      });
      
      setIsAnalyzing(false);
    }, 1500);
  };
  
  // Function to get class for score visualization
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Function to get impact badge styling
  const getImpactBadge = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Positive
          </Badge>
        );
      case 'negative':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <CircleDashed className="mr-1 h-3 w-3" /> Negative
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Neutral
          </Badge>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Globe className="mr-2 h-5 w-5 text-primary" />
              Spatial Analytics
            </CardTitle>
            <CardDescription>
              Analyze the location quality, proximity to amenities, and spatial relationships of properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProperty ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-md border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {selectedProperty.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProperty.parcelId} • {selectedProperty.propertyType || 'Residential'}
                    </p>
                  </div>
                  {selectedProperty.coordinates && (
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium">Coordinates</span>
                      <span className="text-sm">
                        {typeof selectedProperty.coordinates === 'string' 
                          ? selectedProperty.coordinates 
                          : `${selectedProperty.coordinates[0].toFixed(5)}, ${selectedProperty.coordinates[1].toFixed(5)}`
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="analysis-type">Analysis Type</Label>
                    <Select value={analysisType} onValueChange={setAnalysisType}>
                      <SelectTrigger id="analysis-type">
                        <SelectValue placeholder="Select analysis type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                        <SelectItem value="amenities">Amenity Proximity</SelectItem>
                        <SelectItem value="market">Market Comparison</SelectItem>
                        <SelectItem value="cluster">Spatial Clustering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="analysis-radius">Analysis Radius: {analysisRadius.toFixed(1)} miles</Label>
                    <Slider
                      id="analysis-radius"
                      min={0.2}
                      max={5.0}
                      step={0.1}
                      value={[analysisRadius]}
                      onValueChange={(values) => setAnalysisRadius(values[0])}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={generateSpatialAnalysis} 
                  className="w-full"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>Analyzing Spatial Data...</>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Perform Spatial Analysis
                    </>
                  )}
                </Button>
                
                {analysisResult && (
                  <div className="pt-4 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-medium">Location Quality Score</h3>
                        <p className="text-sm text-gray-500">Comprehensive analysis of spatial factors</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-16 w-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center relative">
                          <div className={`h-12 w-12 rounded-full ${getScoreColorClass(analysisResult.overallScore)} flex items-center justify-center text-white font-bold`}>
                            {analysisResult.overallScore}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Badge variant="outline" className="rounded-md px-2.5 py-1 bg-green-100 text-green-800 hover:bg-green-200">
                            {analysisResult.hotspotStatus === 'high' ? 'High Value Area' : 
                             analysisResult.hotspotStatus === 'medium' ? 'Good Location' : 'Developing Area'}
                          </Badge>
                          <div className="text-sm">
                            <span className="font-medium text-green-700">+{analysisResult.valuationImpact}%</span>
                            <span className="text-gray-500"> value impact</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-md font-medium mb-2 flex items-center">
                          <NavigationIcon className="h-4 w-4 mr-2 text-primary" />
                          Location Factors
                        </h4>
                        <div className="space-y-3">
                          {analysisResult.locationFactors.map((factor, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{factor.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{factor.score}</span>
                                  {getImpactBadge(factor.impact)}
                                </div>
                              </div>
                              <Progress value={factor.score} className="h-2" />
                              <p className="text-xs text-gray-500">{factor.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-md font-medium mb-3 flex items-center">
                            <Map className="h-4 w-4 mr-2 text-primary" />
                            Proximity Analysis
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Card className="border-blue-100">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-blue-800">Schools</span>
                                  <span className="text-sm font-medium">{analysisResult.proximityScores.schools}/100</span>
                                </div>
                                <Progress value={analysisResult.proximityScores.schools} className="h-1.5 mt-1.5 bg-blue-100">
                                  <div className="bg-blue-500 h-full rounded-full" />
                                </Progress>
                              </CardContent>
                            </Card>
                            <Card className="border-green-100">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-green-800">Parks</span>
                                  <span className="text-sm font-medium">{analysisResult.proximityScores.parks}/100</span>
                                </div>
                                <Progress value={analysisResult.proximityScores.parks} className="h-1.5 mt-1.5 bg-green-100">
                                  <div className="bg-green-500 h-full rounded-full" />
                                </Progress>
                              </CardContent>
                            </Card>
                            <Card className="border-purple-100">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-purple-800">Transport</span>
                                  <span className="text-sm font-medium">{analysisResult.proximityScores.transportation}/100</span>
                                </div>
                                <Progress value={analysisResult.proximityScores.transportation} className="h-1.5 mt-1.5 bg-purple-100">
                                  <div className="bg-purple-500 h-full rounded-full" />
                                </Progress>
                              </CardContent>
                            </Card>
                            <Card className="border-amber-100">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-amber-800">Shopping</span>
                                  <span className="text-sm font-medium">{analysisResult.proximityScores.shopping}/100</span>
                                </div>
                                <Progress value={analysisResult.proximityScores.shopping} className="h-1.5 mt-1.5 bg-amber-100">
                                  <div className="bg-amber-500 h-full rounded-full" />
                                </Progress>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <h4 className="text-md font-medium mb-3 flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2 text-primary" />
                            Spatial Statistics
                          </h4>
                          <Card>
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Spatial Autocorrelation (Moran's I)</span>
                                <Badge className={analysisResult.spatialIndex > 0.5 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                  {analysisResult.spatialIndex.toFixed(2)}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Clustering Pattern</span>
                                <Badge className="bg-purple-100 text-purple-800">
                                  {analysisResult.spatialIndex > 0.5 ? 'Clustered' : 
                                   analysisResult.spatialIndex > 0 ? 'Somewhat Clustered' : 
                                   analysisResult.spatialIndex < -0.2 ? 'Dispersed' : 'Random'}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Influence Radius</span>
                                <span className="text-sm font-medium">{analysisRadius.toFixed(1)} miles</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Properties in Radius</span>
                                <span className="text-sm font-medium">{Math.round(22 * analysisRadius)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Please select a property to analyze using spatial analytics.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Ruler className="mr-2 h-5 w-5 text-primary" />
              Spatial Insights
            </CardTitle>
            <CardDescription>
              Understanding how location impacts property value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Location Impact</h4>
              <p className="text-sm text-gray-600">
                Spatial analysis suggests that location factors account for approximately 30-40% of a property's total value in Benton County.
              </p>
              
              <div className="pt-2">
                <h4 className="text-sm font-semibold mb-2">Key Proximity Factors</h4>
                <ul className="space-y-2.5">
                  <li className="flex items-start text-sm">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mt-0.5 mr-2">
                      1
                    </div>
                    <div>
                      <span className="font-medium">School Quality</span>
                      <p className="text-xs text-gray-500">Properties near top-rated schools can command 5-12% premium</p>
                    </div>
                  </li>
                  <li className="flex items-start text-sm">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mt-0.5 mr-2">
                      2
                    </div>
                    <div>
                      <span className="font-medium">Parks & Open Spaces</span>
                      <p className="text-xs text-gray-500">Proximity to parks increases values by 3-7% on average</p>
                    </div>
                  </li>
                  <li className="flex items-start text-sm">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mt-0.5 mr-2">
                      3
                    </div>
                    <div>
                      <span className="font-medium">Transit Access</span>
                      <p className="text-xs text-gray-500">Good public transportation can add 4-8% to property values</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-2">Spatial Analytics Methods</h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <ChevronsRight className="h-4 w-4 text-primary mt-1 mr-1.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Spatial Autocorrelation</span>
                    <p className="text-xs text-gray-500">Measures how properties cluster based on similarity</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ChevronsRight className="h-4 w-4 text-primary mt-1 mr-1.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Proximity Analysis</span>
                    <p className="text-xs text-gray-500">Calculates distance-based effects on property value</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ChevronsRight className="h-4 w-4 text-primary mt-1 mr-1.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Geographically Weighted Regression</span>
                    <p className="text-xs text-gray-500">Models how spatial relationships vary across locations</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-3">
              <Card className="bg-blue-50">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-blue-700">Location Quality Index</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">West Richland</span>
                        <Badge className="bg-blue-200 hover:bg-blue-300 text-blue-800">86/100</Badge>
                      </div>
                      <Progress value={86} className="h-1.5 mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">South Kennewick</span>
                        <Badge className="bg-blue-200 hover:bg-blue-300 text-blue-800">82/100</Badge>
                      </div>
                      <Progress value={82} className="h-1.5 mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">Richland Heights</span>
                        <Badge className="bg-blue-200 hover:bg-blue-300 text-blue-800">78/100</Badge>
                      </div>
                      <Progress value={78} className="h-1.5 mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">East Pasco</span>
                        <Badge className="bg-blue-200 hover:bg-blue-300 text-blue-800">74/100</Badge>
                      </div>
                      <Progress value={74} className="h-1.5 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}