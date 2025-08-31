import { Elysia } from "elysia";
import {
  createEmbedding,
  getEmbeddings,
  getEmbeddingById
} from "../controller/embeddingController";
import { healthController } from "../controller/healthHandler";
import { postHandler } from "../controller/postController";

export function registerRoutes(app: Elysia) {
  app.get("/health", healthController);
  app.post("/post", postHandler);

  // Embedding routes
  app.post("/embeddings", createEmbedding);
  app.get("/embeddings", getEmbeddings);
  app.get("/embeddings/:id", getEmbeddingById);
}
