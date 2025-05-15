/**
 * Home Page
 * 
 * This is the main landing page for the TerraInsight application.
 * Provides access to key features and serves as the entry point for users.
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Database, 
  Map, 
  LineChart, 
  Settings, 
  Search, 
  ArrowRight, 
  Presentation, 
  Map as MapIcon, 
  BarChart2,
  BrainCog,
  HelpCircle,
  MapPin
} from 'lucide-react';
import { AIAssistantDialog } from '@/components/agent/AIAssistantDialog';
import { Separator } from '@/components/ui/separator';

export function HomePage() {
  return (
    <div className="container mx-auto py-6 px-4 md:py-10">
        {/* Hero section */}
        <section className="py-10 mb-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-6">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Benton County, Washington</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                Property Assessment Platform
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Advanced geospatial analytics for property valuation and assessment with precision and insight.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/properties">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/map">View Map</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <MapPin className="h-12 w-12" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '14,500+', label: 'Properties' },
                  { value: '5 Years', label: 'Historical Data' },
                  { value: '98.2%', label: 'Accuracy' },
                  { value: '50+', label: 'Data Layers' }
                ].map((stat, index) => (
                  <div key={index} className="bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Assistant section */}
        <section className="mb-16">
          <div className="bg-accent rounded-xl p-6 border shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">AI Assessment Assistant</h2>
                <p className="text-muted-foreground">
                  Get instant help with property assessment questions, data analysis, and platform navigation.
                </p>
              </div>
              <div className="w-full md:w-auto max-w-lg">
                <AIAssistantDialog initialContext="User is viewing the TerraInsight home page for Benton County Property Assessment Platform." />
              </div>
            </div>
          </div>
        </section>

        {/* Main features section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Main Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="mr-2 h-5 w-5 text-primary" />
                  Property Mapping
                </CardTitle>
                <CardDescription>
                  Interactive geospatial property visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore property locations, boundaries, and attributes using our interactive mapping tools.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/map">Open Map</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                  Valuation Analytics
                </CardTitle>
                <CardDescription>
                  Property value trends and comparisons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analyze property value trends, compare properties, and generate valuation reports.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/analysis">View Analytics</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
                  Dashboard
                </CardTitle>
                <CardDescription>
                  Overview of key metrics and indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View summary statistics, recent activity, and important property assessment metrics.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Open Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        
        {/* Additional features section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Additional Tools</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/demos">
                View All Tools
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Search className="mr-2 h-4 w-4 text-primary" />
                  Property Explorer
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Search and view detailed property information with our enhanced interface.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/properties">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Presentation className="mr-2 h-4 w-4 text-primary" />
                  Demonstrations
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Guided demonstrations of the platform for presentations and stakeholders.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/demos">
                    View Demos
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <BrainCog className="mr-2 h-4 w-4 text-primary" />
                  AI Playground
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Test and refine AI-powered property valuation and analysis models.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/scripting">
                    Open AI Tools
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Database className="mr-2 h-4 w-4 text-primary" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Tools for importing, managing, and exporting property data records.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/data">
                    Manage Data
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        
        {/* Footer section */}
        <Separator />
        <footer className="py-6 text-center text-sm text-muted-foreground">
          <p>TerraInsight - Benton County Property Assessment Platform</p>
          <p className="mt-1">© 2025 Benton County Assessor's Office. All rights reserved.</p>
        </footer>
      </div>
  );
}

export default HomePage;