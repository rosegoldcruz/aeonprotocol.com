import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// POST /api/projects/[id]/messages - Add a message to a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const tenantId = "00000000-0000-0000-0000-000000000000";
    const { role, content } = await request.json();

    const message = await prisma.message.create({
      data: {
        tenantId,
        id: randomUUID(),
        projectId,
        role,
        content,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/messages - Get all messages for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const tenantId = "00000000-0000-0000-0000-000000000000";

    const messages = await prisma.message.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
