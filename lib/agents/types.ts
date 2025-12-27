// Agent Swarm Type Definitions - AEON UNIFIED SYSTEM

export type AgentRole = 
  // Core Controllers
  | 'orchestrator'      // Meta-controller - decomposes and routes
  | 'architect'         // System design and structure planning
  
  // Visual & 3D Specialists
  | 'ui-specialist'     // UI/UX, layouts, responsive design
  | 'three-specialist'  // Three.js, R3F, 3D graphics
  | 'shader-specialist' // WebGL, GLSL shaders, visual effects
  | 'camera-specialist' // Camera psychology, dolly, FOV, scroll-synced camera
  
  // Motion & Animation Specialists
  | 'animation-specialist' // GSAP, Framer Motion, transitions
  | 'scroll-specialist' // Scroll-driven experiences, Lenis, ScrollTrigger
  | 'interaction-specialist' // User interactions, events, gestures
  
  // Experience Specialists
  | 'narrative-specialist' // Cinematic storytelling, pacing, tension
  | 'fox-specialist'    // Fox character behavior, moods, idle states
  | 'ar-specialist'     // AR handoff, WebXR, spatial computing
  | 'audio-specialist'  // Audio reactive, haptics, sensory feedback
  
  // Optimization & Quality
  | 'performance-specialist' // Optimization, lazy loading, caching
  | 'accessibility-specialist' // A11y, reduced motion, screen readers
  | 'conversion-specialist' // CTA timing, attention guidance, psychology
  
  // Integration & Finalization
  | 'integration-specialist' // Combining all pieces, dependency resolution
  | 'qa-specialist'     // Validation, error checking, edge cases
  | 'fallback';         // Last resort problem solver

export interface AgentCapability {
  keywords: string[];
  technologies: string[];
  description: string;
  priority: number;
}

export interface TaskDecomposition {
  id: string;
  parentId: string | null;
  description: string;
  assignedAgent: AgentRole;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  retryCount: number;
  maxRetries: number;
}

export interface AgentContext {
  originalPrompt: string;
  decomposedTasks: TaskDecomposition[];
  completedOutputs: Map<string, string>;
  globalDependencies: string[];
  techStack: Set<string>;
  errorLog: string[];
}

export interface AgentResponse {
  success: boolean;
  output: string;
  dependencies?: string[];
  nextSteps?: string[];
  error?: string;
}

export interface SwarmConfig {
  maxConcurrentAgents: number;
  globalTimeout: number;
  retryStrategy: 'exponential' | 'linear' | 'immediate';
  emergencyFallback: boolean;
}

export interface OrchestratorDecision {
  shouldDecompose: boolean;
  complexity: 'simple' | 'moderate' | 'complex' | 'extreme';
  requiredAgents: AgentRole[];
  taskPlan: TaskDecomposition[];
  estimatedSteps: number;
  riskFactors: string[];
}
