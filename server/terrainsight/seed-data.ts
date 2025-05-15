import { db } from './db';
import { 
  incomeHotelMotel, 
  incomeHotelMotelDetail,
  incomeLeaseUp,
  incomeLeaseUpMonthListing,
  etlTransformationRules,
  etlOptimizationSuggestions,
  etlJobs,
  etlBatchJobs,
  etlAlerts,
} from '@shared/schema';
import { hotelMotelSeedData, hotelMotelDetailSeedData } from './data/income-hotel-motel-seed';
import { leaseUpSeedData, leaseUpMonthListingSeedData } from './data/income-lease-up-seed';
import { 
  transformationRulesSeedData,
  optimizationSuggestionsSeedData,
  etlJobsSeedData,
  etlBatchJobsSeedData,
  etlAlertsSeedData
} from './data/etl-seed';

export async function seedData() {
  console.log('Starting to seed additional data...');
  
  try {
    // Check if hotel/motel data already exists
    const existingHotelMotels = await db.select().from(incomeHotelMotel);
    
    if (existingHotelMotels.length === 0) {
      console.log('Seeding income hotel/motel data...');
      
      for (const data of hotelMotelSeedData) {
        await db.insert(incomeHotelMotel).values(data).returning();
      }
      
      console.log('Successfully seeded hotel/motel data.');
    } else {
      console.log('Hotel/motel data already exists, skipping...');
    }
    
    // Check if hotel/motel detail data already exists
    const existingDetails = await db.select().from(incomeHotelMotelDetail);
    
    if (existingDetails.length === 0) {
      console.log('Seeding income hotel/motel detail data...');
      
      for (const data of hotelMotelDetailSeedData) {
        await db.insert(incomeHotelMotelDetail).values(data).returning();
      }
      
      console.log('Successfully seeded hotel/motel detail data.');
    } else {
      console.log('Hotel/motel detail data already exists, skipping...');
    }
    
    // Check if lease up data already exists
    const existingLeaseUps = await db.select().from(incomeLeaseUp);
    
    if (existingLeaseUps.length === 0) {
      console.log('Seeding income lease up data...');
      
      for (const data of leaseUpSeedData) {
        await db.insert(incomeLeaseUp).values(data).returning();
      }
      
      console.log('Successfully seeded lease up data.');
    } else {
      console.log('Lease up data already exists, skipping...');
    }
    
    // Check if lease up month listing data already exists
    const existingMonthListings = await db.select().from(incomeLeaseUpMonthListing);
    
    if (existingMonthListings.length === 0) {
      console.log('Seeding income lease up month listing data...');
      
      for (const data of leaseUpMonthListingSeedData) {
        await db.insert(incomeLeaseUpMonthListing).values(data).returning();
      }
      
      console.log('Successfully seeded lease up month listing data.');
    } else {
      console.log('Lease up month listing data already exists, skipping...');
    }
    
    // Check if ETL transformation rules already exist
    const existingRules = await db.select().from(etlTransformationRules);
    
    if (existingRules.length === 0) {
      console.log('Seeding ETL transformation rules...');
      
      for (const data of transformationRulesSeedData) {
        await db.insert(etlTransformationRules).values(data).returning();
      }
      
      console.log('Successfully seeded ETL transformation rules.');
    } else {
      console.log('ETL transformation rules already exist, skipping...');
    }
    
    // Check if ETL optimization suggestions already exist
    const existingSuggestions = await db.select().from(etlOptimizationSuggestions);
    
    if (existingSuggestions.length === 0) {
      console.log('Seeding ETL optimization suggestions...');
      
      for (const data of optimizationSuggestionsSeedData) {
        await db.insert(etlOptimizationSuggestions).values(data).returning();
      }
      
      console.log('Successfully seeded ETL optimization suggestions.');
    } else {
      console.log('ETL optimization suggestions already exist, skipping...');
    }
    
    // Check if ETL jobs already exist
    const existingJobs = await db.select().from(etlJobs);
    
    if (existingJobs.length === 0) {
      console.log('Seeding ETL jobs...');
      
      for (const data of etlJobsSeedData) {
        await db.insert(etlJobs).values(data).returning();
      }
      
      console.log('Successfully seeded ETL jobs.');
    } else {
      console.log('ETL jobs already exist, skipping...');
    }
    
    // Check if ETL batch jobs already exist
    const existingBatchJobs = await db.select().from(etlBatchJobs);
    
    if (existingBatchJobs.length === 0) {
      console.log('Seeding ETL batch jobs...');
      
      for (const data of etlBatchJobsSeedData) {
        await db.insert(etlBatchJobs).values(data).returning();
      }
      
      console.log('Successfully seeded ETL batch jobs.');
    } else {
      console.log('ETL batch jobs already exist, skipping...');
    }
    
    // Check if ETL alerts already exist
    const existingAlerts = await db.select().from(etlAlerts);
    
    if (existingAlerts.length === 0) {
      console.log('Seeding ETL alerts...');
      
      for (const data of etlAlertsSeedData) {
        await db.insert(etlAlerts).values(data).returning();
      }
      
      console.log('Successfully seeded ETL alerts.');
    } else {
      console.log('ETL alerts already exist, skipping...');
    }
    
    console.log('Successfully completed seeding all data!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}