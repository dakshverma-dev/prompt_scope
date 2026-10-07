# PromptScope

**Inspect the prompt. Compare the revision. Understand the change.**

PromptScope is a developer-tool MVP for editing prompts, inspecting instruction signals, reviewing suggested changes, and comparing revisions in one workspace.

[Open demo](https://prompt-scope-swart.vercel.app) · [Run locally](#run-locally) · [How analysis works](#how-analysis-works)

## Inside the workspace

- **Editor:** Monaco-based prompt editing.
- **Timeline:** an animated illustration of parsing, context assembly, and evaluation.
- **Diff:** review the proposed prompt against the original.
- **Checks:** inspect format, grounding, tone, and missing-context instructions.
- **Suggestions:** identify overlapping instructions and add clearer output or fallback requirements.

## How analysis works

The local analyzer checks the prompt text for instruction patterns. It produces a heuristic score, suggestions, an optimized version, and pass/fail indicators.

With a configured provider, the API also requests model-generated analysis and merges the response with the local result. If the request fails, it returns local analysis with `demo: true`.

| Signal | What it means in this MVP |
| --- | --- |
| Prompt checks | Instruction-pattern checks, not executed behavioral tests against model outputs |
| Token counts and cost | Estimates from text length and constants in the local analyzer |
| Timeline and latency | Illustrative stages and estimated durations, not measured execution traces |
| Quality score | A heuristic or model-provided assessment, not a calibrated benchmark |

## Run locally

Use Node.js 20.9 or later and npm.

```bash
git clone https://github.com/dakshverma-dev/prompt_scope.git
cd prompt_scope
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Local analysis works without an API key. Create `.env.local` only if you want provider-backed analysis; the repository currently has no `.env.example`.

Choose one provider configuration:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

```env
# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

When both keys are set, the route selects OpenRouter. An OpenAI-compatible endpoint can also be supplied through `OPENAI_BASE_URL`. Provider keys are read in the server API route.

## Three-minute walkthrough

1. Open the supplied investor-report prompt.
2. Select **Analyze prompt** and inspect the suggested changes.
3. Compare the original and optimized prompt in the diff.
4. Inspect the grounding and missing-context checks.
5. Change the prompt and repeat to see how the local checks respond.

## Source tour

| File | Responsibility |
| --- | --- |
| [Workspace](src/app/page.tsx) | Editor, timeline, diff, and checks |
| [Analysis route](src/app/api/analyze/route.ts) | Provider selection, requests, and fallback |
| [Local analyzer](src/lib/prompt-analysis.ts) | Instruction-pattern checks and estimates |
| [Demo content](src/lib/demo.ts) | Initial prompts and workspace data |

**Stack:** Next.js 16, React 19, TypeScript, Monaco, Motion, and the OpenAI SDK.

## Build

```bash
npm run build
npm run start
```

The repository also provides `npm run lint`. Output-based evaluation, measured provider telemetry, and persisted experiments are future extensions.
