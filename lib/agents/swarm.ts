// Agent Swarm Executor - Runs the multi-agent system

import { v0, type ChatDetail } from 'v0-sdk';
import { 
  AgentRole, 
  TaskDecomposition, 
  AgentContext, 
  AgentResponse,
  OrchestratorDecision 
} from './types';
import { buildEnhancedPrompt } from './prompts';
import { orchestrator } from './orchestrator';

interface SwarmExecutionResult {
  success: boolean;
  chatId: string;
  demoUrl: string | null;
  webUrl: string;
  executionLog: string[];
  completedTasks: number;
  totalTasks: number;
}

export class AgentSwarm {
  private context: AgentContext;
  private executionLog: string[];
  private chat: ChatDetail | null = null;

  constructor(originalPrompt: string) {
    this.context = {
      originalPrompt,
      decomposedTasks: [],
      completedOutputs: new Map(),
      globalDependencies: [],
      techStack: new Set(),
      errorLog: [],
    };
    this.executionLog = [];
  }

  /**
   * Execute the full swarm workflow
   */
  async execute(): Promise<SwarmExecutionResult> {
    this.log('🚀 Initializing Agent Swarm...');
    
    try {
      // Step 1: Orchestrator analyzes and plans
      this.log('🧠 Orchestrator analyzing request...');
      const decision = orchestrator.analyzeAndPlan(this.context.originalPrompt);
      this.log(`📊 Complexity: ${decision.complexity.toUpperCase()}`);
      this.log(`👥 Required Agents: ${decision.requiredAgents.join(', ')}`);
      this.log(`📋 Task Plan: ${decision.taskPlan.length} tasks`);
      
      if (decision.riskFactors.length > 0) {
        this.log(`⚠️ Risk Factors: ${decision.riskFactors.join('; ')}`);
      }

      this.context.decomposedTasks = decision.taskPlan;

      // Step 2: Build the master prompt with full context
      const masterPrompt = this.buildMasterPrompt(decision);
      
      // Step 3: Execute via v0 with enhanced prompt
      this.log('🔨 Executing build with enhanced prompt...');
      this.chat = await this.executeWithRetry(masterPrompt);
      
      if (!this.chat) {
        throw new Error('Failed to create chat after all retries');
      }

      this.log('✅ Build complete!');

      return {
        success: true,
        chatId: this.chat.id,
        demoUrl: this.chat.latestVersion?.demoUrl || null,
        webUrl: this.chat.webUrl,
        executionLog: this.executionLog,
        completedTasks: decision.taskPlan.length,
        totalTasks: decision.taskPlan.length,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ Swarm execution failed: ${errorMessage}`);
      this.context.errorLog.push(errorMessage);

      // Attempt fallback
      if (this.context.errorLog.length < 3) {
        this.log('🔄 Attempting fallback strategy...');
        return this.executeFallback();
      }

      throw error;
    }
  }

  /**
   * Continue an existing chat with enhanced prompting
   */
  async continueChat(chatId: string, message: string): Promise<SwarmExecutionResult> {
    this.log('🔄 Continuing existing chat with swarm intelligence...');
    
    try {
      const decision = orchestrator.analyzeAndPlan(message);
      const enhancedMessage = this.buildIterationPrompt(message, decision);
      
      this.chat = await v0.chats.sendMessage({
        chatId,
        message: enhancedMessage,
      }) as ChatDetail;

      return {
        success: true,
        chatId: this.chat.id,
        demoUrl: this.chat.latestVersion?.demoUrl || null,
        webUrl: this.chat.webUrl,
        executionLog: this.executionLog,
        completedTasks: 1,
        totalTasks: 1,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ Continue chat failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Build the master prompt that combines all agent intelligence
   */
  private buildMasterPrompt(decision: OrchestratorDecision): string {
    const packages = orchestrator.getRequiredPackages(decision);
    
    let prompt = `You are an elite development team combined into one AI. You have the expertise of:
- A Systems Architect who designs scalable component structures
- A UI/UX Specialist who creates beautiful, responsive interfaces
- A Three.js Expert who builds stunning 3D experiences
- A Shader Wizard who writes custom GLSL for visual effects
- An Animation Master skilled in GSAP and Framer Motion
- An Interaction Designer who creates engaging micro-interactions
- A Performance Engineer who ensures 60fps smooth experiences
- A QA Engineer who handles all edge cases

---

## USER REQUEST:
${this.context.originalPrompt}

---

## ANALYSIS:
- Complexity Level: ${decision.complexity.toUpperCase()}
- Required Technologies: ${Array.from(new Set(packages)).join(', ')}
- Task Breakdown: ${decision.taskPlan.length} specialized tasks

## EXECUTION PLAN:
${decision.taskPlan.map((task, i) => `${i + 1}. [${task.assignedAgent}] ${task.description}`).join('\n')}

---

## MANDATORY REQUIREMENTS:

### Dependencies to Install:
\`\`\`json
{
  "dependencies": {
${packages.filter(p => !p.startsWith('@types')).map(p => `    "${p}": "latest"`).join(',\n')}
  },
  "devDependencies": {
${packages.filter(p => p.startsWith('@types')).map(p => `    "${p}": "latest"`).join(',\n')}
  }
}
\`\`\`

### Technical Standards:
1. Use TypeScript with strict typing
2. Create modular, reusable components
3. Implement proper React patterns (hooks, refs, effects)
4. Add comprehensive error handling
5. Include loading and fallback states
6. Ensure responsive design (mobile-first)
7. Optimize for performance (memo, useMemo, useCallback where needed)

### For 3D/Three.js:
- Use @react-three/fiber and @react-three/drei
- Implement proper scene setup with lighting
- Add OrbitControls or custom camera controls
- Handle WebGL context loss gracefully

### For Shaders:
- Write complete GLSL vertex and fragment shaders
- Use proper uniforms for time, mouse, resolution
- Integrate with R3F using shaderMaterial or custom materials

### For Animations:
- Use GSAP with proper React integration (@gsap/react useGSAP hook)
- Register plugins (ScrollTrigger, etc.) before use
- Clean up animations on unmount
- Use Framer Motion for React-native animations

### For Smooth Scrolling:
- Implement Lenis with proper RAF loop
- Integrate with GSAP ScrollTrigger if needed
- Clean up on unmount

### For Interactions:
- Implement magnetic effects with proper math
- Add hover state transitions
- Use proper event cleanup

---

## CRITICAL INSTRUCTIONS:
1. DO NOT simplify or skip ANY requested feature
2. DO NOT say "I can't" - figure it out
3. DO NOT create placeholder or stub implementations
4. CREATE complete, production-ready code
5. INCLUDE all necessary imports at the top of each file
6. ENSURE the app works out of the box

Build this NOW. Make it EXCEPTIONAL.`;

    return prompt;
  }

  /**
   * Build prompt for iterating on existing app
   */
  private buildIterationPrompt(message: string, decision: OrchestratorDecision): string {
    return `ITERATION REQUEST:
${message}

---

CONTEXT:
- Complexity: ${decision.complexity}
- Required changes involve: ${decision.requiredAgents.join(', ')}

INSTRUCTIONS:
1. Analyze the existing code
2. Make the requested changes
3. Preserve all existing functionality
4. Add the new features completely
5. Update dependencies if needed
6. Ensure everything still works together

DO NOT break existing features. ENHANCE the application.`;
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry(prompt: string, maxRetries = 3): Promise<ChatDetail> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`📤 Attempt ${attempt}/${maxRetries}...`);
        
        const chat = await v0.chats.create({
          message: prompt,
        }) as ChatDetail;
        
        if (chat && chat.id) {
          return chat;
        }
        
        throw new Error('Invalid response from v0');
        
      } catch (error) {
        lastError = error as Error;
        this.log(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.log(`⏳ Waiting ${delay/1000}s before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Fallback execution with simplified prompt
   */
  private async executeFallback(): Promise<SwarmExecutionResult> {
    const fallbackPrompt = `FALLBACK MODE - SIMPLIFIED REQUEST

Original request: ${this.context.originalPrompt}

Previous attempts failed. Please create a working implementation with these priorities:
1. Core functionality MUST work
2. Use stable, well-supported libraries
3. Implement the most important features first
4. Add graceful fallbacks for complex features
5. Ensure the app loads and runs without errors

Create something that WORKS, even if some advanced features are simplified.`;

    try {
      this.chat = await v0.chats.create({
        message: fallbackPrompt,
      }) as ChatDetail;

      return {
        success: true,
        chatId: this.chat.id,
        demoUrl: this.chat.latestVersion?.demoUrl || null,
        webUrl: this.chat.webUrl,
        executionLog: [...this.executionLog, '⚠️ Used fallback mode'],
        completedTasks: 1,
        totalTasks: 1,
      };

    } catch (error) {
      throw new Error(`Fallback also failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.executionLog.push(`[${timestamp}] ${message}`);
    console.log(`[AgentSwarm] ${message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function
export function createSwarm(prompt: string): AgentSwarm {
  return new AgentSwarm(prompt);
}
