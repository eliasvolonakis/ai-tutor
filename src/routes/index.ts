import { Elysia } from "elysia";
import { postHandler } from "../controller/postController";

export function registerRoutes(app: Elysia) {
  app.get("/health", () => 200);

  app.post("/post", postHandler);
}
