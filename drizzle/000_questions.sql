-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the questions table
CREATE TABLE "questions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "question" text NOT NULL,
    "answer" text NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);