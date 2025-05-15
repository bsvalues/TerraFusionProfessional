import React, { useState, useEffect } from 'react';
import {
  Database,
  CloudOff,
  RefreshCw,
  Check,
  Info,
  ArrowDown,
  Filter,
  Save,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Property } from '@shared/schema';
import { 
  PropertyConflict,
  FieldConflict,
  propertyReconciliationService,
  PropertyReconciliationOptions
} from '@/services/etl/property/PropertyReconciliationService';
import { internalDatabaseConnector } from '@/services/etl/property/InternalDatabaseConnector';
import { countyGISConnector } from '@/services/etl/property/CountyGISConnector';
import { zillowAPIConnector } from '@/services/etl/property/ZillowAPIConnector';
import { csvDataConnector } from '@/services/etl/property/CSVDataConnector';
import { PropertyReconciliationPanel } from '@/components/property/PropertyReconciliationPanel';

const PropertyDataSourcesPage: React.FC = () => {
  // State for data source properties
  const [propertiesBySource, setPropertiesBySource] = useState<{ [sourceId: string]: Property[] }>({});
  // State for conflicts
  const [conflicts, setConflicts] = useState<PropertyConflict[]>([]);
  // State for merged properties
  const [mergedProperties, setMergedProperties] = useState<Property[]>([]);
  // State for loading status
  const [loading, setLoading] = useState<boolean>(false);
  // State for selected reconciliation options
  const [reconciliationOptions, setReconciliationOptions] = useState<PropertyReconciliationOptions>({
    defaultSourcePriority: ['county', 'internal', 'zillow'],
    fieldPriorities: {
      value: { sourcePriority: ['county'] },
      yearBuilt: { sourcePriority: ['internal', 'county'] },
      squareFeet: { highest: true }
    }
  });

  // Register data connectors on component mount
  useEffect(() => {
    // Register data connectors with the reconciliation service
    propertyReconciliationService.registerDataConnector(internalDatabaseConnector);
    propertyReconciliationService.registerDataConnector(countyGISConnector);
    propertyReconciliationService.registerDataConnector(zillowAPIConnector);
    propertyReconciliationService.registerDataConnector(csvDataConnector);

    // Since we don't have real data from the connectors yet, let's create some sample data
    const mockData: { [sourceId: string]: Property[] } = {
      internal: [
        {
          id: 1,
          parcelId: 'APN12345',
          address: '123 Main St',
          owner: 'John Smith',
          value: '$450,000',
          salePrice: null,
          squareFeet: 2200,
          yearBuilt: 1998,
          landValue: null,
          coordinates: null,
          latitude: "46.2807",
          longitude: "-119.2753",
          neighborhood: null,
          propertyType: null,
          bedrooms: null,
          bathrooms: null,
          lotSize: null,
          zoning: 'Residential',
          lastSaleDate: null,
          taxAssessment: '$350,000',
          pricePerSqFt: null,
          attributes: null,
          sourceId: 'internal',
          zillowId: null
        },
        {
          id: 2,
          parcelId: 'APN54321',
          address: '456 Oak Ave',
          owner: 'Jane Doe', 
          value: '$525,000',
          salePrice: null,
          squareFeet: 2500,
          yearBuilt: 2005,
          landValue: null,
          coordinates: null,
          latitude: "46.2765",
          longitude: "-119.2791",
          neighborhood: null,
          propertyType: null,
          bedrooms: null,
          bathrooms: null,
          lotSize: null,
          zoning: 'Residential',
          lastSaleDate: null,
          taxAssessment: '$450,000',
          pricePerSqFt: null,
          attributes: null,
          sourceId: 'internal',
          zillowId: null
        }
      ],
      county: [
        {
          id: 101,
          parcelId: 'APN12345',
          address: '123 Main Street',  // Slightly different address format
          owner: 'John A. Smith', // More complete name
          value: '$475,000', // Higher value
          salePrice: null,
          squareFeet: 2180, // Slightly different size
          yearBuilt: 1997, // Different year
          landValue: null,
          coordinates: null,
          latitude: "46.2807",
          longitude: "-119.2753",
          neighborhood: null,
          propertyType: null,
          bedrooms: null,
          bathrooms: null,
          lotSize: null,
          zoning: 'R-1',  // Different format
          lastSaleDate: null,
          taxAssessment: '$375,000',
          pricePerSqFt: null,
          attributes: null,
          sourceId: 'county',
          zillowId: null
        },
        {
          id: 102,
          parcelId: 'APN54321',
          address: '456 Oak Avenue', // Slightly different address format
          owner: 'Jane Doe',
          value: '$520,000', // Different value
          salePrice: null,
          squareFeet: 2510, // Slightly different size
          yearBuilt: 2005,
          landValue: null,
          coordinates: null,
          latitude: "46.2765",
          longitude: "-119.2791",
          neighborhood: null,
          propertyType: null,
          bedrooms: null,
          bathrooms: null,
          lotSize: null,
          zoning: 'R-1', // Different format
          lastSaleDate: null,
          taxAssessment: '$440,000',
          pricePerSqFt: null,
          attributes: null,
          sourceId: 'county',
          zillowId: null
        }
      ],
      zillow: [
        {
          id: 201,
          parcelId: 'APN12345',
          address: '123 Main St',
          owner: 'J. Smith', // Abbreviated name
          value: '$490,000', // Zillow estimate higher
          salePrice: null,
          squareFeet: 2250, // Different size
          yearBuilt: 1998,
          landValue: null,
          coordinates: null,
          latitude: "46.2807", 
          longitude: "-119.2753",
          neighborhood: null,
          propertyType: null,
          bedrooms: null,
          bathrooms: null,
          lotSize: null,
          zoning: 'Residential',
          lastSaleDate: null,
          taxAssessment: '$350,000',
          pricePerSqFt: null,
          attributes: null,
          sourceId: 'zillow',
          zillowId: 'Z-12345'
        }
      ]
    };

    setPropertiesBySource(mockData);

    // Find conflicts in the mock data
    const mockConflicts = propertyReconciliationService.findConflicts(mockData, reconciliationOptions);
    setConflicts(mockConflicts);

    // Generate merged properties
    const mockMerged = propertyReconciliationService.mergeProperties(
      mockConflicts.filter(c => c.conflicts.every(fc => fc.resolved)),
      reconciliationOptions
    );
    setMergedProperties(mockMerged);
  }, []);

  // Handler for when a conflict field is resolved
  const handleResolveField = (
    conflictIndex: number,
    fieldName: string,
    value: unknown,
    sourceId: string
  ) => {
    // Update the conflict in state
    const updatedConflicts = [...conflicts];
    const updatedConflict = propertyReconciliationService.resolveConflictField(
      conflicts[conflictIndex],
      fieldName,
      value,
      sourceId
    );
    updatedConflicts[conflictIndex] = updatedConflict;
    setConflicts(updatedConflicts);

    // Re-generate merged properties
    const newMergedProperties = propertyReconciliationService.mergeProperties(
      updatedConflicts.filter(c => c.conflicts.every(fc => fc.resolved)),
      reconciliationOptions
    );
    setMergedProperties(newMergedProperties);
  };

  // Handler for resolving all fields from a particular source
  const handleResolveAll = (conflictIndex: number, sourceId: string) => {
    const conflict = conflicts[conflictIndex];
    const updatedConflict = { ...conflict };
    
    // Set all field conflicts to resolved with the chosen source
    updatedConflict.conflicts = updatedConflict.conflicts.map((fc: FieldConflict) => {
      const valueFromSource = fc.values.find((v: { value: unknown; sourceId: string }) => v.sourceId === sourceId);
      if (valueFromSource) {
        return {
          ...fc,
          resolved: true,
          selectedValue: valueFromSource.value,
          selectedSourceId: sourceId
        };
      }
      return fc;
    });
    
    // Update conflicts state
    const updatedConflicts = [...conflicts];
    updatedConflicts[conflictIndex] = updatedConflict;
    setConflicts(updatedConflicts);
    
    // Re-generate merged properties
    const newMergedProperties = propertyReconciliationService.mergeProperties(
      updatedConflicts.filter(c => c.conflicts.every(fc => fc.resolved)),
      reconciliationOptions
    );
    setMergedProperties(newMergedProperties);
  };

  // Count properties by source
  const countBySource: Record<string, number> = Object.entries(propertiesBySource)
    .reduce((acc, [sourceId, properties]) => {
      acc[sourceId] = properties.length;
      return acc;
    }, {} as Record<string, number>);
  
  // Count total properties
  const totalProperties = Object.values(countBySource).reduce((sum, count) => sum + count, 0);
  
  // Count total conflicts
  const totalConflicts = conflicts.length;
  
  // Count resolved conflicts
  const resolvedConflicts = conflicts.filter(c => c.conflicts.every(fc => fc.resolved)).length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="border-b bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Property Data Sources</h1>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium flex items-center gap-1.5"
              onClick={() => {
                setLoading(true);
                // In a real implementation, this would fetch fresh data from all connectors
                setTimeout(() => {
                  setLoading(false);
                }, 1000);
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium flex items-center gap-1.5"
              onClick={() => {
                // In a real implementation, this would save the merged properties
                alert(`Saved ${mergedProperties.length} merged properties`);
              }}
              disabled={mergedProperties.length === 0}
            >
              <Save className="h-4 w-4" />
              Save Merged
            </button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-center">
            <div className="mr-3 bg-blue-100 text-blue-600 p-2 rounded-md">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-blue-700">Total Properties</h3>
              <p className="text-xl font-bold text-blue-800">{totalProperties}</p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-center">
            <div className="mr-3 bg-green-100 text-green-600 p-2 rounded-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-green-700">Data Sources</h3>
              <p className="text-xl font-bold text-green-800">{Object.keys(propertiesBySource).length}</p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-md p-3 flex items-center">
            <div className="mr-3 bg-amber-100 text-amber-600 p-2 rounded-md">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-amber-700">Conflicts</h3>
              <p className="text-xl font-bold text-amber-800">{totalConflicts}</p>
            </div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 flex items-center">
            <div className="mr-3 bg-indigo-100 text-indigo-600 p-2 rounded-md">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-indigo-700">Resolved</h3>
              <p className="text-xl font-bold text-indigo-800">{resolvedConflicts} / {totalConflicts}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-grow">
        <div className="col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
              Property Conflicts ({conflicts.length})
            </h2>
            
            {conflicts.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center text-gray-500">
                No conflicts detected between data sources
              </div>
            ) : (
              <div className="space-y-4">
                {conflicts.map((conflict: PropertyConflict, index: number) => (
                  <PropertyReconciliationPanel
                    key={`conflict-${index}`}
                    conflict={conflict}
                    onResolve={(fieldName, value, sourceId) => 
                      handleResolveField(index, fieldName, value, sourceId)}
                    onResolveAll={(sourceId) => handleResolveAll(index, sourceId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Data Sources
            </h2>
            
            <div className="space-y-3">
              {Object.entries(propertiesBySource).map(([sourceId, properties]) => {
                // Get connector metadata
                const connector = propertyReconciliationService.getDataConnector(sourceId);
                const metadata = connector?.metadata;
                
                return (
                  <div key={sourceId} className="border rounded-md">
                    <div className={`p-3 flex justify-between items-center ${
                      metadata?.status === 'active' 
                        ? 'bg-green-50' 
                        : metadata?.status === 'error' 
                          ? 'bg-red-50' 
                          : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-3 ${
                          metadata?.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : metadata?.status === 'error' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {metadata?.status === 'active' ? (
                            <Database className="h-5 w-5" />
                          ) : (
                            <CloudOff className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{metadata?.name || sourceId}</h3>
                          <p className="text-sm text-gray-500">{metadata?.description || ''}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        {properties.length} properties
                      </div>
                    </div>
                    
                    {metadata?.status === 'error' && metadata.error && (
                      <div className="p-3 bg-red-50 text-red-700 text-sm border-t">
                        Error: {metadata.error}
                      </div>
                    )}
                    
                    <div className="p-3 border-t">
                      <div className="text-sm text-gray-500 flex items-center justify-between">
                        <span>Last updated: {metadata?.lastUpdated.toLocaleString() || 'Unknown'}</span>
                        <button 
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          onClick={() => {
                            // In a real implementation, this would refresh this specific source
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-indigo-500" />
              Reconciliation Options
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Source Priority
                </label>
                <div className="flex flex-col space-y-2">
                  {reconciliationOptions.defaultSourcePriority?.map((sourceId: string, index: number) => (
                    <div key={`priority-${sourceId}`} className="flex items-center">
                      <div className="w-8 text-center text-gray-500">{index + 1}.</div>
                      <div className="flex-grow border rounded-md p-2 bg-gray-50">
                        <div className="text-sm font-medium">
                          {propertyReconciliationService.getDataConnector(sourceId)?.metadata.name || sourceId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field-Specific Priorities
                </label>
                <div className="space-y-2">
                  {Object.entries(reconciliationOptions.fieldPriorities || {}).map(([field, priority]) => (
                    <div key={`field-${field}`} className="border rounded-md p-3">
                      <div className="font-medium mb-1 text-gray-800">
                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {priority.sourcePriority && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Source order:</span>
                            <span className="flex-grow">
                              {priority.sourcePriority.map((s: string) => 
                                propertyReconciliationService.getDataConnector(s)?.metadata.name || s
                              ).join(' > ')}
                            </span>
                          </div>
                        )}
                        
                        {priority.highest && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Strategy:</span>
                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-md text-xs font-medium">
                              Highest value
                            </span>
                          </div>
                        )}
                        
                        {priority.lowest && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Strategy:</span>
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-medium">
                              Lowest value
                            </span>
                          </div>
                        )}
                        
                        {priority.newest && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Strategy:</span>
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-xs font-medium">
                              Newest data
                            </span>
                          </div>
                        )}
                        
                        {priority.mostComplete && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Strategy:</span>
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-medium">
                              Most complete
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reconciliationOptions.forceMerge || false}
                    onChange={(e) => {
                      setReconciliationOptions({
                        ...reconciliationOptions,
                        forceMerge: e.target.checked
                      });
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Force merge unresolved conflicts</span>
                </label>
                <button
                  className="ml-1 text-gray-400 hover:text-gray-600"
                  title="When enabled, unresolved conflicts will use the first source's value"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {mergedProperties.length > 0 && (
            <div className="bg-white p-4 rounded-md border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-green-500" />
                Merged Properties ({mergedProperties.length})
              </h2>
              
              <div className="space-y-2">
                {mergedProperties.map((property: Property, index: number) => (
                  <div key={`merged-${index}`} className="border rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{property.address}</h3>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        Merged
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Parcel ID: <span className="font-mono">{property.parcelId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDataSourcesPage;