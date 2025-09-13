import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { seedEmbeddings } from '../scripts/seedEmbeddings'
import * as schema from './schema'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool, { schema })

const performHealthCheck = async (): Promise<boolean> => {
    console.log('🔍 Performing database health check...')

    try {
        // Basic connectivity test
        const connectResult = await pool.query('SELECT 1 as health_check')
        if (connectResult.rows[0]?.health_check !== 1) {
            throw new Error('Health check query returned unexpected result')
        }
        console.log('✅ Database connection successful!')

        // Check PostgreSQL version
        const versionResult = await pool.query('SELECT version()')
        const version = versionResult.rows[0]?.version
        console.log(`📊 PostgreSQL version: ${version?.split(' ')[1] || 'Unknown'}`)

        // Check if pgvector extension is available
        const extensionAvailable = await pool.query(`
            SELECT EXISTS(
                SELECT 1 FROM pg_available_extensions 
                WHERE name = 'vector'
            ) as pgvector_available
        `)

        if (!extensionAvailable.rows[0]?.pgvector_available) {
            console.log('❌ pgvector extension not available in this PostgreSQL instance')
            console.log('💡 Install pgvector: https://github.com/pgvector/pgvector#installation')
            return false
        }

        console.log('✅ pgvector extension is available')

        // Check current database name
        const dbNameResult = await pool.query('SELECT current_database()')
        console.log(`🗄️  Connected to database: ${dbNameResult.rows[0]?.current_database}`)
        return true

    } catch (error) {
        console.error('❌ Database health check failed:', (error as Error).message)
        return false
    }
}

const checkAndSeedDatabase = async (): Promise<void> => {
    try {
        // Check if we should seed based on environment variable
        const shouldSeed = process.env.SEED_DATABASE === 'true' || process.env.NODE_ENV === 'development'

        if (!shouldSeed) {
            console.log('ℹ️  Skipping database seeding (set SEED_DATABASE=true to enable)')
            return
        }

        // Check if database is already seeded
        const countResult = await pool.query('SELECT COUNT(*) as count FROM questions')
        const existingCount = parseInt(countResult.rows[0]?.count || '0')

        if (existingCount > 0) {
            console.log(`ℹ️  Database already contains ${existingCount} questions, skipping seeding`)
            console.log('💡 To force re-seeding, truncate the questions table first')
            return
        }

        console.log('🌱 Seeding database with embeddings...')
        await seedEmbeddings()
        console.log('✅ Database seeding completed successfully!')

    } catch (error) {
        console.error('❌ Database seeding failed:', (error as Error).message)
    }
}

const setupDatabase = async (): Promise<boolean> => {
    console.log('🚀 Setting up database schema...')

    try {
        // Enable pgvector extension
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
        console.log('✅ pgvector extension enabled')

        // Check if questions table already exists
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'questions'
            ) as exists
        `)

        if (tableExists.rows[0]?.exists) {
            console.log('ℹ️  Questions table already exists, skipping creation')
            // Still check and seed even if table exists
            await checkAndSeedDatabase()
            return true
        }

        // Create questions table
        await pool.query(`
            CREATE TABLE "questions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "question" text NOT NULL,
                "answer" text NOT NULL,
                "embedding" vector(1536) NOT NULL,
                "created_at" timestamp DEFAULT now(),
                "updated_at" timestamp DEFAULT now()
            )
        `)
        console.log('✅ Questions table created successfully')

        // Verify table structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'questions' 
            ORDER BY ordinal_position
        `)

        console.log('📋 Table structure verified:')
        tableInfo.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type}`)
        })

        // Step 3: Check if we should seed the database
        await checkAndSeedDatabase();

        return true

    } catch (error) {
        console.error('❌ Database setup failed:', (error as Error).message)

        // Provide helpful error context
        if ((error as Error).message.includes('vector')) {
            console.error('💡 Hint: pgvector extension may not be properly installed')
        }
        if ((error as Error).message.includes('permission')) {
            console.error('💡 Hint: Database user may need CREATE EXTENSION privileges')
        }

        return false
    }
}

// Main initialization function
const initializeDatabase = async () => {
    console.log('🔄 Initializing database...\n')

    try {
        // Step 1: Health check
        const healthCheckPassed = await performHealthCheck()
        if (!healthCheckPassed) {
            console.error('\n💥 Exiting due to health check failure')
            process.exit(1)
        }

        // Step 2: Setup database schema
        const setupSuccess = await setupDatabase()
        if (!setupSuccess) {
            console.error('\n💥 Exiting due to database setup failure')
            process.exit(1)
        }

        console.log('\n🎉 Database initialization completed successfully!')

    } catch (error) {
        console.error('\n💥 Unexpected error during database initialization:', (error as Error).message)
        process.exit(1)
    } finally {
        // Don't close pool here - keep it open for the application
        console.log('🔌 Database ready for application use')
    }
}


initializeDatabase()


export { db, schema, pool, initializeDatabase, performHealthCheck, setupDatabase, checkAndSeedDatabase }