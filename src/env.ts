import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  DEV_PORT: z.string().default("4141"),
  PROD_PORT: z.string().default("4141"),
  POSTGRES_IMAGE: z.string().default("postgres:17"),
  POSTGRES_CONTAINER: z.string().default("ai-tutor-postgres"),
  POSTGRES_DB: z.string().default("ai_tutor_db"),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("password"),
  POSTGRES_PORT: z.string().default("5432"),
  DATABASE_URL: z.string().optional(),
  PORT: z.string().optional()
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:\n", parsed.error.format());
    throw new Error("Environment validation failed");
  }
  // Return typed env
  return parsed.data;
}
