import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/[id] - Get a specific project with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "00000000-0000-0000-0000-000000000000";

    const project = await prisma.project.findUnique({
      where: {
        tenantId_id: { tenantId, id },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project (chat_id, demo_url, etc)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "00000000-0000-0000-0000-000000000000";
    const body = await request.json();

    const project = await prisma.project.update({
      where: {
        tenantId_id: { tenantId, id },
      },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.chatId && { chatId: body.chatId }),
        ...(body.demoUrl && { demoUrl: body.demoUrl }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "00000000-0000-0000-0000-000000000000";

    await prisma.project.delete({
      where: {
        tenantId_id: { tenantId, id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
