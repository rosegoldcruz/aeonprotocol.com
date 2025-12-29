import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/auth";
import { isValidUUID } from "@/lib/utils";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  chatId: z.string().optional(),
  demoUrl: z.string().url().optional(),
});

// GET /api/projects/[id] - Get a specific project with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId();

    // Validate UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

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
    const tenantId = await getTenantId();

    // Validate UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = updateProjectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: {
        tenantId_id: { tenantId, id },
      },
      data: {
        ...(validation.data.name && { name: validation.data.name }),
        ...(validation.data.chatId && { chatId: validation.data.chatId }),
        ...(validation.data.demoUrl && { demoUrl: validation.data.demoUrl }),
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
    const tenantId = await getTenantId();

    // Validate UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

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
