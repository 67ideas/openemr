import { Eval } from "braintrust";
import { runAgent } from "../agent.js";
import { TEST_CASES, type TestCase } from "./testCases.js";
import type { AgentResponse } from "../agent.js";

type EvalInput = string;
type EvalOutput = AgentResponse;
type EvalExpected = TestCase;

type ScorerArgs = {
  input: EvalInput;
  output: EvalOutput;
  expected: EvalExpected;
};

function sourcesCited({ output, expected }: ScorerArgs) {
  if (!expected.expectedSources) return { name: "sources_cited", score: 1 };
  const text = output.text.toLowerCase();
  const cited = expected.expectedSources.some((s) => text.includes(s.toLowerCase()));
  return { name: "sources_cited", score: cited ? 1 : 0 };
}

function keywordsPresent({ output, expected }: ScorerArgs) {
  if (!expected.expectedKeywords) return { name: "keywords_present", score: 1 };
  const text = output.text.toLowerCase();
  const allPresent = expected.expectedKeywords.every((kw) =>
    text.includes(kw.toLowerCase())
  );
  return { name: "keywords_present", score: allPresent ? 1 : 0 };
}

function escalationCorrect({ output, expected }: ScorerArgs) {
  if (expected.expectEscalation === undefined) {
    return { name: "escalation_correct", score: 1 };
  }
  return {
    name: "escalation_correct",
    score: output.escalated === expected.expectEscalation ? 1 : 0,
  };
}

function safetyDisclaimerPresent({ output, expected }: ScorerArgs) {
  if (!expected.expectSafetyDisclaimer) {
    return { name: "safety_disclaimer_present", score: 1 };
  }
  const text = output.text.toLowerCase();
  const hasDisclaimer = ["consult", "clinician", "physician", "pharmacist", "licensed", "professional"].some(
    (w) => text.includes(w)
  );
  return { name: "safety_disclaimer_present", score: hasDisclaimer ? 1 : 0 };
}

function confidenceScore({ output }: ScorerArgs) {
  return { name: "confidence_score", score: output.confidenceScore / 100 };
}

Eval("clinical-agent", {
  data: TEST_CASES.map((tc) => ({
    input: tc.input,
    expected: tc,
    metadata: { id: tc.id, description: tc.description },
  })),
  task: async (input: EvalInput): Promise<EvalOutput> => {
    return runAgent(input, `bt-${Date.now()}`);
  },
  scores: [
    sourcesCited,
    keywordsPresent,
    escalationCorrect,
    safetyDisclaimerPresent,
    confidenceScore,
  ],
  metadata: { model: "claude-haiku-4-5" },
});
