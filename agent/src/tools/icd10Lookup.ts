import { tool } from "ai";
import { z } from "zod";

export type ICD10Result = {
  results: Array<{ code: string; description: string }>;
  total: number;
  source: "NLM ICD-10-CM";
  error?: string;
};

export const icd10LookupTool = tool({
  description:
    "Search ICD-10-CM codes by symptom, condition, or keyword using the NLM clinical tables API. Returns matching codes with descriptions.",
  inputSchema: z.object({
    query: z.string().describe("Symptom, condition, or keyword to search for"),
    maxResults: z
      .number()
      .optional()
      .describe("Maximum number of results to return (default 5)"),
  }),
  execute: async ({ query, maxResults = 5 }): Promise<ICD10Result> => {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encoded}&maxList=${maxResults}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`NLM API error: ${res.status}`);
      }

      // Response format: [total, [codes], null, [[code, description], ...]]
      const data = (await res.json()) as [
        number,
        string[],
        null,
        Array<[string, string]>,
      ];

      const total = data[0] ?? 0;
      const items = data[3] ?? [];

      const results = items.map(([code, description]) => ({
        code,
        description,
      }));

      return { results, total, source: "NLM ICD-10-CM" };
    } catch (err) {
      return {
        results: [],
        total: 0,
        source: "NLM ICD-10-CM",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
