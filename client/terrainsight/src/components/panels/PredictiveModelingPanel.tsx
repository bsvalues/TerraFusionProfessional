import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp,
  BarChart,
  History,
  LineChart
} from 'lucide-react';
import { PropertyValuePrediction } from '../predictive/PropertyValuePrediction';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { PredictionResult } from '../../services/predictive/propertyValueModel';

interface PredictiveModelingPanelProps {
  className?: string;
  properties?: Property[];
}

export function PredictiveModelingPanel({ className, properties: propProperties }: PredictiveModelingPanelProps) {
  const [activeTab, setActiveTab] = useState('value-prediction');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  
  // Fetch all properties for selection if not provided via props
  const { data: fetchedProperties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Use properties from props or fallback to fetched ones
  const allProperties: Property[] = propProperties || fetchedProperties || [];

  // Get selected property
  const selectedProperty = allProperties.find((p: Property) => p.id === selectedPropertyId);
  
  // Handle property selection
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedPropertyId(id || null);
  };
  
  // Handle prediction completed
  const handlePredictionComplete = (prediction: PredictionResult) => {
    setPredictionResult(prediction);
  };
  
  return (
    <div className={`h-full flex flex-col bg-white overflow-visible relative z-10 ${className}`}>
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          Predictive Analytics
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Advanced machine learning models for property valuation and market analysis
        </p>
      </div>
      
      <div className="p-4 border-b">
        <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Property for Analysis
        </label>
        <select
          id="property-select"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          value={selectedPropertyId?.toString() || ''}
          onChange={handlePropertyChange}
        >
          <option value="">Select a property...</option>
          {allProperties.map((property: Property) => (
            <option key={property.id} value={property.id.toString()}>
              {property.address} - {property.parcelId}
            </option>
          ))}
        </select>
      </div>
      
      <Tabs 
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger 
              value="value-prediction"
              className="flex items-center"
              aria-label="Value prediction"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Value Prediction</span>
            </TabsTrigger>
            <TabsTrigger 
              value="time-series"
              className="flex items-center"
              aria-label="Time Series Analysis"
              disabled={true}
            >
              <LineChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Time Series</span>
            </TabsTrigger>
            <TabsTrigger 
              value="market-analysis"
              className="flex items-center"
              aria-label="Market Analysis"
              disabled={true}
            >
              <BarChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Market Analysis</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          <TabsContent value="value-prediction" className="h-full m-0 p-0">
            <PropertyValuePrediction 
              selectedProperty={selectedProperty} 
              onPredictionComplete={handlePredictionComplete}
            />
          </TabsContent>
          
          <TabsContent value="time-series" className="h-full m-0 p-0">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <History className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold">Time Series Analysis</h3>
              </div>
              <p className="text-gray-500 mb-4">
                Track property value trends over time and forecast future values with statistical models.
              </p>
              <div className="text-sm text-gray-500 italic">
                Time series analysis feature coming soon.
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="market-analysis" className="h-full m-0 p-0">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <BarChart className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold">Market Analysis</h3>
              </div>
              <p className="text-gray-500 mb-4">
                Analyze market trends, identify opportunities, and compare properties to overall market performance.
              </p>
              <div className="text-sm text-gray-500 italic">
                Market analysis feature coming soon.
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}