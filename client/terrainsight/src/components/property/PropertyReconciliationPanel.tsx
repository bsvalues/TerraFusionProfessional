import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Database, Edit } from 'lucide-react';
import { PropertyConflict, FieldConflict } from '@/services/etl/property/PropertyReconciliationService';
import { propertyReconciliationService } from '@/services/etl/property/PropertyReconciliationService';

interface PropertyReconciliationPanelProps {
  conflict: PropertyConflict;
  onResolve: (fieldName: string, value: unknown, sourceId: string) => void;
  onResolveAll: (sourceId: string) => void;
}

export function PropertyReconciliationPanel({
  conflict,
  onResolve,
  onResolveAll
}: PropertyReconciliationPanelProps) {
  const [expanded, setExpanded] = useState(true);
  
  // Get the property address for display
  const parcelId = conflict.parcelId;
  
  // Calculate number of resolved conflicts
  const resolvedCount = conflict.conflicts.filter(c => c.resolved).length;
  const totalConflicts = conflict.conflicts.length;
  
  // Helper to format field names
  const formatFieldName = (fieldName: string) => {
    return fieldName
      // Add spaces before capital letters and capitalize first letter
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  // Helper to get a source name from its ID
  const getSourceName = (sourceId: string) => {
    const connector = propertyReconciliationService.getDataConnector(sourceId);
    return connector?.metadata.name || sourceId;
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Header */}
      <div 
        className={`p-3 ${expanded ? 'border-b' : ''} flex justify-between bg-gray-50 cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className={`mr-2 p-1 rounded-full ${
            resolvedCount === totalConflicts
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {resolvedCount === totalConflicts ? (
              <Check className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="font-medium">Parcel ID: {parcelId}</h3>
            <p className="text-sm text-gray-500">
              {resolvedCount} of {totalConflicts} conflicts resolved
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {/* Quick resolve buttons */}
          {resolvedCount < totalConflicts && (
            <div className="mr-4 flex gap-2">
              {conflict.sourceIds.map(sourceId => (
                <button
                  key={`resolve-all-${sourceId}`}
                  className="text-xs px-2 py-1 border rounded-md bg-white hover:bg-gray-50 text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveAll(sourceId);
                  }}
                >
                  Use {getSourceName(sourceId)}
                </button>
              ))}
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Conflict details */}
      {expanded && (
        <div className="p-3 space-y-4">
          {conflict.conflicts.map((fieldConflict, index) => (
            <div 
              key={`conflict-${index}`}
              className={`border rounded-md overflow-hidden ${
                fieldConflict.resolved ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="p-2 border-b bg-white flex justify-between items-center">
                <span className="font-medium">{formatFieldName(fieldConflict.fieldName)}</span>
                {fieldConflict.resolved && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      Using {getSourceName(fieldConflict.selectedSourceId!)}
                    </span>
                    <div className="p-1 rounded-full bg-green-100 text-green-700">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 divide-y">
                {fieldConflict.values.map((valueWithSource, i) => (
                  <div key={`value-${i}`} className="p-2 flex justify-between items-center">
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <div className="p-1 rounded-md bg-blue-100 text-blue-800 mr-2 w-9 h-9 flex items-center justify-center">
                          <Database className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {getSourceName(valueWithSource.sourceId)}
                          </div>
                          <div className="text-gray-900 font-mono text-sm">
                            {typeof valueWithSource.value === 'object' 
                              ? JSON.stringify(valueWithSource.value)
                              : String(valueWithSource.value)
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(!fieldConflict.resolved || fieldConflict.selectedSourceId !== valueWithSource.sourceId) && (
                      <button
                        className="ml-2 px-3 py-1.5 bg-white border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50"
                        onClick={() => onResolve(
                          fieldConflict.fieldName,
                          valueWithSource.value,
                          valueWithSource.sourceId
                        )}
                      >
                        Use this value
                      </button>
                    )}
                    
                    {fieldConflict.resolved && fieldConflict.selectedSourceId === valueWithSource.sourceId && (
                      <div className="ml-2 px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded-md flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}