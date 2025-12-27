import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { createSwarm, orchestrator } from "@/lib/agents";

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

    let project;
    let swarmResult;

    // Log the incoming request for debugging
    console.log(`[Chat API] Received request - chatId: ${chatId}, projectId: ${projectId}`);
    console.log(`[Chat API] Message preview: ${message.slice(0, 100)}...`);

    // Analyze the prompt complexity
    const analysis = orchestrator.analyzeAndPlan(message);
    console.log(`[Chat API] Orchestrator Analysis:`, {
      complexity: analysis.complexity,
      requiredAgents: analysis.requiredAgents,
      taskCount: analysis.taskPlan.length,
      risks: analysis.riskFactors,
    });

    if (chatId && projectId) {
      // ═══════════════════════════════════════════════════════════════════
      // CONTINUE EXISTING CHAT - Iterate on the app with swarm intelligence
      // ═══════════════════════════════════════════════════════════════════
      
      console.log(`[Chat API] Continuing existing chat: ${chatId}`);
      
      // Create swarm for iteration
      const swarm = createSwarm(message);
      swarmResult = await swarm.continueChat(chatId, message);

      // Log execution details
      console.log(`[Chat API] Swarm execution log:`, swarmResult.executionLog);

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
      project = await prisma.project.update({
        where: {
          tenantId_id: { tenantId: DEFAULT_TENANT_ID, id: projectId },
        },
        data: {
          demoUrl: swarmResult.demoUrl,
          updatedAt: new Date(),
        },
      });

      // Save assistant message with execution details
      const assistantMessage = swarmResult.success 
        ? `✨ Your app has been updated!\n\n📊 Analysis: ${analysis.complexity} complexity\n👥 Agents Used: ${analysis.requiredAgents.join(', ')}\n\nCheck the preview to see your changes.`
        : `⚠️ Update completed with some issues. Check the preview.`;

      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId,
          role: "assistant",
          content: assistantMessage,
        },
      });

    } else {
      // ═══════════════════════════════════════════════════════════════════
      // CREATE NEW CHAT - Start fresh app with full swarm power
      // ═══════════════════════════════════════════════════════════════════
      
      console.log(`[Chat API] Creating new chat with swarm...`);
      
      // Create and execute the swarm
      const swarm = createSwarm(message);
      swarmResult = await swarm.execute();

      // Log full execution details
      console.log(`[Chat API] Swarm execution complete:`, {
        success: swarmResult.success,
        chatId: swarmResult.chatId,
        completedTasks: swarmResult.completedTasks,
        totalTasks: swarmResult.totalTasks,
      });
      swarmResult.executionLog.forEach(log => console.log(log));

      // Create new project in database
      const newProjectId = randomUUID();
      project = await prisma.project.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: newProjectId,
          name: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          userId: "anonymous",
          chatId: swarmResult.chatId,
          demoUrl: swarmResult.demoUrl,
        },
      });

      // Save the user message
      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId: newProjectId,
          role: "user",
          content: message,
        },
      });

      // Save detailed assistant message
      const taskSummary = analysis.taskPlan
        .map((task, i) => `${i + 1}. [${task.assignedAgent}] ${task.description.slice(0, 60)}...`)
        .join('\n');

      const assistantMessage = `✨ Your app is ready!\n
📊 **Build Analysis:**
- Complexity: ${analysis.complexity.toUpperCase()}
- Agents Deployed: ${analysis.requiredAgents.length}
- Tasks Completed: ${swarmResult.completedTasks}/${swarmResult.totalTasks}

🤖 **Agent Swarm Execution:**
${taskSummary}

${analysis.riskFactors.length > 0 ? `\n⚠️ **Notes:**\n${analysis.riskFactors.join('\n')}` : ''}

Check the preview panel on the right to see your creation!`;

      await prisma.message.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          id: randomUUID(),
          projectId: newProjectId,
          role: "assistant",
          content: assistantMessage,
        },
      });
    }

    return NextResponse.json({
      id: swarmResult.chatId,
      projectId: project.id,
      demo: swarmResult.demoUrl,
      webUrl: swarmResult.webUrl,
      analysis: {
        complexity: analysis.complexity,
        agents: analysis.requiredAgents,
        tasks: analysis.taskPlan.length,
      },
      executionLog: swarmResult.executionLog,
    });

  } catch (error) {
    console.error("[Chat API] Error:", error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error("[Chat API] Error name:", error.name);
      console.error("[Chat API] Error message:", error.message);
      console.error("[Chat API] Error stack:", error.stack);
    }
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Invalid V0_API_KEY. Check your API key at v0.dev/chat/settings/keys" },
          { status: 401 }
        );
      }
      if (error.message.includes("429") || error.message.includes("rate")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. The swarm is too powerful! Please wait a moment and try again." },
          { status: 429 }
        );
      }
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Request timed out. Complex builds may take longer - try again or simplify your request." },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: "Failed to generate app. The swarm encountered an error.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const analysis = orchestrator.analyzeAndPlan("test health check");
  
  return NextResponse.json({
    status: "operational",
    swarm: {
      agents: 10,
      capabilities: [
        "orchestrator",
        "architect", 
        "ui-specialist",
        "three-specialist",
        "shader-specialist",
        "animation-specialist",
        "interaction-specialist",
        "performance-specialist",
        "integration-specialist",
        "qa-specialist"
      ],
    },
    version: "2.0.0-swarm",
  });
}
