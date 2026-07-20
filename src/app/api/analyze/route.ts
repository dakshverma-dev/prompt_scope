import OpenAI from "openai";
import { NextResponse } from "next/server";
import { analyzePrompt, defaultTests } from "@/lib/prompt-analysis";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };
  const source = prompt?.trim() || "";
  const localAnalysis = analyzePrompt(source, defaultTests);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ...localAnalysis, demo: true });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "developer",
          content:
            "You are PromptScope's profiler. Return strict JSON only. Keep all fields concise and product-ready.",
        },
        {
          role: "user",
          content: `Analyze this prompt. Return JSON with optional keys score, complexity, redundantInstructions, suggestions, tests, optimizedPrompt, improvementScore. Prompt:\n${source}`,
        },
      ],
    });
    const jsonText = response.output_text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      ...localAnalysis,
      ...parsed,
      demo: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed";
    console.error("PromptScope live analysis failed:", message);
    return NextResponse.json({ ...localAnalysis, demo: true, error: message }, { status: 200 });
  }
}
