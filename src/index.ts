import { swagger } from "@elysiajs/swagger";
import { drizzle } from 'drizzle-orm/node-postgres';
import Elysia from "elysia";
import {Pool} from "pg";
import { validateEnv } from "./env";
import { registerRoutes } from "./routes";

// Validate env at startup
const env = validateEnv();

const app = new Elysia().use(swagger());

registerRoutes(app);

const port = env.NODE_ENV === 'production' ? env.PROD_PORT : env.DEV_PORT;

app.listen(Number(port));

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle({client: pool});
const result = await db.execute(`select 1`);
console.log(result)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
