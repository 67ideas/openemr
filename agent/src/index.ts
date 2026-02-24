import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runAgent } from "./agent.js";
import { clearSession } from "./memory/conversationStore.js";

const SESSION_ID = "cli-session";

const rl = readline.createInterface({ input, output });

console.log("OpenEMR Clinical AI Agent");
console.log('Type your clinical query below. Type "exit" to quit, "clear" to reset history.\n');

async function main() {
  while (true) {
    const userInput = await rl.question("You: ");
    const trimmed = userInput.trim();

    if (trimmed === "exit" || trimmed === "quit") {
      console.log("Goodbye.");
      rl.close();
      break;
    }

    if (trimmed === "clear") {
      clearSession(SESSION_ID);
      console.log("Session history cleared.\n");
      continue;
    }

    if (!trimmed) continue;

    try {
      const { text, escalated, confidenceScore } = await runAgent(trimmed, SESSION_ID);
      if (escalated) {
        console.log("\n[ESCALATED — HIGH-RISK OUTPUT]");
      }
      console.log(`\nAgent: ${text}`);
      console.log(`[Confidence: ${confidenceScore}/100]\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n[Error] ${msg}\n`);
    }
  }
}

main().catch(console.error);
