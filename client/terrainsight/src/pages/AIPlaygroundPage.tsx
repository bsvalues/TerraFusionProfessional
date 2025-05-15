import React, { useState, useEffect } from 'react';
import AIPlayground from '../components/scripting/AIPlayground';
import { Property } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const AIPlaygroundPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Load property data
  useEffect(() => {
    fetch('/api/properties')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        return response.json();
      })
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property data for analysis.',
          variant: 'destructive'
        });
        setLoading(false);
      });
  }, [toast]);
  
  // Handle script execution results
  const handleScriptResult = (result: any) => {
    console.log('Script execution result:', result);
    // You can do additional processing of results here if needed
  };
  
  return (
    <div className="h-full flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>Loading property data...</span>
          </div>
        </div>
      ) : (
        <AIPlayground 
          properties={properties} 
          onScriptResult={handleScriptResult} 
        />
      )}
    </div>
  );
};

export default AIPlaygroundPage;