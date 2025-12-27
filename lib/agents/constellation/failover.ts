// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - FAILOVER SYSTEM
// Microsecond-latency failover with hot-standby clones
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ConstellationAgentRole,
  FallbackTier,
  FailoverCircuit,
  AgentTelemetry,
  StateCheckpoint,
  TaskContext,
  DependencyNode,
  FailureType,
  TelemetryThresholds,
  calculateHealthScore,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// FAILOVER TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FailoverResult {
  success: boolean;
  tier: FallbackTier;
  latencyMicroseconds: number;
  agentId: string;
  stateRestored: boolean;
}

interface CircuitState {
  currentTier: FallbackTier;
  failureCount: number;
  lastFailure: number | null;
  circuitOpen: boolean;
  cooldownUntil: number | null;
}

interface TierAgents {
  PRIMARY: string;
  STANDBY: string;
  FALLBACK_A: string;
  FALLBACK_B: string;
  FALLBACK_C: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function createCheckpointId(): string {
  return `chk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function shouldTriggerFailover(
  telemetry: AgentTelemetry,
  _tier: FallbackTier,
  thresholds: TelemetryThresholds
): boolean {
  // Trigger failover if health score is below floor
  if (telemetry.healthScore < thresholds.healthFloor) return true;
  
  // Trigger if latency exceeds threshold
  if (telemetry.metrics.latencyMs > thresholds.maxLatencyMs) return true;
  
  // Trigger if error rate exceeds threshold
  if (telemetry.metrics.errorRate > thresholds.maxErrorRate) return true;
  
  // Trigger if entropy is too high (unpredictable behavior)
  if (telemetry.metrics.entropy > thresholds.maxEntropy) return true;
  
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILOVER CIRCUIT MANAGER
// ─────────────────────────────────────────────────────────────────────────────

export class FailoverCircuitManager {
  private tierAgents: Map<ConstellationAgentRole, TierAgents> = new Map();
  private circuitStates: Map<ConstellationAgentRole, CircuitState> = new Map();
  private checkpoints: Map<ConstellationAgentRole, StateCheckpoint[]> = new Map();
  private failoverHistory: FailoverCircuit[] = [];
  
  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 3;
  private readonly COOLDOWN_MS = 5000;
  private readonly thresholds: TelemetryThresholds = {
    maxLatencyMs: 5000,
    maxErrorRate: 0.1,
    maxEntropy: 0.5,
    sigmaMultiplier: 2,
    healthFloor: 30,
  };
  
  constructor(private agents: Map<ConstellationAgentRole, string>) {
    this.initializeCircuits();
  }
  
  private initializeCircuits(): void {
    const roles: ConstellationAgentRole[] = [
      'NEXUS', 'ARCHITECT', 'RENDERER', 'SHADER_FORGE', 'MOTION_CORE',
      'INTERFACE', 'PERCEPTION', 'SENTINEL', 'SYNTHESIZER', 'VALIDATOR'
    ];
    
    for (const role of roles) {
      const agentId = this.agents.get(role);
      if (!agentId) continue;
      
      this.tierAgents.set(role, {
        PRIMARY: agentId,
        STANDBY: `${agentId}-standby`,
        FALLBACK_A: `${agentId}-fallback-a`,
        FALLBACK_B: `${agentId}-fallback-b`,
        FALLBACK_C: `${agentId}-fallback-c`,
      });
      
      this.circuitStates.set(role, {
        currentTier: 'PRIMARY',
        failureCount: 0,
        lastFailure: null,
        circuitOpen: false,
        cooldownUntil: null,
      });
      
      this.checkpoints.set(role, []);
    }
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // MICROSECOND FAILOVER
  // ───────────────────────────────────────────────────────────────────────────
  
  async executeWithFailover<T>(
    role: ConstellationAgentRole,
    operation: (agentId: string) => Promise<T>,
    telemetry: AgentTelemetry
  ): Promise<{ result: T; failoverResult?: FailoverResult }> {
    const tierAgentsForRole = this.tierAgents.get(role);
    const state = this.circuitStates.get(role);
    
    if (!tierAgentsForRole || !state) {
      throw new Error(`No circuit found for role: ${role}`);
    }
    
    // Check if circuit is in cooldown
    if (state.circuitOpen && state.cooldownUntil) {
      if (Date.now() < state.cooldownUntil) {
        throw new Error(`Circuit open for ${role} until ${new Date(state.cooldownUntil).toISOString()}`);
      }
      // Half-open: try primary again
      state.circuitOpen = false;
      state.currentTier = 'PRIMARY';
    }
    
    const startNs = process.hrtime.bigint();
    let currentTier = state.currentTier;
    let lastError: Error | null = null;
    
    // Try each tier in sequence until success
    const tiers: FallbackTier[] = ['PRIMARY', 'STANDBY', 'FALLBACK_A', 'FALLBACK_B', 'FALLBACK_C'];
    const startIndex = tiers.indexOf(currentTier);
    
    for (let i = startIndex; i < tiers.length; i++) {
      const tier = tiers[i];
      const agentId = tierAgentsForRole[tier];
      
      try {
        // Attempt the operation
        const result = await this.executeWithTimeout(
          operation(agentId),
          this.getTimeoutForTier(tier)
        );
        
        const endNs = process.hrtime.bigint();
        const latencyMicroseconds = Number(endNs - startNs) / 1000;
        
        // Success - record if it was a failover
        if (tier !== state.currentTier) {
          this.recordFailover(role, state.currentTier, tier, latencyMicroseconds, true, 'QUALITY_THRESHOLD');
        }
        
        state.failureCount = Math.max(0, state.failureCount - 1);
        
        return {
          result,
          failoverResult: tier !== state.currentTier ? {
            success: true,
            tier,
            latencyMicroseconds,
            agentId,
            stateRestored: await this.restoreState(role, agentId),
          } : undefined,
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const endNs = process.hrtime.bigint();
        const latencyMicroseconds = Number(endNs - startNs) / 1000;
        
        this.recordFailover(role, tier, tiers[i + 1] || 'FALLBACK_C', latencyMicroseconds, false, 'LLM_ERROR');
        
        // Check if we should trigger failover
        if (shouldTriggerFailover(telemetry, tier, this.thresholds)) {
          state.failureCount++;
          
          if (state.failureCount >= this.FAILURE_THRESHOLD) {
            state.circuitOpen = true;
            state.cooldownUntil = Date.now() + this.COOLDOWN_MS;
          }
          
          // Continue to next tier
          currentTier = tiers[i + 1] || 'FALLBACK_C';
          state.currentTier = currentTier;
        }
      }
    }
    
    // All tiers exhausted
    throw new Error(`All failover tiers exhausted for ${role}: ${lastError?.message}`);
  }
  
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }
  
  private getTimeoutForTier(tier: FallbackTier): number {
    const timeouts: Record<FallbackTier, number> = {
      PRIMARY: 5000,
      STANDBY: 5000,
      FALLBACK_A: 7000,
      FALLBACK_B: 10000,
      FALLBACK_C: 15000,
    };
    return timeouts[tier];
  }
  
  private recordFailover(
    role: ConstellationAgentRole,
    fromTier: FallbackTier,
    toTier: FallbackTier,
    latencyMicroseconds: number,
    success: boolean,
    reason: FailureType
  ): void {
    const tierAgentsForRole = this.tierAgents.get(role);
    if (!tierAgentsForRole) return;
    
    const circuit: FailoverCircuit = {
      agentId: tierAgentsForRole[toTier],
      fromTier,
      toTier,
      triggeredAt: Date.now(),
      reason,
      stateRehydrated: false,
      latencyMicroseconds,
      success,
    };
    
    this.failoverHistory.push(circuit);
    
    // Keep last 500 entries
    if (this.failoverHistory.length > 500) {
      this.failoverHistory.shift();
    }
    
    if (success) {
      const state = this.circuitStates.get(role);
      if (state) {
        state.currentTier = toTier;
      }
    }
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // STATE CHECKPOINTING
  // ───────────────────────────────────────────────────────────────────────────
  
  saveCheckpoint(
    role: ConstellationAgentRole,
    agentId: string,
    state: Record<string, unknown>,
    taskContext?: TaskContext
  ): StateCheckpoint {
    const checkpointList = this.checkpoints.get(role) || [];
    
    const checkpoint: StateCheckpoint = {
      id: createCheckpointId(),
      agentId,
      timestamp: Date.now(),
      state,
      taskContext: taskContext ?? {
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
    
    checkpointList.push(checkpoint);
    
    // Keep last 50 checkpoints
    if (checkpointList.length > 50) {
      checkpointList.shift();
    }
    
    this.checkpoints.set(role, checkpointList);
    
    return checkpoint;
  }
  
  async restoreState(
    role: ConstellationAgentRole,
    targetAgentId: string
  ): Promise<boolean> {
    const checkpointList = this.checkpoints.get(role);
    if (!checkpointList || checkpointList.length === 0) {
      return false;
    }
    
    // Get most recent checkpoint
    const checkpoint = checkpointList[checkpointList.length - 1];
    
    // In production, this would actually restore state to the agent
    console.log(`Restored state to ${targetAgentId} from checkpoint ${checkpoint.id}`);
    
    return true;
  }
  
  getLatestCheckpoint(role: ConstellationAgentRole): StateCheckpoint | null {
    const checkpointList = this.checkpoints.get(role);
    if (!checkpointList || checkpointList.length === 0) {
      return null;
    }
    return checkpointList[checkpointList.length - 1];
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // HOT STANDBY MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────
  
  async syncHotStandby(role: ConstellationAgentRole): Promise<void> {
    const checkpointList = this.checkpoints.get(role);
    
    if (!checkpointList || checkpointList.length === 0) {
      return;
    }
    
    const latestCheckpoint = checkpointList[checkpointList.length - 1];
    
    // In production, this would actually sync the state to the hot-standby
    console.log(`Syncing ${role} standby with checkpoint ${latestCheckpoint.id}`);
  }
  
  getCircuitStatus(role: ConstellationAgentRole): {
    tier: FallbackTier;
    healthy: boolean;
    failureCount: number;
    circuitOpen: boolean;
  } | null {
    const state = this.circuitStates.get(role);
    
    if (!state) return null;
    
    return {
      tier: state.currentTier,
      healthy: !state.circuitOpen,
      failureCount: state.failureCount,
      circuitOpen: state.circuitOpen,
    };
  }
  
  getAllCircuitStatuses(): Map<ConstellationAgentRole, ReturnType<typeof this.getCircuitStatus>> {
    const statuses = new Map<ConstellationAgentRole, ReturnType<typeof this.getCircuitStatus>>();
    
    for (const role of this.tierAgents.keys()) {
      statuses.set(role, this.getCircuitStatus(role));
    }
    
    return statuses;
  }
  
  getFailoverHistory(count?: number): FailoverCircuit[] {
    if (count) {
      return this.failoverHistory.slice(-count);
    }
    return [...this.failoverHistory];
  }
  
  getFailoverHistoryByRole(role: ConstellationAgentRole): FailoverCircuit[] {
    const tierAgentsForRole = this.tierAgents.get(role);
    if (!tierAgentsForRole) return [];
    
    const agentIds = Object.values(tierAgentsForRole);
    return this.failoverHistory.filter(f => agentIds.includes(f.agentId));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK ALGORITHM EXECUTOR
// ─────────────────────────────────────────────────────────────────────────────

export class FallbackExecutor {
  async executeFallback(
    tier: FallbackTier,
    role: ConstellationAgentRole,
    task: string
  ): Promise<string> {
    switch (tier) {
      case 'PRIMARY':
      case 'STANDBY':
        return this.executeFullCapability(role, task);
        
      case 'FALLBACK_A':
        return this.executeReducedCapability(role, task);
        
      case 'FALLBACK_B':
        return this.executeMinimalCapability(role, task);
        
      case 'FALLBACK_C':
        return this.executeEmergencyFallback(role, task);
    }
  }
  
  private async executeFullCapability(
    role: ConstellationAgentRole,
    task: string
  ): Promise<string> {
    return `[${role}:FULL] Executed: ${task}`;
  }
  
  private async executeReducedCapability(
    role: ConstellationAgentRole,
    task: string
  ): Promise<string> {
    const reductions: Record<ConstellationAgentRole, string> = {
      NEXUS: 'Using simplified task decomposition',
      ARCHITECT: 'Using standard component templates',
      RENDERER: 'Using basic rendering pipeline',
      SHADER_FORGE: 'Using preset shader library',
      MOTION_CORE: 'Using simplified animations',
      INTERFACE: 'Using basic UI components',
      PERCEPTION: 'Using reduced context window',
      SENTINEL: 'Using standard validation',
      SYNTHESIZER: 'Using cached integration patterns',
      VALIDATOR: 'Using quick validation mode',
    };
    
    return `[${role}:REDUCED] ${reductions[role]} - ${task}`;
  }
  
  private async executeMinimalCapability(
    role: ConstellationAgentRole,
    task: string
  ): Promise<string> {
    const minimal: Record<ConstellationAgentRole, string> = {
      NEXUS: 'Sequential task routing only',
      ARCHITECT: 'Single-component output',
      RENDERER: 'Static HTML output',
      SHADER_FORGE: 'No custom shaders',
      MOTION_CORE: 'CSS transitions only',
      INTERFACE: 'Plain HTML forms',
      PERCEPTION: 'Keyword extraction only',
      SENTINEL: 'Syntax check only',
      SYNTHESIZER: 'Simple concatenation',
      VALIDATOR: 'Schema validation only',
    };
    
    return `[${role}:MINIMAL] ${minimal[role]} - ${task}`;
  }
  
  private async executeEmergencyFallback(
    role: ConstellationAgentRole,
    task: string
  ): Promise<string> {
    // Emergency fallback - return safe default
    return `[${role}:EMERGENCY] Safe default output for: ${task}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let _failoverInstance: FailoverCircuitManager | null = null;

export function getFailoverManager(
  agents?: Map<ConstellationAgentRole, string>
): FailoverCircuitManager {
  if (!_failoverInstance && agents) {
    _failoverInstance = new FailoverCircuitManager(agents);
  }
  if (!_failoverInstance) {
    throw new Error('FailoverCircuitManager not initialized. Provide agents map.');
  }
  return _failoverInstance;
}

export function resetFailoverManager(): void {
  _failoverInstance = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILOVER METRICS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateFailoverMetrics(history: FailoverCircuit[]): {
  totalFailovers: number;
  successRate: number;
  avgLatencyMicroseconds: number;
  failoversByReason: Record<FailureType, number>;
  failoversByTier: Record<FallbackTier, number>;
} {
  if (history.length === 0) {
    return {
      totalFailovers: 0,
      successRate: 1,
      avgLatencyMicroseconds: 0,
      failoversByReason: {} as Record<FailureType, number>,
      failoversByTier: {} as Record<FallbackTier, number>,
    };
  }
  
  const successCount = history.filter(f => f.success).length;
  const totalLatency = history.reduce((sum, f) => sum + f.latencyMicroseconds, 0);
  
  const failoversByReason: Record<string, number> = {};
  const failoversByTier: Record<string, number> = {};
  
  for (const failover of history) {
    failoversByReason[failover.reason] = (failoversByReason[failover.reason] || 0) + 1;
    failoversByTier[failover.toTier] = (failoversByTier[failover.toTier] || 0) + 1;
  }
  
  return {
    totalFailovers: history.length,
    successRate: successCount / history.length,
    avgLatencyMicroseconds: totalLatency / history.length,
    failoversByReason: failoversByReason as Record<FailureType, number>,
    failoversByTier: failoversByTier as Record<FallbackTier, number>,
  };
}
