import Elysia from "elysia";
import { registerRoutes } from "./routes";
import { validateEnv } from "./env";
import { swagger } from "@elysiajs/swagger";

// Validate env at startup
const env = validateEnv();

const app = new Elysia().use(swagger());

registerRoutes(app);

const port = env.NODE_ENV === 'production' ? env.PROD_PORT : env.DEV_PORT;

app.listen(Number(port));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
