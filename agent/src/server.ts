import "dotenv/config";
import express from "express";
import cors from "cors";
import { runAgent } from "./agent.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? process.env.AGENT_PORT ?? "3001");

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:8300", "https://localhost:9300"];
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, sessionId, patientContext } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const sid = sessionId && typeof sessionId === "string" ? sessionId : `session-${Date.now()}`;

  const result = await runAgent(message, sid, patientContext ?? null);
  res.json(result);
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`AI agent server listening on http://localhost:${PORT}`);
});
