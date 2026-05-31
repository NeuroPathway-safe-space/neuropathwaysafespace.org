import express from "express";
import cors from "cors";
import pathwayRoutes from "./routes/pathways.js";
import medisenseRoutes from "./routes/medisense.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestId);
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "medisense-backend" });
  });

  app.use("/api", pathwayRoutes);
  app.use("/api", medisenseRoutes);
  app.use("/", medisenseRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.statusCode ?? 500).json({ error: err.message ?? "Unexpected server error." });
  });

  return app;
}
