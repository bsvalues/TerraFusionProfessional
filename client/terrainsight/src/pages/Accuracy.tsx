import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowUpRight, ArrowDownRight, LineChart } from 'lucide-react';

const AccuracyPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">Valuation Accuracy</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Monitor and analyze the accuracy of property valuations against market data and reference points.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">94.2%</p>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm">+2.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Residential</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">95.7%</p>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm">+1.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Commercial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">92.3%</p>
              <div className="flex items-center text-red-600">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                <span className="text-sm">-0.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-white mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-purple-600" />
            Accuracy Trends (Last 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center border-t">
          <p className="text-muted-foreground">Trend visualization would appear here</p>
        </CardContent>
      </Card>
      
      <h2 className="text-xl font-semibold mt-8 mb-4">Accuracy by Property Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['Single Family', 'Multi-Family', 'Commercial', 'Agricultural', 'Industrial'].map((type) => (
          <Card key={type} className="bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold">{(90 + Math.random() * 8).toFixed(1)}%</p>
                <div className="w-2/3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: `${90 + Math.random() * 8}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccuracyPage;