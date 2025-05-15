// This file initializes database-backed repositories
// separated from main storage initialization to avoid circular dependencies
import { storage } from './storage';
import { db } from './db';
import { 
  incomeHotelMotel, 
  incomeHotelMotelDetail,
  incomeLeaseUp,
  incomeLeaseUpMonthListing,
  IncomeHotelMotel,
  IncomeHotelMotelDetail,
  IncomeLeaseUp,
  IncomeLeaseUpMonthListing,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Function to initialize database storage
export async function initDatabaseStorage() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not defined, skipping database storage initialization');
      return;
    }

    console.log('Initializing database repositories for income approach data...');
    
    // Override the default hotel/motel data methods
    storage.getIncomeHotelMotels = async (): Promise<IncomeHotelMotel[]> => {
      try {
        return await db.select().from(incomeHotelMotel);
      } catch (error) {
        console.error('Error fetching hotel/motel data from database:', error);
        return [];
      }
    };
    
    storage.getIncomeHotelMotelById = async (incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> => {
      try {
        const results = await db.select()
          .from(incomeHotelMotel)
          .where(
            and(
              eq(incomeHotelMotel.incomeYear, String(incomeYear)),
              eq(incomeHotelMotel.supNum, supNum),
              eq(incomeHotelMotel.incomeId, incomeId)
            )
          );
        
        return results.length > 0 ? results[0] : undefined;
      } catch (error) {
        console.error('Error fetching hotel/motel by ID from database:', error);
        return undefined;
      }
    };
    
    // Override the hotel/motel detail methods
    storage.getAllIncomeHotelMotelDetails = async () => {
      try {
        return await db.select().from(incomeHotelMotelDetail);
      } catch (error) {
        console.error('Error fetching all hotel/motel detail data from database:', error);
        return [];
      }
    };
    
    storage.getIncomeHotelMotelDetails = async (incomeYear, supNum, incomeId) => {
      try {
        return await db.select()
          .from(incomeHotelMotelDetail)
          .where(
            and(
              eq(incomeHotelMotelDetail.incomeYear, String(incomeYear)),
              eq(incomeHotelMotelDetail.supNum, supNum),
              eq(incomeHotelMotelDetail.incomeId, incomeId)
            )
          );
      } catch (error) {
        console.error('Error fetching hotel/motel details from database:', error);
        return [];
      }
    };
    
    storage.getIncomeHotelMotelDetailByType = async (incomeYear, supNum, incomeId, valueType) => {
      try {
        const results = await db.select()
          .from(incomeHotelMotelDetail)
          .where(
            and(
              eq(incomeHotelMotelDetail.incomeYear, String(incomeYear)),
              eq(incomeHotelMotelDetail.supNum, supNum),
              eq(incomeHotelMotelDetail.incomeId, incomeId),
              eq(incomeHotelMotelDetail.valueType, valueType)
            )
          );
        
        return results.length > 0 ? results[0] : undefined;
      } catch (error) {
        console.error('Error fetching hotel/motel detail by type from database:', error);
        return undefined;
      }
    };
    
    storage.getIncomeHotelMotelDetail = async (incomeYear, supNum, incomeId, valueType) => {
      return storage.getIncomeHotelMotelDetailByType(Number(incomeYear), supNum, incomeId, valueType);
    };
    
    // Override lease up methods
    storage.getIncomeLeaseUps = async () => {
      try {
        return await db.select().from(incomeLeaseUp);
      } catch (error) {
        console.error('Error fetching lease up data from database:', error);
        return [];
      }
    };
    
    storage.getAllIncomeLeaseUps = async () => {
      try {
        return await db.select().from(incomeLeaseUp);
      } catch (error) {
        console.error('Error fetching all lease up data from database:', error);
        return [];
      }
    };
    
    storage.getIncomeLeaseUpById = async (id) => {
      try {
        const results = await db.select()
          .from(incomeLeaseUp)
          .where(eq(incomeLeaseUp.incomeLeaseUpId, id));
        
        return results.length > 0 ? results[0] : undefined;
      } catch (error) {
        console.error('Error fetching lease up by ID from database:', error);
        return undefined;
      }
    };
    
    storage.getIncomeLeaseUp = async (id) => {
      return storage.getIncomeLeaseUpById(id);
    };
    
    // Override lease up month listing methods
    storage.getIncomeLeaseUpMonthListings = async (incomeLeaseUpId) => {
      try {
        return await db.select()
          .from(incomeLeaseUpMonthListing)
          .where(eq(incomeLeaseUpMonthListing.incomeLeaseUpId, incomeLeaseUpId));
      } catch (error) {
        console.error('Error fetching lease up month listings from database:', error);
        return [];
      }
    };
    
    storage.getIncomeLeaseUpMonthListingsByLeaseUpId = async (incomeLeaseUpId) => {
      return storage.getIncomeLeaseUpMonthListings(incomeLeaseUpId);
    };
    
    storage.getIncomeLeaseUpMonthListingById = async (id) => {
      try {
        const results = await db.select()
          .from(incomeLeaseUpMonthListing)
          .where(eq(incomeLeaseUpMonthListing.incomeLeaseUpMonthListingId, id));
        
        return results.length > 0 ? results[0] : undefined;
      } catch (error) {
        console.error('Error fetching lease up month listing by ID from database:', error);
        return undefined;
      }
    };
    
    console.log('Database repositories initialized successfully.');
    
  } catch (error) {
    console.error('Error initializing database storage:', error);
  }
}