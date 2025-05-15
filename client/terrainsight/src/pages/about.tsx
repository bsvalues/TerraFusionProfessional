import React from 'react';
import { LucideMap, Info, Database, ArrowRight, Users, Building, BriefcaseBusiness } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-primary/10 inline-flex">
              <LucideMap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About <span className="module-lockup module-insight">
            <span className="prefix">Terra</span><span className="name">Insight</span>
          </span></h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced geospatial analysis for accurate property valuation in Benton County, Washington.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 border-none shadow-lg">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Our Mission</CardTitle>
            <CardDescription>Why we built this platform</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-6">
            <p className="text-gray-700 leading-relaxed mb-6">
              <span className="module-lockup module-insight"><span className="prefix">Terra</span><span className="name">Insight</span></span> 
              (Territorial Insights System) was developed to 
              revolutionize property valuation by integrating cutting-edge spatial analysis with 
              traditional appraisal methodologies. Our platform empowers assessors, real estate 
              professionals, and county officials with data-driven insights to ensure fair and 
              accurate property assessments.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By leveraging advanced geospatial technologies, machine learning algorithms, and 
              comprehensive property data, we provide unparalleled accuracy in property valuation 
              while reducing assessment time and increasing transparency for property owners.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Spatial Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Interactive mapping with advanced spatial algorithms to identify location-based 
                value drivers and neighborhood patterns.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-50">
                  <BriefcaseBusiness className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Predictive Modeling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-powered valuation models that account for spatial relationships, market trends,
                and property characteristics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-50">
                  <Building className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Property Comparison</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced comparables selection with adjustment calculations based on 
                location, features, and market conditions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-50">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-lg">User Accessibility</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Designed for users of all technical levels with features like high-contrast mode,
                keyboard navigation, and screen reader support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <Link href="/dashboard">
            <Button className="px-6" size="lg">
              Explore the Platform <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-16">
          <p>© 2025 Benton County Assessment & Valuation</p>
          <p className="mt-1"><span className="module-lockup module-insight"><span className="prefix">Terra</span><span className="name">Insight</span></span> is an advanced geospatial platform for property valuation.</p>
        </div>
      </div>
    </div>
  );
}