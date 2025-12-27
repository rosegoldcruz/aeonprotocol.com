// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - SELF-EVOLVING MULTI-AGENT SYSTEM
// Zero single point of failure architecture
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────
export {
  // Agent types
  type ConstellationAgentRole,
  type AgentId,
  type SovereignAgent,
  type AgentIdeology,
  
  // Telemetry types
  type AgentTelemetry,
  
  // Failover types
  type FallbackTier,
  type FailoverCircuit,
  type FallbackAlgorithm,
  
  // State types
  type StateCheckpoint,
  type LedgerEntry,
  
  // Result types
  type TaskResult,
  type UserOutcome,
  type PostMortem,
  
  // Genetic types
  type GeneticMutation,
  type MutationType,
  type RewardSignal,
  
  // Factory functions
  createAgentId,
  createCheckpointId,
  createLedgerEntryId,
  createPostMortemId,
  createMutationId,
  calculateHealthScore,
  shouldTriggerFailover,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITIES
// ─────────────────────────────────────────────────────────────────────────────
export {
  CAPABILITY_DOMAINS,
  AGENT_IDEOLOGIES,
  CAPABILITY_TO_AGENT,
  createFallbackAlgorithms,
  getAgentsForCapability,
  getCapabilitiesForAgent,
} from './capabilities';

// ─────────────────────────────────────────────────────────────────────────────
// META-CONTROLLER (NEXUS)
// ─────────────────────────────────────────────────────────────────────────────
export {
  NexusController,
} from './nexus';

// ─────────────────────────────────────────────────────────────────────────────
// FAILOVER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
export {
  FailoverCircuitManager,
  FallbackExecutor,
  getFailoverManager,
  resetFailoverManager,
  calculateFailoverMetrics,
} from './failover';

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY
// ─────────────────────────────────────────────────────────────────────────────
export {
  TelemetryCollector,
  getTelemetryCollector,
  resetTelemetryCollector,
  type TelemetrySnapshot,
  type TelemetryAlert,
  type TelemetryConfig,
} from './telemetry';

// ─────────────────────────────────────────────────────────────────────────────
// GENETIC PROGRAMMING
// ─────────────────────────────────────────────────────────────────────────────
export {
  GeneticEngine,
  type Gene,
  type Chromosome,
  type Population,
  type EvolutionConfig,
} from './genetic';

// ─────────────────────────────────────────────────────────────────────────────
// POST-MORTEM ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export {
  PostMortemEngine,
  type FailureAnalysis,
  type ConstellationRewrite,
  type LearningInsight,
} from './postmortem';

// ─────────────────────────────────────────────────────────────────────────────
// AGENT PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  CONSTELLATION_SYSTEM_PROMPTS,
  buildAgentPrompt,
  buildIntegrationPrompt,
  buildValidationPrompt,
} from './prompts';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTELLATION FACTORY
// ─────────────────────────────────────────────────────────────────────────────

import { NexusController } from './nexus';
import { TelemetryCollector, getTelemetryCollector } from './telemetry';
import { GeneticEngine } from './genetic';
import { PostMortemEngine } from './postmortem';
import { FailoverCircuitManager } from './failover';
import { ConstellationAgentRole, TelemetryThresholds, createAgentId } from './types';

export interface NexusConfig {
  enableEvolution: boolean;
  enableTelemetry: boolean;
  maxConcurrentTasks: number;
  failoverLatencyThreshold: number;
  thresholds?: TelemetryThresholds;
}

export interface ConstellationInstance {
  nexus: NexusController;
  telemetry: TelemetryCollector;
  genetic: GeneticEngine;
  postMortem: PostMortemEngine;
  failover: FailoverCircuitManager;
  agents: Map<ConstellationAgentRole, string>;
}

/**
 * Create a fully initialized constellation instance
 * All systems are connected and ready for operation
 */
export function createConstellation(
  config?: Partial<NexusConfig>
): ConstellationInstance {
  // Create agent IDs
  const agents = new Map<ConstellationAgentRole, string>();
  const roles: ConstellationAgentRole[] = [
    'NEXUS', 'ARCHITECT', 'RENDERER', 'SHADER_FORGE', 'MOTION_CORE',
    'INTERFACE', 'PERCEPTION', 'SENTINEL', 'SYNTHESIZER', 'VALIDATOR'
  ];
  
  for (const role of roles) {
    agents.set(role, createAgentId(role));
  }
  
  // Initialize systems
  const telemetry = getTelemetryCollector({ interval: 50 });
  const genetic = new GeneticEngine();
  const postMortem = new PostMortemEngine(genetic);
  const failover = new FailoverCircuitManager(agents);
  const nexus = new NexusController(config?.thresholds);
  
  // Initialize genetic populations for all agents
  for (const [role, agentId] of agents) {
    genetic.initializePopulation(role, agentId);
  }
  
  // Start telemetry collection
  telemetry.start();
  
  return {
    nexus,
    telemetry,
    genetic,
    postMortem,
    failover,
    agents,
  };
}

/**
 * Shutdown a constellation instance cleanly
 */
export function shutdownConstellation(instance: ConstellationInstance): void {
  instance.telemetry.stop();
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK START
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a request through the entire constellation
 * This is the main entry point for using the system
 * 
 * @example
 * ```typescript
 * import { processWithConstellation } from '@/lib/agents/constellation';
 * 
 * const result = await processWithConstellation(
 *   'Create a Three.js scene with animated particles and bloom effect'
 * );
 * 
 * if (result.success) {
 *   console.log(result.output);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function processWithConstellation(
  request: string,
  config?: Partial<NexusConfig>
): Promise<{
  success: boolean;
  output?: string;
  error?: string;
  requestId: string;
  overallScore: number;
  executionTimeMs: number;
  constellation: ConstellationInstance;
}> {
  const startTime = Date.now();
  const constellation = createConstellation(config);
  
  try {
    const result = await constellation.nexus.processRequest(request);
    
    return {
      success: result.delivered && !result.isCatastrophicFailure,
      output: result.artifacts.map(a => a.content).join('\n\n'),
      error: result.isCatastrophicFailure ? 'Catastrophic failure detected' : undefined,
      requestId: result.requestId,
      overallScore: result.overallScore,
      executionTimeMs: Date.now() - startTime,
      constellation,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      requestId: `failed-${Date.now()}`,
      overallScore: 0,
      executionTimeMs: Date.now() - startTime,
      constellation,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSION & METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const CONSTELLATION_VERSION = '1.0.0';
export const CONSTELLATION_AGENTS = 10;
export const CONSTELLATION_CAPABILITIES = 43;
