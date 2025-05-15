import React, { useState } from 'react';
import { GISDataManager } from '@/components/gis/GISDataManager';
import { MapViewer } from '@/components/gis/MapViewer';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Map, Layers, Database, FileText } from 'lucide-react';
import Header from '@/components/Header';

export default function GISDataPage() {
  const [taxYear, setTaxYear] = useState('2025');
  
  return (
    <>
      <Header taxYear={taxYear} onTaxYearChange={setTaxYear} />
      <Container className="py-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Geospatial Data Management</h1>
            <p className="text-muted-foreground mt-2">
              Access, download, and manage Benton County geospatial datasets for property analysis
            </p>
          </div>
          
          <Tabs defaultValue="datasets" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="datasets" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                GIS Datasets
              </TabsTrigger>
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Map Viewer
              </TabsTrigger>
              <TabsTrigger value="integration" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Integration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="datasets">
              <GISDataManager />
            </TabsContent>
            
            <TabsContent value="viewer">
              <MapViewer />
            </TabsContent>
            
            <TabsContent value="integration">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Integration Tools
                  </CardTitle>
                  <CardDescription>
                    Tools for integrating GIS data with property appraisal workflows
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6">
                  <div className="bg-muted/50 p-8 rounded-md text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Integration Tools Coming Soon</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Tools for integrating GIS data with property appraisal workflows are
                      under development. These will include data conversion utilities,
                      property matching algorithms, and spatial analysis tools.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </>
  );
}