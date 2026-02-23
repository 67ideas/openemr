import { tool } from "ai";
import { z } from "zod";
import { getOpenEMRToken } from "../openemr/auth.js";

export type ProviderSearchResult = {
  providers: Array<{
    uuid: string;
    fname: string;
    lname: string;
    specialty: string;
    npi: string;
    phone: string;
    email: string;
  }>;
  total: number;
  source: "OpenEMR";
  error?: string;
};

type OpenEMRPractitioner = {
  uuid?: string;
  fname?: string;
  lname?: string;
  specialty?: string;
  npi?: string;
  phone?: string;
  email?: string;
};

export const providerSearchTool = tool({
  description:
    "Search for healthcare providers (practitioners) in OpenEMR by name, specialty, or NPI number.",
  inputSchema: z.object({
    name: z
      .string()
      .optional()
      .describe("Provider first or last name to search for"),
    specialty: z
      .string()
      .optional()
      .describe("Medical specialty (e.g. 'cardiology', 'internal medicine')"),
    npi: z
      .string()
      .optional()
      .describe("National Provider Identifier (NPI) number"),
  }),
  execute: async ({ name, specialty, npi }): Promise<ProviderSearchResult> => {
    try {
      const baseUrl = process.env.OPENEMR_BASE_URL ?? "http://localhost:8300";
      const token = await getOpenEMRToken();

      const params = new URLSearchParams();
      if (name) {
        // Search both first and last name fields
        params.set("lname", name);
      }
      if (specialty) params.set("specialty", specialty);
      if (npi) params.set("npi", npi);

      const url = `${baseUrl}/apis/default/api/practitioner${params.toString() ? `?${params}` : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          providers: [],
          total: 0,
          source: "OpenEMR",
          error: `OpenEMR request failed (${res.status}): ${body}`,
        };
      }

      const data = (await res.json()) as { data?: OpenEMRPractitioner[] };
      const raw = data.data ?? [];

      const providers = raw.map((p) => ({
        uuid: p.uuid ?? "",
        fname: p.fname ?? "",
        lname: p.lname ?? "",
        specialty: p.specialty ?? "",
        npi: p.npi ?? "",
        phone: p.phone ?? "",
        email: p.email ?? "",
      }));

      return { providers, total: providers.length, source: "OpenEMR" };
    } catch (err) {
      return {
        providers: [],
        total: 0,
        source: "OpenEMR",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
