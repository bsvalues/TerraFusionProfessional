import React from 'react';
import PropertyDetail from './PropertyDetail';

const PropertyValueDemo: React.FC = () => {
  // Sample property data with historical values
  const sampleProperty = {
    id: 1,
    parcelId: "123456789",
    address: "123 Main Street, Kennewick, WA 99336",
    owner: "John Smith",
    value: "$450,000",
    estimatedValue: "$475,000",
    salePrice: "$430,000",
    squareFeet: 2800,
    yearBuilt: 2005,
    landValue: "$90,000",
    coordinates: [46.2087, -119.1360],
    latitude: "46.2087",
    longitude: "-119.1360",
    neighborhood: "Southridge",
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 2.5,
    lotSize: 9000,
    zoning: "R1",
    lastSaleDate: "2020-05-15",
    taxAssessment: "$445,000",
    pricePerSqFt: "$160",
    attributes: {
      roofType: "Composite Shingle",
      heatingType: "Forced Air",
      coolingType: "Central Air",
      foundation: "Concrete",
      garageType: "Attached",
      garageSpaces: 2
    },
    historicalValues: {
      "2019": { value: 390000, source: "County Assessment" },
      "2020": { value: 410000, source: "County Assessment" },
      "2021": { value: 425000, source: "County Assessment" },
      "2022": { value: 440000, source: "County Assessment" },
      "2023": { value: 450000, source: "County Assessment" }
    },
    sourceId: "BC-GIS-001",
    zillowId: null
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Property Value History Demo</h1>
      <PropertyDetail property={sampleProperty} />
    </div>
  );
};

export default PropertyValueDemo;