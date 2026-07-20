import { analyzePrompt } from "@/lib/prompt-analysis";

export const demoPrompt = `You are a financial analyst. Summarize the quarterly report below for a busy investor.

Use five bullet points, a neutral and precise tone, and only claim facts present in the report. Do not make assumptions or invent details.

Q2 revenue grew 18% year-over-year to $42m. Gross margin increased from 61% to 65%. The company launched in two European markets and expects moderate growth next quarter.`;

export const initialAnalysis = analyzePrompt(demoPrompt);
