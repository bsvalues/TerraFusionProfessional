import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CSVImportDialog } from '../import/CSVImportDialog';
import { Download, RefreshCw, Map, FilePlus2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Import for the Search icon
const Search = ({ className, ...props }: React.ComponentProps<typeof Map>) => (
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

interface PropertyDataTableProps {
  className?: string;
}

export function PropertyDataTable({ className }: PropertyDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: properties = [],
    isLoading,
    isError,
    refetch
  } = useQuery<Property[]>({
    queryKey: ['/api/properties'], 
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredProperties = properties.filter((property: Property) => 
    property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.parcelId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredProperties.length / pageSize);
  const paginatedProperties = filteredProperties.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleImportComplete = () => {
    refetch();
  };

  const handleExportCSV = () => {
    if (!properties || properties.length === 0) return;
    
    // Create CSV content
    const headers = ['parcelId', 'address', 'owner', 'value', 'squareFeet', 'yearBuilt', 'propertyType', 'neighborhood'];
    const csvContent = [
      headers.join(','),
      ...filteredProperties.map((property: Property) => 
        headers.map(header => {
          const value = property[header as keyof Property];
          // Quote strings with commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"`
            : value !== null && value !== undefined ? value : '';
        }).join(',')
      )
    ].join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'property_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Property Data</CardTitle>
          <CardDescription>
            An error occurred while loading the properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <div className="text-red-500 mb-4">Failed to load property data</div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Property Data</CardTitle>
        <CardDescription>
          Manage and view all properties in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <CSVImportDialog onImportComplete={handleImportComplete} />
          </div>
        </div>

        {paginatedProperties.length === 0 ? (
          <div className="text-center py-10 border rounded-md">
            <FilePlus2 className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-1">No properties found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Import properties to get started'}
            </p>
            {!searchTerm && (
              <CSVImportDialog 
                trigger={<Button variant="outline">Import Properties</Button>}
                onImportComplete={handleImportComplete}
              />
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcel ID</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Year Built</TableHead>
                    <TableHead>Square Feet</TableHead>
                    <TableHead>Neighborhood</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProperties.map((property: Property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.parcelId}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>{property.owner}</TableCell>
                      <TableCell>
                        {property.propertyType && (
                          <Badge variant="outline">{property.propertyType}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{property.value}</TableCell>
                      <TableCell>{property.yearBuilt}</TableCell>
                      <TableCell>{property.squareFeet}</TableCell>
                      <TableCell>{property.neighborhood}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredProperties.length)} of {filteredProperties.length} properties
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pageCount}
                  onClick={() => setPage(page => Math.min(pageCount, page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}