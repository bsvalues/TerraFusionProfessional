import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NeighborhoodTimeline from './NeighborhoodTimeline';

const NeighborhoodTimelineDemo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Neighborhood Timeline Visualization</h1>
          <p className="text-muted-foreground mt-2">
            Interactive visualization of property value trends across neighborhoods over time
          </p>
        </div>
        
        <NeighborhoodTimeline className="mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Using Neighborhood Analysis</CardTitle>
              <CardDescription>Learn how to apply neighborhood trends to your property valuation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Neighborhood-level analysis provides critical context for property valuation and helps identify market trends before they're visible at the individual property level. This visualization allows you to:
              </p>
              <ul className="text-sm list-disc pl-5 space-y-2">
                <li>Compare value trends across different neighborhoods</li>
                <li>Identify growth patterns and market shifts</li>
                <li>Correlate transaction volume with price changes</li>
                <li>Assess the impact of economic events on different areas</li>
                <li>Support valuation adjustments with neighborhood-level data</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Events Analysis</CardTitle>
              <CardDescription>Understanding how market events affect property values</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                The timeline visualization highlights several key market events that have influenced property values:
              </p>
              <ul className="text-sm list-disc pl-5 space-y-2">
                <li><strong>2008 Housing Crisis:</strong> Significant downturn in most neighborhoods with varying recovery rates</li>
                <li><strong>2015-2018:</strong> Sustained growth period with above-average appreciation</li>
                <li><strong>2020 COVID-19:</strong> Brief market disruption followed by accelerated growth in suburban areas</li>
                <li><strong>2021-2022:</strong> Rapid appreciation across all neighborhoods due to low inventory and interest rates</li>
                <li><strong>Current:</strong> Stabilizing market with more sustainable growth rates</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-medium mb-3">IAAO Compliance Note</h3>
          <p className="text-sm mb-4">
            This neighborhood trend analysis tool complies with International Association of Assessing Officers (IAAO) standards for mass appraisal and the Uniform Standards of Professional Appraisal Practice (USPAP) guidelines.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Export Data</Button>
            <Button variant="outline" size="sm">Print Report</Button>
            <Button variant="outline" size="sm">Save Analysis</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodTimelineDemo;