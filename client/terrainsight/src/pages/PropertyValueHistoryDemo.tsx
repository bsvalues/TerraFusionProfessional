import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PropertyValueHistoryDemo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Property Value History Demo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Simple Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a simple test to see if the page renders correctly.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyValueHistoryDemo;