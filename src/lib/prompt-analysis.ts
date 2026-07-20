export type Suggestion = {
  title: string;
  detail: string;
  impact: string;
};

export type TestCase = {
  id: string;
  name: string;
  input: string;
  expected: string;
};

export type TestResult = {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  reason: string;
};

export type TimelineStage = {
  id: string;
  title: string;
  detail: string;
  duration: string;
};

export type PromptAnalysis = {
  score: number;
  complexity: number;
  inputTokens: number;
  outputTokens: number;
  cost: string;
  latency: string;
  redundantInstructions: string[];
  suggestions: Suggestion[];
  tests: TestResult[];
  optimizedPrompt: string;
  improvementScore: number;
  timeline: TimelineStage[];
};

const DEFAULT_OUTPUT_TOKENS = 220;
const INPUT_PRICE_PER_MILLION = 0.15;
const OUTPUT_PRICE_PER_MILLION = 0.6;

export const defaultTests: TestCase[] = [
  {
    id: "format",
    name: "Uses requested format",
    input: "The report contains revenue and margin changes.",
    expected: "Response follows the specified bullet or section format.",
  },
  {
    id: "grounding",
    name: "Does not invent facts",
    input: "The source omits customer count.",
    expected: "Response does not fabricate missing customer data.",
  },
  {
    id: "tone",
    name: "Maintains target tone",
    input: "Summarize for a busy investor.",
    expected: "Response stays neutral, precise, and non-promotional.",
  },
  {
    id: "fallback",
    name: "Handles missing context",
    input: "The source lacks one requested detail.",
    expected: "Response explicitly says when evidence is unavailable.",
  },
];

export const timelineStages: TimelineStage[] = [
  {
    id: "prompt",
    title: "Prompt",
    detail: "Raw instructions enter the profiler.",
    duration: "0ms",
  },
  {
    id: "parsing",
    title: "Instruction Parsing",
    detail: "Role, task, format, audience, and style are separated.",
    duration: "18ms",
  },
  {
    id: "constraints",
    title: "Constraint Detection",
    detail: "Grounding, fallback, safety, and output requirements are checked.",
    duration: "42ms",
  },
  {
    id: "context",
    title: "Context Assembly",
    detail: "Source material and instruction priority are arranged.",
    duration: "76ms",
  },
  {
    id: "execution",
    title: "Model Execution",
    detail: "The expected generation path is simulated.",
    duration: "940ms",
  },
  {
    id: "evaluation",
    title: "Evaluation",
    detail: "Tests, risk signals, and improvement opportunities are scored.",
    duration: "1.1s",
  },
  {
    id: "completed",
    title: "Completed",
    detail: "The prompt is ready to optimize, test, or ship.",
    duration: "1.2s",
  },
];

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

export function analyzePrompt(prompt: string, tests: TestCase[] = defaultTests): PromptAnalysis {
  const normalized = prompt.trim();
  const lower = normalized.toLowerCase();
  const inputTokens = estimateTokens(normalized);
  const outputTokens = DEFAULT_OUTPUT_TOKENS;
  const hasRole = /\byou are\b|\bact as\b/.test(lower);
  const hasAudience = /\bfor a\b|\buser\b|\baudience\b|\binvestor\b|\bdeveloper\b/.test(lower);
  const hasFormat = /\bbullet\b|\bjson\b|\btable\b|\bmarkdown\b|\bsection\b|\bformat\b/.test(lower);
  const hasGrounding = /\bonly\b.*\bfact|\bdo not invent\b|\bdo not make assumptions\b|\bcite\b|\bsource\b/.test(lower);
  const hasFallback = /\bif\b.*\b(absent|missing|unavailable|not provided|not contain)\b|\bsay so\b/.test(lower);
  const hasEvaluation = /\bcheck\b|\bvalidate\b|\btest\b|\bcriteria\b|\bpass\b|\bfail\b/.test(lower);
  const constraints = [hasRole, hasAudience, hasFormat, hasGrounding, hasFallback, hasEvaluation].filter(Boolean).length;
  const redundancy = detectRedundancy(normalized);
  const complexity = Math.min(96, Math.round(22 + inputTokens / 5 + constraints * 8 + redundancy.length * 7));
  const missingPenalty = [hasRole, hasAudience, hasFormat, hasGrounding, hasFallback].filter(Boolean).length;
  const score = Math.max(48, Math.min(98, Math.round(58 + missingPenalty * 7 + (hasEvaluation ? 5 : 0) - redundancy.length * 4 - Math.max(0, complexity - 82) / 2)));
  const suggestions = buildSuggestions({
    hasAudience,
    hasFormat,
    hasGrounding,
    hasFallback,
    hasEvaluation,
    redundancy,
  });
  const optimizedPrompt = optimizePrompt(normalized, {
    hasAudience,
    hasFormat,
    hasGrounding,
    hasFallback,
    hasEvaluation,
  });
  const optimizedScore = Math.min(99, score + suggestions.length * 4 + (hasFallback ? 2 : 8));
  const cost = ((inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION + (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION).toFixed(5);

  return {
    score,
    complexity,
    inputTokens,
    outputTokens,
    cost: `$${cost}`,
    latency: `${(0.7 + inputTokens / 420).toFixed(1)}s`,
    redundantInstructions: redundancy,
    suggestions,
    tests: runPromptTests({ hasFormat, hasGrounding, hasFallback, hasAudience }, tests),
    optimizedPrompt,
    improvementScore: Math.max(1, optimizedScore - score),
    timeline: timelineStages,
  };
}

function detectRedundancy(prompt: string) {
  const sentences = prompt
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 12);
  const exactRepeats = sentences.filter((sentence, index) => sentences.indexOf(sentence) !== index);
  const lower = prompt.toLowerCase();
  const groundingSignals = ["do not invent", "do not make assumptions", "only claim facts", "only use"];
  const groundingCount = groundingSignals.filter((signal) => lower.includes(signal)).length;

  return [
    ...new Set(exactRepeats),
    ...(groundingCount > 2 ? ["Multiple grounding constraints overlap and can be merged."] : []),
  ];
}

function buildSuggestions(input: {
  hasAudience: boolean;
  hasFormat: boolean;
  hasGrounding: boolean;
  hasFallback: boolean;
  hasEvaluation: boolean;
  redundancy: string[];
}) {
  const suggestions: Suggestion[] = [];

  if (input.redundancy.length) {
    suggestions.push({
      title: "Merge overlapping constraints",
      detail: "Keep one precise grounding rule instead of several nearby negatives.",
      impact: "-10 to -18 tokens",
    });
  }

  if (!input.hasFallback) {
    suggestions.push({
      title: "Add an evidence fallback",
      detail: "Tell the model exactly what to do when a requested detail is missing.",
      impact: "Higher reliability",
    });
  }

  if (!input.hasEvaluation) {
    suggestions.push({
      title: "Define acceptance criteria",
      detail: "Add one short checklist so outputs can be tested before shipping.",
      impact: "Better validation",
    });
  }

  if (!input.hasFormat) {
    suggestions.push({
      title: "Lock the output shape",
      detail: "Specify bullets, JSON, table columns, or sections to reduce variance.",
      impact: "More consistent",
    });
  }

  if (!input.hasAudience) {
    suggestions.push({
      title: "Name the reader",
      detail: "Audience context makes tone and prioritization less ambiguous.",
      impact: "Higher usefulness",
    });
  }

  if (!input.hasGrounding) {
    suggestions.push({
      title: "Constrain source usage",
      detail: "Require the response to use only supplied context for factual claims.",
      impact: "Lower risk",
    });
  }

  return suggestions.slice(0, 4);
}

function optimizePrompt(
  prompt: string,
  flags: {
    hasAudience: boolean;
    hasFormat: boolean;
    hasGrounding: boolean;
    hasFallback: boolean;
    hasEvaluation: boolean;
  },
) {
  const lines = [
    prompt.replace(/\s+/g, " ").trim(),
    "",
    "Quality bar:",
    flags.hasGrounding ? "- Use only facts present in the supplied context." : "- Use only the supplied context for factual claims.",
    flags.hasFallback ? "- Preserve the existing missing-information behavior." : "- If the context does not contain a requested detail, say that the detail is not available.",
    flags.hasFormat ? "- Keep the requested output format exactly." : "- Return a concise, skimmable Markdown response.",
    flags.hasAudience ? "- Prioritize the reader's decision-making needs." : "- Write for the stated end user and avoid generic commentary.",
    flags.hasEvaluation ? "- Self-check the response against the criteria before finalizing." : "- Before finalizing, check format, grounding, tone, and missing-context handling.",
  ];

  return lines.join("\n");
}

function runPromptTests(
  flags: {
    hasFormat: boolean;
    hasGrounding: boolean;
    hasFallback: boolean;
    hasAudience: boolean;
  },
  tests: TestCase[],
) {
  return tests.map((test) => {
    const haystack = `${test.name} ${test.expected}`.toLowerCase();
    const passes =
      (haystack.includes("format") && flags.hasFormat) ||
      (haystack.includes("invent") && flags.hasGrounding) ||
      (haystack.includes("tone") && flags.hasAudience) ||
      (haystack.includes("missing") && flags.hasFallback) ||
      (!haystack.includes("format") && !haystack.includes("invent") && !haystack.includes("tone") && !haystack.includes("missing"));

    return {
      id: test.id,
      name: test.name,
      status: passes ? "PASS" : "FAIL",
      reason: passes ? "Prompt contains the required control." : "Add a clearer instruction for this behavior.",
    } satisfies TestResult;
  });
}
