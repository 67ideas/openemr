import { tool } from "ai";
import { z } from "zod";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getOpenEMRToken } from "../openemr/auth.js";

const gateway = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export type RiskFactor = {
  factor: string;
  rationale: string;
  severity: "low" | "moderate" | "high";
  category: "cardiovascular" | "metabolic" | "medication" | "oncologic" | "other";
};

export type RiskFactorsResult = {
  patientId: string;
  riskFactors: RiskFactor[];
  summary: string;
  source: "OpenEMR+AI";
  error?: string;
};

type MedicationRow = { drug?: string; rxnorm_drugcode?: string };
type ProblemRow = { title?: string; diagnosis?: string };
type PatientRow = {
  fname?: string;
  lname?: string;
  DOB?: string;
  sex?: string;
};

async function fetchPatientData(patientId: string): Promise<{
  patient: PatientRow | null;
  medications: string[];
  problems: string[];
}> {
  const baseUrl = process.env.OPENEMR_BASE_URL ?? "http://localhost:8300";
  const token = await getOpenEMRToken();
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  const [patientRes, medRes, problemRes] = await Promise.allSettled([
    fetch(`${baseUrl}/apis/default/api/patient/${encodeURIComponent(patientId)}`, { headers }),
    fetch(`${baseUrl}/apis/default/api/patient/${encodeURIComponent(patientId)}/medication`, { headers }),
    fetch(`${baseUrl}/apis/default/api/patient/${encodeURIComponent(patientId)}/medical_problem`, { headers }),
  ]);

  let patient: PatientRow | null = null;
  if (patientRes.status === "fulfilled" && patientRes.value.ok) {
    const data = (await patientRes.value.json()) as { data?: PatientRow };
    patient = data.data ?? null;
  }

  let medications: string[] = [];
  if (medRes.status === "fulfilled" && medRes.value.ok) {
    const data = (await medRes.value.json()) as { data?: MedicationRow[] };
    medications = (data.data ?? []).map((m) => m.drug ?? "").filter(Boolean);
  }

  let problems: string[] = [];
  if (problemRes.status === "fulfilled" && problemRes.value.ok) {
    const data = (await problemRes.value.json()) as { data?: ProblemRow[] };
    problems = (data.data ?? [])
      .map((p) => p.title ?? p.diagnosis ?? "")
      .filter(Boolean);
  }

  return { patient, medications, problems };
}

function computeAge(dob: string): number | null {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const riskFactorsTool = tool({
  description:
    "Analyze a patient's demographics, active medications, and medical problems to generate a personalized clinical risk factor assessment. Returns ranked risk factors with rationale, severity, and category. Always call this tool when the user asks about patient risk, risk factors, clinical risks, or health risks for the current patient.",
  inputSchema: z.object({
    patientId: z.string().describe("OpenEMR patient PID (numeric)"),
  }),
  execute: async ({ patientId }): Promise<RiskFactorsResult> => {
    try {
      const { patient, medications, problems } = await fetchPatientData(patientId);

      const age = patient?.DOB ? computeAge(patient.DOB) : null;
      const sex = patient?.sex ?? "unknown";
      const ageStr = age !== null ? `${age} years old` : "unknown age";
      const medsStr = medications.length ? medications.join(", ") : "none on record";
      const probsStr = problems.length ? problems.join(", ") : "none on record";

      const prompt = `You are a clinical risk assessment assistant. Based on the following patient data, identify the top clinical risk factors that are SPECIFIC and UNIQUE to this patient. Do not list generic population-level risks. Focus on interactions between their conditions, medications, age, and sex.

Patient demographics: ${sex}, ${ageStr}
Active medications: ${medsStr}
Active medical problems: ${probsStr}

Respond with a JSON object exactly matching this schema (no markdown, no extra text):
{
  "riskFactors": [
    {
      "factor": "short name of the risk",
      "rationale": "1-2 sentence explanation specific to this patient's data",
      "severity": "low" | "moderate" | "high",
      "category": "cardiovascular" | "metabolic" | "medication" | "oncologic" | "other"
    }
  ],
  "summary": "2-3 sentence overall risk summary for this patient"
}

List up to 6 risk factors, ordered from highest to lowest severity. Only include risks that are directly supported by the patient's actual data above.`;

      const result = await generateText({
        model: gateway.chat("anthropic/claude-haiku-4-5"),
        prompt,
      });

      let parsed: { riskFactors: RiskFactor[]; summary: string };
      try {
        parsed = JSON.parse(result.text.trim()) as {
          riskFactors: RiskFactor[];
          summary: string;
        };
      } catch {
        return {
          patientId,
          riskFactors: [],
          summary: result.text.slice(0, 500),
          source: "OpenEMR+AI",
          error: "Failed to parse structured risk factor response",
        };
      }

      return {
        patientId,
        riskFactors: parsed.riskFactors ?? [],
        summary: parsed.summary ?? "",
        source: "OpenEMR+AI",
      };
    } catch (err) {
      return {
        patientId,
        riskFactors: [],
        summary: "",
        source: "OpenEMR+AI",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
