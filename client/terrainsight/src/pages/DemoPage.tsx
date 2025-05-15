/**
 * Demo Page
 * 
 * This page provides access to demo scenarios for presentations
 * and stakeholder demonstrations of the Benton County GIS Property Analyzer.
 */

import React, { useState, useEffect } from 'react';
import { DemoControlPanel } from '../components/demos/DemoControlPanel';
import { DemoScenario } from '../utils/demoScenarios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Home, Presentation, Info } from 'lucide-react';
import { EnhancedMapComponent } from '../components/map/EnhancedMapComponent';

export function DemoPage() {
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [highlightedProperties, setHighlightedProperties] = useState<string[]>([]);
  const [demoStatus, setDemoStatus] = useState<string>('');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  
  // Load sample property data for demo
  useEffect(() => {
    // Fetch property data
    fetch('/api/properties')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProperties(data);
        }
      })
      .catch(error => {
        console.error('Error loading property data:', error);
      });
  }, []);

  // Handle scenario selection
  const handleScenarioSelect = (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    setDemoStatus(`Selected ${scenario.name}`);
    
    // Update map position if scenario specifies it
    if (scenario.mapCenter) {
      setMapCenter(scenario.mapCenter);
    }
    
    if (scenario.mapZoom) {
      setMapZoom(scenario.mapZoom);
    }
    
    // Highlight properties if specified
    if (scenario.targetProperties) {
      setHighlightedProperties(scenario.targetProperties);
    } else {
      setHighlightedProperties([]);
    }
  };
  
  // Handle step execution
  const handleStepExecute = (scenario: DemoScenario, step: { id: string; title: string }) => {
    setDemoStatus(`Executing: ${step.title}`);
  };
  
  // Handle demo completion
  const handleDemoComplete = (scenario: DemoScenario) => {
    setDemoStatus(`Demo complete: ${scenario.name}`);
  };
  
  // Handle property selection
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
    setDemoStatus(`Selected property: ${property.address || property.parcelId || 'Unknown'}`);
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center">
            <Presentation className="mr-2 h-6 w-6" />
            Benton County GIS Property Analyzer Demo
          </h1>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Main Application
            </Link>
          </Button>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This page allows you to run demonstration scenarios that showcase the capabilities of the Benton County GIS Property Analyzer.
            Select a scenario from the control panel below to begin.
          </AlertDescription>
        </Alert>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Demo Control Panel */}
        <div className="md:col-span-1">
          <DemoControlPanel 
            onScenarioSelect={handleScenarioSelect}
            onStepExecute={handleStepExecute}
            onDemoComplete={handleDemoComplete}
            className="sticky top-4"
          />
          
          {/* Demo Status */}
          {demoStatus && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Demo Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{demoStatus}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Demo Instructions */}
          {activeScenario && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  Use the control panel to advance through the demonstration steps. 
                  Each step will highlight different features of the property analysis system.
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>Press "Start Demo" to automate the entire sequence</li>
                  <li>Use "Next Step" to manually advance through steps</li>
                  <li>The demonstration can be paused or reset at any time</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main Content Area - Map */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeScenario ? activeScenario.name : 'Property Visualization'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] w-full">
                <EnhancedMapComponent 
                  properties={properties}
                  center={mapCenter}
                  zoom={mapZoom}
                  onPropertySelect={handlePropertySelect}
                  selectedProperty={selectedProperty}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 text-xs text-gray-500">
              {activeScenario ? activeScenario.description : 'Select a demo scenario to begin'}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DemoPage;