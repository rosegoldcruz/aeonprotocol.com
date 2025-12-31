import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { createSwarm, orchestrator } from "@/lib/agents";
import { z } from "zod";
import { getTenantId } from '@/lib/auth';
import { isValidUUID } from "@/lib/utils";

// Security: Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  chatId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Security: Validate input before processing
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);
    const { message, chatId, projectId } = validated;

    // Security: Check if V0_API_KEY is configured
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        { error: "Service configuration error. Please contact support." },
        { status: 500 }
      );
    }

    let project;
    let swarmResult;
    const tenantId = await getTenantId();

    // Security: Log only non-sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Chat API] Processing request - chatId: ${chatId}, projectId: ${projectId}`);
    }

    // Validate UUIDs if provided
    if (chatId && !isValidUUID(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }
    if (projectId && !isValidUUID(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Analyze the prompt complexity
    const analysis = orchestrator.analyzeAndPlan(message);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Chat API] Orchestrator Analysis:`, {
        complexity: analysis.complexity,
        requiredAgents: analysis.requiredAgents,
        taskCount: analysis.taskPlan.length,
        risks: analysis.riskFactors,
      });
    }

    // Run swarm
    const swarm = createSwarm(message);
    swarmResult = await swarm.execute();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Chat API] Swarm execution log:`, swarmResult.executionLog);
    }

    if (projectId) {
      // Save user message
      await prisma.message.create({
        data: {
          tenantId,
          id: randomUUID(),
          projectId,
          role: "user",
          content: message,
        },
      });

      // Update project with latest demo URL
      project = await prisma.project.update({
        where: {
          tenantId_id: { tenantId, id: projectId },
        },
        data: {
          demoUrl: swarmResult.demoUrl,
          updatedAt: new Date(),
        },
      });

      // Save assistant message with execution details
      const assistantMessage = swarmResult.success
        ? `✨ Your app has been updated!\n\n📊 Analysis: ${analysis.complexity} complexity\n👥 Agents Used: ${analysis.requiredAgents.join(', ')}\n\nCheck out the preview to see your changes.`
        : `⚠️ Update completed with some issues. Check out the preview.`;

      await prisma.message.create({
        data: {
          tenantId,
          id: randomUUID(),
          projectId,
          role: "assistant",
          content: assistantMessage,
        },
      });

    } else {
      // CREATE NEW CHAT - Start fresh app with full swarm power
      const newProjectId = randomUUID();

      project = await prisma.project.create({
        data: {
          tenantId,
          id: newProjectId,
          name: "New Project",
          userId: "anonymous", // Will be real user after auth
          demoUrl: swarmResult.demoUrl,
        },
      });

      await prisma.message.createMany({
        data: [
          {
            tenantId,
            id: randomUUID(),
            projectId: newProjectId,
            role: "user",
            content: message,
          },
          {
            tenantId,
            id: randomUUID(),
            projectId: newProjectId,
            role: "assistant",
            content: swarmResult.success
              ? "New project created successfully!"
              : "New project created with issues",
          },
        ],
      });
    }

    return NextResponse.json({ project, swarmResult });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    if (error instanceof Error) {
      console.error("[Chat API] Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
