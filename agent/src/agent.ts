import "dotenv/config";
import { generateText, gateway, stepCountIs } from "ai";
import { appendMessage, getHistory } from "./memory/conversationStore.js";
import { drugInteractionTool } from "./tools/drugInteraction.js";
import { icd10LookupTool } from "./tools/icd10Lookup.js";
import { medicationInfoTool } from "./tools/medicationInfo.js";
import { symptomLookupTool } from "./tools/symptomLookup.js";
import { providerSearchTool } from "./tools/providerSearch.js";
import {
  buildSafetyPrefix,
  verifyDrugInteractionResult,
} from "./verification/domainChecks.js";
import type { DrugInteractionResult } from "./tools/drugInteraction.js";

const CLINICAL_SYSTEM_PROMPT = `You are a clinical decision-support assistant helping healthcare professionals with informational queries.

You have access to the following tools:
- drugInteractionTool: Check for interactions between two drugs. Accepts an optional patientId to use that patient's actual medication list from OpenEMR and query RxNorm; without a patientId uses OpenFDA label data.
- icd10LookupTool: Look up ICD-10-CM codes by symptom or condition name using the NLM public API.
- medicationInfoTool: Get RxNorm drug class and dosage form information for a medication.
- symptomLookupTool: Search medical problems and conditions recorded in OpenEMR. Accepts an optional patientUuid to retrieve a specific patient's problem list, or a query string to search across all conditions.
- providerSearchTool: Search for healthcare providers (practitioners) in OpenEMR by name, specialty, or NPI number.

Guidelines:
- Always use tools to retrieve factual clinical data rather than relying on your own memory
- Present drug interaction findings with their severity level
- Always cite the data source (OpenFDA, RxNorm, NLM ICD-10-CM, OpenEMR)
- If a tool returns an error, acknowledge it gracefully and explain what information could not be retrieved
- This system uses synthetic patient data for development purposes only
- Never provide definitive medical advice — always recommend consulting a licensed clinician`;

export type AgentResponse = {
  text: string;
  escalated: boolean;
};

export async function runAgent(
  userMessage: string,
  sessionId: string,
): Promise<AgentResponse> {
  const history = getHistory(sessionId);

  let escalated = false;
  let safetyPrefix = "";

  const result = await generateText({
    model: gateway("openai/gpt-oss-120b"),
    tools: {
      drugInteractionTool,
      icd10LookupTool,
      medicationInfoTool,
      symptomLookupTool,
      providerSearchTool,
    },
    stopWhen: stepCountIs(5),
    messages: [
      ...history,
      { role: "user" as const, content: userMessage },
    ],
    system: CLINICAL_SYSTEM_PROMPT,
    onStepFinish: async ({ toolResults }) => {
      for (const tr of toolResults) {
        if (tr.toolName === "drugInteractionTool") {
          const interactionResult = tr.output as DrugInteractionResult;
          const verification = verifyDrugInteractionResult(interactionResult);
          if (verification.escalate) {
            escalated = true;
          }
          const prefix = buildSafetyPrefix(verification);
          if (prefix) {
            safetyPrefix = prefix;
          }
        }
      }
    },
  });

  appendMessage(sessionId, { role: "user", content: userMessage });
  appendMessage(sessionId, { role: "assistant", content: result.text });

  const finalText = safetyPrefix ? `${safetyPrefix}${result.text}` : result.text;

  return { text: finalText, escalated };
}
