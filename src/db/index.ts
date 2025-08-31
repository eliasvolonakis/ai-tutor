import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const checkDbConnection = async () => {
    try {
        await pool.query('SELECT 1')
        console.log('✅ Database connection successful!')
    } catch (error) {
        console.error('❌ Database connection failed:', (error as Error).message)
        process.exit(1)
    }
}

// Call the health check function immediately
checkDbConnection()

export const db = drizzle(pool, { schema })

export { schema }