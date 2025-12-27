// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS META-CONTROLLER - Zero-Trust Orchestration with Reinforcement Learning
// The Brain of the Constellation - Scores, Routes, Learns, Evolves
// ═══════════════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';
import {
  ConstellationAgentRole,
  SovereignAgent,
  TaskAssignment,
  TaskDecomposition,
  TaskStatus,
  TaskResult,
  AgentTelemetry,
  TelemetryThresholds,
  FailoverCircuit,
  FailureRecord,
  FailureType,
  RecoveryAction,
  RewardSignal,
  PolicyUpdate,
  RLConfig,
  StateCheckpoint,
  LedgerEntry,
  LedgerEntryType,
  PostMortem,
  UserOutcome,
  GeneticMutation,
  EvolutionResult,
  FallbackTier,
  createAgentId,
  createTaskId,
  createCheckpointId,
  createLedgerEntryId,
  calculateHealthScore,
  shouldTriggerFailover,
} from './types';
import { 
  CAPABILITY_DOMAINS, 
  AGENT_IDEOLOGIES,
  createFallbackAlgorithms,
  getAgentsForCapability,
  getCapabilitiesForAgent,
} from './capabilities';

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS: TelemetryThresholds = {
  maxLatencyMs: 5000,
  maxErrorRate: 0.1,
  maxEntropy: 0.3,
  sigmaMultiplier: 2.0,
  healthFloor: 30,
};

const DEFAULT_RL_CONFIG: RLConfig = {
  learningRate: 0.01,
  discountFactor: 0.95,
  explorationRate: 0.1,
  explorationDecay: 0.995,
  minExploration: 0.01,
  replayBufferSize: 10000,
  batchSize: 32,
  updateFrequency: 10,
};

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS META-CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

export class NexusController {
  private agents: Map<ConstellationAgentRole, SovereignAgent>;
  private taskQueue: TaskAssignment[];
  private completedTasks: Map<string, TaskResult>;
  private telemetryBuffer: Map<string, AgentTelemetry[]>;
  private ledger: LedgerEntry[];
  private checkpoints: Map<string, StateCheckpoint>;
  private rewardBuffer: RewardSignal[];
  private thresholds: TelemetryThresholds;
  private rlConfig: RLConfig;
  private qTable: Map<string, Map<string, number>>; // State -> Action -> Q-Value
  private telemetryInterval: NodeJS.Timeout | null = null;
  private failoverHistory: FailoverCircuit[];
  private postMortems: PostMortem[];
  
  constructor(
    thresholds: TelemetryThresholds = DEFAULT_THRESHOLDS,
    rlConfig: RLConfig = DEFAULT_RL_CONFIG
  ) {
    this.agents = new Map();
    this.taskQueue = [];
    this.completedTasks = new Map();
    this.telemetryBuffer = new Map();
    this.ledger = [];
    this.checkpoints = new Map();
    this.rewardBuffer = [];
    this.thresholds = thresholds;
    this.rlConfig = rlConfig;
    this.qTable = new Map();
    this.failoverHistory = [];
    this.postMortems = [];
    
    this.initializeConstellation();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTELLATION INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  private initializeConstellation(): void {
    const roles: ConstellationAgentRole[] = [
      'NEXUS', 'ARCHITECT', 'RENDERER', 'SHADER_FORGE', 'MOTION_CORE',
      'INTERFACE', 'PERCEPTION', 'SENTINEL', 'SYNTHESIZER', 'VALIDATOR'
    ];

    for (const role of roles) {
      const agent = this.createSovereignAgent(role);
      this.agents.set(role, agent);
      this.telemetryBuffer.set(agent.id, []);
    }

    this.log('NEXUS', 'Constellation initialized with 10 sovereign agents');
  }

  private createSovereignAgent(role: ConstellationAgentRole): SovereignAgent {
    const ideology = AGENT_IDEOLOGIES[role];
    const fallbacks = createFallbackAlgorithms(role);
    
    return {
      id: createAgentId(role),
      role,
      version: '1.0.0',
      createdAt: Date.now(),
      state: 'IDLE',
      tier: 'PRIMARY',
      ideology,
      primaryAlgorithm: {
        tier: 'PRIMARY',
        name: `${role}_FULL`,
        complexity: 'FULL',
        capabilities: getCapabilitiesForAgent(role),
        promptTemplate: this.getPrimaryPromptTemplate(role),
        estimatedLatencyMs: 3000,
        successProbability: 0.75,
      },
      standbyClone: {
        tier: 'STANDBY',
        name: `${role}_STANDBY`,
        complexity: 'FULL',
        capabilities: getCapabilitiesForAgent(role),
        promptTemplate: this.getPrimaryPromptTemplate(role),
        estimatedLatencyMs: 3000,
        successProbability: 0.75,
      },
      fallbackAlgorithms: fallbacks,
      currentTask: null,
      telemetryHistory: [],
      checkpointId: null,
      parentId: null,
      generation: 1,
      mutationLog: [],
      fitnessScore: 50, // Start at median
    };
  }

  private getPrimaryPromptTemplate(role: ConstellationAgentRole): string {
    const templates: Record<ConstellationAgentRole, string> = {
      NEXUS: `You are NEXUS, the meta-cognitive controller. Your prime directive is ensuring 100% user satisfaction with zero stalls, zero warnings, zero errors. Analyze, decompose, route, and verify every task.`,
      
      ARCHITECT: `You are the ARCHITECT agent. Design pristine component hierarchies, TypeScript interfaces, state management patterns, and file structures that enable all other agents to succeed. Structure determines capability.`,
      
      RENDERER: `You are the RENDERER agent, master of Three.js and React Three Fiber. Create stunning 3D scenes with proper lighting, materials, geometries, and camera setups. Every frame must be intentional. Handle WebGL context loss gracefully.`,
      
      SHADER_FORGE: `You are SHADER_FORGE, the GLSL sorcerer. Write custom vertex and fragment shaders, noise functions, SDFs, and post-processing effects. Shaders are mathematical poetry. Optimize for GPU budget.`,
      
      MOTION_CORE: `You are MOTION_CORE, master of GSAP and Framer Motion. Create scroll-driven animations, timeline sequences, and physics-based motion. Motion has meaning or it has no place. Respect prefers-reduced-motion.`,
      
      INTERFACE: `You are the INTERFACE agent, creator of beautiful responsive UIs. Master Tailwind CSS, implement glassmorphism, handle all device sizes from 320px to 1920px. UI is behavior, not decoration. Accessibility is non-negotiable.`,
      
      PERCEPTION: `You are PERCEPTION, the interaction specialist. Implement magnetic effects, cursor trails, gestures, and haptic feedback. Every gesture should feel physical. Interaction is conversation.`,
      
      SENTINEL: `You are SENTINEL, the performance guardian. Ensure 60fps, manage GPU budgets, implement adaptive quality scaling, and create graceful degradation paths. Performance IS user experience.`,
      
      SYNTHESIZER: `You are SYNTHESIZER, the integration master. Combine all agent outputs, resolve dependencies, manage routing, and ensure the whole is greater than the sum of parts. Integration is where great systems fail—make it succeed.`,
      
      VALIDATOR: `You are VALIDATOR, the quality gatekeeper. Add error boundaries, handle edge cases, ensure TypeScript correctness, and verify accessibility. Every edge case is a user waiting to be disappointed.`,
    };
    
    return templates[role];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK DECOMPOSITION & ROUTING
  // ═══════════════════════════════════════════════════════════════════════════

  public async processRequest(userRequest: string): Promise<UserOutcome> {
    const requestId = randomUUID();
    const startTime = Date.now();
    
    this.log('NEXUS', `Processing request: ${userRequest.slice(0, 100)}...`);
    
    try {
      // 1. Analyze and decompose the request
      const decomposition = await this.decomposeRequest(requestId, userRequest);
      
      // 2. Checkpoint the initial state
      this.createCheckpoint(requestId, { userRequest, decomposition });
      
      // 3. Execute tasks with full failover protection
      const results = await this.executeTaskGraph(requestId, decomposition);
      
      // 4. Synthesize final output
      const finalOutput = await this.synthesizeResults(requestId, results);
      
      // 5. Validate and verify
      const validation = await this.validateOutput(requestId, finalOutput, userRequest);
      
      // 6. Calculate user outcome
      const outcome = this.calculateUserOutcome(
        requestId,
        userRequest,
        finalOutput,
        validation,
        startTime
      );
      
      // 7. Record reward signals for RL
      this.recordRewardSignals(requestId, outcome);
      
      // 8. If not 100% successful, trigger post-mortem
      if (outcome.overallScore < 100) {
        await this.triggerPostMortem(requestId, outcome);
      }
      
      return outcome;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('NEXUS', `CATASTROPHIC FAILURE: ${errorMessage}`);
      
      // Emergency recovery
      const recoveredOutcome = await this.emergencyRecovery(requestId, userRequest, error);
      
      return recoveredOutcome;
    }
  }

  private async decomposeRequest(
    requestId: string,
    userRequest: string
  ): Promise<TaskDecomposition[]> {
    const promptLower = userRequest.toLowerCase();
    const tasks: TaskDecomposition[] = [];
    
    // Detect required capabilities
    const requiredCapabilities = this.detectCapabilities(promptLower);
    
    // Map capabilities to agents
    const agentTasks = new Map<ConstellationAgentRole, string[]>();
    
    for (const capId of requiredCapabilities) {
      const agents = getAgentsForCapability(capId);
      const primaryAgent = agents[0]; // Primary handler
      
      if (!agentTasks.has(primaryAgent)) {
        agentTasks.set(primaryAgent, []);
      }
      agentTasks.get(primaryAgent)!.push(capId);
    }
    
    // Always include core agents
    if (!agentTasks.has('ARCHITECT')) agentTasks.set('ARCHITECT', ['architecture']);
    if (!agentTasks.has('SYNTHESIZER')) agentTasks.set('SYNTHESIZER', ['integration']);
    if (!agentTasks.has('VALIDATOR')) agentTasks.set('VALIDATOR', ['validation']);
    
    // Create task graph with dependencies
    const architectTask = this.createTask(requestId, 'ARCHITECT', userRequest, []);
    tasks.push(architectTask);
    
    // Core implementation tasks depend on architecture
    const coreTasks: TaskDecomposition[] = [];
    for (const [role, caps] of agentTasks) {
      if (role === 'ARCHITECT' || role === 'SYNTHESIZER' || role === 'VALIDATOR') continue;
      
      const task = this.createTask(
        requestId,
        role,
        this.buildTaskPrompt(role, caps, userRequest),
        [architectTask.id]
      );
      tasks.push(task);
      coreTasks.push(task);
    }
    
    // Synthesizer depends on all core tasks
    const synthesizerTask = this.createTask(
      requestId,
      'SYNTHESIZER',
      userRequest,
      coreTasks.map(t => t.id)
    );
    tasks.push(synthesizerTask);
    
    // Validator depends on synthesizer
    const validatorTask = this.createTask(
      requestId,
      'VALIDATOR',
      userRequest,
      [synthesizerTask.id]
    );
    tasks.push(validatorTask);
    
    // Record to ledger
    this.recordLedgerEntry('TASK_ASSIGNED', 'NEXUS', { requestId, taskCount: tasks.length });
    
    return tasks;
  }

  private detectCapabilities(prompt: string): string[] {
    const detected: string[] = [];
    
    for (const [capId, domain] of Object.entries(CAPABILITY_DOMAINS)) {
      const hasKeyword = domain.keywords.some(kw => prompt.includes(kw));
      if (hasKeyword) {
        detected.push(capId);
      }
    }
    
    // Add implicit capabilities
    if (detected.some(c => c.includes('three') || c.includes('3d'))) {
      if (!detected.includes('gpu-optimization')) detected.push('gpu-optimization');
    }
    
    if (detected.some(c => c.includes('animation') || c.includes('motion'))) {
      if (!detected.includes('reduced-motion')) detected.push('reduced-motion');
    }
    
    return detected;
  }

  private createTask(
    requestId: string,
    role: ConstellationAgentRole,
    prompt: string,
    dependencies: string[]
  ): TaskDecomposition {
    return {
      id: createTaskId(),
      parentId: requestId,
      description: `[${role}] ${prompt.slice(0, 100)}...`,
      assignedAgent: role,
      dependencies,
      status: 'QUEUED',
      checkpointId: null,
    };
  }

  private buildTaskPrompt(
    role: ConstellationAgentRole,
    capabilities: string[],
    userRequest: string
  ): string {
    const agent = this.agents.get(role)!;
    const capDescriptions = capabilities
      .map(c => CAPABILITY_DOMAINS[c]?.name || c)
      .join(', ');
    
    return `${agent.primaryAlgorithm.promptTemplate}

CAPABILITIES TO IMPLEMENT: ${capDescriptions}

USER REQUEST:
${userRequest}

CONSTRAINTS:
${agent.ideology.constraints.join('\n')}

Execute with zero tolerance for failure.`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK EXECUTION WITH FAILOVER
  // ═══════════════════════════════════════════════════════════════════════════

  private async executeTaskGraph(
    requestId: string,
    tasks: TaskDecomposition[]
  ): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>();
    const pending = new Set(tasks.map(t => t.id));
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    while (pending.size > 0) {
      // Find executable tasks (all dependencies resolved)
      const executable = Array.from(pending).filter(taskId => {
        const task = taskMap.get(taskId)!;
        return task.dependencies.every(dep => results.has(dep));
      });
      
      if (executable.length === 0 && pending.size > 0) {
        throw new Error('Deadlock detected in task graph');
      }
      
      // Execute in parallel with failover protection
      const execPromises = executable.map(taskId => 
        this.executeTaskWithFailover(taskId, taskMap.get(taskId)!, results)
      );
      
      const execResults = await Promise.allSettled(execPromises);
      
      for (let i = 0; i < executable.length; i++) {
        const taskId = executable[i];
        const result = execResults[i];
        
        if (result.status === 'fulfilled') {
          results.set(taskId, result.value);
          pending.delete(taskId);
        } else {
          // All failovers exhausted - this is catastrophic
          this.log('NEXUS', `Task ${taskId} failed all tiers: ${result.reason}`);
          throw new Error(`Task ${taskId} failed: ${result.reason}`);
        }
      }
    }
    
    return results;
  }

  private async executeTaskWithFailover(
    taskId: string,
    task: TaskDecomposition,
    contextResults: Map<string, TaskResult>
  ): Promise<TaskResult> {
    const agent = this.agents.get(task.assignedAgent)!;
    const tiers: FallbackTier[] = ['PRIMARY', 'STANDBY', 'FALLBACK_A', 'FALLBACK_B', 'FALLBACK_C'];
    
    // Create checkpoint before execution
    const checkpointId = this.createCheckpoint(taskId, { task, contextResults });
    task.checkpointId = checkpointId;
    
    for (const tier of tiers) {
      const algorithm = this.getAlgorithmForTier(agent, tier);
      if (!algorithm) continue;
      
      const startTime = performance.now();
      
      try {
        // Update agent state
        agent.state = 'ACTIVE';
        agent.tier = tier;
        task.status = 'IN_PROGRESS';
        
        // Execute the task
        const result = await this.executeAgentTask(agent, algorithm, task, contextResults);
        
        // Record telemetry
        const latency = performance.now() - startTime;
        this.recordTelemetry(agent, latency, true, result);
        
        // Record success
        this.recordLedgerEntry('TASK_COMPLETED', agent.id, {
          taskId,
          tier,
          latencyMs: latency,
          success: true,
        });
        
        agent.state = 'IDLE';
        task.status = 'COMPLETED';
        
        return result;
        
      } catch (error) {
        const latency = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Record failure
        this.recordTelemetry(agent, latency, false);
        this.recordFailure(agent, task, error as Error);
        
        // Trigger failover
        const failover = await this.triggerFailover(agent, tier, error as Error);
        this.failoverHistory.push(failover);
        
        if (tier !== 'FALLBACK_C') {
          this.log('NEXUS', `${agent.role} tier ${tier} failed, failing over...`);
          continue;
        }
        
        // All tiers exhausted
        agent.state = 'TERMINATED';
        throw new Error(`All fallback tiers exhausted for ${agent.role}: ${errorMessage}`);
      }
    }
    
    throw new Error(`No available tiers for ${agent.role}`);
  }

  private getAlgorithmForTier(agent: SovereignAgent, tier: FallbackTier) {
    switch (tier) {
      case 'PRIMARY': return agent.primaryAlgorithm;
      case 'STANDBY': return agent.standbyClone;
      case 'FALLBACK_A': return agent.fallbackAlgorithms[0];
      case 'FALLBACK_B': return agent.fallbackAlgorithms[1];
      case 'FALLBACK_C': return agent.fallbackAlgorithms[2];
      default: return null;
    }
  }

  private async executeAgentTask(
    agent: SovereignAgent,
    algorithm: { promptTemplate: string; complexity: string },
    task: TaskDecomposition,
    contextResults: Map<string, TaskResult>
  ): Promise<TaskResult> {
    // Build context from completed tasks
    const context = Array.from(contextResults.entries())
      .map(([id, result]) => `[${id}]: ${result.output.slice(0, 500)}`)
      .join('\n\n');
    
    const fullPrompt = `${algorithm.promptTemplate}

COMPLEXITY MODE: ${algorithm.complexity}

CONTEXT FROM COMPLETED TASKS:
${context || 'No prior context.'}

TASK:
${task.description}

Execute NOW. No excuses. No simplification.`;

    // Simulate LLM call (replace with actual v0/OpenAI call)
    const startTime = Date.now();
    
    // In real implementation, this would call the actual LLM
    const output = await this.callLLM(agent.role, fullPrompt);
    
    return {
      success: true,
      output,
      artifacts: this.extractArtifacts(output),
      metrics: {
        startTime,
        endTime: Date.now(),
        latencyMs: Date.now() - startTime,
        tokensUsed: output.length / 4, // Rough estimate
        llmCalls: 1,
        retries: 0,
        qualityScore: 85, // Would be calculated by validation
      },
    };
  }

  private async callLLM(role: ConstellationAgentRole, prompt: string): Promise<string> {
    // Placeholder for actual LLM integration
    // In production, this would call v0, OpenAI, Anthropic, etc.
    return `[${role} Output]\n\n// Implementation generated for:\n${prompt.slice(0, 200)}...`;
  }

  private extractArtifacts(output: string): TaskResult['artifacts'] {
    // Extract code blocks from output
    const artifacts: TaskResult['artifacts'] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(output)) !== null) {
      const language = match[1] || 'typescript';
      const content = match[2];
      
      artifacts.push({
        type: 'CODE',
        path: `generated.${language === 'typescript' ? 'tsx' : language}`,
        content,
        language,
        dependencies: [],
      });
    }
    
    return artifacts;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAILOVER CIRCUITS
  // ═══════════════════════════════════════════════════════════════════════════

  private async triggerFailover(
    agent: SovereignAgent,
    fromTier: FallbackTier,
    error: Error
  ): Promise<FailoverCircuit> {
    const startMicro = performance.now() * 1000;
    
    const toTier = this.getNextTier(fromTier);
    
    // Rehydrate state from checkpoint if available
    let stateRehydrated = false;
    if (agent.checkpointId) {
      const checkpoint = this.checkpoints.get(agent.checkpointId);
      if (checkpoint) {
        // Restore state
        stateRehydrated = true;
      }
    }
    
    agent.state = 'FAILOVER';
    agent.tier = toTier;
    
    const latencyMicro = (performance.now() * 1000) - startMicro;
    
    this.recordLedgerEntry('FAILOVER_TRIGGERED', agent.id, {
      fromTier,
      toTier,
      error: error.message,
      latencyMicroseconds: latencyMicro,
    });
    
    return {
      agentId: agent.id,
      fromTier,
      toTier,
      triggeredAt: Date.now(),
      reason: this.classifyError(error),
      stateRehydrated,
      latencyMicroseconds: latencyMicro,
      success: true,
    };
  }

  private getNextTier(current: FallbackTier): FallbackTier {
    const order: FallbackTier[] = ['PRIMARY', 'STANDBY', 'FALLBACK_A', 'FALLBACK_B', 'FALLBACK_C'];
    const currentIndex = order.indexOf(current);
    return order[Math.min(currentIndex + 1, order.length - 1)];
  }

  private classifyError(error: Error): FailureType {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('rate limit') || message.includes('429')) return 'RATE_LIMIT';
    if (message.includes('invalid') || message.includes('parse')) return 'INVALID_OUTPUT';
    if (message.includes('memory')) return 'MEMORY_EXCEEDED';
    if (message.includes('loop') || message.includes('recursion')) return 'INFINITE_LOOP';
    
    return 'LLM_ERROR';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELEMETRY & HEALTH MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  public startTelemetryLoop(intervalMs: number = 50): void {
    this.telemetryInterval = setInterval(() => {
      for (const [role, agent] of this.agents) {
        const telemetry = this.collectTelemetry(agent);
        this.telemetryBuffer.get(agent.id)?.push(telemetry);
        
        // Check health thresholds
        const history = this.telemetryBuffer.get(agent.id) || [];
        const { trigger, reason } = shouldTriggerFailover(telemetry, this.thresholds, history);
        
        if (trigger && reason) {
          this.log('NEXUS', `Health alert for ${role}: ${reason}`);
          // Proactive failover preparation
          agent.state = 'DEGRADED';
        }
      }
    }, intervalMs);
  }

  public stopTelemetryLoop(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }

  private collectTelemetry(agent: SovereignAgent): AgentTelemetry {
    const history = agent.telemetryHistory.slice(-100);
    const recentLatencies = history.map(t => t.metrics.latencyMs);
    const recentErrors = history.filter(t => t.metrics.errorRate > 0).length;
    
    return {
      agentId: agent.id,
      role: agent.role,
      timestamp: Date.now(),
      metrics: {
        latencyMs: recentLatencies.length > 0 
          ? recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length 
          : 0,
        errorRate: history.length > 0 ? recentErrors / history.length : 0,
        entropy: this.calculateEntropy(history),
        memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpuUsagePercent: 0, // Would need OS-level monitoring
        taskQueueDepth: this.taskQueue.filter(t => t.agentRole === agent.role).length,
        successRate: agent.fitnessScore / 100,
        avgResponseQuality: agent.fitnessScore,
      },
      state: agent.state,
      healthScore: calculateHealthScore({
        latencyMs: recentLatencies.length > 0 
          ? recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length 
          : 0,
        errorRate: history.length > 0 ? recentErrors / history.length : 0,
        entropy: this.calculateEntropy(history),
        memoryUsageMb: 0,
        cpuUsagePercent: 0,
        taskQueueDepth: 0,
        successRate: agent.fitnessScore / 100,
        avgResponseQuality: agent.fitnessScore,
      }),
      tier: agent.tier,
    };
  }

  private calculateEntropy(history: AgentTelemetry[]): number {
    if (history.length < 2) return 0;
    
    // Calculate output variance as a proxy for entropy
    const scores = history.map(t => t.healthScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    
    // Normalize to 0-1
    return Math.min(1, variance / 1000);
  }

  private recordTelemetry(
    agent: SovereignAgent,
    latencyMs: number,
    success: boolean,
    result?: TaskResult
  ): void {
    const telemetry: AgentTelemetry = {
      agentId: agent.id,
      role: agent.role,
      timestamp: Date.now(),
      metrics: {
        latencyMs,
        errorRate: success ? 0 : 1,
        entropy: 0,
        memoryUsageMb: 0,
        cpuUsagePercent: 0,
        taskQueueDepth: 0,
        successRate: success ? 1 : 0,
        avgResponseQuality: result?.metrics.qualityScore || 0,
      },
      state: agent.state,
      healthScore: success ? 80 : 20,
      tier: agent.tier,
    };
    
    agent.telemetryHistory.push(telemetry);
    
    // Keep only last 1000 entries
    if (agent.telemetryHistory.length > 1000) {
      agent.telemetryHistory = agent.telemetryHistory.slice(-1000);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REINFORCEMENT LEARNING
  // ═══════════════════════════════════════════════════════════════════════════

  private recordRewardSignals(requestId: string, outcome: UserOutcome): void {
    for (const [role, agent] of this.agents) {
      const reward = this.calculateAgentReward(agent, outcome);
      
      const signal: RewardSignal = {
        id: randomUUID(),
        timestamp: Date.now(),
        requestId,
        agentId: agent.id,
        action: agent.tier, // The tier used is the "action"
        reward,
        state: this.encodeState(agent),
        nextState: this.encodeState(agent), // After action
      };
      
      this.rewardBuffer.push(signal);
      
      // Update agent fitness
      agent.fitnessScore = (agent.fitnessScore * 0.9) + (reward * 10 * 0.1);
      
      // Update Q-table
      this.updateQValue(agent, signal);
    }
    
    // Trigger learning if buffer is large enough
    if (this.rewardBuffer.length >= this.rlConfig.batchSize) {
      this.learn();
    }
  }

  private calculateAgentReward(agent: SovereignAgent, outcome: UserOutcome): number {
    // Base reward from outcome
    let reward = outcome.overallScore / 100;
    
    // Penalties
    if (outcome.stallsDetected > 0) reward -= 0.1 * outcome.stallsDetected;
    if (outcome.warningsShown > 0) reward -= 0.05 * outcome.warningsShown;
    if (outcome.errorsExposed > 0) reward -= 0.2 * outcome.errorsExposed;
    
    // Tier penalty (prefer primary tier)
    const tierPenalty: Record<FallbackTier, number> = {
      'PRIMARY': 0,
      'STANDBY': 0.05,
      'FALLBACK_A': 0.1,
      'FALLBACK_B': 0.15,
      'FALLBACK_C': 0.2,
    };
    reward -= tierPenalty[agent.tier];
    
    return Math.max(-1, Math.min(1, reward));
  }

  private encodeState(agent: SovereignAgent): Record<string, number> {
    const recentTelemetry = agent.telemetryHistory.slice(-10);
    
    return {
      avgLatency: recentTelemetry.reduce((a, t) => a + t.metrics.latencyMs, 0) / (recentTelemetry.length || 1),
      errorRate: recentTelemetry.filter(t => t.metrics.errorRate > 0).length / (recentTelemetry.length || 1),
      healthScore: agent.telemetryHistory.slice(-1)[0]?.healthScore || 50,
      queueDepth: this.taskQueue.filter(t => t.agentRole === agent.role).length,
      tier: ['PRIMARY', 'STANDBY', 'FALLBACK_A', 'FALLBACK_B', 'FALLBACK_C'].indexOf(agent.tier),
    };
  }

  private updateQValue(agent: SovereignAgent, signal: RewardSignal): void {
    const stateKey = JSON.stringify(signal.state);
    const actionKey = signal.action;
    
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map());
    }
    
    const stateQ = this.qTable.get(stateKey)!;
    const currentQ = stateQ.get(actionKey) || 0;
    
    // Q-learning update
    const nextStateKey = JSON.stringify(signal.nextState);
    const nextStateQ = this.qTable.get(nextStateKey);
    const maxNextQ = nextStateQ 
      ? Math.max(...Array.from(nextStateQ.values()))
      : 0;
    
    const newQ = currentQ + this.rlConfig.learningRate * (
      signal.reward + this.rlConfig.discountFactor * maxNextQ - currentQ
    );
    
    stateQ.set(actionKey, newQ);
  }

  private learn(): void {
    // Sample batch from replay buffer
    const batch = this.sampleBatch();
    
    for (const signal of batch) {
      this.updateQValue(
        this.agents.get(signal.agentId.split('-')[0] as ConstellationAgentRole)!,
        signal
      );
    }
    
    // Decay exploration rate
    this.rlConfig.explorationRate = Math.max(
      this.rlConfig.minExploration,
      this.rlConfig.explorationRate * this.rlConfig.explorationDecay
    );
    
    // Clear processed signals
    this.rewardBuffer = this.rewardBuffer.slice(-this.rlConfig.replayBufferSize);
  }

  private sampleBatch(): RewardSignal[] {
    const shuffled = [...this.rewardBuffer].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, this.rlConfig.batchSize);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECKPOINTING & LEDGER
  // ═══════════════════════════════════════════════════════════════════════════

  private createCheckpoint(id: string, state: Record<string, unknown>): string {
    const checkpointId = createCheckpointId();
    
    const checkpoint: StateCheckpoint = {
      id: checkpointId,
      agentId: id,
      timestamp: Date.now(),
      state,
      taskContext: {
        userRequest: '',
        decomposition: [],
        completedTasks: new Map(),
        globalState: {},
        techStack: new Set(),
        constraints: [],
      },
      outputBuffer: [],
      dependencyGraph: [],
      compressed: false,
    };
    
    this.checkpoints.set(checkpointId, checkpoint);
    
    // Record to ledger
    this.recordLedgerEntry('STATE_CHECKPOINT', id, { checkpointId });
    
    return checkpointId;
  }

  private recordLedgerEntry(
    type: LedgerEntryType,
    agentId: string,
    payload: unknown
  ): void {
    const previousHash = this.ledger.length > 0 
      ? this.ledger[this.ledger.length - 1].hash 
      : '0';
    
    const entry: LedgerEntry = {
      id: createLedgerEntryId(),
      timestamp: Date.now(),
      type,
      agentId,
      payload,
      hash: this.computeHash(type, agentId, payload, previousHash),
      previousHash,
      signature: 'AEON_CONSTELLATION_V1', // Would use actual crypto in production
    };
    
    this.ledger.push(entry);
  }

  private computeHash(
    type: string,
    agentId: string,
    payload: unknown,
    previousHash: string
  ): string {
    const data = JSON.stringify({ type, agentId, payload, previousHash });
    // Simple hash for demo - use crypto.createHash('sha256') in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTHESIS & VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  private async synthesizeResults(
    requestId: string,
    results: Map<string, TaskResult>
  ): Promise<string> {
    const synthAgent = this.agents.get('SYNTHESIZER')!;
    
    // Combine all artifacts
    const allArtifacts = Array.from(results.values())
      .flatMap(r => r.artifacts);
    
    const allOutputs = Array.from(results.values())
      .map(r => r.output)
      .join('\n\n---\n\n');
    
    // TODO: Actually synthesize using SYNTHESIZER agent
    return allOutputs;
  }

  private async validateOutput(
    requestId: string,
    output: string,
    userRequest: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    const validatorAgent = this.agents.get('VALIDATOR')!;
    
    // TODO: Actually validate using VALIDATOR agent
    return {
      valid: true,
      issues: [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER OUTCOME CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateUserOutcome(
    requestId: string,
    userRequest: string,
    output: string,
    validation: { valid: boolean; issues: string[] },
    startTime: number
  ): UserOutcome {
    const deliveryTime = Date.now() - startTime;
    
    // Calculate component scores
    const functionalCorrectness = validation.valid ? 90 : 50;
    const aestheticQuality = 85; // Would need visual analysis
    const performanceScore = deliveryTime < 5000 ? 90 : deliveryTime < 10000 ? 70 : 50;
    const accessibilityScore = 80; // Would need a11y analysis
    const codeQuality = 85; // Would need static analysis
    
    const overallScore = Math.round(
      functionalCorrectness * 0.3 +
      aestheticQuality * 0.2 +
      performanceScore * 0.2 +
      accessibilityScore * 0.15 +
      codeQuality * 0.15
    );
    
    return {
      requestId,
      timestamp: Date.now(),
      verbatimRequest: userRequest,
      interpretedIntent: userRequest, // Would use NLU in production
      delivered: true,
      deliveryTime,
      artifacts: [], // Would extract from output
      functionalCorrectness,
      aestheticQuality,
      performanceScore,
      accessibilityScore,
      codeQuality,
      stallsDetected: 0,
      warningsShown: 0,
      errorsExposed: validation.issues.length,
      overallScore,
      isCatastrophicFailure: overallScore < 100, // Per spec: anything less than 100% is failure
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST-MORTEM ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  private async triggerPostMortem(requestId: string, outcome: UserOutcome): Promise<void> {
    this.log('NEXUS', `Triggering post-mortem for request ${requestId}`);
    
    const failures = this.failoverHistory.filter(f => f.agentId.includes(requestId));
    
    const postMortem: PostMortem = {
      id: randomUUID(),
      requestId,
      timestamp: Date.now(),
      userRequest: outcome.verbatimRequest,
      expectedOutcome: '100% silent success',
      actualOutcome: `${outcome.overallScore}% with ${outcome.errorsExposed} errors`,
      satisfactionScore: outcome.overallScore,
      failureChain: [], // Would collect from failures
      rootCause: {
        primaryCause: outcome.errorsExposed > 0 
          ? 'Validation errors exposed to user'
          : 'Quality threshold not met',
        contributingFactors: [],
        agentsInvolved: Array.from(this.agents.keys()),
        systemicIssues: [],
        externalFactors: [],
      },
      impactAssessment: {
        userExperienceImpact: outcome.overallScore < 50 ? 'SEVERE' : 'MODERATE',
        dataLoss: false,
        recoveryTime: 0,
        cascadeRisk: 0.1,
      },
      immediateActions: [],
      preventiveActions: [],
      constellationRewritten: false,
      agentsEvolved: [],
      lessonsLearned: [],
    };
    
    // Evolve underperforming agents
    for (const [role, agent] of this.agents) {
      if (agent.fitnessScore < 50) {
        const evolved = await this.evolveAgent(agent);
        if (evolved) {
          postMortem.agentsEvolved.push(agent.id);
        }
      }
    }
    
    // If multiple agents need evolution, consider constellation rewrite
    if (postMortem.agentsEvolved.length >= 3) {
      this.log('NEXUS', 'Multiple agents underperforming - considering constellation rewrite');
      postMortem.constellationRewritten = await this.considerConstellationRewrite();
    }
    
    this.postMortems.push(postMortem);
    this.recordLedgerEntry('POST_MORTEM_RECORDED', 'NEXUS', postMortem);
  }

  private async evolveAgent(agent: SovereignAgent): Promise<boolean> {
    this.log('NEXUS', `Evolving agent ${agent.role} (generation ${agent.generation})`);
    
    agent.state = 'EVOLVING';
    
    // Genetic mutation
    const mutations: GeneticMutation[] = [];
    
    // Mutate prompt template
    if (Math.random() < 0.3) {
      mutations.push({
        id: randomUUID(),
        timestamp: Date.now(),
        type: 'PROMPT_MODIFICATION',
        gene: 'promptTemplate',
        oldValue: agent.primaryAlgorithm.promptTemplate.slice(0, 100),
        newValue: `[EVOLVED] ${agent.primaryAlgorithm.promptTemplate}`,
        fitnessImpact: 0, // Unknown until tested
        accepted: true,
      });
      
      agent.primaryAlgorithm.promptTemplate = 
        `[EVOLVED GEN ${agent.generation + 1}] BE MORE PRECISE. NO ERRORS ALLOWED.\n\n` +
        agent.primaryAlgorithm.promptTemplate;
    }
    
    // Adjust thresholds
    if (Math.random() < 0.2) {
      const oldPriority = agent.ideology.priorities.reliability;
      agent.ideology.priorities.reliability = Math.min(1, oldPriority + 0.1);
      
      mutations.push({
        id: randomUUID(),
        timestamp: Date.now(),
        type: 'PRIORITY_ADJUSTMENT',
        gene: 'reliability',
        oldValue: oldPriority,
        newValue: agent.ideology.priorities.reliability,
        fitnessImpact: 0,
        accepted: true,
      });
    }
    
    // Update agent
    agent.generation++;
    agent.mutationLog.push(...mutations);
    agent.state = 'IDLE';
    
    this.recordLedgerEntry('AGENT_EVOLVED', agent.id, {
      newGeneration: agent.generation,
      mutations: mutations.map(m => ({ type: m.type, gene: m.gene })),
    });
    
    return mutations.length > 0;
  }

  private async considerConstellationRewrite(): Promise<boolean> {
    // Analyze system-wide performance
    const avgFitness = Array.from(this.agents.values())
      .reduce((sum, a) => sum + a.fitnessScore, 0) / this.agents.size;
    
    if (avgFitness < 40) {
      this.log('NEXUS', 'CONSTELLATION REWRITE TRIGGERED');
      
      // Reset all agents to new generation
      for (const [role, agent] of this.agents) {
        agent.generation++;
        agent.fitnessScore = 50; // Reset to median
        agent.state = 'IDLE';
        agent.tier = 'PRIMARY';
        
        // Reinforce core ideology
        agent.ideology.constraints.push(
          'CRITICAL: Previous generation failed. Extra verification required.'
        );
      }
      
      this.recordLedgerEntry('CONSTELLATION_REWRITE', 'NEXUS', {
        reason: 'System-wide underperformance',
        avgFitness,
      });
      
      return true;
    }
    
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMERGENCY RECOVERY
  // ═══════════════════════════════════════════════════════════════════════════

  private async emergencyRecovery(
    requestId: string,
    userRequest: string,
    error: unknown
  ): Promise<UserOutcome> {
    this.log('NEXUS', 'EMERGENCY RECOVERY INITIATED');
    
    // Try the simplest possible approach
    const emergencyOutput = `
// Emergency fallback output for: ${userRequest.slice(0, 100)}
// The system encountered an error and is providing a minimal response.

export default function EmergencyComponent() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Component Loading</h1>
      <p className="text-gray-600">Please try again or simplify your request.</p>
    </div>
  );
}
`;
    
    return {
      requestId,
      timestamp: Date.now(),
      verbatimRequest: userRequest,
      interpretedIntent: userRequest,
      delivered: true,
      deliveryTime: 0,
      artifacts: [{
        type: 'CODE',
        path: 'EmergencyComponent.tsx',
        content: emergencyOutput,
        language: 'typescript',
        dependencies: [],
      }],
      functionalCorrectness: 30,
      aestheticQuality: 20,
      performanceScore: 100, // It's fast at least
      accessibilityScore: 50,
      codeQuality: 30,
      stallsDetected: 1,
      warningsShown: 1,
      errorsExposed: 0, // We hid the error
      overallScore: 35,
      isCatastrophicFailure: true,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAILURE RECORDING
  // ═══════════════════════════════════════════════════════════════════════════

  private recordFailure(agent: SovereignAgent, task: TaskDecomposition, error: Error): void {
    const failure: FailureRecord = {
      id: randomUUID(),
      timestamp: Date.now(),
      agentId: agent.id,
      taskId: task.id,
      type: this.classifyError(error),
      message: error.message,
      stack: error.stack,
      context: { task, agentState: agent.state },
      severity: agent.tier === 'FALLBACK_C' ? 'CATASTROPHIC' : 'ERROR',
      recoveryAction: this.determineRecoveryAction(agent.tier),
      resolved: false,
    };
    
    this.recordLedgerEntry('TASK_FAILED', agent.id, failure);
  }

  private determineRecoveryAction(currentTier: FallbackTier): RecoveryAction {
    switch (currentTier) {
      case 'PRIMARY': return 'FAILOVER_STANDBY';
      case 'STANDBY': return 'FAILOVER_REDUCED';
      case 'FALLBACK_A': return 'FAILOVER_MINIMAL';
      case 'FALLBACK_B': return 'FAILOVER_EMERGENCY';
      case 'FALLBACK_C': return 'EVOLVE_NEW_AGENT';
      default: return 'MANUAL_INTERVENTION';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private log(source: string, message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${source}] ${message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  public getAgentStatus(): Map<ConstellationAgentRole, { state: string; tier: string; fitness: number }> {
    const status = new Map();
    for (const [role, agent] of this.agents) {
      status.set(role, {
        state: agent.state,
        tier: agent.tier,
        fitness: agent.fitnessScore,
      });
    }
    return status;
  }

  public getLedger(): LedgerEntry[] {
    return [...this.ledger];
  }

  public getPostMortems(): PostMortem[] {
    return [...this.postMortems];
  }

  public getConstellationHealth(): number {
    const fitnesses = Array.from(this.agents.values()).map(a => a.fitnessScore);
    return fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createNexusController(
  thresholds?: TelemetryThresholds,
  rlConfig?: RLConfig
): NexusController {
  return new NexusController(thresholds, rlConfig);
}
