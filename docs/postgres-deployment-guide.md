# PostgreSQL Deployment Guide for TerraFusionPro

This guide walks through the setup, deployment, and configuration of PostgreSQL for TerraFusionPro. It includes instructions for local development, testing, and production environments.

## Prerequisites

- Docker and Docker Compose
- Node.js 16+ and npm
- Git (for version control)

## Quick Start

For a rapid deployment of PostgreSQL with default settings:

### Windows

```powershell
# Navigate to the project root
cd C:\path\to\TerraFusionPro

# Run the deployment script
.\devops\scripts\deploy-postgres.ps1

# Install required npm packages for database operations
cd server
npm install dotenv drizzle-orm @neondatabase/serverless postgres ws

# Install dev dependencies
npm install -D drizzle-kit @types/pg @types/ws tsx

# Update package.json with database scripts
# (See package-updates.json for the scripts to add)

# Apply database migrations
npm run db:migrate

# Seed the database with sample data (optional)
npm run db:seed
```

### Linux/macOS

```bash
# Navigate to the project root
cd /path/to/TerraFusionPro

# Make the deployment script executable
chmod +x ./devops/scripts/deploy-postgres.sh

# Run the deployment script
./devops/scripts/deploy-postgres.sh

# Install required npm packages for database operations
cd server
npm install dotenv drizzle-orm @neondatabase/serverless postgres ws

# Install dev dependencies
npm install -D drizzle-kit @types/pg @types/ws tsx

# Update package.json with database scripts
# (See package-updates.json for the scripts to add)

# Apply database migrations
npm run db:migrate

# Seed the database with sample data (optional)
npm run db:seed
```

## Database Structure

The TerraFusionPro database follows a structured schema optimized for real estate appraisal workflows:

1. **Users & Authentication**
   - User accounts with role-based access control
   - Authentication and permission management

2. **Properties**
   - Property records with detailed attributes
   - Location data with GIS coordinates
   - Historical property data

3. **Valuations**
   - Assessment data with multiple approaches
   - Historical valuation tracking
   - Workflow status and approvals

4. **Comparables**
   - Similar property records for comparison
   - Sales data for market analysis
   - Distance and relevance metrics

5. **Reporting**
   - Report templates and configurations
   - Generated reports with metadata
   - Compliance tracking

## Connection Details

The default PostgreSQL deployment includes:

- **PostgreSQL Server:**
  - Host: `localhost`
  - Port: `5432`
  - Database: `terrafusionpro`
  - Username: `terrafusionpro`
  - Password: `terrafusiondevelopment`

- **PgAdmin (Database Management UI):**
  - URL: `http://localhost:5050`
  - Email: `admin@terrafusion.com`
  - Password: `terrafusionadmin`

## Configuration Options

The PostgreSQL deployment can be customized through environment variables in the `.env` file:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=terrafusionpro
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=terrafusionpro
DATABASE_SSL=false
DATABASE_URL=postgresql://terrafusionpro:your_secure_password@localhost:5432/terrafusionpro
DATABASE_POOL_MAX=10
DATABASE_POOL_MIN=2
DATABASE_POOL_IDLE_TIMEOUT=30000
```

## Database Management

TerraFusionPro includes several npm scripts for database management:

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply pending migrations to the database
- `npm run db:seed` - Populate the database with sample data
- `npm run db:studio` - Launch Drizzle Studio for visual database management
- `npm run db:setup` - Combined command to run migrations and seed data

## Production Deployment Considerations

For production environments:

1. **Security:**
   - Use strong, unique passwords
   - Enable SSL/TLS encryption
   - Implement IP restrictions where possible
   - Use a managed PostgreSQL service when available

2. **Performance:**
   - Increase connection pool sizes based on demand
   - Configure appropriate resource limits
   - Set up read replicas for high-read workloads

3. **Backup & Disaster Recovery:**
   - Configure automated daily backups
   - Implement point-in-time recovery
   - Test restoration procedures regularly

4. **Monitoring:**
   - Set up query performance monitoring
   - Configure storage and connection alerts
   - Implement log aggregation and analysis

## Troubleshooting

### Common Issues

1. **Connection Failures:**
   - Verify Docker containers are running: `docker ps`
   - Check connection string in `.env` file
   - Confirm port 5432 is not in use by another service

2. **Migration Errors:**
   - Review migration files for syntax errors
   - Check database user permissions
   - Verify schema compatibility

3. **Performance Issues:**
   - Optimize connection pooling settings
   - Review and optimize complex queries
   - Add appropriate indexes to frequently queried columns

## Support & Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Docker Compose Reference](https://docs.docker.com/compose/)
