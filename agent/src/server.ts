import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { runAgent } from "./agent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "../public/index.html");
const html = fs.readFileSync(htmlPath, "utf-8");

const app = express();
const PORT = parseInt(process.env.PORT ?? process.env.AGENT_PORT ?? "3001");

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3001", "http://localhost:8300", "https://localhost:9300"];
app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.get("/", (_req, res) => {
  res.send(html);
});

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
