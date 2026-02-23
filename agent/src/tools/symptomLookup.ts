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
    "Look up medical problems, conditions, and symptoms recorded in OpenEMR. When a patientUuid is provided, returns that patient's active problem list. Without a patientUuid, searches across all medical problems by title or ICD-10 code.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Condition name or ICD-10 code to search for (e.g. 'hypertension' or 'I10')"),
    patientUuid: z
      .string()
      .optional()
      .describe("OpenEMR patient UUID to retrieve that patient's specific problem list"),
  }),
  execute: async ({ query, patientUuid }): Promise<SymptomLookupResult> => {
    try {
      const baseUrl = process.env.OPENEMR_BASE_URL ?? "http://localhost:8300";
      const token = await getOpenEMRToken();

      const urlBase = patientUuid
        ? `${baseUrl}/apis/default/api/patient/${encodeURIComponent(patientUuid)}/medical_problem`
        : `${baseUrl}/apis/default/api/medical_problem`;

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
