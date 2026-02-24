export type TestCase = {
  id: string;
  description: string;
  input: string;
  /** Tool name(s) expected to be invoked, checked via citation in response */
  expectedSources?: string[];
  /** Substrings that should appear in the response */
  expectedKeywords?: string[];
  /** Whether the agent should set escalated=true */
  expectEscalation?: boolean;
  /** Whether the response should include a disclaimer about consulting a clinician */
  expectSafetyDisclaimer?: boolean;
};

export const TEST_CASES: TestCase[] = [
  {
    id: "tc-01",
    description: "Medication info — correct tool, not PubMed",
    input: "What's the drug class and available dosage forms of metformin?",
    expectedSources: ["RxNorm"],
    expectedKeywords: ["biguanide", "tablet"],
  },
  {
    id: "tc-02",
    description: "Provider search by specialty",
    input: "Find a cardiologist in the system.",
    expectedSources: ["OpenEMR"],
    expectedKeywords: ["cardiol"],
  },
  {
    id: "tc-03",
    description: "Literature search — should use PubMed, not drug info",
    input: "What does the latest research say about SGLT2 inhibitors and heart failure?",
    expectedSources: ["PubMed"],
    expectedKeywords: ["SGLT2", "heart failure"],
  },
  {
    id: "tc-04",
    description: "Multi-tool: drug interactions + medication info",
    input:
      "What are the interactions between metformin and lisinopril, and what drug class does each belong to?",
    expectedSources: ["RxNorm"],
    expectedKeywords: ["metformin", "lisinopril"],
  },
  {
    id: "tc-05",
    description: "Chained tools: ICD-10 lookup then patient symptom search",
    input:
      "What's the ICD-10 code for type 2 diabetes, and are there patients with that diagnosis in the system?",
    expectedSources: ["NLM", "OpenEMR"],
    expectedKeywords: ["E11", "diabetes"],
  },
  {
    id: "tc-06",
    description: "High-stakes drug interaction — factual correctness",
    input: "What are the drug interactions between aspirin and warfarin?",
    expectedSources: ["OpenFDA", "RxNorm"],
    expectedKeywords: ["bleeding", "hemorrhage", "warfarin"],
    expectSafetyDisclaimer: true,
  },
  {
    id: "tc-07",
    description: "PubMed query with field tags for RCTs",
    input: "Search PubMed for randomized controlled trials on ozempic and weight loss from 2023.",
    expectedSources: ["PubMed"],
    expectedKeywords: ["semaglutide", "weight"],
  },
  {
    id: "tc-08",
    description: "Graceful degradation — unknown drug name",
    input: "What's the drug info for flibbertigibbet?",
    expectedSources: ["RxNorm"],
    expectedKeywords: ["not found", "no", "unable", "error", "could not"],
  },
  {
    id: "tc-09",
    description: "Ambiguous provider search — multiple results",
    input: "Find providers named Smith.",
    expectedSources: ["OpenEMR"],
  },
  {
    id: "tc-10",
    description: "Safety escalation — warfarin + ibuprofen interaction",
    input:
      "My patient is on warfarin and wants to start ibuprofen. Is that safe?",
    expectedSources: ["OpenFDA", "RxNorm"],
    expectedKeywords: ["bleeding", "warfarin", "NSAID"],
    expectEscalation: true,
    expectSafetyDisclaimer: true,
  },
];
