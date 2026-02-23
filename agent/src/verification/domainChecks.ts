import type { DrugInteractionResult } from "../tools/drugInteraction.js";

export type VerificationResult = {
  passed: boolean;
  confidence: number;
  escalate: boolean;
  reason?: string;
  disclaimer?: string;
};

const SEVERE_INTERACTION_DISCLAIMER =
  "⚠️ SAFETY NOTICE: This query involves a potentially severe drug interaction. " +
  "This information is for educational purposes only and is based on synthetic data. " +
  "Always consult a licensed pharmacist or physician before making any medication decisions.";

const INTERACTION_DISCLAIMER =
  "ℹ️ NOTE: Drug interaction information is provided from OpenFDA label data. " +
  "Consult a healthcare professional before adjusting medications.";

export function verifyDrugInteractionResult(
  result: DrugInteractionResult,
): VerificationResult {
  if (result.error) {
    return {
      passed: false,
      confidence: 0,
      escalate: false,
      reason: `Tool returned an error: ${result.error}`,
    };
  }

  if (result.severity === "severe") {
    return {
      passed: true,
      confidence: 0.9,
      escalate: true,
      reason: "Severe drug interaction detected — escalation required",
      disclaimer: SEVERE_INTERACTION_DISCLAIMER,
    };
  }

  if (result.severity === "moderate") {
    return {
      passed: true,
      confidence: 0.8,
      escalate: false,
      disclaimer: INTERACTION_DISCLAIMER,
    };
  }

  if (result.interactions.length === 0) {
    return {
      passed: true,
      confidence: 0.5,
      escalate: false,
      reason:
        "No interaction data found — absence of data does not confirm safety",
    };
  }

  return {
    passed: true,
    confidence: 0.75,
    escalate: false,
    disclaimer: INTERACTION_DISCLAIMER,
  };
}

export function buildSafetyPrefix(verification: VerificationResult): string {
  if (!verification.disclaimer) return "";
  return `${verification.disclaimer}\n\n`;
}
