import OpenAI from "openai";
import { NextResponse } from "next/server";
import { analyzePrompt, defaultTests } from "@/lib/prompt-analysis";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };
  const source = prompt?.trim() || "";
  const localAnalysis = analyzePrompt(source, defaultTests);

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ...localAnalysis, demo: true });
  }

  const isOpenRouter = Boolean(process.env.OPENROUTER_API_KEY) || Boolean(process.env.OPENAI_BASE_URL?.includes("openrouter"));
  const baseURL = isOpenRouter ? "https://openrouter.ai/api/v1" : process.env.OPENAI_BASE_URL;
  const defaultModel = isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4.1-mini";
  const model = process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || defaultModel;

  try {
    const client = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: isOpenRouter
        ? {
            "HTTP-Referer": "https://promptscope.dev",
            "X-Title": "PromptScope DevTools",
          }
        : undefined,
    });

    let jsonText = "";

    if (isOpenRouter || typeof client.responses?.create !== "function") {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are PromptScope's profiler. Return strict JSON only. Keep all fields concise and product-ready.",
          },
          {
            role: "user",
            content: `Analyze this prompt. Return strict valid JSON with optional keys: score (number 0-100), complexity (number 0-100), redundantInstructions (string[]), suggestions (array of objects with title, detail, impact="HIGH"|"MEDIUM"|"LOW"), optimizedPrompt (string), improvementScore (number). Prompt:\n${source}`,
          },
        ],
      });
      jsonText = completion.choices[0]?.message?.content || "";
    } else {
      const response = await client.responses.create({
        model,
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
      jsonText = response.output_text;
    }

    const cleanedText = jsonText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json({
      ...localAnalysis,
      ...parsed,
      demo: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    console.error("PromptScope live analysis failed:", message);
    return NextResponse.json({ ...localAnalysis, demo: true, error: message }, { status: 200 });
  }
}
