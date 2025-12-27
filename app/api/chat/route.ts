import { NextRequest, NextResponse } from "next/server";
import { v0, type ChatDetail } from "v0-sdk";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(request: NextRequest) {
  try {
    const { message, chatId, projectId } = await request.json();

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
    let project;

    if (chatId && projectId) {
      // Continue existing chat - iterate on the app
      chat = await v0.chats.sendMessage({
        chatId: chatId,
        message,
      }) as ChatDetail;

      // Save the user message
      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId,
          role: "user",
          content: message,
        },
      });

      // Update project with latest demo URL
      const demoUrl = chat.latestVersion?.demoUrl || null;
      project = await prisma.project.update({
        where: {
          tenantId_id: { tenantId: DEFAULT_TENANT_ID, id: projectId },
        },
        data: {
          demoUrl,
          updatedAt: new Date(),
        },
      });

      // Save assistant message
      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId,
          role: "assistant",
          content: "✨ Your app has been updated! Check the preview.",
        },
      });

    } else {
      // Create new chat - start fresh app
      chat = await v0.chats.create({
        message,
      }) as ChatDetail;

      const demoUrl = chat.latestVersion?.demoUrl || null;

      // Create new project in database
      project = await prisma.project.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          name: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          userId: "anonymous",
          chatId: chat.id,
          demoUrl,
        },
      });

      // Save the user message
      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId: project.id,
          role: "user",
          content: message,
        },
      });

      // Save assistant message
      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId: project.id,
          role: "assistant",
          content: "✨ Your app is ready! Check the preview panel on the right.",
        },
      });
    }

    // Get the demo URL from the latest version
    const demoUrl = chat.latestVersion?.demoUrl || null;

    return NextResponse.json({
      id: chat.id,
      projectId: project.id,
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
