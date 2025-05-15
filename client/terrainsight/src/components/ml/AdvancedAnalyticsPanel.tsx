import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, LineChart, BarChart2, BarChart4, Globe, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@shared/schema';
import { ValuationModelPanel } from './ValuationModelPanel';
import { ForecastPanel } from './ForecastPanel';
import { SpatialAnalyticsPanel } from './SpatialAnalyticsPanel';
import { AdvancedRegressionPanel } from './AdvancedRegressionPanel';
import { OutlierDetectionPanel } from '../analysis/OutlierDetectionPanel';
import { ProximityAnalysisPanel } from '../spatial/ProximityAnalysisPanel';

interface AdvancedAnalyticsPanelProps {
  selectedProperty?: Property;
  allProperties: Property[];
  className?: string;
}

export function AdvancedAnalyticsPanel({ 
  selectedProperty, 
  allProperties,
  className = "" 
}: AdvancedAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState('valuation');

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-500" />
              ML Valuation
            </CardTitle>
            <CardDescription className="text-blue-600/80">
              Advanced valuation algorithms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              99.4%
            </div>
            <div className="text-sm text-blue-700 mt-1">Prediction accuracy</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700 flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-purple-500" />
              Time Series
            </CardTitle>
            <CardDescription className="text-purple-600/80">
              Future value projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              +5.2%
            </div>
            <div className="text-sm text-purple-700 mt-1">Projected growth (1yr)</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-500" />
              Spatial Analysis
            </CardTitle>
            <CardDescription className="text-green-600/80">
              Location impact scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              23
            </div>
            <div className="text-sm text-green-700 mt-1">Spatial clusters identified</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-700 flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-amber-500" />
              Comparable Analysis
            </CardTitle>
            <CardDescription className="text-amber-600/80">
              Property matching engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              243
            </div>
            <div className="text-sm text-amber-700 mt-1">Market comparables processed</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Outlier Detection
            </CardTitle>
            <CardDescription className="text-red-600/80">
              Anomaly identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              4.7%
            </div>
            <div className="text-sm text-red-700 mt-1">Market anomaly rate</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="valuation" className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Valuation Model
          </TabsTrigger>
          <TabsTrigger value="regression" className="flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            Advanced Regression
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center">
            <LineChart className="h-4 w-4 mr-2" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="spatial" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Spatial Analytics
          </TabsTrigger>
          <TabsTrigger value="proximity" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Proximity Analysis
          </TabsTrigger>
          <TabsTrigger value="outliers" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Outlier Detection
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="valuation" className="mt-4">
          <ValuationModelPanel selectedProperty={selectedProperty} allProperties={allProperties} />
        </TabsContent>
        
        <TabsContent value="regression" className="mt-4">
          <AdvancedRegressionPanel selectedProperty={selectedProperty} allProperties={allProperties} />
        </TabsContent>
        
        <TabsContent value="forecast" className="mt-4">
          <ForecastPanel selectedProperty={selectedProperty} allProperties={allProperties} />
        </TabsContent>
        
        <TabsContent value="spatial" className="mt-4">
          <SpatialAnalyticsPanel selectedProperty={selectedProperty} allProperties={allProperties} />
        </TabsContent>
        
        <TabsContent value="proximity" className="mt-4">
          <ProximityAnalysisPanel selectedProperty={selectedProperty} allProperties={allProperties} />
        </TabsContent>
        
        <TabsContent value="outliers" className="mt-4">
          <OutlierDetectionPanel properties={allProperties} />
        </TabsContent>
      </Tabs>
    </div>
  );
}