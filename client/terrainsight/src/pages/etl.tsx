import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  Gauge, 
  Cpu, 
  Code, 
  Settings,
  ListFilter
} from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

// Import the legacy dashboard components
import { ETLDashboard } from '../components/automation/ETLDashboard';
import { ETLDataSourceManager } from '../components/automation/ETLDataSourceManager';
import { ETLTransformationEditor } from '../components/automation/ETLTransformationEditor';
import { ETLOptimizationPanel } from '../components/automation/ETLOptimizationPanel';

// Import the new ETL Management component
import ETLManagement from './ETLManagement';

export default function ETLPage() {
  const [activeTab, setActiveTab] = useState('management');
  const [showLegacy, setShowLegacy] = useState(false);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ETL Data Integration</h1>
        <Button
          variant="outline"
          onClick={() => setShowLegacy(!showLegacy)}
        >
          {showLegacy ? "Switch to New Interface" : "Switch to Legacy Interface"}
        </Button>
      </div>
      
      {showLegacy ? (
        // Legacy ETL Interface
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Legacy Data Integration Hub</CardTitle>
            <CardDescription>
              Automated ETL processes with AI-powered optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="dashboard" className="flex items-center">
                  <Gauge className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="datasources" className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Data Sources
                </TabsTrigger>
                <TabsTrigger value="transformations" className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Transformations
                </TabsTrigger>
                <TabsTrigger value="optimization" className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2" />
                  Optimization
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-0">
                <ETLDashboard />
              </TabsContent>
              
              <TabsContent value="datasources" className="mt-0">
                <ETLDataSourceManager dataSourceId="db-1" />
              </TabsContent>
              
              <TabsContent value="transformations" className="mt-0">
                <ETLTransformationEditor />
              </TabsContent>
              
              <TabsContent value="optimization" className="mt-0">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">ETL Optimization</h2>
                  <p className="text-gray-600 mb-6">
                    AI-powered optimization suggestions for your ETL pipelines.
                    Select a job to see detailed optimization metrics and recommendations.
                  </p>
                  
                  <ETLOptimizationPanel jobId="job-1" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        // New ETL Management Interface
        <ETLManagement />
      )}
    </div>
  );
}