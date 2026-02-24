import "dotenv/config";
import express from "express";
import cors from "cors";
import { runAgent } from "./agent.js";

const app = express();
const PORT = process.env.AGENT_PORT ? parseInt(process.env.AGENT_PORT) : 3001;

app.use(cors({ origin: ["http://localhost:8300", "https://localhost:9300"] }));
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const sid = sessionId && typeof sessionId === "string" ? sessionId : `session-${Date.now()}`;

  const result = await runAgent(message, sid);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`AI agent server listening on http://localhost:${PORT}`);
});
