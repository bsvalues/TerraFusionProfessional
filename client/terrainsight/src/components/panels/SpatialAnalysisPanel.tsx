import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClusteringPanel } from '../analysis/ClusteringPanel';
import { TemporalAnalysisPanel } from '../analysis/TemporalAnalysisPanel';
import { Property } from '@shared/schema';
import { BarChart2 } from 'lucide-react';

// Interface for component props
interface SpatialAnalysisPanelProps {
  properties: Property[];
  className?: string;
}

/**
 * Panel for spatial analysis features including clustering, heatmaps, and temporal analysis
 */
export const SpatialAnalysisPanel: React.FC<SpatialAnalysisPanelProps> = ({ 
  properties, 
  className = "" 
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('clustering');
  
  // Handler for tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className={`border border-neutral-200 rounded-md bg-white overflow-hidden ${className}`}>
      <div className="p-3 border-b border-neutral-200">
        <div className="flex items-center mb-1">
          <BarChart2 className="h-4 w-4 text-primary mr-2" />
          <h2 className="text-base font-medium text-gray-900">Spatial Analysis</h2>
        </div>
        <p className="text-sm text-gray-600 pl-6">
          Analyze spatial patterns and relationships in property data
        </p>
      </div>
      <div className="p-4 overflow-visible">
        <Tabs defaultValue="clustering" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="clustering">Clustering</TabsTrigger>
            <TabsTrigger value="temporal">Temporal Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clustering" className="overflow-visible">
            <ClusteringPanel properties={properties} />
          </TabsContent>
          
          <TabsContent value="temporal" className="overflow-visible">
            <TemporalAnalysisPanel properties={properties} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};