import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UpdatesPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Recent Property Updates</h1>
      <p className="text-muted-foreground">View and manage recent updates to property data.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample update cards */}
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <Card key={id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Update #{id}</CardTitle>
              <CardDescription className="text-xs">
                Updated {Math.floor(Math.random() * 24) + 1} hours ago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Property data was updated with new assessment values, structural changes, or ownership information.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UpdatesPage;