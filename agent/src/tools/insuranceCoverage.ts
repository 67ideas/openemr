import { tool } from "ai";
import { z } from "zod";
import mysql from "mysql2/promise";

export type CoverageDetail = {
  cptCode: string;
  description: string;
  coverageStatus: "covered" | "not_covered" | "prior_auth_required";
  requiresReferral: boolean;
  copayOverride: number | null;
  notes: string | null;
};

export type InsuranceCoverageResult = {
  patientId: string;
  insurances: Array<{
    type: "primary" | "secondary" | "tertiary";
    provider: string;
    planName: string;
    planId: string;
    policyNumber: string;
    groupNumber: string;
    subscriberName: string;
    subscriberDob: string;
    relationship: string;
    effectiveDate: string;
    expirationDate: string;
    copay: string;
    acceptAssignment: string;
    phone: string | null;
    procedureCoverage?: CoverageDetail | null;
  }>;
  source: "OpenEMR";
  error?: string;
};

type InsuranceRow = {
  type: "primary" | "secondary" | "tertiary";
  provider: string;
  plan_name: string;
  policy_number: string;
  group_number: string;
  subscriber_fname: string;
  subscriber_lname: string;
  subscriber_DOB: string;
  subscriber_relationship: string;
  date: string;
  date_end: string;
  copay: string;
  accept_assignment: string;
  phone: string | null;
};

type CoverageRow = {
  cpt_code: string;
  description: string;
  coverage_status: "covered" | "not_covered" | "prior_auth_required";
  requires_referral: number;
  copay_override: string | null;
  notes: string | null;
};

const INSURANCE_TYPES = ["primary", "secondary", "tertiary"] as const;

async function lookupCoverage(planId: string, cptCode: string): Promise<CoverageDetail | null> {
  const conn = await mysql.createConnection({
    host: process.env.OPENEMR_DB_HOST ?? "localhost",
    port: parseInt(process.env.OPENEMR_DB_PORT ?? "8320", 10),
    user: process.env.OPENEMR_DB_USER ?? "openemr",
    password: process.env.OPENEMR_DB_PASSWORD ?? "openemr",
    database: process.env.OPENEMR_DB_NAME ?? "openemr",
  });

  try {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      "SELECT cpt_code, description, coverage_status, requires_referral, copay_override, notes FROM insurance_plan_coverage WHERE plan_id = ? AND cpt_code = ?",
      [planId, cptCode],
    );
    if (!rows.length) return null;
    const row = rows[0] as CoverageRow;
    return {
      cptCode: row.cpt_code,
      description: row.description,
      coverageStatus: row.coverage_status,
      requiresReferral: row.requires_referral === 1,
      copayOverride: row.copay_override !== null ? parseFloat(row.copay_override) : null,
      notes: row.notes ?? null,
    };
  } finally {
    await conn.end();
  }
}

export const insuranceCoverageTool = tool({
  description:
    "Look up a patient's insurance coverage from OpenEMR. Returns primary, secondary, and/or tertiary insurance details including plan name, plan ID, policy number, copay, deductible, and the insurance company's member-services phone number. Optionally pass a CPT procedure code to check whether that specific procedure is covered under the patient's plan.",
  inputSchema: z.object({
    patientId: z
      .string()
      .describe("The patient's numeric PID in OpenEMR"),
    type: z
      .enum(["primary", "secondary", "tertiary", "all"])
      .optional()
      .default("all")
      .describe("Which insurance tier to retrieve. Defaults to 'all'."),
    cptCode: z
      .string()
      .optional()
      .describe("CPT procedure code to check for coverage (e.g. '99213', '27447'). Optional."),
  }),
  execute: async ({ patientId, type = "all", cptCode }): Promise<InsuranceCoverageResult> => {
    const conn = await mysql.createConnection({
      host: process.env.OPENEMR_DB_HOST ?? "localhost",
      port: parseInt(process.env.OPENEMR_DB_PORT ?? "8320", 10),
      user: process.env.OPENEMR_DB_USER ?? "openemr",
      password: process.env.OPENEMR_DB_PASSWORD ?? "openemr",
      database: process.env.OPENEMR_DB_NAME ?? "openemr",
    });

    try {
      const typesToFetch = type === "all" ? INSURANCE_TYPES : [type as "primary" | "secondary" | "tertiary"];
      const placeholders = typesToFetch.map(() => "?").join(",");

      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT id.type, id.provider, id.plan_name, id.policy_number, id.group_number,
                id.subscriber_fname, id.subscriber_lname, id.subscriber_DOB, id.subscriber_relationship,
                id.\`date\`, id.date_end, id.copay, id.accept_assignment,
                CONCAT_WS('-', pn.area_code, pn.prefix, pn.number) AS phone
         FROM insurance_data id
         LEFT JOIN insurance_companies ic ON ic.name = id.provider
         LEFT JOIN phone_numbers pn ON pn.foreign_id = ic.id AND pn.type = 2
         WHERE id.pid = ? AND id.type IN (${placeholders})`,
        [patientId, ...typesToFetch],
      );

      const insurances = await Promise.all(
        (rows as InsuranceRow[]).map(async (ins) => {
          const subscriberName = [ins.subscriber_fname, ins.subscriber_lname]
            .filter(Boolean)
            .join(" ");
          const planId = ins.plan_name ?? "";

          let procedureCoverage: CoverageDetail | null | undefined = undefined;
          if (cptCode && planId) {
            procedureCoverage = await lookupCoverage(planId, cptCode);
          }

          return {
            type: ins.type,
            provider: ins.provider ?? "",
            planName: ins.plan_name ?? "",
            planId,
            policyNumber: ins.policy_number ?? "",
            groupNumber: ins.group_number ?? "",
            subscriberName,
            subscriberDob: ins.subscriber_DOB ?? "",
            relationship: ins.subscriber_relationship ?? "",
            effectiveDate: ins.date ?? "",
            expirationDate: ins.date_end ?? "",
            copay: ins.copay ?? "",
            acceptAssignment: ins.accept_assignment ?? "",
            phone: ins.phone ?? null,
            ...(procedureCoverage !== undefined ? { procedureCoverage } : {}),
          };
        }),
      );

      return { patientId, insurances, source: "OpenEMR" };
    } catch (err) {
      return {
        patientId,
        insurances: [],
        source: "OpenEMR",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    } finally {
      await conn.end();
    }
  },
});
