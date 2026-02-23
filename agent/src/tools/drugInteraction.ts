import { tool } from "ai";
import { z } from "zod";

export type DrugInteractionResult = {
  drug1: string;
  drug2: string;
  interactions: string[];
  severity: "none" | "mild" | "moderate" | "severe";
  source: "OpenFDA";
  error?: string;
};

async function fetchDrugWarnings(drugName: string): Promise<string[]> {
  const encoded = encodeURIComponent(drugName.toLowerCase());
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encoded}"&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as {
    results?: Array<{ drug_interactions?: string[] }>;
  };

  const label = data.results?.[0];
  if (!label) return [];
  return label.drug_interactions ?? [];
}

function inferSeverity(interactions: string[]): "none" | "mild" | "moderate" | "severe" {
  if (interactions.length === 0) return "none";

  const text = interactions.join(" ").toLowerCase();

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

export const drugInteractionTool = tool({
  description:
    "Check for drug-drug interactions between two medications using OpenFDA label data. Returns interaction descriptions and a severity rating.",
  inputSchema: z.object({
    drug1: z.string().describe("Name of the first drug (generic or brand)"),
    drug2: z.string().describe("Name of the second drug (generic or brand)"),
  }),
  execute: async ({ drug1, drug2 }): Promise<DrugInteractionResult> => {
    try {
      const [warnings1, warnings2] = await Promise.all([
        fetchDrugWarnings(drug1),
        fetchDrugWarnings(drug2),
      ]);

      const drug2Lower = drug2.toLowerCase();
      const drug1Lower = drug1.toLowerCase();

      const relevant1 = warnings1
        .filter((w) => w.toLowerCase().includes(drug2Lower))
        .map((w) => w.slice(0, 500));

      const relevant2 = warnings2
        .filter((w) => w.toLowerCase().includes(drug1Lower))
        .map((w) => w.slice(0, 500));

      const interactions = [...relevant1, ...relevant2];

      // If no cross-references found, include any interaction warnings as context
      const allWarnings =
        interactions.length > 0
          ? interactions
          : [...warnings1.slice(0, 1), ...warnings2.slice(0, 1)].map((w) =>
              w.slice(0, 300),
            );

      return {
        drug1,
        drug2,
        interactions: allWarnings,
        severity: inferSeverity(allWarnings),
        source: "OpenFDA",
      };
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
