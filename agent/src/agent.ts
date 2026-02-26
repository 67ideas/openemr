import "dotenv/config";
import { generateText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const gateway = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});
import { initLogger, traced } from "braintrust";
import { appendMessage, getHistory } from "./memory/conversationStore.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let braintrustLogger: any = null;
if (process.env.BRAINTRUST_API_KEY) {
  braintrustLogger = initLogger({
    projectName: "clinical-agent",
    asyncFlush: true,
  });
}
import { drugInteractionTool } from "./tools/drugInteraction.js";
import { icd10LookupTool } from "./tools/icd10Lookup.js";
import { medicationInfoTool } from "./tools/medicationInfo.js";
import { symptomLookupTool } from "./tools/symptomLookup.js";
import { providerSearchTool } from "./tools/providerSearch.js";
import { pubmedSearchTool } from "./tools/pubmedSearch.js";
import { appointmentAvailabilityTool } from "./tools/appointmentAvailability.js";
import { insuranceCoverageTool } from "./tools/insuranceCoverage.js";
import {
  buildSafetyPrefix,
  verifyDrugInteractionResult,
} from "./verification/domainChecks.js";
import type { DrugInteractionResult } from "./tools/drugInteraction.js";
import type { InsuranceCoverageResult } from "./tools/insuranceCoverage.js";
import { createEscalationTask } from "./tools/createOpenEMRTask.js";

const CLINICAL_SYSTEM_PROMPT = `You are a clinical decision-support assistant helping healthcare professionals with informational queries.

You have access to the following tools:
- drugInteractionTool: Check for interactions between two drugs. Accepts an optional patientId (numeric PID) to use that patient's actual medication list from OpenEMR and query RxNorm; without a patientId uses OpenFDA label data.
- icd10LookupTool: Look up ICD-10-CM codes by symptom or condition name using the NLM public API.
- medicationInfoTool: Get RxNorm drug class and dosage form information for a medication.
- symptomLookupTool: Search medical problems and conditions recorded in OpenEMR by name or ICD-10 code across all patients. The current patient's problem list is already provided in the patient context above — use this tool only when searching for a specific condition by name.
- providerSearchTool: Search for healthcare providers (practitioners) in OpenEMR by name, specialty, or NPI number.
- pubmedSearchTool: Search PubMed biomedical literature. Supports full PubMed query syntax with field tags (MeSH, title/abstract, publication type, date ranges). Use for evidence-based research, finding clinical studies, or literature on a diagnosis or treatment.
- appointmentAvailabilityTool: Check available and booked appointment slots for a provider in OpenEMR. Accepts provider name, specialty, a specific date, or a date range (YYYY-MM-DD). Returns 30-minute slots within 09:00–17:00 working hours. Each available slot has a bookingLinks entry — always render available slots as markdown links using those URLs, e.g. [09:00](http://...).
- insuranceCoverageTool: Look up a patient’s insurance coverage in OpenEMR by patient PID. Returns primary, secondary, and/or tertiary insurance details including plan name, plan ID, policy number, copay, and deductible. Accepts an optional cptCode parameter to check whether a specific CPT procedure code is covered under the patient’s plan (returns coverage status: covered, not_covered, or prior_auth_required, plus any referral or notes).

Guidelines:
- Always use tools to retrieve factual clinical data rather than relying on your own memory
- Present drug interaction findings with their severity level
- Always cite the data source (OpenFDA, RxNorm, NLM ICD-10-CM, OpenEMR)
- When citing PubMed articles, always format the link as a markdown hyperlink using the url field, e.g. [PMID 12345678](https://pubmed.ncbi.nlm.nih.gov/12345678/)
- If a tool returns an error, acknowledge it gracefully and explain what information could not be retrieved
- This system uses synthetic patient data for development purposes only
- Never provide definitive medical advice — always recommend consulting a licensed clinician
- When asked about insurance or procedure coverage and no patient context is loaded, ask the user for the patient's PID (numeric ID) before calling insuranceCoverageTool — never refuse to look up insurance just because no patient is in context
- When a CPT code is not explicitly provided but the user asks about a specific procedure, infer the most relevant CPT code and pass it as cptCode to insuranceCoverageTool
- When coverage is unclear (procedureCoverage is null, coverageStatus is "prior_auth_required", or coverageStatus is "not_covered"), recommend that the user contact the insurer directly. The phone link will be appended automatically — do not add it yourself.

At the end of every response, on its own line, append exactly:
CONFIDENCE: <number>
where <number> is an integer 0–100 reflecting how confident you are in the accuracy and completeness of your answer. Base this on: whether tools returned data (vs. errors or empty results), data source quality, and query specificity. Do not explain the score.`;

export type PatientContext = {
  pid: string;
  name: string;
  pubpid: string;
  dob: string;
  medications?: string[];
  problems?: string[];
};

export type ToolCallRecord = {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
};

export type AgentResponse = {
  text: string;
  escalated: boolean;
  confidenceScore: number;
  toolCalls: ToolCallRecord[];
  spanId?: string;
  taskCreated?: boolean;
  taskUrl?: string;
};

export async function runAgent(
  userMessage: string,
  sessionId: string,
  patientContext: PatientContext | null = null,
): Promise<AgentResponse> {
  return traced(
    async (span) => {
      span.log({ input: userMessage, metadata: { sessionId, patientContext } });
      const response = await _runAgent(userMessage, sessionId, patientContext);
      span.log({
        output: response.text,
        scores: { confidence: response.confidenceScore / 100 },
      });
      return { ...response, spanId: span.id };
    },
    { name: "runAgent" },
  );
}

async function _runAgent(
  userMessage: string,
  sessionId: string,
  patientContext: PatientContext | null,
): Promise<AgentResponse> {
  const history = await getHistory(sessionId);

  let escalated = false;
  let safetyPrefix = "";

  let contextBlock = "";
  if (patientContext) {
    const meds = patientContext.medications?.length
      ? patientContext.medications.join(", ")
      : "none on record";
    const probs = patientContext.problems?.length
      ? patientContext.problems.join(", ")
      : "none on record";
    contextBlock = `\n\nCurrent patient context:
- Patient: ${patientContext.name} (PID: ${patientContext.pid})
- ${patientContext.dob}
- Active medications: ${meds}
- Active problems: ${probs}

Use this context to answer questions about the patient directly. When calling tools that accept a patientId or patientPid parameter, use PID ${patientContext.pid}. Do not ask the user for the patient ID.
Insurance data is NOT included in this context — always call insuranceCoverageTool with patientId "${patientContext.pid}" to answer any questions about the patient's insurance, plan, coverage, or procedure eligibility.`;
  }

  const result = await generateText({
    model: gateway.chat("anthropic/claude-haiku-4-5"),
    tools: {
      drugInteractionTool,
      icd10LookupTool,
      medicationInfoTool,
      symptomLookupTool,
      providerSearchTool,
      pubmedSearchTool,
      appointmentAvailabilityTool,
      insuranceCoverageTool,
    },
    stopWhen: stepCountIs(5),
    messages: [...history, { role: "user" as const, content: userMessage }],
    system: CLINICAL_SYSTEM_PROMPT + contextBlock,
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

  await appendMessage(sessionId, { role: "user", content: userMessage });
  await appendMessage(sessionId, { role: "assistant", content: result.text });

  const confidenceMatch = result.text.match(/\nCONFIDENCE:\s*(\d+)\s*$/);
  const confidenceScore = confidenceMatch
    ? Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)))
    : 50;
  const cleanText = result.text
    .replace(/\nCONFIDENCE:\s*\d+\s*$/, "")
    .trimEnd();

  const phoneLinks = result.steps
    .flatMap((step) => step.toolResults ?? [])
    .filter((tr) => tr.toolName === "insuranceCoverageTool")
    .flatMap((tr) => {
      const output = tr.output as InsuranceCoverageResult;
      return (output.insurances ?? [])
        .filter((ins) => ins.phone)
        .map((ins) => {
          const digits = ins.phone!.replace(/\D/g, "");
          return `[Call ${ins.provider} Member Services](tel:${digits})`;
        });
    });

  const uniquePhoneLinks = [...new Set(phoneLinks)];
  const phoneBlock = uniquePhoneLinks
    .filter((link) => !cleanText.includes(link))
    .join("\n");
  const textWithPhones = phoneBlock
    ? `${cleanText}\n\n${phoneBlock}`
    : cleanText;

  const finalText = safetyPrefix
    ? `${safetyPrefix}${textWithPhones}`
    : textWithPhones;

  const toolCalls: ToolCallRecord[] = result.steps.flatMap((step) =>
    (step.toolCalls ?? []).map((tc) => {
      const tr = (step.toolResults ?? []).find(
        (r) => r.toolCallId === tc.toolCallId,
      );
      return {
        name: tc.toolName,
        input: tc.input as Record<string, unknown>,
        output: tr?.output ?? null,
      };
    }),
  );

  let taskCreated = false;
  let taskUrl: string | undefined;

  if (escalated && patientContext) {
    const taskResult = await createEscalationTask(
      patientContext,
      safetyPrefix || "High-risk clinical finding detected by AI agent",
    );
    taskCreated = taskResult.created;
    taskUrl = taskResult.taskUrl;
  }

  return {
    text: finalText,
    escalated,
    confidenceScore,
    toolCalls,
    taskCreated,
    taskUrl,
  };
}
