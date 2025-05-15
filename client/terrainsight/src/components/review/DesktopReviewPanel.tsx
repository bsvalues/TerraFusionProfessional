import React, { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  ClipboardCheck, 
  Eye, 
  FileCheck, 
  Home, 
  Layers, 
  MapPin, 
  Ruler, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import PropertyInspectionForm from './PropertyInspectionForm';
import ParcelVerificationComponent from './ParcelVerificationComponent';
import SketchValidationComponent from './SketchValidationComponent';

interface DesktopReviewPanelProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect: (property: Property) => void;
  onUpdateProperty?: (propertyId: number, updates: Partial<Property>) => void;
  className?: string;
}

interface ReviewItem {
  id: number;
  propertyId: number;
  status: 'pending' | 'approved' | 'rejected';
  type: 'inspection' | 'verification' | 'sketch';
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * Desktop Review Panel Component
 * 
 * A comprehensive interface for reviewing property parcels, conducting inspections,
 * and validating property sketches. This component supports both standalone and
 * integrated modes through the AppModeContext.
 */
const DesktopReviewPanel: React.FC<DesktopReviewPanelProps> = ({
  properties,
  selectedProperty,
  onPropertySelect,
  onUpdateProperty,
  className
}) => {
  const { mode, isStandalone } = useAppMode();
  const [activeTab, setActiveTab] = useState<string>('queue');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generate review items based on properties (in a real app, these would come from the database)
  useEffect(() => {
    if (properties.length > 0) {
      // Create synthetic review items based on property data
      const items: ReviewItem[] = properties.map((property, index) => {
        // Determine review type and status based on property attributes
        let reviewType: 'inspection' | 'verification' | 'sketch' = 'inspection';
        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        
        // Alternate between different review types
        if (index % 3 === 0) reviewType = 'inspection';
        else if (index % 3 === 1) reviewType = 'verification';
        else reviewType = 'sketch';
        
        // Set some items as approved or rejected for demonstration
        if (index % 5 === 0) status = 'approved';
        else if (index % 7 === 0) status = 'rejected';
        
        return {
          id: index + 1,
          propertyId: property.id,
          status: status,
          type: reviewType,
          assignedTo: 'John Doe',
          dueDate: new Date(Date.now() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: ''
        };
      });
      
      setReviewItems(items);
    }
  }, [properties]);

  // Filter properties based on search query and status filter
  useEffect(() => {
    let filtered = properties;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.address?.toLowerCase().includes(query) ||
        property.parcelId?.toLowerCase().includes(query) ||
        property.owner?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter using review items
    if (filterStatus !== 'all') {
      const propertyIdsWithStatus = reviewItems
        .filter(item => item.status === filterStatus)
        .map(item => item.propertyId);
      
      filtered = filtered.filter(property => 
        propertyIdsWithStatus.includes(property.id)
      );
    }
    
    setFilteredProperties(filtered);
  }, [properties, reviewItems, searchQuery, filterStatus]);

  // Handle property status update
  const handleStatusUpdate = (propertyId: number, status: 'approved' | 'rejected' | 'pending') => {
    setReviewItems(prevItems => 
      prevItems.map(item => 
        item.propertyId === propertyId 
          ? { ...item, status: status }
          : item
      )
    );
    
    // In a real application, we'd call an API to update the status
    console.log(`Updated property ${propertyId} status to ${status}`);
  };

  // Handle property updates from inspection form
  const handlePropertyUpdate = (propertyId: number, updates: Partial<Property>) => {
    if (onUpdateProperty) {
      onUpdateProperty(propertyId, updates);
    }
    
    // Mark the related review item as approved
    handleStatusUpdate(propertyId, 'approved');
  };

  // Find the review item for a property
  const getReviewItemForProperty = (propertyId: number): ReviewItem | undefined => {
    return reviewItems.find(item => item.propertyId === propertyId);
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  // Render icon for review type
  const renderReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'verification':
        return <ClipboardCheck className="h-4 w-4 text-purple-600" />;
      case 'sketch':
        return <Ruler className="h-4 w-4 text-orange-600" />;
      default:
        return <FileCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full", 
      isStandalone ? "bg-white" : "bg-gray-900 text-white",
      className
    )}>
      <div className={cn(
        "px-4 py-3 flex items-center justify-between border-b",
        isStandalone ? "bg-gray-50 border-gray-200" : "bg-gray-800 border-gray-700"
      )}>
        <div className="flex items-center space-x-2">
          <ClipboardCheck className={cn(
            "h-5 w-5",
            isStandalone ? "text-primary" : "text-primary-foreground"
          )} />
          <h2 className="text-lg font-medium">Desktop Review & Validation</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="search"
              placeholder="Search properties..."
              className={cn(
                "h-8 px-3 py-1 text-sm rounded-md w-40 md:w-64",
                isStandalone 
                  ? "bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  : "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            className={cn(
              "h-8 px-2 py-1 text-sm rounded-md",
              isStandalone 
                ? "bg-white border border-gray-300" 
                : "bg-gray-700 border-gray-600 text-white"
            )}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <Tabs 
        defaultValue="queue" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className={cn(
          "mx-4 mt-2",
          isStandalone ? "" : "bg-gray-800"
        )}>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="inspection">Property Inspection</TabsTrigger>
          <TabsTrigger value="verification">Parcel Verification</TabsTrigger>
          <TabsTrigger value="sketch">Sketch Validation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="flex-1 p-4 pt-2">
          <Card className={cn(
            "h-full",
            isStandalone ? "" : "bg-gray-800 border-gray-700"
          )}>
            <CardHeader className="pb-2">
              <CardTitle>Properties Requiring Review</CardTitle>
              <CardDescription>
                {filteredProperties.length} properties in queue
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {filteredProperties.map(property => {
                    const reviewItem = getReviewItemForProperty(property.id);
                    
                    return (
                      <div 
                        key={property.id}
                        className={cn(
                          "p-3 rounded-md border transition-colors cursor-pointer",
                          selectedProperty?.id === property.id 
                            ? (isStandalone ? "border-primary bg-primary/5" : "border-primary bg-primary/10") 
                            : (isStandalone ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50" : "border-gray-700 hover:border-gray-600 hover:bg-gray-700"),
                        )}
                        onClick={() => onPropertySelect(property)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{property.address}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Parcel ID: {property.parcelId} • {formatCurrency(property.value || 0)}
                            </div>
                            
                            <div className="flex items-center mt-2 space-x-3">
                              {reviewItem && (
                                <>
                                  <div className="flex items-center">
                                    {renderReviewTypeIcon(reviewItem.type)}
                                    <span className="text-xs ml-1 capitalize">{reviewItem.type}</span>
                                  </div>
                                  
                                  <div>
                                    {renderStatusBadge(reviewItem.status)}
                                  </div>
                                  
                                  {reviewItem.dueDate && (
                                    <div className="text-xs">
                                      Due: {reviewItem.dueDate}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(property.id, 'approved');
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(property.id, 'rejected');
                              }}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredProperties.length === 0 && (
                    <div className={cn(
                      "p-8 text-center",
                      isStandalone ? "text-gray-500" : "text-gray-400"
                    )}>
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                        <ClipboardCheck className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">No properties to review</h3>
                      <p className="text-sm">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'Try adjusting your filters or search criteria'
                          : 'All properties have been reviewed'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className={cn(
              "text-sm border-t",
              isStandalone ? "border-gray-200" : "border-gray-700"
            )}>
              <div className="flex justify-between w-full">
                <span>
                  {reviewItems.filter(item => item.status === 'pending').length} pending reviews
                </span>
                <span>
                  {reviewItems.filter(item => item.status === 'approved').length} approved •
                  {reviewItems.filter(item => item.status === 'rejected').length} rejected
                </span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="inspection" className="flex-1 p-4 pt-2">
          {selectedProperty ? (
            <PropertyInspectionForm 
              property={selectedProperty}
              onSubmit={handlePropertyUpdate}
              onCancel={() => setActiveTab('queue')}
              isStandalone={isStandalone}
            />
          ) : (
            <Card className={cn(
              "h-full flex items-center justify-center",
              isStandalone ? "bg-white" : "bg-gray-800 border-gray-700"
            )}>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Select a property from the Review Queue to begin the inspection process
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('queue')}
                >
                  Go to Review Queue
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="verification" className="flex-1 p-4 pt-2">
          {selectedProperty ? (
            <ParcelVerificationComponent 
              property={selectedProperty}
              onVerify={(verified: boolean) => {
                handleStatusUpdate(selectedProperty.id, verified ? 'approved' : 'rejected');
                setActiveTab('queue');
              }}
              onCancel={() => setActiveTab('queue')}
              isStandalone={isStandalone}
            />
          ) : (
            <Card className={cn(
              "h-full flex items-center justify-center",
              isStandalone ? "bg-white" : "bg-gray-800 border-gray-700"
            )}>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Parcel Selected</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Select a property from the Review Queue to begin the parcel verification process
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('queue')}
                >
                  Go to Review Queue
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="sketch" className="flex-1 p-4 pt-2">
          {selectedProperty ? (
            <SketchValidationComponent 
              property={selectedProperty}
              onValidate={(valid: boolean) => {
                handleStatusUpdate(selectedProperty.id, valid ? 'approved' : 'rejected');
                setActiveTab('queue');
              }}
              onCancel={() => setActiveTab('queue')}
              isStandalone={isStandalone}
            />
          ) : (
            <Card className={cn(
              "h-full flex items-center justify-center",
              isStandalone ? "bg-white" : "bg-gray-800 border-gray-700"
            )}>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <Layers className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Sketch Selected</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Select a property from the Review Queue to begin the sketch validation process
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('queue')}
                >
                  Go to Review Queue
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesktopReviewPanel;