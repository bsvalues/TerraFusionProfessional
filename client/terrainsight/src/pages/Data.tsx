import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileDown, Upload, FileText, Table, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyDataTable } from "../components/data/PropertyDataTable";
import { CSVImportDialog } from "../components/import/CSVImportDialog";

const DataPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Property Data</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage, import, and export property datasets</p>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <CSVImportDialog 
            trigger={
              <Button size="sm" variant="outline" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                <span>Import</span>
              </Button>
            } 
          />
          <Button size="sm" variant="outline" className="flex items-center">
            <FileDown className="h-4 w-4 mr-2" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="datasets" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 min-w-[300px] sm:max-w-[500px]">
            <TabsTrigger value="datasets" className="flex items-center justify-center sm:justify-start py-2">
              <Database className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Datasets</span>
            </TabsTrigger>
            <TabsTrigger value="imports" className="flex items-center justify-center sm:justify-start py-2">
              <FileText className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Import History</span>
            </TabsTrigger>
            <TabsTrigger value="queries" className="flex items-center justify-center sm:justify-start py-2">
              <Table className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Saved Queries</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="datasets" className="space-y-4">
          <PropertyDataTable className="w-full" />
        </TabsContent>
        
        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                Recent data import activities and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] sm:h-[500px] rounded-md">
                <div className="space-y-4">
                  {[
                    {
                      filename: "benton_county_new_constructions.csv",
                      date: "April 1, 2024",
                      records: "156",
                      status: "Completed",
                      user: "John Admin"
                    },
                    {
                      filename: "hotel_motel_income_statements.xlsx",
                      date: "March 15, 2024",
                      records: "28",
                      status: "Completed",
                      user: "Jane Analyst"
                    },
                    {
                      filename: "commercial_lease_data_q1_2024.csv",
                      date: "March 8, 2024",
                      records: "412",
                      status: "Completed",
                      user: "John Admin"
                    },
                    {
                      filename: "residential_sales_feb2024.xlsx",
                      date: "March 1, 2024",
                      records: "187",
                      status: "Completed",
                      user: "Sarah Manager"
                    }
                  ].map((import_item, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">{import_item.filename}</h3>
                            <Badge variant={import_item.status === "Completed" ? "default" : "secondary"} className="ml-2">
                              {import_item.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row mt-2 text-xs text-muted-foreground gap-2 sm:gap-4">
                            <div>
                              <span className="font-medium">Date:</span> {import_item.date}
                            </div>
                            <div>
                              <span className="font-medium">Records:</span> {import_item.records}
                            </div>
                            <div>
                              <span className="font-medium">User:</span> {import_item.user}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <Button size="sm" variant="ghost">Details</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Saved Queries</CardTitle>
              <CardDescription>
                Reusable database queries and data filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-medium">Hotel Properties Value &gt; $1M</h3>
                      <p className="text-sm text-muted-foreground mt-1">Hotels and motels with assessed value greater than $1 million</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">Hotel/Motel</Badge>
                        <Badge variant="outline" className="text-xs">Value &gt; $1M</Badge>
                        <Badge variant="outline" className="text-xs">Commercial</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <Button size="sm" variant="ghost">Edit</Button>
                      <Button size="sm" variant="ghost">Run</Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-medium">Recent Residential Sales</h3>
                      <p className="text-sm text-muted-foreground mt-1">Residential properties sold in the last 90 days</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">Residential</Badge>
                        <Badge variant="outline" className="text-xs">Sales</Badge>
                        <Badge variant="outline" className="text-xs">Last 90 Days</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <Button size="sm" variant="ghost">Edit</Button>
                      <Button size="sm" variant="ghost">Run</Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-medium">Downtown Commercial Properties</h3>
                      <p className="text-sm text-muted-foreground mt-1">All commercial properties in downtown district</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">Commercial</Badge>
                        <Badge variant="outline" className="text-xs">Downtown</Badge>
                        <Badge variant="outline" className="text-xs">All Types</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <Button size="sm" variant="ghost">Edit</Button>
                      <Button size="sm" variant="ghost">Run</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Create New Query</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Import for the Search icon
const Search = ({ className, ...props }: React.ComponentProps<typeof Database>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default DataPage;