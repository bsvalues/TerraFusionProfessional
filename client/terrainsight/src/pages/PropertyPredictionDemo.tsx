import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ContextualPropertyPredictionPanel from '@/components/property/ContextualPropertyPredictionPanel';
import { Property } from '@shared/schema';

const PropertyPredictionDemo: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/properties');
        if (!response.ok) {
          throw new Error(`Error fetching properties: ${response.status}`);
        }
        
        const data = await response.json();
        setProperties(data);
        
        // Select the first property by default
        if (data.length > 0) {
          setSelectedProperty(data[0]);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, []);

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = e.target.value;
    const property = properties.find(p => p.id.toString() === propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };
  
  // Find nearby/comparable properties (in a real app, this would be more sophisticated)
  const getComparableProperties = (): Property[] => {
    if (!selectedProperty || properties.length < 2) return [];
    
    // Just get some other properties from the same neighborhood or similar price range
    return properties
      .filter(p => p.id !== selectedProperty.id)
      .filter(p => 
        p.neighborhood === selectedProperty.neighborhood || 
        (p.value && selectedProperty.value && 
          Math.abs(parseFloat(p.value.toString()) - parseFloat(selectedProperty.value.toString())) < 100000)
      )
      .slice(0, 5);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Contextual Property Valuation
        </h1>
        <p className="text-gray-600 max-w-3xl">
          This demo showcases AI-enhanced property valuation with contextual insights. 
          Select a property and provide additional context to get a comprehensive valuation 
          that combines machine learning models with contextual AI analysis.
        </p>
      </header>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading properties...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-8">
            <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select a Property
            </label>
            <select
              id="property-select"
              value={selectedProperty?.id || ''}
              onChange={handlePropertyChange}
              className="w-full md:w-1/2 lg:w-1/3 rounded-md border border-gray-300 shadow-sm p-2 bg-white"
            >
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.address} - {property.value ? `$${property.value}` : 'No value'}
                </option>
              ))}
            </select>
          </div>
          
          {selectedProperty && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ContextualPropertyPredictionPanel
                  property={selectedProperty}
                  comparableProperties={getComparableProperties()}
                />
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="text-gray-800">{selectedProperty.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Current Value</h3>
                      <p className="text-gray-800">{selectedProperty.value ? `$${selectedProperty.value}` : 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Land Value</h3>
                      <p className="text-gray-800">{selectedProperty.landValue ? `$${selectedProperty.landValue}` : 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Square Feet</h3>
                      <p className="text-gray-800">{selectedProperty.squareFeet || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Year Built</h3>
                      <p className="text-gray-800">{selectedProperty.yearBuilt || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Bedrooms</h3>
                      <p className="text-gray-800">{selectedProperty.bedrooms || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
                      <p className="text-gray-800">{selectedProperty.bathrooms || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Neighborhood</h3>
                    <p className="text-gray-800">{selectedProperty.neighborhood || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Lot Size</h3>
                    <p className="text-gray-800">{selectedProperty.lotSize ? `${selectedProperty.lotSize} sq ft` : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">About Contextual Valuation</h3>
                  <p className="text-sm text-gray-600">
                    This feature combines traditional machine learning models with AI 
                    contextual analysis to provide more accurate property valuations that 
                    take into account qualitative factors and local market conditions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyPredictionDemo;