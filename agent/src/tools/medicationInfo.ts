import { tool } from "ai";
import { z } from "zod";

export type MedicationInfoResult = {
  rxcui: string;
  name: string;
  drugClass: string[];
  dosageForms: string[];
  source: "RxNorm";
  error?: string;
};

async function fetchRxCUI(drugName: string): Promise<string | null> {
  const encoded = encodeURIComponent(drugName);
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encoded}&search=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    idGroup?: { rxnormId?: string[] };
  };
  return data.idGroup?.rxnormId?.[0] ?? null;
}

async function fetchDrugClass(drugName: string): Promise<string[]> {
  const encoded = encodeURIComponent(drugName);
  const url = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json?drugName=${encoded}&relaSource=MEDRT`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    rxclassDrugInfoList?: {
      rxclassDrugInfo?: Array<{
        rxclassMinConceptItem?: { className?: string };
      }>;
    };
  };
  const infos = data.rxclassDrugInfoList?.rxclassDrugInfo ?? [];
  const classes = infos
    .map((i) => i.rxclassMinConceptItem?.className)
    .filter((c): c is string => !!c);
  return [...new Set(classes)].slice(0, 5);
}

async function fetchDosageForms(rxcui: string): Promise<string[]> {
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=DF`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    relatedGroup?: {
      conceptGroup?: Array<{
        conceptProperties?: Array<{ name?: string }>;
      }>;
    };
  };
  const groups = data.relatedGroup?.conceptGroup ?? [];
  const forms: string[] = [];
  for (const g of groups) {
    for (const p of g.conceptProperties ?? []) {
      if (p.name) forms.push(p.name);
    }
  }
  return [...new Set(forms)].slice(0, 5);
}

export const medicationInfoTool = tool({
  description:
    "Look up medication information from RxNorm including drug class and dosage forms for a given drug name.",
  inputSchema: z.object({
    drugName: z
      .string()
      .describe("Generic or brand name of the medication to look up"),
  }),
  execute: async ({ drugName }): Promise<MedicationInfoResult> => {
    try {
      const rxcui = await fetchRxCUI(drugName);
      if (!rxcui) {
        return {
          rxcui: "",
          name: drugName,
          drugClass: [],
          dosageForms: [],
          source: "RxNorm",
          error: `No RxCUI found for "${drugName}"`,
        };
      }

      const [drugClass, dosageForms] = await Promise.all([
        fetchDrugClass(drugName),
        fetchDosageForms(rxcui),
      ]);

      return {
        rxcui,
        name: drugName,
        drugClass,
        dosageForms,
        source: "RxNorm",
      };
    } catch (err) {
      return {
        rxcui: "",
        name: drugName,
        drugClass: [],
        dosageForms: [],
        source: "RxNorm",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
