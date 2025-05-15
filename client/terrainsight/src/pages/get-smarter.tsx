import React from 'react';
import { Brain, Lightbulb, BookOpen, GraduationCap, ArrowRight, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function GetSmarterPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 inline-flex">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get Smarter</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expand your knowledge of property valuation, geospatial analysis, and assessment best practices.
          </p>
        </div>

        {/* Featured Knowledge Card */}
        <Card className="mb-12 border-none shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-gradient-to-br from-primary/80 to-primary p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Featured Topic</h2>
              <h3 className="text-3xl font-bold mb-6">The Impact of Spatial Autocorrelation on Property Values</h3>
              <p className="mb-8 text-white/90">
                Discover how the proximity of properties affects their values and how our platform accounts for this 
                crucial statistical relationship in generating more accurate valuations.
              </p>
              <Button variant="secondary" className="font-medium">
                Read the Guide <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="p-8 bg-gray-50">
              <h4 className="font-semibold text-lg mb-4 text-gray-900">What You'll Learn:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-green-100 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-gray-700">The mathematical foundation of spatial autocorrelation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-green-100 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-gray-700">How Moran's I and Geary's C statistics work</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-green-100 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-gray-700">Practical application in property assessment workflows</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-green-100 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-gray-700">Real-world case studies and success stories</span>
                </li>
              </ul>
              
              <div className="mt-8 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Advanced</Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">20 min read</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Knowledge Categories */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Knowledge Categories</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Fundamentals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-gray-600 mb-4">
                Core principles and foundational knowledge for property assessment and GIS.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Introduction to Spatial Analysis
                </p>
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Property Valuation Basics
                </p>
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  GIS for Beginners
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Browse Fundamentals
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-50">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Advanced Techniques</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-gray-600 mb-4">
                Cutting-edge methodologies for experienced valuation professionals.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Machine Learning in Valuation
                </p>
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Advanced Regression Methods
                </p>
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Spatial Econometrics
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Explore Advanced Topics
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-50">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Case Studies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-gray-600 mb-4">
                Real-world applications and success stories from around the country.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Benton County Success Story
                </p>
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Urban vs. Rural Applications
                </p>
                <p className="text-gray-700 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary mr-1" />
                  Commercial District Analysis
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View Case Studies
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-xl p-8 border shadow text-center mb-16">
          <h2 className="text-2xl font-bold mb-4">Ready to dive deeper?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Access our comprehensive library of tutorials, webinars, and interactive courses to 
            master the art and science of geospatial property valuation.
          </p>
          <Button size="lg">
            Browse Full Library <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <Separator className="mb-8" />
        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 Benton County Assessment & Valuation</p>
          <p className="mt-1">Content updated regularly with the latest research and best practices.</p>
        </div>
      </div>
    </div>
  );
}