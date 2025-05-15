import React from 'react';
import { ProjectTracker } from '@/components/ProjectTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Home } from 'lucide-react';
import { Link } from 'wouter';

/**
 * Project Tracker Page
 * Displays the project progress tracking dashboard
 */
export function ProjectTrackerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Tracker</h1>
          <p className="text-muted-foreground">
            Track the progress of the GeospatialAnalyzerBS ETL system implementation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/etl">
              <Home className="h-4 w-4 mr-1" />
              ETL Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Basic information about the GeospatialAnalyzerBS ETL system project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Project Name</h3>
                <p className="font-medium">GeospatialAnalyzerBS ETL System</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Start Date</h3>
                <p className="font-medium">April 1, 2023</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <p className="font-medium">In Development</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Development Team</h3>
                <p className="font-medium">Replit AI</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Target Completion</h3>
                <p className="font-medium">July 1, 2023</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Repository</h3>
                <p className="font-medium">GitHub: GeospatialAnalyzerBS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Project Tracker Component */}
        <ProjectTracker />
        
        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Project Resources</CardTitle>
            <CardDescription>
              Helpful resources and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Technical Documentation</h3>
                <ul className="list-disc pl-5 text-sm">
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">ETL Architecture Guide</a></li>
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">Data Schema Documentation</a></li>
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">API References</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">User Guides</h3>
                <ul className="list-disc pl-5 text-sm">
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">ETL System User Guide</a></li>
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">Dashboard Tutorial</a></li>
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">Data Quality Monitoring</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Support Resources</h3>
                <ul className="list-disc pl-5 text-sm">
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">GitHub Issues</a></li>
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">Development Roadmap</a></li>
                  <li className="mt-1"><a href="#" className="text-blue-600 hover:underline">Contact Development Team</a></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}