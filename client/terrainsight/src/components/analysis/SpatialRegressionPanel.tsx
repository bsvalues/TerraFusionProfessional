import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { 
  performGWR, 
  SpatialRegressionResults,
  KernelType
} from '@/services/spatialAnalysisService';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider
} from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SpatialRegressionPanelProps {
  properties: Property[];
  className?: string;
}

// Component to handle map bounds
const MapBoundsHandler: React.FC<{properties: Property[]}> = ({ properties }) => {
  const map = useMap();
  
  useEffect(() => {
    if (properties.length === 0) return;
    
    // Extract valid coordinates
    const validCoords = properties
      .filter(p => p.latitude && p.longitude)
      .map(p => [p.latitude as number, p.longitude as number] as [number, number]);
    
    if (validCoords.length > 0) {
      map.fitBounds(validCoords);
    }
  }, [properties, map]);
  
  return null;
};

export const SpatialRegressionPanel: React.FC<SpatialRegressionPanelProps> = ({ 
  properties,
  className = ''
}) => {
  // Available fields for dependent variable
  const dependentFields = ['value', 'salePrice', 'landValue'];
  
  // Available fields for independent variables
  const independentFields = [
    'squareFeet', 
    'yearBuilt', 
    'bedrooms', 
    'bathrooms', 
    'lotSize'
  ];
  
  // State for regression parameters
  const [dependentVar, setDependentVar] = useState<string>('value');
  const [selectedIndependentVars, setSelectedIndependentVars] = useState<string[]>(['squareFeet', 'yearBuilt']);
  const [bandwidth, setBandwidth] = useState<number>(5);
  const [kernelType, setKernelType] = useState<KernelType>('gaussian');
  
  // State for regression results
  const [results, setResults] = useState<SpatialRegressionResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for visualization
  const [visField, setVisField] = useState<string>('squareFeet');
  
  // Run regression analysis
  const runRegression = async () => {
    if (properties.length < 30) {
      setError("GWR requires at least 30 properties for reliable results");
      return;
    }
    
    if (selectedIndependentVars.length === 0) {
      setError("Please select at least one independent variable");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const regressionResults = performGWR(
        properties,
        selectedIndependentVars,
        dependentVar,
        bandwidth,
        kernelType
      );
      
      setResults(regressionResults);
      setLoading(false);
    } catch (err: any) {
      console.error("Error in GWR analysis:", err);
      setError(err.message || "Failed to perform GWR analysis");
      setLoading(false);
    }
  };
  
  // Toggle selection of independent variables
  const toggleIndependentVar = (field: string) => {
    setSelectedIndependentVars(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };
  
  // Format field name for display
  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };
  
  // Get color for coefficient visualization
  const getCoefficientColor = (value: number, max: number, min: number): string => {
    if (value === 0) return '#888888';
    
    if (value > 0) {
      // Positive coefficient: green (darker = stronger)
      const intensity = Math.min(1, value / Math.max(0.00001, max));
      return `rgba(0, 128, 0, ${0.3 + intensity * 0.7})`;
    } else {
      // Negative coefficient: red (darker = stronger)
      const intensity = Math.min(1, Math.abs(value) / Math.max(0.00001, Math.abs(min)));
      return `rgba(220, 0, 0, ${0.3 + intensity * 0.7})`;
    }
  };
  
  // Get coefficient for a property
  const getPropertyCoefficient = (property: Property, field: string): number => {
    if (!results || !property) return 0;
    
    const index = properties.findIndex(p => p.id === property.id);
    if (index === -1) return 0;
    
    return results.coefficients[index][field];
  };
  
  // Get max absolute coefficient value for visualization scaling
  const getMaxCoefficientValue = (field: string): { max: number, min: number } => {
    if (!results) return { max: 1, min: -1 };
    
    const values = results.coefficients.map(c => c[field]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return { max, min };
  };
  
  // Format a coefficient value for display
  const formatCoefficient = (value: number): string => {
    if (Math.abs(value) < 0.01) {
      return value.toExponential(2);
    }
    return value.toFixed(4);
  };
  
  // Get R² color based on value
  const getR2Color = (r2: number): string => {
    if (r2 > 0.8) return 'bg-green-500';
    if (r2 > 0.6) return 'bg-green-400';
    if (r2 > 0.4) return 'bg-yellow-400';
    if (r2 > 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Geographic Weighted Regression
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          GWR allows coefficients to vary across space, accounting for spatial non-stationarity in property relationships.
        </p>
        
        <div className="space-y-4">
          {/* Dependent Variable Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependent Variable (What to predict)
            </label>
            <Select
              value={dependentVar}
              onValueChange={setDependentVar}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select variable to predict" />
              </SelectTrigger>
              <SelectContent>
                {dependentFields.map(field => (
                  <SelectItem key={field} value={field}>
                    {formatFieldName(field)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Independent Variables Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Independent Variables (Predictors)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {independentFields.map(field => (
                <div 
                  key={field}
                  className={`p-2 border rounded cursor-pointer text-sm ${
                    selectedIndependentVars.includes(field) 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => toggleIndependentVar(field)}
                >
                  {formatFieldName(field)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Bandwidth Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bandwidth: {bandwidth.toFixed(1)} km
            </label>
            <Slider
              min={0.5}
              max={20}
              step={0.5}
              value={[bandwidth]}
              onValueChange={(values) => setBandwidth(values[0])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Local (0.5km)</span>
              <span>Regional (20km)</span>
            </div>
          </div>
          
          {/* Kernel Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kernel Function
            </label>
            <Select
              value={kernelType}
              onValueChange={(value) => setKernelType(value as KernelType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select kernel function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gaussian">Gaussian</SelectItem>
                <SelectItem value="bisquare">Bisquare</SelectItem>
                <SelectItem value="tricube">Tricube</SelectItem>
                <SelectItem value="uniform">Uniform</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Run Button */}
          <button
            onClick={runRegression}
            disabled={loading || selectedIndependentVars.length === 0}
            className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Running Analysis...
              </span>
            ) : "Run Regression Analysis"}
          </button>
          
          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Results Section */}
      {results && (
        <div className="p-4">
          <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="coefficients">Coefficients</TabsTrigger>
              <TabsTrigger value="visualization">Map View</TabsTrigger>
            </TabsList>
            
            {/* Summary Tab */}
            <TabsContent value="summary" className="py-2">
              <div className="space-y-4">
                {/* Global Statistics */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Global Model Performance</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Global R²</div>
                      <div className="text-lg font-semibold">{results.globalR2.toFixed(3)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500">Adjusted R²</div>
                      <div className="text-lg font-semibold">{results.adjustedR2.toFixed(3)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500">AIC</div>
                      <div className="text-lg font-semibold">{results.aic.toFixed(1)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500">Moran's I (Residuals)</div>
                      <div className="text-lg font-semibold">{results.moran.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Coefficient Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Coefficient Summary</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2">Variable</th>
                          <th className="text-right p-2">Mean</th>
                          <th className="text-right p-2">Min</th>
                          <th className="text-right p-2">Max</th>
                          <th className="text-right p-2">Std. Dev</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Intercept</td>
                          <td className="text-right p-2">
                            {formatCoefficient(
                              results.coefficients.reduce((sum, c) => sum + c.intercept, 0) / 
                              results.coefficients.length
                            )}
                          </td>
                          <td className="text-right p-2">
                            {formatCoefficient(
                              Math.min(...results.coefficients.map(c => c.intercept))
                            )}
                          </td>
                          <td className="text-right p-2">
                            {formatCoefficient(
                              Math.max(...results.coefficients.map(c => c.intercept))
                            )}
                          </td>
                          <td className="text-right p-2">
                            {formatCoefficient(
                              Math.sqrt(
                                results.coefficients.reduce(
                                  (sum, c) => sum + Math.pow(
                                    c.intercept - 
                                    results.coefficients.reduce((s, cf) => s + cf.intercept, 0) / 
                                    results.coefficients.length, 
                                    2
                                  ), 
                                  0
                                ) / results.coefficients.length
                              )
                            )}
                          </td>
                        </tr>
                        
                        {selectedIndependentVars.map(variable => (
                          <tr key={variable} className="border-b">
                            <td className="p-2">{formatFieldName(variable)}</td>
                            <td className="text-right p-2">
                              {formatCoefficient(
                                results.coefficients.reduce((sum, c) => sum + c[variable], 0) / 
                                results.coefficients.length
                              )}
                            </td>
                            <td className="text-right p-2">
                              {formatCoefficient(
                                Math.min(...results.coefficients.map(c => c[variable]))
                              )}
                            </td>
                            <td className="text-right p-2">
                              {formatCoefficient(
                                Math.max(...results.coefficients.map(c => c[variable]))
                              )}
                            </td>
                            <td className="text-right p-2">
                              {formatCoefficient(
                                Math.sqrt(
                                  results.coefficients.reduce(
                                    (sum, c) => sum + Math.pow(
                                      c[variable] - 
                                      results.coefficients.reduce((s, cf) => s + cf[variable], 0) / 
                                      results.coefficients.length, 
                                      2
                                    ), 
                                    0
                                  ) / results.coefficients.length
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <p>
                      <strong>Coefficient variation</strong> across space indicates spatial non-stationarity 
                      in the relationship between variables.
                    </p>
                  </div>
                </div>
                
                {/* Warnings */}
                {results.warnings.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-yellow-800 mb-2">Warnings</h3>
                    <ul className="list-disc pl-5 text-sm text-yellow-700">
                      {results.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Coefficients Tab */}
            <TabsContent value="coefficients" className="py-2">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-md font-medium text-gray-800 mb-2">Local R² Distribution</h3>
                
                <div className="h-10 bg-gray-200 rounded-lg overflow-hidden flex">
                  {results.localR2.sort((a, b) => a - b).map((r2, index) => (
                    <div 
                      key={index}
                      className={`h-full ${getR2Color(r2)}`}
                      style={{ width: `${100 / results.localR2.length}%` }}
                      title={`R²: ${r2.toFixed(3)}`}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Min: {Math.min(...results.localR2).toFixed(3)}</span>
                  <span>Median: {
                    results.localR2.sort((a, b) => a - b)[Math.floor(results.localR2.length / 2)].toFixed(3)
                  }</span>
                  <span>Max: {Math.max(...results.localR2).toFixed(3)}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium text-gray-800">Coefficient Variation By Location</h3>
                  
                  <Select
                    value={visField}
                    onValueChange={setVisField}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select variable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intercept">Intercept</SelectItem>
                      {selectedIndependentVars.map(field => (
                        <SelectItem key={field} value={field}>
                          {formatFieldName(field)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="h-80 rounded-lg overflow-hidden">
                  <MapContainer
                    style={{ height: '100%', width: '100%' }}
                    zoom={12}
                    center={[46.2, -119.1]} // Default center - will be adjusted by MapBoundsHandler
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <MapBoundsHandler properties={properties} />
                    
                    {properties.map(property => {
                      if (!property.latitude || !property.longitude) return null;
                      
                      const coefficient = getPropertyCoefficient(property, visField);
                      const { max, min } = getMaxCoefficientValue(visField);
                      
                      return (
                        <CircleMarker
                          key={property.id}
                          center={[property.latitude as number, property.longitude as number]}
                          radius={8}
                          fillOpacity={0.8}
                          weight={1}
                          color="#ffffff"
                          fillColor={getCoefficientColor(coefficient, max, min)}
                          data-testid={`coefficient-marker-${property.id}`}
                        >
                          <Tooltip>
                            <div>
                              <strong>{property.address}</strong>
                              <div>Coefficient: {formatCoefficient(coefficient)}</div>
                              <div>Local R²: {
                                results.localR2[properties.findIndex(p => p.id === property.id)]?.toFixed(3) || 'N/A'
                              }</div>
                            </div>
                          </Tooltip>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
                
                <div className="mt-3 flex justify-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                      <span className="text-xs text-gray-600">Negative Effect</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-gray-400 mr-1"></div>
                      <span className="text-xs text-gray-600">No Effect</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-xs text-gray-600">Positive Effect</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Visualization Tab */}
            <TabsContent value="visualization" className="py-2">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Predicted vs Actual Values</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2">Address</th>
                        <th className="text-right p-2">Actual Value</th>
                        <th className="text-right p-2">Predicted Value</th>
                        <th className="text-right p-2">Residual</th>
                        <th className="text-right p-2">Local R²</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.slice(0, 10).map((property, idx) => {
                        const value = property[dependentVar];
                        let formattedValue = 'N/A';
                        
                        if (value !== null && value !== undefined) {
                          if (typeof value === 'string') {
                            formattedValue = value;
                          } else if (typeof value === 'number') {
                            formattedValue = formatCurrency(value);
                          }
                        }
                        
                        // Formatted predicted value
                        const prediction = results.predictions[idx];
                        const formattedPrediction = formatCurrency(prediction);
                        
                        // Formatted residual
                        const residual = results.residuals[idx];
                        const residualFormatted = formatCurrency(Math.abs(residual));
                        const residualSign = residual >= 0 ? '+' : '-';
                        
                        return (
                          <tr key={property.id} className="border-b">
                            <td className="p-2">{property.address}</td>
                            <td className="text-right p-2">{formattedValue}</td>
                            <td className="text-right p-2">{formattedPrediction}</td>
                            <td className={`text-right p-2 ${
                              residual > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {residualSign} {residualFormatted}
                            </td>
                            <td className="text-right p-2">{results.localR2[idx].toFixed(3)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Showing 10 of {properties.length} properties. 
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SpatialRegressionPanel;