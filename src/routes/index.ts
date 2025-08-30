import { Elysia } from "elysia";
import {healthController} from "../controller/healthHandler";
import { postHandler } from "../controller/postController";

export function registerRoutes(app: Elysia) {
  app.get("/health", healthController);

  app.post("/post", postHandler);
}
