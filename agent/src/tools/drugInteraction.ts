import { tool } from "ai";
import { z } from "zod";
import { getOpenEMRToken } from "../openemr/auth.js";

export type DrugInteractionResult = {
  drug1: string;
  drug2: string;
  interactions: string[];
  severity: "none" | "mild" | "moderate" | "severe";
  source: "OpenFDA" | "RxNorm";
  error?: string;
};

// --- OpenFDA path (no patient context) ---

async function fetchDrugWarnings(drugName: string): Promise<string[]> {
  const encoded = encodeURIComponent(drugName.toLowerCase());
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encoded}"&limit=1`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{ drug_interactions?: string[] }>;
  };
  return data.results?.[0]?.drug_interactions ?? [];
}

function inferSeverityFromText(text: string): "none" | "mild" | "moderate" | "severe" {
  if (
    text.includes("fatal") ||
    text.includes("life-threatening") ||
    text.includes("contraindicated") ||
    text.includes("severe bleeding") ||
    text.includes("serious")
  ) {
    return "severe";
  }
  if (
    text.includes("increase") ||
    text.includes("decrease") ||
    text.includes("caution") ||
    text.includes("monitor")
  ) {
    return "moderate";
  }
  return "mild";
}

function inferSeverity(interactions: string[]): "none" | "mild" | "moderate" | "severe" {
  if (interactions.length === 0) return "none";
  return inferSeverityFromText(interactions.join(" ").toLowerCase());
}

async function checkInteractionsViaOpenFDA(drug1: string, drug2: string): Promise<DrugInteractionResult> {
  const [warnings1, warnings2] = await Promise.all([
    fetchDrugWarnings(drug1),
    fetchDrugWarnings(drug2),
  ]);

  const relevant1 = warnings1
    .filter((w) => w.toLowerCase().includes(drug2.toLowerCase()))
    .map((w) => w.slice(0, 500));

  const relevant2 = warnings2
    .filter((w) => w.toLowerCase().includes(drug1.toLowerCase()))
    .map((w) => w.slice(0, 500));

  const interactions = [...relevant1, ...relevant2];
  const allWarnings =
    interactions.length > 0
      ? interactions
      : [...warnings1.slice(0, 1), ...warnings2.slice(0, 1)].map((w) => w.slice(0, 300));

  return {
    drug1,
    drug2,
    interactions: allWarnings,
    severity: inferSeverity(allWarnings),
    source: "OpenFDA",
  };
}

// --- RxNorm path (with patient context) ---

type RxNormInteraction = {
  description: string;
  severity?: string;
  comment?: string;
};

type RxNormInteractionResponse = {
  fullInteractionTypeGroup?: Array<{
    fullInteractionType?: Array<{
      interactionPair?: Array<{
        description: string;
        severity?: string;
        comment?: string;
      }>;
    }>;
  }>;
};

async function fetchPatientRxCuis(patientId: string): Promise<string[]> {
  const baseUrl = process.env.OPENEMR_BASE_URL ?? "http://localhost:8300";
  const token = await getOpenEMRToken();

  const res = await fetch(
    `${baseUrl}/apis/default/api/patient/${encodeURIComponent(patientId)}/medication`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    data?: Array<{ rxnorm_drugcode?: string; drug?: string }>;
  };

  return (data.data ?? [])
    .map((m) => m.rxnorm_drugcode)
    .filter((code): code is string => Boolean(code));
}

async function checkInteractionsViaRxNorm(
  drug1: string,
  drug2: string,
  patientId: string
): Promise<DrugInteractionResult> {
  // Get patient's actual RxCUI codes from OpenEMR
  const rxcuis = await fetchPatientRxCuis(patientId);

  if (rxcuis.length === 0) {
    // Fall back to OpenFDA if no RxNorm codes on file
    return checkInteractionsViaOpenFDA(drug1, drug2);
  }

  const res = await fetch(
    `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join("+")}`
  );

  if (!res.ok) {
    return checkInteractionsViaOpenFDA(drug1, drug2);
  }

  const data = (await res.json()) as RxNormInteractionResponse;
  const pairs: RxNormInteraction[] =
    data.fullInteractionTypeGroup?.flatMap(
      (g) => g.fullInteractionType?.flatMap((t) => t.interactionPair ?? []) ?? []
    ) ?? [];

  const drug1Lower = drug1.toLowerCase();
  const drug2Lower = drug2.toLowerCase();

  const relevant = pairs.filter((p) => {
    const desc = p.description.toLowerCase();
    return desc.includes(drug1Lower) || desc.includes(drug2Lower);
  });

  const interactions = (relevant.length > 0 ? relevant : pairs.slice(0, 3)).map(
    (p) => `${p.description}${p.severity ? ` [${p.severity}]` : ""}`
  );

  const severityText = relevant.map((p) => p.severity ?? "").join(" ").toLowerCase();
  let severity: "none" | "mild" | "moderate" | "severe" = "none";
  if (interactions.length > 0) {
    if (severityText.includes("high") || severityText.includes("contraindicated")) {
      severity = "severe";
    } else if (severityText.includes("moderate")) {
      severity = "moderate";
    } else if (interactions.length > 0) {
      severity = "mild";
    }
  }

  return { drug1, drug2, interactions, severity, source: "RxNorm" };
}

// --- Tool definition ---

export const drugInteractionTool = tool({
  description:
    "Check for drug-drug interactions between two medications. When a patientId is provided, fetches the patient's actual medications from OpenEMR and uses RxNorm interaction data. Without a patientId, falls back to OpenFDA label data.",
  inputSchema: z.object({
    drug1: z.string().describe("Name of the first drug (generic or brand)"),
    drug2: z.string().describe("Name of the second drug (generic or brand)"),
    patientId: z
      .string()
      .optional()
      .describe("OpenEMR patient UUID to use the patient's actual medication list"),
  }),
  execute: async ({ drug1, drug2, patientId }): Promise<DrugInteractionResult> => {
    try {
      if (patientId) {
        return await checkInteractionsViaRxNorm(drug1, drug2, patientId);
      }
      return await checkInteractionsViaOpenFDA(drug1, drug2);
    } catch (err) {
      return {
        drug1,
        drug2,
        interactions: [],
        severity: "none",
        source: "OpenFDA",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
