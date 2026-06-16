import express from "express";
import cors from "cors";
import pathwayRoutes from "./routes/pathways.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(requestId);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "neuropathways-backend" });
});

app.use("/api", pathwayRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Neuropathways backend running on port ${PORT}`);
});
