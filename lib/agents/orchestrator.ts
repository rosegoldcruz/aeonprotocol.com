// The Orchestrator - Meta-Controller for the Agent Swarm

import { 
  AgentRole, 
  TaskDecomposition, 
  AgentContext, 
  OrchestratorDecision,
  SwarmConfig 
} from './types';
import { AGENT_CAPABILITIES, TECH_TO_PACKAGES } from './capabilities';
import { randomUUID } from 'crypto';

const DEFAULT_SWARM_CONFIG: SwarmConfig = {
  maxConcurrentAgents: 3,
  globalTimeout: 120000, // 2 minutes
  retryStrategy: 'exponential',
  emergencyFallback: true,
};

export class Orchestrator {
  private config: SwarmConfig;

  constructor(config: Partial<SwarmConfig> = {}) {
    this.config = { ...DEFAULT_SWARM_CONFIG, ...config };
  }

  /**
   * Analyze the prompt and create an execution plan
   */
  analyzeAndPlan(prompt: string): OrchestratorDecision {
    const promptLower = prompt.toLowerCase();
    
    // Detect required technologies
    const detectedTech = this.detectTechnologies(promptLower);
    
    // Determine complexity
    const complexity = this.assessComplexity(prompt, detectedTech);
    
    // Identify required agents
    const requiredAgents = this.identifyRequiredAgents(promptLower, detectedTech);
    
    // Create task plan
    const taskPlan = this.createTaskPlan(prompt, requiredAgents, complexity);
    
    // Identify risks
    const riskFactors = this.identifyRisks(detectedTech, complexity);

    return {
      shouldDecompose: complexity !== 'simple',
      complexity,
      requiredAgents,
      taskPlan,
      estimatedSteps: taskPlan.length,
      riskFactors,
    };
  }

  /**
   * Detect technologies mentioned or implied in the prompt
   */
  private detectTechnologies(prompt: string): Set<string> {
    const detected = new Set<string>();
    
    const techPatterns: Record<string, string[]> = {
      'three.js': ['three', 'threejs', '3d', 'webgl', 'canvas 3d', 'r3f', 'react-three'],
      'shaders': ['shader', 'glsl', 'fragment', 'vertex', 'particle', 'noise', 'sine wave'],
      'gsap': ['gsap', 'greensock', 'timeline', 'tween', 'scrolltrigger', 'morph', 'clip-path'],
      'framer-motion': ['framer', 'motion', 'spring', 'animate', 'variants', 'gesture'],
      'lenis': ['lenis', 'smooth scroll', 'buttery', 'smooth motion'],
      'interactions': ['hover', 'magnetic', 'cursor', 'ripple', 'drag', 'gesture'],
      'postprocessing': ['bloom', 'glow', 'chromatic', 'postprocess', 'effect', 'volumetric'],
    };

    for (const [tech, patterns] of Object.entries(techPatterns)) {
      if (patterns.some(p => prompt.includes(p))) {
        detected.add(tech);
      }
    }

    // Always include base tech
    detected.add('react');
    detected.add('typescript');
    detected.add('tailwindcss');

    return detected;
  }

  /**
   * Assess the complexity of the request
   */
  private assessComplexity(
    prompt: string, 
    detectedTech: Set<string>
  ): 'simple' | 'moderate' | 'complex' | 'extreme' {
    const techCount = detectedTech.size;
    const wordCount = prompt.split(/\s+/).length;
    const hasShaders = detectedTech.has('shaders');
    const has3D = detectedTech.has('three.js');
    const hasAdvancedAnimation = detectedTech.has('gsap') && detectedTech.has('framer-motion');

    // Scoring system
    let score = 0;
    
    score += techCount * 2;
    score += Math.floor(wordCount / 20);
    if (hasShaders) score += 5;
    if (has3D) score += 4;
    if (hasAdvancedAnimation) score += 3;
    if (prompt.includes('fractal')) score += 3;
    if (prompt.includes('volumetric')) score += 3;
    if (prompt.includes('real-time') || prompt.includes('realtime')) score += 2;

    if (score <= 6) return 'simple';
    if (score <= 12) return 'moderate';
    if (score <= 20) return 'complex';
    return 'extreme';
  }

  /**
   * Identify which agents are needed for this task
   */
  private identifyRequiredAgents(prompt: string, detectedTech: Set<string>): AgentRole[] {
    const agents: Set<AgentRole> = new Set(['architect']); // Always need architecture

    // Map tech to agents
    if (detectedTech.has('three.js')) {
      agents.add('three-specialist');
    }
    if (detectedTech.has('shaders') || detectedTech.has('postprocessing')) {
      agents.add('shader-specialist');
    }
    if (detectedTech.has('gsap') || detectedTech.has('framer-motion')) {
      agents.add('animation-specialist');
    }
    if (detectedTech.has('interactions')) {
      agents.add('interaction-specialist');
    }
    if (detectedTech.has('lenis') || prompt.includes('performance') || prompt.includes('smooth')) {
      agents.add('performance-specialist');
    }

    // Always need these for final output
    agents.add('ui-specialist');
    agents.add('integration-specialist');
    agents.add('qa-specialist');

    return Array.from(agents);
  }

  /**
   * Create a detailed task plan with dependencies
   */
  private createTaskPlan(
    prompt: string,
    requiredAgents: AgentRole[],
    complexity: string
  ): TaskDecomposition[] {
    const tasks: TaskDecomposition[] = [];
    const promptLower = prompt.toLowerCase();

    // Phase 1: Architecture (no dependencies)
    tasks.push({
      id: randomUUID(),
      parentId: null,
      description: `Analyze requirements and design component architecture for: ${prompt.slice(0, 100)}...`,
      assignedAgent: 'architect',
      dependencies: [],
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
    });

    const architectTaskId = tasks[0].id;

    // Phase 2: Core implementations (depend on architecture)
    if (requiredAgents.includes('three-specialist')) {
      tasks.push({
        id: randomUUID(),
        parentId: architectTaskId,
        description: this.extractTaskDescription(prompt, 'three-specialist'),
        assignedAgent: 'three-specialist',
        dependencies: [architectTaskId],
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      });
    }

    if (requiredAgents.includes('shader-specialist')) {
      const threeTaskId = tasks.find(t => t.assignedAgent === 'three-specialist')?.id;
      tasks.push({
        id: randomUUID(),
        parentId: architectTaskId,
        description: this.extractTaskDescription(prompt, 'shader-specialist'),
        assignedAgent: 'shader-specialist',
        dependencies: threeTaskId ? [architectTaskId, threeTaskId] : [architectTaskId],
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      });
    }

    if (requiredAgents.includes('animation-specialist')) {
      tasks.push({
        id: randomUUID(),
        parentId: architectTaskId,
        description: this.extractTaskDescription(prompt, 'animation-specialist'),
        assignedAgent: 'animation-specialist',
        dependencies: [architectTaskId],
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 3: UI and Interactions (can run parallel with above)
    tasks.push({
      id: randomUUID(),
      parentId: architectTaskId,
      description: this.extractTaskDescription(prompt, 'ui-specialist'),
      assignedAgent: 'ui-specialist',
      dependencies: [architectTaskId],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
    });

    if (requiredAgents.includes('interaction-specialist')) {
      const uiTaskId = tasks.find(t => t.assignedAgent === 'ui-specialist')?.id!;
      tasks.push({
        id: randomUUID(),
        parentId: uiTaskId,
        description: this.extractTaskDescription(prompt, 'interaction-specialist'),
        assignedAgent: 'interaction-specialist',
        dependencies: [uiTaskId],
        status: 'pending',
        retryCount: 0,
        maxRetries: 2,
      });
    }

    // Phase 4: Performance optimization
    if (requiredAgents.includes('performance-specialist')) {
      const coreTasks = tasks.filter(t => 
        ['three-specialist', 'animation-specialist', 'ui-specialist'].includes(t.assignedAgent)
      ).map(t => t.id);
      
      tasks.push({
        id: randomUUID(),
        parentId: null,
        description: 'Implement smooth scrolling, optimize animations, ensure 60fps performance',
        assignedAgent: 'performance-specialist',
        dependencies: coreTasks,
        status: 'pending',
        retryCount: 0,
        maxRetries: 2,
      });
    }

    // Phase 5: Integration (depends on all core tasks)
    const allCoreTaskIds = tasks.map(t => t.id);
    const integrationTask: TaskDecomposition = {
      id: randomUUID(),
      parentId: null,
      description: 'Integrate all components, resolve dependencies, create final structure',
      assignedAgent: 'integration-specialist',
      dependencies: allCoreTaskIds,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
    };
    tasks.push(integrationTask);

    // Phase 6: QA (depends on integration)
    tasks.push({
      id: randomUUID(),
      parentId: integrationTask.id,
      description: 'Add error boundaries, loading states, validate types, handle edge cases',
      assignedAgent: 'qa-specialist',
      dependencies: [integrationTask.id],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
    });

    return tasks;
  }

  /**
   * Extract a specific task description based on agent role
   */
  private extractTaskDescription(prompt: string, agent: AgentRole): string {
    const descriptions: Record<string, string> = {
      'three-specialist': 'Create 3D scene with Three.js/R3F including camera setup, lighting, and 3D elements',
      'shader-specialist': 'Create custom GLSL shaders for particle systems, visual effects, and post-processing',
      'animation-specialist': 'Implement animations using GSAP and Framer Motion including scroll effects and transitions',
      'ui-specialist': 'Create UI components with Tailwind CSS including layout, styling, and responsive design',
      'interaction-specialist': 'Implement user interactions including hover effects, magnetic buttons, and gestures',
      'performance-specialist': 'Optimize performance with Lenis smooth scrolling and animation optimization',
    };

    return descriptions[agent] || `Execute ${agent} responsibilities for the given requirements`;
  }

  /**
   * Identify potential risks and failure points
   */
  private identifyRisks(detectedTech: Set<string>, complexity: string): string[] {
    const risks: string[] = [];

    if (detectedTech.has('shaders')) {
      risks.push('Custom shaders may have compatibility issues across browsers/devices');
    }
    if (detectedTech.has('three.js') && detectedTech.has('framer-motion')) {
      risks.push('Three.js and Framer Motion integration may need careful coordination');
    }
    if (complexity === 'extreme') {
      risks.push('High complexity may require multiple iterations');
    }
    if (detectedTech.size > 5) {
      risks.push('Many dependencies may cause bundle size concerns');
    }

    return risks;
  }

  /**
   * Get all required npm packages for detected technologies
   */
  getRequiredPackages(decision: OrchestratorDecision): string[] {
    const packages = new Set<string>();
    
    // Base packages
    packages.add('react');
    packages.add('react-dom');
    
    // Map agents to their typical packages
    for (const agent of decision.requiredAgents) {
      const caps = AGENT_CAPABILITIES[agent];
      for (const tech of caps.technologies) {
        const pkgs = TECH_TO_PACKAGES[tech];
        if (pkgs) {
          pkgs.forEach(p => packages.add(p));
        }
      }
    }

    return Array.from(packages);
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();
