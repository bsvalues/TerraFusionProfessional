import React from 'react';
import { Map, Workflow, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const OverviewPanel: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">
        <span className="module-lockup module-insight">
          <span className="prefix">Terra</span><span className="name">Insight</span>
        </span> Project Overview
      </h2>
      
      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Map size={18} className="mr-2 text-blue-500" />
              GIS Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              TerraInsight is a comprehensive GIS-based appraisal toolset that integrates geographic data with property information for accurate valuations.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Layers:</span>
              <span>8</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saved Locations:</span>
              <span>14</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Workflow size={18} className="mr-2 text-green-500" />
              Script-Driven Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Projects are built using sequential Script Steps for data cleaning, analysis, model generation, and comparable sales analysis.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Scripts:</span>
              <span>6</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SQL Queries:</span>
              <span>8</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calculator size={18} className="mr-2 text-purple-500" />
              Regression Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Multiple Regression Analysis (MRA) modeling with variable selection, coefficient interpretation, and model validation.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Model R²:</span>
              <span>0.892</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PRD Value:</span>
              <span>1.02</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project components */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Project Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Property Records</span>
              <span className="text-sm text-muted-foreground">1,250 records</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Validated Sales</span>
              <span className="text-sm text-muted-foreground">523 records</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Regression Models</span>
              <span className="text-sm text-muted-foreground">8 models</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Comparable Analyses</span>
              <span className="text-sm text-muted-foreground">438 analyses</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPanel;