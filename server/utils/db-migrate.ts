import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getDatabaseConfig } from "./database-config";
import * as path from "path";

// Function to run database migrations
async function runMigrations() {
  console.log("Starting database migrations...");
  const config = getDatabaseConfig();
  
  try {
    const connection = postgres(config.connectionString, { 
      ssl: config.ssl,
      max: config.maxPoolSize
    });
    
    const db = drizzle(connection);
    
    // Run migrations from the migrations folder
    const migrationsFolder = path.join(__dirname, "../../drizzle/migrations");
    console.log(`Running migrations from: ${migrationsFolder}`);
    
    await migrate(db, { migrationsFolder });
    console.log("Database migrations completed successfully!");
    
    await connection.end();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migration process completed.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration process failed:", err);
      process.exit(1);
    });
}

export { runMigrations };
