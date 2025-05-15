import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  ClipboardCopy, 
  Share2, 
  Clock, 
  Filter, 
  BarChart, 
  TableProperties, 
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ReportsPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Generate and manage property valuation reports</p>
        </div>
        
        <div className="flex mt-4 sm:mt-0">
          <Button>Create New Report</Button>
        </div>
      </div>
      
      <Tabs defaultValue="available" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 min-w-[300px] sm:max-w-[400px]">
            <TabsTrigger value="available" className="flex items-center justify-center sm:justify-start py-2">
              <FileText className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Available</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center justify-center sm:justify-start py-2">
              <Clock className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Recent</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center justify-center sm:justify-start py-2">
              <TableProperties className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Templates</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <CardTitle>Available Reports</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="valuation">Valuation</SelectItem>
                      <SelectItem value="market">Market Analysis</SelectItem>
                      <SelectItem value="tax">Tax Assessment</SelectItem>

                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] rounded-md">
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      title: "Annual Property Valuation Report 2024",
                      description: "Comprehensive property valuation report for 2024 tax year",
                      type: "Valuation",
                      date: "April 1, 2024",
                      author: "System Generated",
                      format: "PDF"
                    },
                    {
                      id: 2,
                      title: "Quarterly Market Analysis Q1 2024",
                      description: "First quarter market analysis for all property types",
                      type: "Market Analysis",
                      date: "March 31, 2024",
                      author: "Jane Analyst",
                      format: "PDF/Excel"
                    },
                    {
                      id: 3,
                      title: "Benton County Tax Assessment Report",
                      description: "Tax assessment report for all properties in Benton County",
                      type: "Tax Assessment",
                      date: "March 15, 2024",
                      author: "County Assessor",
                      format: "PDF"
                    },
                    {
                      id: 4,
                      title: "Commercial Property Valuation",
                      description: "Valuation report for all commercial properties",
                      type: "Valuation",
                      date: "March 10, 2024",
                      author: "John Admin",
                      format: "PDF/Excel"
                    },

                    {
                      id: 6,
                      title: "Residential Market Trends",
                      description: "Trend analysis for residential properties over past 5 years",
                      type: "Market Analysis",
                      date: "February 28, 2024",
                      author: "Jane Analyst",
                      format: "PDF/PowerPoint"
                    }
                  ].map((report) => (
                    <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-48 h-32 bg-slate-100 relative flex-shrink-0 flex items-center justify-center">
                          {report.format.includes("Excel") ? (
                            <FileSpreadsheet className="h-12 w-12 text-green-500" />
                          ) : report.format.includes("PowerPoint") ? (
                            <BarChart className="h-12 w-12 text-orange-500" />
                          ) : (
                            <FileText className="h-12 w-12 text-blue-500" />
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary">
                              {report.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 flex-grow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="font-medium">{report.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {report.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col sm:flex-row text-sm text-muted-foreground gap-2 sm:gap-4">
                            <div>
                              <span className="font-medium">Date:</span> {report.date}
                            </div>
                            <div>
                              <span className="font-medium">Author:</span> {report.author}
                            </div>
                            <div>
                              <span className="font-medium">Format:</span> {report.format}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 justify-end">
                            <Button size="sm" variant="outline" className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              <span>Email</span>
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center">
                              <Printer className="h-4 w-4 mr-1" />
                              <span>Print</span>
                            </Button>
                            <Button size="sm" className="flex items-center">
                              <Download className="h-4 w-4 mr-1" />
                              <span>Download</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recently Accessed Reports</CardTitle>
              <CardDescription>
                Reports you have recently viewed or downloaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-md">
                <div className="space-y-4">
                  {[

                    {
                      title: "Quarterly Market Analysis Q1 2024",
                      accessedDate: "March 31, 2024, 2:45 PM",
                      action: "Viewed"
                    },
                    {
                      title: "Commercial Property Valuation",
                      accessedDate: "March 30, 2024, 9:15 AM",
                      action: "Printed"
                    },
                    {
                      title: "Residential Market Trends",
                      accessedDate: "March 29, 2024, 4:30 PM",
                      action: "Emailed"
                    }
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground">{report.accessedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline">{report.action}</Badge>
                        <Button size="sm" variant="ghost" className="ml-2">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Standard report templates for various property types and analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Valuation Summary</CardTitle>
                      <TableProperties className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>
                      Property valuation summary report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Comprehensive property valuation report with cost and sales comparison approaches.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button size="sm" className="w-full">Use Template</Button>
                  </CardFooter>
                </Card>
                
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Market Analysis</CardTitle>
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>
                      Property market analysis report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Detailed market analysis with trends, comparable properties, and market condition adjustments.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button size="sm" className="w-full">Use Template</Button>
                  </CardFooter>
                </Card>
                
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Tax Assessment</CardTitle>
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>
                      Property tax assessment report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Comprehensive tax assessment report with valuation summary and tax implications.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button size="sm" className="w-full">Use Template</Button>
                  </CardFooter>
                </Card>
                
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Property Comparison</CardTitle>
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>
                      Comparable property analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Side-by-side comparison of similar properties with adjustment analysis and final reconciliation.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button size="sm" className="w-full">Use Template</Button>
                  </CardFooter>
                </Card>
                
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Trend Analysis</CardTitle>
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>
                      Property value trend analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Detailed trend analysis showing property value changes over time with visualizations and projections.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button size="sm" className="w-full">Use Template</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;