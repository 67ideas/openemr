import { tool } from "ai";
import { z } from "zod";
import { getOpenEMRToken } from "../openemr/auth.js";

export type SymptomLookupResult = {
  results: Array<{
    uuid: string;
    title: string;
    diagnosis: string;
    begdate: string | null;
    activity: string;
  }>;
  total: number;
  source: "OpenEMR";
  error?: string;
};

type OpenEMRCondition = {
  uuid?: string;
  title?: string;
  diagnosis?: string;
  begdate?: string | null;
  activity?: string | number;
};

export const symptomLookupTool = tool({
  description:
    "Search medical problems and conditions recorded in OpenEMR by title or ICD-10 code across all patients. Use this to search for a specific condition by name, not to list a specific patient's problems (those are already in the patient context).",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Condition name or ICD-10 code to search for (e.g. 'hypertension' or 'I10')"),
  }),
  execute: async ({ query }): Promise<SymptomLookupResult> => {
    try {
      const baseUrl = process.env.OPENEMR_BASE_URL ?? "http://localhost:8300";
      const token = await getOpenEMRToken();

      const urlBase = `${baseUrl}/apis/default/api/medical_problem`;

      const params = new URLSearchParams();
      if (query) params.set("title", query);

      const url = params.toString() ? `${urlBase}?${params}` : urlBase;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          results: [],
          total: 0,
          source: "OpenEMR",
          error: `OpenEMR request failed (${res.status}): ${body}`,
        };
      }

      const data = (await res.json()) as { data?: OpenEMRCondition[] };
      const raw = data.data ?? [];

      const results = raw.map((c) => ({
        uuid: c.uuid ?? "",
        title: c.title ?? "",
        diagnosis: c.diagnosis ?? "",
        begdate: c.begdate ?? null,
        activity: String(c.activity ?? ""),
      }));

      return { results, total: results.length, source: "OpenEMR" };
    } catch (err) {
      return {
        results: [],
        total: 0,
        source: "OpenEMR",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
