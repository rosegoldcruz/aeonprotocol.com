import { NextResponse } from "next/server";
import { v0 } from "v0-sdk";

type Provider = "v0" | "openai" | "deepseek" | "requesty";
type V0ModelId = "v0-1.5-sm" | "v0-1.5-md" | "v0-1.5-lg" | "v0-gpt-5" | "v0-opus-4.5";

interface GeneratePayload {
  prompt?: string;
  provider?: Provider;
  model?: string;
}

const V0_MODEL_IDS: V0ModelId[] = [
  "v0-1.5-sm",
  "v0-1.5-md",
  "v0-1.5-lg",
  "v0-gpt-5",
  "v0-opus-4.5",
];

function isV0ModelId(value: unknown): value is V0ModelId {
  return typeof value === "string" && V0_MODEL_IDS.includes(value as V0ModelId);
}

async function callOpenAICompatible(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(`${params.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert UI/code generator using shadcn/ui, Tailwind, and Next.js. Output clean, production-ready code.",
        },
        { role: "user", content: params.prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Provider request failed");
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

export async function POST(req: Request) {
  const { prompt, provider = "v0", model }: GeneratePayload = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  try {
    if (provider === "v0") {
      const apiKey = process.env.V0_DEV_API_KEY || process.env.V0_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "V0_DEV_API_KEY is not configured" },
          { status: 500 }
        );
      }

      if (!process.env.V0_API_KEY) {
        process.env.V0_API_KEY = apiKey;
      }

      const result = await v0.chats.create({
        message: `SYSTEM: You are an expert UI/code generator using shadcn/ui, Tailwind, and Next.js. Output clean, production-ready code.\n\nUSER: ${prompt}`,
        modelConfiguration: {
          modelId: isV0ModelId(model) ? model : "v0-1.5-sm",
          imageGenerations: false,
          thinking: false,
        },
      });

      const generatedCode =
        typeof result === "object" && result && "demo" in result
          ? String((result as { demo?: string }).demo || "")
          : String(result);

      return NextResponse.json({ code: generatedCode });
    }

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY is not configured" },
          { status: 500 }
        );
      }
      const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const generatedCode = await callOpenAICompatible({
        apiKey,
        baseUrl,
        model: model || "gpt-4o-mini",
        prompt,
      });
      return NextResponse.json({ code: generatedCode });
    }

    if (provider === "deepseek") {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "DEEPSEEK_API_KEY is not configured" },
          { status: 500 }
        );
      }
      const baseUrl =
        process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
      const generatedCode = await callOpenAICompatible({
        apiKey,
        baseUrl,
        model: model || "deepseek-chat",
        prompt,
      });
      return NextResponse.json({ code: generatedCode });
    }

    if (provider === "requesty") {
      const apiKey = process.env.REQUESTY_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "REQUESTY_API_KEY is not configured" },
          { status: 500 }
        );
      }
      const baseUrl =
        process.env.REQUESTY_BASE_URL || "https://api.requesty.ai/v1";
      const generatedCode = await callOpenAICompatible({
        apiKey,
        baseUrl,
        model: model || "gpt-4o-mini",
        prompt,
      });
      return NextResponse.json({ code: generatedCode });
    }

    return NextResponse.json(
      { error: "Unsupported provider" },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
