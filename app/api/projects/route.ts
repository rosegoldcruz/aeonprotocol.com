import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// Default tenant ID for now (will be user's tenant after auth)
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

// GET /api/projects - List all projects for the user
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: DEFAULT_TENANT_ID },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // Just get last message for preview
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    const project = await prisma.project.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        id: randomUUID(),
        name: name || "New Project",
        userId: "anonymous", // Will be real user after auth
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
