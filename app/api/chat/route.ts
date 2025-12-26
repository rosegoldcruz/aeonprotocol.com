import { NextRequest, NextResponse } from "next/server";
import { v0, type ChatDetail } from "v0-sdk";

export async function POST(request: NextRequest) {
  try {
    const { message, chatId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check if V0_API_KEY is configured
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        { error: "V0_API_KEY is not configured. Get one at v0.dev/chat/settings/keys" },
        { status: 500 }
      );
    }

    let chat: ChatDetail;

    if (chatId) {
      // Continue existing chat - iterate on the app
      chat = await v0.chats.sendMessage({
        chatId: chatId,
        message,
      }) as ChatDetail;
    } else {
      // Create new chat - start fresh app
      chat = await v0.chats.create({
        message,
      }) as ChatDetail;
    }

    // Get the demo URL from the latest version
    const demoUrl = chat.latestVersion?.demoUrl || null;

    return NextResponse.json({
      id: chat.id,
      demo: demoUrl,
      webUrl: chat.webUrl,
    });
  } catch (error) {
    console.error("V0 API Error:", error);
    
    // Handle specific v0 SDK errors
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Invalid V0_API_KEY. Check your API key at v0.dev/chat/settings/keys" },
          { status: 401 }
        );
      }
      if (error.message.includes("429") || error.message.includes("rate")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate app. Please try again." },
      { status: 500 }
    );
  }
}
