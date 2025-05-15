import { 
  IncomeHotelMotel,
  InsertIncomeHotelMotel,
  IncomeHotelMotelDetail,
  InsertIncomeHotelMotelDetail,
  IncomeLeaseUp,
  InsertIncomeLeaseUp,
  IncomeLeaseUpMonthListing,
  InsertIncomeLeaseUpMonthListing,
  incomeHotelMotel, 
  incomeHotelMotelDetail, 
  incomeLeaseUp, 
  incomeLeaseUpMonthListing 
} from '@shared/schema';
import { db } from './db';
import { eq, and } from 'drizzle-orm';

// This is a standalone DB implementation of the storage interface
export class DBStorage {
  constructor() {
    console.log('Initializing DB-backed storage...');
  }

  // Override methods for income hotel/motel data
  async getIncomeHotelMotels(): Promise<IncomeHotelMotel[]> {
    try {
      return await db.select().from(incomeHotelMotel);
    } catch (error) {
      console.error('Error fetching hotel/motel data from database:', error);
      return [];
    }
  }

  async getIncomeHotelMotelById(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> {
    try {
      const results = await db.select()
        .from(incomeHotelMotel)
        .where(
          and(
            eq(incomeHotelMotel.incomeYear, incomeYear),
            eq(incomeHotelMotel.supNum, supNum),
            eq(incomeHotelMotel.incomeId, incomeId)
          )
        );
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error('Error fetching hotel/motel by ID from database:', error);
      return undefined;
    }
  }

  async getAllIncomeHotelMotels(): Promise<IncomeHotelMotel[]> {
    return this.getIncomeHotelMotels();
  }

  async getIncomeHotelMotel(incomeYear: string, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> {
    return this.getIncomeHotelMotelById(Number(incomeYear), supNum, incomeId);
  }

  async insertIncomeHotelMotel(data: InsertIncomeHotelMotel): Promise<IncomeHotelMotel> {
    try {
      const result = await db.insert(incomeHotelMotel).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error inserting hotel/motel data into database:', error);
      throw error;
    }
  }

  async updateIncomeHotelMotel(
    incomeYear: number, 
    supNum: number, 
    incomeId: number, 
    data: Partial<InsertIncomeHotelMotel>
  ): Promise<IncomeHotelMotel | undefined> {
    try {
      const result = await db.update(incomeHotelMotel)
        .set(data)
        .where(
          and(
            eq(incomeHotelMotel.incomeYear, incomeYear),
            eq(incomeHotelMotel.supNum, supNum),
            eq(incomeHotelMotel.incomeId, incomeId)
          )
        )
        .returning();
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error updating hotel/motel data in database:', error);
      return undefined;
    }
  }

  async deleteIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number): Promise<boolean> {
    try {
      await db.delete(incomeHotelMotel)
        .where(
          and(
            eq(incomeHotelMotel.incomeYear, incomeYear),
            eq(incomeHotelMotel.supNum, supNum),
            eq(incomeHotelMotel.incomeId, incomeId)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error deleting hotel/motel data from database:', error);
      return false;
    }
  }

  // Hotel/Motel Details
  async getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]> {
    try {
      return await db.select()
        .from(incomeHotelMotelDetail)
        .where(
          and(
            eq(incomeHotelMotelDetail.incomeYear, incomeYear),
            eq(incomeHotelMotelDetail.supNum, supNum),
            eq(incomeHotelMotelDetail.incomeId, incomeId)
          )
        );
    } catch (error) {
      console.error('Error fetching hotel/motel details from database:', error);
      return [];
    }
  }

  async getAllIncomeHotelMotelDetails(): Promise<IncomeHotelMotelDetail[]> {
    try {
      return await db.select().from(incomeHotelMotelDetail);
    } catch (error) {
      console.error('Error fetching all hotel/motel details from database:', error);
      return [];
    }
  }

  async getIncomeHotelMotelDetailByType(
    incomeYear: number, 
    supNum: number, 
    incomeId: number, 
    valueType: string
  ): Promise<IncomeHotelMotelDetail | undefined> {
    try {
      const results = await db.select()
        .from(incomeHotelMotelDetail)
        .where(
          and(
            eq(incomeHotelMotelDetail.incomeYear, incomeYear),
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
  }

  async getIncomeHotelMotelDetail(
    incomeYear: string,
    supNum: number,
    incomeId: number,
    valueType: string
  ): Promise<IncomeHotelMotelDetail | undefined> {
    return this.getIncomeHotelMotelDetailByType(Number(incomeYear), supNum, incomeId, valueType);
  }

  async insertIncomeHotelMotelDetail(data: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail> {
    try {
      const result = await db.insert(incomeHotelMotelDetail).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error inserting hotel/motel detail into database:', error);
      throw error;
    }
  }

  // Lease Up
  async getIncomeLeaseUps(): Promise<IncomeLeaseUp[]> {
    try {
      return await db.select().from(incomeLeaseUp);
    } catch (error) {
      console.error('Error fetching lease up data from database:', error);
      return [];
    }
  }

  async getAllIncomeLeaseUps(): Promise<IncomeLeaseUp[]> {
    return this.getIncomeLeaseUps();
  }

  async getIncomeLeaseUpById(id: number): Promise<IncomeLeaseUp | undefined> {
    try {
      const results = await db.select()
        .from(incomeLeaseUp)
        .where(eq(incomeLeaseUp.incomeLeaseUpId, id));
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error('Error fetching lease up by ID from database:', error);
      return undefined;
    }
  }

  async getIncomeLeaseUp(id: number): Promise<IncomeLeaseUp | undefined> {
    return this.getIncomeLeaseUpById(id);
  }

  async insertIncomeLeaseUp(data: InsertIncomeLeaseUp): Promise<IncomeLeaseUp> {
    try {
      const result = await db.insert(incomeLeaseUp).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error inserting lease up data into database:', error);
      throw error;
    }
  }

  // Lease Up Month Listings
  async getIncomeLeaseUpMonthListings(incomeLeaseUpId: number): Promise<IncomeLeaseUpMonthListing[]> {
    try {
      return await db.select()
        .from(incomeLeaseUpMonthListing)
        .where(eq(incomeLeaseUpMonthListing.incomeLeaseUpId, incomeLeaseUpId));
    } catch (error) {
      console.error('Error fetching lease up month listings from database:', error);
      return [];
    }
  }

  async getIncomeLeaseUpMonthListingsByLeaseUpId(incomeLeaseUpId: number): Promise<IncomeLeaseUpMonthListing[]> {
    return this.getIncomeLeaseUpMonthListings(incomeLeaseUpId);
  }

  async getIncomeLeaseUpMonthListingById(id: number): Promise<IncomeLeaseUpMonthListing | undefined> {
    try {
      const results = await db.select()
        .from(incomeLeaseUpMonthListing)
        .where(eq(incomeLeaseUpMonthListing.incomeLeaseUpMonthListingId, id));
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error('Error fetching lease up month listing by ID from database:', error);
      return undefined;
    }
  }

  async insertIncomeLeaseUpMonthListing(data: InsertIncomeLeaseUpMonthListing): Promise<IncomeLeaseUpMonthListing> {
    try {
      const result = await db.insert(incomeLeaseUpMonthListing).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error inserting lease up month listing into database:', error);
      throw error;
    }
  }
}