import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { experimental_transcribe as transcribe } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { runAgent, braintrustLogger } from "./agent.js";

const sttClient = createOpenAI({ apiKey: process.env.OPENAI_STT_KEY });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "../public/index.html");

const app = express();
const PORT = parseInt(process.env.PORT ?? process.env.AGENT_PORT ?? "3001");

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3001", "http://localhost:8300", "https://localhost:9300"];
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

const AGENT_API_KEY = process.env.AGENT_API_KEY;

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!AGENT_API_KEY) {
    next();
    return;
  }
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token !== AGENT_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/", (_req, res) => {
  res.send(fs.readFileSync(htmlPath, "utf-8"));
});

app.post("/chat", requireAuth, async (req, res) => {
  const { message, sessionId, patientContext } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const sid = sessionId && typeof sessionId === "string" ? sessionId : `session-${Date.now()}`;

  const result = await runAgent(message, sid, patientContext ?? null);
  res.json(result);
});

app.post("/feedback", requireAuth, async (req, res) => {
  const { spanId, score, comment } = req.body;

  if (score !== 1 && score !== -1) {
    res.status(400).json({ error: "score (1 or -1) is required" });
    return;
  }

  if (braintrustLogger && spanId) {
    try {
      braintrustLogger.logFeedback({
        id: spanId,
        scores: { user_rating: (score + 1) / 2 },
        comment: comment ?? undefined,
      });
    } catch {
      console.error("Failed to log feedback to Braintrust");
    }
  }

  res.json({ ok: true });
});

app.post("/transcribe", requireAuth, express.raw({ type: "audio/*", limit: "25mb" }), async (req, res) => {
  const contentType = req.headers["content-type"] ?? "audio/webm";
  const audioBuffer = req.body as Buffer;

  if (!audioBuffer || audioBuffer.length === 0) {
    res.status(400).json({ error: "audio body is required" });
    return;
  }

  const result = await transcribe({
    model: sttClient.transcription("whisper-1"),
    audio: audioBuffer,
    providerOptions: { openai: { language: "en" } },
  });

  res.json({ text: result.text });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`AI agent server listening on http://localhost:${PORT}`);
});
