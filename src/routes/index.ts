import { Elysia } from "elysia";
import {
  createEmbedding,
  getEmbeddings,
  getEmbeddingById,
  updateEmbedding,
  deleteEmbedding
} from "../controller/embeddingController";
import { healthController } from "../controller/healthHandler";
import { convertImageToLatex } from "../controller/mathImageController";
import { postHandler } from "../controller/postController";

export function registerRoutes(app: Elysia) {
  app.get("/health", healthController);
  app.post("/post", postHandler);

  // Embedding routes
  app.post("/embeddings", createEmbedding);
  app.get("/embeddings", getEmbeddings);
  app.get("/embeddings/:id", getEmbeddingById);
  app.put("/embeddings/:id", updateEmbedding);
  app.delete("/embeddings/:id", deleteEmbedding);

  // Math image processing routes
  app.post("/convert-to-latex", convertImageToLatex);
}
