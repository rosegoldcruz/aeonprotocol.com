// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - SELF-EVOLVING AGENT TYPE SYSTEM
// 10 Sovereign Micro-Agents with Hot-Standby and Zero Single Point of Failure
// ═══════════════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// AGENT IDENTITY & SOVEREIGNTY
// ─────────────────────────────────────────────────────────────────────────────

export type ConstellationAgentRole =
  | 'NEXUS'           // Meta-controller with reinforcement learning
  | 'ARCHITECT'       // System design, component hierarchy, state patterns
  | 'RENDERER'        // Three.js, R3F, WebGL, 3D scenes, portals, fractals
  | 'SHADER_FORGE'    // GLSL, particle systems, post-processing, volumetrics
  | 'MOTION_CORE'     // GSAP, Framer Motion, scroll-driven, Lenis
  | 'INTERFACE'       // UI/UX, Tailwind, responsive, glassmorphism
  | 'PERCEPTION'      // Interactions, gestures, magnetic effects, haptics
  | 'SENTINEL'        // Performance, optimization, GPU budgeting, fallbacks
  | 'SYNTHESIZER'     // Integration, dependency resolution, routing
  | 'VALIDATOR'       // QA, error boundaries, edge cases, accessibility

export type AgentState = 
  | 'IDLE'            // Ready for work
  | 'ACTIVE'          // Processing task
  | 'DEGRADED'        // Operating with reduced capability
  | 'FAILOVER'        // Primary failed, standby promoted
  | 'RECOVERING'      // Rehydrating from ledger
  | 'EVOLVING'        // Genetic programming generating new version
  | 'TERMINATED'      // Permanently failed, replaced

export type FallbackTier = 'PRIMARY' | 'STANDBY' | 'FALLBACK_A' | 'FALLBACK_B' | 'FALLBACK_C';

// Agent ID is a string identifier
export type AgentId = string;

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY & HEALTH MONITORING (50ms intervals)
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentTelemetry {
  agentId: string;
  role: ConstellationAgentRole;
  timestamp: number;
  metrics: {
    latencyMs: number;
    errorRate: number;           // 0-1 sliding window
    entropy: number;             // Output predictability score
    memoryUsageMb: number;
    cpuUsagePercent: number;
    taskQueueDepth: number;
    successRate: number;         // Historical success
    avgResponseQuality: number;  // 0-100 user outcome score
  };
  state: AgentState;
  healthScore: number;           // 0-100 composite
  tier: FallbackTier;
}

export interface TelemetryThresholds {
  maxLatencyMs: number;
  maxErrorRate: number;
  maxEntropy: number;
  sigmaMultiplier: number;       // Dynamic sigma threshold
  healthFloor: number;           // Below this = immediate failover
}

// ─────────────────────────────────────────────────────────────────────────────
// SOVEREIGN AGENT DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export interface FallbackAlgorithm {
  tier: FallbackTier;
  name: string;
  complexity: 'FULL' | 'REDUCED' | 'MINIMAL' | 'EMERGENCY';
  capabilities: string[];
  promptTemplate: string;
  estimatedLatencyMs: number;
  successProbability: number;
}

export interface SovereignAgent {
  id: string;
  role: ConstellationAgentRole;
  version: string;
  createdAt: number;
  
  // Sovereignty
  state: AgentState;
  tier: FallbackTier;
  ideology: AgentIdeology;
  
  // Capabilities
  primaryAlgorithm: FallbackAlgorithm;
  standbyClone: FallbackAlgorithm;
  fallbackAlgorithms: [FallbackAlgorithm, FallbackAlgorithm, FallbackAlgorithm];
  
  // Runtime
  currentTask: TaskAssignment | null;
  telemetryHistory: AgentTelemetry[];
  checkpointId: string | null;
  
  // Evolution
  parentId: string | null;
  generation: number;
  mutationLog: GeneticMutation[];
  fitnessScore: number;
}

export interface AgentIdeology {
  coreBeliefs: string[];
  priorities: Record<string, number>;
  constraints: string[];
  emergentBehaviors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// IMMUTABLE LEDGER & CHECKPOINTING
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  timestamp: number;
  type: LedgerEntryType;
  agentId: string;
  payload: unknown;
  hash: string;
  previousHash: string;
  signature: string;
}

export type LedgerEntryType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'STATE_CHECKPOINT'
  | 'FAILOVER_TRIGGERED'
  | 'AGENT_EVOLVED'
  | 'AGENT_TERMINATED'
  | 'CONSTELLATION_REWRITE'
  | 'POST_MORTEM_RECORDED'
  | 'TELEMETRY_SNAPSHOT'

export interface StateCheckpoint {
  id: string;
  agentId: string;
  timestamp: number;
  state: Record<string, unknown>;
  taskContext: TaskContext;
  outputBuffer: string[];
  dependencyGraph: DependencyNode[];
  compressed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface TaskAssignment {
  id: string;
  parentRequestId: string;
  agentRole: ConstellationAgentRole;
  description: string;
  prompt: string;
  dependencies: string[];
  deadline: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  attempts: number;
  maxAttempts: number;
  status: TaskStatus;
  result?: TaskResult;
}

export type TaskStatus = 
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'

export interface TaskResult {
  success: boolean;
  output: string;
  artifacts: Artifact[];
  metrics: TaskMetrics;
  error?: FailureRecord;
}

export interface Artifact {
  type: 'CODE' | 'COMPONENT' | 'SHADER' | 'STYLE' | 'CONFIG' | 'ASSET';
  path: string;
  content: string;
  language: string;
  dependencies: string[];
}

export interface TaskMetrics {
  startTime: number;
  endTime: number;
  latencyMs: number;
  tokensUsed: number;
  llmCalls: number;
  retries: number;
  qualityScore: number;
}

export interface TaskContext {
  userRequest: string;
  decomposition: TaskDecomposition[];
  completedTasks: Map<string, TaskResult>;
  globalState: Record<string, unknown>;
  techStack: Set<string>;
  constraints: string[];
}

export interface TaskDecomposition {
  id: string;
  parentId: string | null;
  description: string;
  assignedAgent: ConstellationAgentRole;
  dependencies: string[];
  status: TaskStatus;
  checkpointId: string | null;
}

export interface DependencyNode {
  taskId: string;
  agentRole: ConstellationAgentRole;
  dependsOn: string[];
  dependents: string[];
  resolved: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILURE & RECOVERY
// ─────────────────────────────────────────────────────────────────────────────

export interface FailureRecord {
  id: string;
  timestamp: number;
  agentId: string;
  taskId: string;
  type: FailureType;
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL' | 'CATASTROPHIC';
  recoveryAction: RecoveryAction;
  resolved: boolean;
}

export type FailureType =
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'INVALID_OUTPUT'
  | 'DEPENDENCY_MISSING'
  | 'INFINITE_LOOP'
  | 'MEMORY_EXCEEDED'
  | 'LLM_ERROR'
  | 'INTEGRATION_FAILURE'
  | 'QUALITY_THRESHOLD'
  | 'USER_OUTCOME_NEGATIVE'

export type RecoveryAction =
  | 'RETRY_SAME_TIER'
  | 'FAILOVER_STANDBY'
  | 'FAILOVER_REDUCED'
  | 'FAILOVER_MINIMAL'
  | 'FAILOVER_EMERGENCY'
  | 'REHYDRATE_CHECKPOINT'
  | 'EVOLVE_NEW_AGENT'
  | 'REWRITE_CONSTELLATION'
  | 'MANUAL_INTERVENTION'

export interface FailoverCircuit {
  agentId: string;
  fromTier: FallbackTier;
  toTier: FallbackTier;
  triggeredAt: number;
  reason: FailureType;
  stateRehydrated: boolean;
  latencyMicroseconds: number;
  success: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENETIC PROGRAMMING & EVOLUTION
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneticMutation {
  id: string;
  timestamp: number;
  type: MutationType;
  gene: string;
  oldValue: unknown;
  newValue: unknown;
  fitnessImpact: number;
  accepted: boolean;
}

export type MutationType =
  | 'PROMPT_MODIFICATION'
  | 'PRIORITY_ADJUSTMENT'
  | 'CONSTRAINT_ADDED'
  | 'CONSTRAINT_REMOVED'
  | 'CAPABILITY_EXPANSION'
  | 'CAPABILITY_PRUNING'
  | 'THRESHOLD_TUNING'
  | 'IDEOLOGY_SHIFT'

export interface EvolutionConfig {
  mutationRate: number;
  crossoverRate: number;
  selectionPressure: number;
  elitismCount: number;
  populationSize: number;
  maxGenerations: number;
  fitnessFunction: FitnessCriteria;
}

export interface FitnessCriteria {
  weights: {
    successRate: number;
    latency: number;
    qualityScore: number;
    userSatisfaction: number;
    resourceEfficiency: number;
  };
  penalties: {
    failure: number;
    timeout: number;
    retry: number;
    userComplaint: number;
  };
}

export interface EvolutionResult {
  parentId: string;
  childId: string;
  mutations: GeneticMutation[];
  fitnessImprovement: number;
  generationNumber: number;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-MORTEM ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface PostMortem {
  id: string;
  requestId: string;
  timestamp: number;
  
  // What happened
  userRequest: string;
  expectedOutcome: string;
  actualOutcome: string;
  satisfactionScore: number; // 0-100
  
  // Analysis
  failureChain: FailureRecord[];
  rootCause: RootCauseAnalysis;
  impactAssessment: ImpactAssessment;
  
  // Actions taken
  immediateActions: ConstellationAction[];
  preventiveActions: ConstellationAction[];
  
  // Result
  constellationRewritten: boolean;
  agentsEvolved: string[];
  lessonsLearned: string[];
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  agentsInvolved: string[];
  systemicIssues: string[];
  externalFactors: string[];
}

export interface ImpactAssessment {
  userExperienceImpact: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC';
  dataLoss: boolean;
  recoveryTime: number;
  cascadeRisk: number;
}

export interface ConstellationAction {
  type: 'EVOLVE' | 'REWRITE' | 'TUNE' | 'DISABLE' | 'REPLACE';
  targetAgentId: string;
  description: string;
  executedAt: number;
  success: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// REINFORCEMENT LEARNING
// ─────────────────────────────────────────────────────────────────────────────

export interface RewardSignal {
  id: string;
  timestamp: number;
  requestId: string;
  agentId: string;
  action: string;
  reward: number;
  state: Record<string, number>;
  nextState: Record<string, number>;
}

export interface PolicyUpdate {
  agentId: string;
  timestamp: number;
  parameter: string;
  oldValue: number;
  newValue: number;
  rewardDelta: number;
}

export interface RLConfig {
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  explorationDecay: number;
  minExploration: number;
  replayBufferSize: number;
  batchSize: number;
  updateFrequency: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTELLATION CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export interface ConstellationConfig {
  // Agents
  agents: Map<ConstellationAgentRole, SovereignAgent>;
  
  // Thresholds
  telemetryInterval: number;     // 50ms
  healthCheckInterval: number;
  failoverLatencyTarget: number; // microseconds
  
  // Scoring
  thresholds: TelemetryThresholds;
  evolutionConfig: EvolutionConfig;
  rlConfig: RLConfig;
  
  // Ledger
  ledgerEnabled: boolean;
  checkpointFrequency: number;
  maxCheckpointAge: number;
  
  // Post-mortem
  catastrophicThreshold: number; // User satisfaction below this = catastrophic
  autoRewriteEnabled: boolean;
  
  // Global
  emergencyMode: boolean;
  debugMode: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER OUTCOME (THE ULTIMATE METRIC)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserOutcome {
  requestId: string;
  timestamp: number;
  
  // Request
  verbatimRequest: string;
  interpretedIntent: string;
  
  // Delivery
  delivered: boolean;
  deliveryTime: number;
  artifacts: Artifact[];
  
  // Quality
  functionalCorrectness: number;  // 0-100: Does it work?
  aestheticQuality: number;       // 0-100: Does it look good?
  performanceScore: number;       // 0-100: Is it fast?
  accessibilityScore: number;     // 0-100: Is it accessible?
  codeQuality: number;            // 0-100: Is code clean?
  
  // Experience
  stallsDetected: number;
  warningsShown: number;
  errorsExposed: number;
  
  // Verdict
  overallScore: number;           // 0-100 composite
  isCatastrophicFailure: boolean; // < 100% = technically yes per spec
  userFeedback?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function createAgentId(role: ConstellationAgentRole): string {
  return `${role}-${randomUUID().slice(0, 8)}`;
}

export function createTaskId(): string {
  return `TASK-${randomUUID().slice(0, 12)}`;
}

export function createCheckpointId(): string {
  return `CHKPT-${Date.now()}-${randomUUID().slice(0, 6)}`;
}

export function createLedgerEntryId(): string {
  return `LEDGER-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function createPostMortemId(): string {
  return `PM-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function createMutationId(): string {
  return `MUT-${Date.now()}-${randomUUID().slice(0, 6)}`;
}

export function calculateHealthScore(telemetry: AgentTelemetry['metrics']): number {
  const weights = {
    latency: 0.2,
    errorRate: 0.3,
    entropy: 0.1,
    successRate: 0.25,
    responseQuality: 0.15,
  };
  
  const latencyScore = Math.max(0, 100 - (telemetry.latencyMs / 10));
  const errorScore = (1 - telemetry.errorRate) * 100;
  const entropyScore = (1 - telemetry.entropy) * 100;
  const successScore = telemetry.successRate * 100;
  const qualityScore = telemetry.avgResponseQuality;
  
  return Math.round(
    latencyScore * weights.latency +
    errorScore * weights.errorRate +
    entropyScore * weights.entropy +
    successScore * weights.successRate +
    qualityScore * weights.responseQuality
  );
}

export function shouldTriggerFailover(
  telemetry: AgentTelemetry,
  thresholds: TelemetryThresholds,
  history: AgentTelemetry[]
): { trigger: boolean; reason: FailureType | null } {
  // Immediate triggers
  if (telemetry.healthScore < thresholds.healthFloor) {
    return { trigger: true, reason: 'QUALITY_THRESHOLD' };
  }
  
  if (telemetry.metrics.latencyMs > thresholds.maxLatencyMs) {
    return { trigger: true, reason: 'TIMEOUT' };
  }
  
  if (telemetry.metrics.errorRate > thresholds.maxErrorRate) {
    return { trigger: true, reason: 'INVALID_OUTPUT' };
  }
  
  // Dynamic sigma threshold
  if (history.length >= 10) {
    const recentScores = history.slice(-10).map(t => t.healthScore);
    const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const variance = recentScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentScores.length;
    const sigma = Math.sqrt(variance);
    
    if (telemetry.healthScore < mean - (sigma * thresholds.sigmaMultiplier)) {
      return { trigger: true, reason: 'QUALITY_THRESHOLD' };
    }
  }
  
  return { trigger: false, reason: null };
}
