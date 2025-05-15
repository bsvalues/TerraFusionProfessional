import { pgTable, text, serial, integer, boolean, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true)
});

// Property table for storing property data
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  parcelId: text("parcel_id").notNull().unique(),
  address: text("address").notNull(),
  owner: text("owner"),
  value: text("value"),
  salePrice: text("sale_price"),
  squareFeet: integer("square_feet").notNull(),
  yearBuilt: integer("year_built"),
  landValue: text("land_value"),
  coordinates: jsonb("coordinates"),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  neighborhood: text("neighborhood"),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  lotSize: integer("lot_size"),
  zoning: text("zoning"),
  lastSaleDate: text("last_sale_date"),
  taxAssessment: text("tax_assessment"),
  pricePerSqFt: text("price_per_sqft"),
  attributes: jsonb("attributes")
});

// Project table for storing project metadata
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: text("year").notNull(),
  metrics: jsonb("metrics"),
  records: jsonb("records")
});

// Script table for storing script definitions
export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  groupId: text("group_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(),
  code: text("code"),
  order: integer("order").notNull()
});

// Script group table
export const scriptGroups = pgTable("script_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(false),
  order: integer("order").notNull()
});

// Regression models table
export const regressionModels = pgTable("regression_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  r2: text("r2").notNull(),
  variables: integer("variables").notNull(),
  cov: text("cov"),
  samples: integer("samples"),
  lastRun: text("last_run"),
  modelType: text("model_type").notNull(),
  configuration: jsonb("configuration")
});

// Create schemas for inserting data
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  isActive: true
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  parcelId: true,
  address: true,
  owner: true,
  value: true,
  salePrice: true,
  squareFeet: true,
  yearBuilt: true,
  landValue: true,
  coordinates: true,
  latitude: true,
  longitude: true,
  neighborhood: true,
  propertyType: true,
  bedrooms: true,
  bathrooms: true,
  lotSize: true,
  zoning: true,
  lastSaleDate: true,
  taxAssessment: true,
  pricePerSqFt: true,
  attributes: true
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  year: true,
  metrics: true,
  records: true
});

export const insertScriptSchema = createInsertSchema(scripts).pick({
  groupId: true,
  name: true,
  status: true,
  type: true,
  code: true,
  order: true
});

export const insertScriptGroupSchema = createInsertSchema(scriptGroups).pick({
  name: true,
  active: true,
  order: true
});

export const insertRegressionModelSchema = createInsertSchema(regressionModels).pick({
  name: true,
  r2: true,
  variables: true,
  cov: true,
  samples: true,
  lastRun: true,
  modelType: true,
  configuration: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;

export type InsertScriptGroup = z.infer<typeof insertScriptGroupSchema>;
export type ScriptGroup = typeof scriptGroups.$inferSelect;

export type InsertRegressionModel = z.infer<typeof insertRegressionModelSchema>;
export type RegressionModel = typeof regressionModels.$inferSelect;
