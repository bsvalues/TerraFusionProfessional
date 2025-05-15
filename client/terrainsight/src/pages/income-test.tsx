import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface HotelMotel {
  incomeYear: string;
  supNum: number;
  incomeId: number;
  sizeInSqft: string;
  averageDailyRoomRate: string;
  numberOfRooms: string;
  numberOfRoomNights: string;
  incomeValueReconciled: string;
  incomeValuePerRoom: string;
  assessmentValuePerRoom: string;
  incomeValuePerSqft: string;
  assessmentValuePerSqft: string;
}

interface HotelMotelDetail {
  incomeYear: string;
  supNum: number;
  incomeId: number;
  valueType: string;
  roomRevenue: string;
  roomRevenuePct: string;
  roomRevenueUpdate: string;
  vacancyCollectionLoss: string;
  vacancyCollectionLossPct: string;
  vacancyCollectionLossUpdate: string;
  // Additional fields omitted for brevity
}

interface LeaseUp {
  incomeLeaseUpId: number;
  incomeYear: string;
  supNum: number;
  incomeId: number;
  frequency: string;
  netRentableArea: string;
  currentOccupancyPct: string;
  stabilizedOccupancyPct: string;
  // Additional fields omitted for brevity
}

interface LeaseUpMonthListing {
  incomeLeaseUpMonthListingId: number;
  incomeLeaseUpId: number;
  yearNumber: string;
  monthNumber: string;
  available: string;
  rentLoss: string;
  finishAllowance: string;
  commissions: string;
  presentValueFactor: string;
  presentValue: string;
}

const IncomeTest = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('hotel-motel');
  const [hotelMotels, setHotelMotels] = useState<HotelMotel[]>([]);
  const [leaseUps, setLeaseUps] = useState<LeaseUp[]>([]);
  
  const [hotelMotelForm, setHotelMotelForm] = useState<Partial<HotelMotel>>({
    incomeYear: new Date().getFullYear().toString(),
    supNum: 1,
    incomeId: 1,
    sizeInSqft: "0",
    averageDailyRoomRate: "0",
    numberOfRooms: "0",
    numberOfRoomNights: "0"
  });

  const [leaseUpForm, setLeaseUpForm] = useState<Partial<LeaseUp>>({
    incomeYear: new Date().getFullYear().toString(),
    supNum: 1,
    incomeId: 1,
    frequency: "A",
    netRentableArea: "0",
    currentOccupancyPct: "100"
  });

  useEffect(() => {
    // Load initial data
    loadHotelMotelData();
    loadLeaseUpData();
  }, []);

  const loadHotelMotelData = async () => {
    try {
      const response = await apiRequest('GET', '/api/income-hotel-motels');
      setHotelMotels(response as HotelMotel[]);
    } catch (error) {
      console.error('Failed to load hotel/motel data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hotel/motel data',
        variant: 'destructive'
      });
    }
  };

  const loadLeaseUpData = async () => {
    try {
      const response = await apiRequest('GET', '/api/income-lease-ups');
      setLeaseUps(response as LeaseUp[]);
    } catch (error) {
      console.error('Failed to load lease up data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lease up data',
        variant: 'destructive'
      });
    }
  };

  const handleHotelMotelFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHotelMotelForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaseUpFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLeaseUpForm(prev => ({ ...prev, [name]: value }));
  };

  const handleHotelMotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('POST', '/api/income-hotel-motel', JSON.stringify(hotelMotelForm));
      toast({
        title: 'Success',
        description: 'Hotel/Motel data created successfully'
      });
      loadHotelMotelData();
      // Reset form
      setHotelMotelForm({
        incomeYear: new Date().getFullYear().toString(),
        supNum: 1,
        incomeId: 1,
        sizeInSqft: "0",
        averageDailyRoomRate: "0",
        numberOfRooms: "0",
        numberOfRoomNights: "0"
      });
    } catch (error) {
      console.error('Failed to create hotel/motel data:', error);
      toast({
        title: 'Error',
        description: 'Failed to create hotel/motel data',
        variant: 'destructive'
      });
    }
  };

  const handleLeaseUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('POST', '/api/income-lease-up', JSON.stringify(leaseUpForm));
      toast({
        title: 'Success',
        description: 'Lease Up data created successfully'
      });
      loadLeaseUpData();
      // Reset form
      setLeaseUpForm({
        incomeYear: new Date().getFullYear().toString(),
        supNum: 1,
        incomeId: 1,
        frequency: "A",
        netRentableArea: "0",
        currentOccupancyPct: "100"
      });
    } catch (error) {
      console.error('Failed to create lease up data:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lease up data',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteHotelMotel = async (incomeYear: string, supNum: number, incomeId: number) => {
    try {
      await apiRequest('DELETE', `/api/income-hotel-motel/${incomeYear}/${supNum}/${incomeId}`);
      toast({
        title: 'Success',
        description: 'Hotel/Motel data deleted successfully'
      });
      loadHotelMotelData();
    } catch (error) {
      console.error('Failed to delete hotel/motel data:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete hotel/motel data',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLeaseUp = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/income-lease-up/${id}`);
      toast({
        title: 'Success',
        description: 'Lease Up data deleted successfully'
      });
      loadLeaseUpData();
    } catch (error) {
      console.error('Failed to delete lease up data:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lease up data',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Income Approach Testing</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hotel-motel">Hotel/Motel</TabsTrigger>
          <TabsTrigger value="lease-up">Lease Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hotel-motel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create Hotel/Motel</h2>
              <form onSubmit={handleHotelMotelSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incomeYear">Income Year</Label>
                    <Input 
                      id="incomeYear" 
                      name="incomeYear" 
                      value={hotelMotelForm.incomeYear} 
                      onChange={handleHotelMotelFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="supNum">Sup Number</Label>
                    <Input 
                      id="supNum" 
                      name="supNum" 
                      type="number"
                      value={hotelMotelForm.supNum} 
                      onChange={handleHotelMotelFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="incomeId">Income ID</Label>
                    <Input 
                      id="incomeId" 
                      name="incomeId" 
                      type="number"
                      value={hotelMotelForm.incomeId} 
                      onChange={handleHotelMotelFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="sizeInSqft">Size (sqft)</Label>
                    <Input 
                      id="sizeInSqft" 
                      name="sizeInSqft" 
                      value={hotelMotelForm.sizeInSqft} 
                      onChange={handleHotelMotelFormChange} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="averageDailyRoomRate">Average Daily Room Rate</Label>
                    <Input 
                      id="averageDailyRoomRate" 
                      name="averageDailyRoomRate" 
                      value={hotelMotelForm.averageDailyRoomRate} 
                      onChange={handleHotelMotelFormChange} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                    <Input 
                      id="numberOfRooms" 
                      name="numberOfRooms" 
                      value={hotelMotelForm.numberOfRooms} 
                      onChange={handleHotelMotelFormChange} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfRoomNights">Number of Room Nights</Label>
                    <Input 
                      id="numberOfRoomNights" 
                      name="numberOfRoomNights" 
                      value={hotelMotelForm.numberOfRoomNights} 
                      onChange={handleHotelMotelFormChange} 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Hotel/Motel</Button>
              </form>
            </Card>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Hotel/Motel List</h2>
              {hotelMotels.length === 0 ? (
                <p>No hotel/motel data available</p>
              ) : (
                <div className="space-y-4">
                  {hotelMotels.map((item) => (
                    <Card key={`${item.incomeYear}-${item.supNum}-${item.incomeId}`} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Year: {item.incomeYear}, Sup: {item.supNum}, ID: {item.incomeId}</h3>
                          <p>Size: {item.sizeInSqft} sqft</p>
                          <p>Rooms: {item.numberOfRooms}, Rate: ${item.averageDailyRoomRate}</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteHotelMotel(item.incomeYear, item.supNum, item.incomeId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="lease-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create Lease Up</h2>
              <form onSubmit={handleLeaseUpSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leaseUpIncomeYear">Income Year</Label>
                    <Input 
                      id="leaseUpIncomeYear" 
                      name="incomeYear" 
                      value={leaseUpForm.incomeYear} 
                      onChange={handleLeaseUpFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="leaseUpSupNum">Sup Number</Label>
                    <Input 
                      id="leaseUpSupNum" 
                      name="supNum" 
                      type="number"
                      value={leaseUpForm.supNum} 
                      onChange={handleLeaseUpFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="leaseUpIncomeId">Income ID</Label>
                    <Input 
                      id="leaseUpIncomeId" 
                      name="incomeId" 
                      type="number"
                      value={leaseUpForm.incomeId} 
                      onChange={handleLeaseUpFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input 
                      id="frequency" 
                      name="frequency" 
                      value={leaseUpForm.frequency} 
                      onChange={handleLeaseUpFormChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="netRentableArea">Net Rentable Area</Label>
                    <Input 
                      id="netRentableArea" 
                      name="netRentableArea" 
                      value={leaseUpForm.netRentableArea} 
                      onChange={handleLeaseUpFormChange} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentOccupancyPct">Current Occupancy %</Label>
                    <Input 
                      id="currentOccupancyPct" 
                      name="currentOccupancyPct" 
                      value={leaseUpForm.currentOccupancyPct} 
                      onChange={handleLeaseUpFormChange} 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Lease Up</Button>
              </form>
            </Card>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Lease Up List</h2>
              {leaseUps.length === 0 ? (
                <p>No lease up data available</p>
              ) : (
                <div className="space-y-4">
                  {leaseUps.map((item) => (
                    <Card key={item.incomeLeaseUpId} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">ID: {item.incomeLeaseUpId}</h3>
                          <p>Year: {item.incomeYear}, Sup: {item.supNum}, Income ID: {item.incomeId}</p>
                          <p>Area: {item.netRentableArea} sqft, Occupancy: {item.currentOccupancyPct}%</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteLeaseUp(item.incomeLeaseUpId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomeTest;