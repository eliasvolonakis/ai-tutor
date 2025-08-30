import { Elysia } from "elysia";
import { postHandler } from "../controller/postController";
import {healthController} from "../controller/healthHandler";

export function registerRoutes(app: Elysia) {
  app.get("/health", healthController);

  app.post("/post", postHandler);
}
