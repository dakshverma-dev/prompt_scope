# PromptScope

**DevTools for prompt engineering.** Write a prompt, inspect its execution story, compare revisions, validate behavior, and ship with confidence.

## Build-week MVP

- Animated **Prompt Timeline**: parse → assemble context → evaluate output
- Monaco prompt editor
- Prompt Diff with an explicit grounding fallback improvement
- Prompt Tests with pass/fail behavioral checks
- Optimization suggestions, quality score, tokens, cost, and latency
- OpenAI Responses API route with a graceful demo-data fallback when no API key is configured

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local` to run live analysis. Without a key, the app remains fully demoable with curated data.

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel.
2. Add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in Project Settings → Environment Variables.
3. Deploy with the standard Next.js preset.

## 3-minute demo

1. Start with the Q2 investor prompt, then press **Analyze prompt**.
2. Walk through the Prompt Timeline and point to the quality/cost snapshot.
3. Open **Optimize** and describe the grounding fallback suggestion.
4. Open **Prompt Diff** to show the exact safety improvement.
5. Finish in **Prompt Tests**: three checks pass; one makes the risk visible before deployment.

**Tagline:** Prompt engineering deserves the same debugging tools software engineers already have.
