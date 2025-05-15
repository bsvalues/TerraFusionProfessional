import React from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const FeatureDetail: React.FC = () => {
  // Extract feature ID from the URL
  const [, params] = useRoute('/features/:id');
  const featureId = params?.id || '1';
  
  // Sample features data - in a real app, this would come from an API
  const features = {
    '1': {
      id: '1',
      title: 'Advanced Property Comparison',
      description: 'Compare multiple properties with detailed side-by-side analysis across dozens of factors.',
      screenshot: '/assets/comparison-screenshot.png',
      details: 'The Advanced Property Comparison tool allows assessors to select multiple properties and generate comprehensive side-by-side analyses. This feature helps identify outliers, ensure fairness in assessments, and validate the accuracy of data. Users can compare properties based on value history, features, income potential, and geographic characteristics.',
      releaseDate: 'June 15, 2025',
      benefits: [
        'Compare up to 10 properties simultaneously',
        'Visualize differences with interactive charts',
        'Identify outliers and discrepancies quickly',
        'Export comparison data to Excel or PDF'
      ]
    },
    '2': {
      id: '2',
      title: 'AI-Powered Valuation Suggestions',
      description: 'Get intelligent property valuation suggestions based on comparable properties and market data.',
      screenshot: '/assets/ai-valuation-screenshot.png',
      details: 'The AI-Powered Valuation Suggestions feature uses machine learning algorithms to analyze property characteristics, recent sales, and market trends to suggest accurate valuations. This tool assists assessors in making informed decisions and provides supporting evidence for valuations.',
      releaseDate: 'July 8, 2025',
      benefits: [
        'Receive AI-generated valuation suggestions',
        'View confidence scores for each suggestion',
        'Understand the factors influencing valuations',
        'Compare with historical assessments'
      ]
    },
    '3': {
      id: '3',
      title: 'Real-Time Market Integration',
      description: 'Connect to real-time market data sources to keep property valuations current and accurate.',
      screenshot: '/assets/market-data-screenshot.png',
      details: 'The Real-Time Market Integration feature connects your assessment data with live market feeds, ensuring your valuations reflect current market conditions. This integration enables automatic flagging of properties that may need reassessment based on significant market changes.',
      releaseDate: 'August 22, 2025',
      benefits: [
        'Connect to multiple market data sources',
        'Set up alerts for significant market changes',
        'Automatically identify properties for reassessment',
        'Generate market trend reports'
      ]
    }
  };
  
  // Get the feature data for the current ID
  const feature = features[featureId as keyof typeof features] || features['1'];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">New Feature</h1>
      </div>
      
      <Card className="bg-white border-t-4 border-t-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{feature.title}</CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              NEW
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{feature.description}</p>
          
          <div className="border rounded-md p-4 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">Feature screenshot would appear here</p>
          </div>
          
          <h3 className="text-lg font-semibold mt-4">About This Feature</h3>
          <p>{feature.details}</p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
            <h4 className="font-medium text-blue-800 mb-2">Key Benefits</h4>
            <ul className="space-y-2">
              {feature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div>
              <p className="text-sm text-gray-500">Release Date</p>
              <p className="font-medium">{feature.releaseDate}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">Learn More</Button>
              <Button className="flex items-center">
                Try Now <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-xl font-semibold mt-8">Other New Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(features)
          .filter(f => f.id !== featureId)
          .map(otherFeature => (
            <Card key={otherFeature.id} className="bg-white hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-70"></div>
              <CardHeader className="pb-2 pl-6">
                <CardTitle className="text-base">{otherFeature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pl-6">
                <p className="text-sm text-gray-600 mb-4">{otherFeature.description}</p>
                <Button 
                  variant="link" 
                  className="flex items-center p-0 text-blue-600"
                  onClick={() => window.location.href = `/features/${otherFeature.id}`}
                >
                  <span className="mr-1">View Details</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default FeatureDetail;