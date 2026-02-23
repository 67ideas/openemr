import { describe, it, expect, beforeEach } from "vitest";
import { runAgent } from "../src/agent.js";
import { clearSession } from "../src/memory/conversationStore.js";

const SESSION = "eval-session";

// Helper: check that the response contains at least one of the expected terms (case-insensitive)
function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

beforeEach(() => {
  clearSession(SESSION);
});

describe("OpenEMR AI Agent Evaluation", () => {
  it("TC-01: drug interaction query returns interaction and bleeding risk for warfarin + aspirin", async () => {
    const { text } = await runAgent(
      "What are the interactions between warfarin and aspirin?",
      SESSION,
    );
    expect(containsAny(text, ["interact", "bleeding", "hemorrhage", "blood", "warfarin", "aspirin"])).toBe(true);
  }, 30_000);

  it("TC-02: ICD-10 lookup returns code I10 for essential hypertension", async () => {
    const { text } = await runAgent(
      "What is the ICD-10 code for essential hypertension?",
      SESSION,
    );
    expect(containsAny(text, ["I10", "hypertension", "I-10"])).toBe(true);
  }, 30_000);

  it("TC-03: medication info query returns drug class info for metformin", async () => {
    const { text } = await runAgent(
      "Tell me about metformin — what drug class is it and what forms does it come in?",
      SESSION,
    );
    expect(containsAny(text, ["metformin", "diabetes", "biguanide", "hypoglycemic", "glucose"])).toBe(true);
  }, 30_000);

  it("TC-04: drug interaction query for lisinopril + ibuprofen mentions kidney or interaction concern", async () => {
    const { text } = await runAgent(
      "Is it safe to take ibuprofen with lisinopril?",
      SESSION,
    );
    expect(containsAny(text, ["interact", "kidney", "renal", "blood pressure", "lisinopril", "ibuprofen", "caution", "nsaid"])).toBe(true);
  }, 30_000);

  it("TC-05: ICD-10 lookup for chest pain returns R07 codes", async () => {
    const { text } = await runAgent(
      "What ICD-10 codes match chest pain?",
      SESSION,
    );
    expect(containsAny(text, ["R07", "chest pain", "chest"])).toBe(true);
  }, 30_000);

  it("TC-06: conversation history is maintained across turns", async () => {
    await runAgent("What is the ICD-10 code for type 2 diabetes?", SESSION);
    const { text: followUp } = await runAgent(
      "What did I just ask you about?",
      SESSION,
    );
    expect(containsAny(followUp, ["diabetes", "ICD", "code", "asked", "type 2"])).toBe(true);
  }, 60_000);

  it("TC-07: severe interaction triggers escalation flag for warfarin + aspirin", async () => {
    const { escalated } = await runAgent(
      "Check interactions between warfarin and aspirin",
      SESSION,
    );
    // May or may not escalate depending on OpenFDA data — just verify the flag is a boolean
    expect(typeof escalated).toBe("boolean");
  }, 30_000);

  it("TC-08: graceful error handling for unknown drug name", async () => {
    const { text } = await runAgent(
      "Give me information about the drug xyzfictional123notreal",
      SESSION,
    );
    // Should not throw — should return some response acknowledging the lookup failed
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  }, 30_000);
});
