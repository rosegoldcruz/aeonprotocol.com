// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - GENETIC PROGRAMMING ENGINE
// Self-evolving agent optimization through mutation and selection
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ConstellationAgentRole,
  AgentId,
  GeneticMutation,
  MutationType,
  AgentIdeology,
  createMutationId,
} from './types';
import { AGENT_IDEOLOGIES } from './capabilities';

// ─────────────────────────────────────────────────────────────────────────────
// GENETIC TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Gene {
  id: string;
  type: 'prompt' | 'priority' | 'constraint' | 'capability' | 'threshold';
  value: string | number | boolean;
  weight: number; // Importance in fitness calculation
}

export interface Chromosome {
  id: string;
  agentId: AgentId;
  role: ConstellationAgentRole;
  genes: Gene[];
  fitness: number;
  generation: number;
  parentIds: string[];
  createdAt: Date;
}

export interface Population {
  chromosomes: Chromosome[];
  generation: number;
  bestFitness: number;
  avgFitness: number;
  diversity: number;
}

export interface EvolutionConfig {
  populationSize: number;
  eliteCount: number;
  mutationRate: number;
  crossoverRate: number;
  tournamentSize: number;
  maxGenerations: number;
  fitnessThreshold: number;
  diversityWeight: number;
}

const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  populationSize: 20,
  eliteCount: 2,
  mutationRate: 0.15,
  crossoverRate: 0.7,
  tournamentSize: 3,
  maxGenerations: 100,
  fitnessThreshold: 0.95,
  diversityWeight: 0.1,
};

// ─────────────────────────────────────────────────────────────────────────────
// GENETIC ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class GeneticEngine {
  private config: EvolutionConfig;
  private populations: Map<ConstellationAgentRole, Population> = new Map();
  private mutationHistory: GeneticMutation[] = [];
  private fitnessEvaluators: Map<ConstellationAgentRole, (chrome: Chromosome) => number> = new Map();
  
  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = { ...DEFAULT_EVOLUTION_CONFIG, ...config };
    this.initializeDefaultEvaluators();
  }
  
  private initializeDefaultEvaluators(): void {
    const roles: ConstellationAgentRole[] = [
      'NEXUS', 'ARCHITECT', 'RENDERER', 'SHADER_FORGE', 'MOTION_CORE',
      'INTERFACE', 'PERCEPTION', 'SENTINEL', 'SYNTHESIZER', 'VALIDATOR'
    ];
    
    for (const role of roles) {
      this.fitnessEvaluators.set(role, this.createDefaultEvaluator(role));
    }
  }
  
  private createDefaultEvaluator(role: ConstellationAgentRole): (chrome: Chromosome) => number {
    return (chromosome: Chromosome): number => {
      let fitness = 0;
      let totalWeight = 0;
      
      for (const gene of chromosome.genes) {
        const geneScore = this.evaluateGene(gene, role);
        fitness += geneScore * gene.weight;
        totalWeight += gene.weight;
      }
      
      return totalWeight > 0 ? fitness / totalWeight : 0;
    };
  }
  
  private evaluateGene(gene: Gene, role: ConstellationAgentRole): number {
    // Score gene based on type and context
    switch (gene.type) {
      case 'prompt':
        // Longer, more detailed prompts tend to be better (up to a point)
        const promptLength = String(gene.value).length;
        return Math.min(1, promptLength / 1000) * 0.5 + 0.5;
        
      case 'priority':
        // Higher priority genes score higher
        const priority = Number(gene.value);
        return Math.min(1, priority / 10);
        
      case 'constraint':
        // Constraints that are satisfied score 1, else 0
        return gene.value === true ? 1 : 0;
        
      case 'capability':
        // Capabilities that exist score 1
        return gene.value ? 1 : 0;
        
      case 'threshold':
        // Thresholds in valid range score higher
        const threshold = Number(gene.value);
        return threshold >= 0 && threshold <= 1 ? threshold : 0;
        
      default:
        return 0.5;
    }
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ───────────────────────────────────────────────────────────────────────────
  
  initializePopulation(role: ConstellationAgentRole, agentId: AgentId): Population {
    const ideology = AGENT_IDEOLOGIES[role];
    const chromosomes: Chromosome[] = [];
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const chromosome = this.createChromosomeFromIdeology(role, agentId, ideology, i === 0);
      chromosomes.push(chromosome);
    }
    
    // Evaluate fitness
    const evaluator = this.fitnessEvaluators.get(role)!;
    chromosomes.forEach(c => c.fitness = evaluator(c));
    
    // Sort by fitness
    chromosomes.sort((a, b) => b.fitness - a.fitness);
    
    const population: Population = {
      chromosomes,
      generation: 0,
      bestFitness: chromosomes[0].fitness,
      avgFitness: chromosomes.reduce((a, b) => a + b.fitness, 0) / chromosomes.length,
      diversity: this.calculateDiversity(chromosomes),
    };
    
    this.populations.set(role, population);
    return population;
  }
  
  private createChromosomeFromIdeology(
    role: ConstellationAgentRole,
    agentId: AgentId,
    ideology: AgentIdeology,
    isOriginal: boolean
  ): Chromosome {
    const genes: Gene[] = [];
    
    // Core beliefs as genes
    ideology.coreBeliefs.forEach((belief, i) => {
      genes.push({
        id: `belief-${i}`,
        type: 'prompt',
        value: isOriginal ? belief : this.mutateString(belief),
        weight: 1,
      });
    });
    
    // Priorities as genes
    Object.entries(ideology.priorities).forEach(([key, priority], i) => {
      genes.push({
        id: `priority-${key}`,
        type: 'priority',
        value: isOriginal ? priority : Math.random() * 10,
        weight: 0.8,
      });
    });
    
    // Constraints as genes
    ideology.constraints.forEach((constraint, i) => {
      genes.push({
        id: `constraint-${i}`,
        type: 'constraint',
        value: isOriginal ? true : Math.random() > 0.3,
        weight: 0.6,
      });
    });
    
    return {
      id: `${agentId}-gen0-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      role,
      genes,
      fitness: 0,
      generation: 0,
      parentIds: [],
      createdAt: new Date(),
    };
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // EVOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  
  evolve(role: ConstellationAgentRole, userFeedback?: number): Population {
    const population = this.populations.get(role);
    if (!population) {
      throw new Error(`No population found for role: ${role}`);
    }
    
    const evaluator = this.fitnessEvaluators.get(role)!;
    
    // If user feedback provided, adjust fitness
    if (userFeedback !== undefined) {
      const best = population.chromosomes[0];
      best.fitness = best.fitness * 0.7 + userFeedback * 0.3; // Blend model and user evaluation
    }
    
    // Check if we've reached the threshold
    if (population.bestFitness >= this.config.fitnessThreshold) {
      return population;
    }
    
    const newChromosomes: Chromosome[] = [];
    
    // Elitism: keep the best chromosomes
    for (let i = 0; i < this.config.eliteCount; i++) {
      newChromosomes.push({ ...population.chromosomes[i] });
    }
    
    // Generate rest of population through selection, crossover, mutation
    while (newChromosomes.length < this.config.populationSize) {
      // Selection
      const parent1 = this.tournamentSelection(population);
      const parent2 = this.tournamentSelection(population);
      
      let offspring: Chromosome;
      
      // Crossover
      if (Math.random() < this.config.crossoverRate) {
        offspring = this.crossover(parent1, parent2, population.generation + 1);
      } else {
        offspring = { ...parent1, id: this.generateId(parent1.agentId, population.generation + 1) };
      }
      
      // Mutation
      if (Math.random() < this.config.mutationRate) {
        offspring = this.mutate(offspring, role);
      }
      
      offspring.fitness = evaluator(offspring);
      newChromosomes.push(offspring);
    }
    
    // Sort by fitness
    newChromosomes.sort((a, b) => b.fitness - a.fitness);
    
    // Update population
    const newPopulation: Population = {
      chromosomes: newChromosomes,
      generation: population.generation + 1,
      bestFitness: newChromosomes[0].fitness,
      avgFitness: newChromosomes.reduce((a, b) => a + b.fitness, 0) / newChromosomes.length,
      diversity: this.calculateDiversity(newChromosomes),
    };
    
    this.populations.set(role, newPopulation);
    
    return newPopulation;
  }
  
  private tournamentSelection(population: Population): Chromosome {
    const tournament: Chromosome[] = [];
    
    for (let i = 0; i < this.config.tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.chromosomes.length);
      tournament.push(population.chromosomes[idx]);
    }
    
    // Add diversity bonus
    tournament.sort((a, b) => {
      const fitnessA = a.fitness + this.config.diversityWeight * (1 - this.calculateSimilarity(a, population.chromosomes[0]));
      const fitnessB = b.fitness + this.config.diversityWeight * (1 - this.calculateSimilarity(b, population.chromosomes[0]));
      return fitnessB - fitnessA;
    });
    
    return tournament[0];
  }
  
  private crossover(parent1: Chromosome, parent2: Chromosome, generation: number): Chromosome {
    const childGenes: Gene[] = [];
    const maxGenes = Math.max(parent1.genes.length, parent2.genes.length);
    
    // Uniform crossover
    for (let i = 0; i < maxGenes; i++) {
      const gene1 = parent1.genes[i];
      const gene2 = parent2.genes[i];
      
      if (gene1 && gene2) {
        // Both parents have this gene - randomly pick one
        childGenes.push({ ...(Math.random() > 0.5 ? gene1 : gene2) });
      } else if (gene1) {
        childGenes.push({ ...gene1 });
      } else if (gene2) {
        childGenes.push({ ...gene2 });
      }
    }
    
    return {
      id: this.generateId(parent1.agentId, generation),
      agentId: parent1.agentId,
      role: parent1.role,
      genes: childGenes,
      fitness: 0,
      generation,
      parentIds: [parent1.id, parent2.id],
      createdAt: new Date(),
    };
  }
  
  private mutate(chromosome: Chromosome, role: ConstellationAgentRole): Chromosome {
    const mutated = { ...chromosome, genes: [...chromosome.genes] };
    
    // Select random gene to mutate
    const geneIndex = Math.floor(Math.random() * mutated.genes.length);
    const gene = { ...mutated.genes[geneIndex] };
    
    // Apply mutation based on gene type
    let mutationType: MutationType;
    
    switch (gene.type) {
      case 'prompt':
        gene.value = this.mutateString(String(gene.value));
        mutationType = 'PROMPT_MODIFICATION';
        break;
        
      case 'priority':
        gene.value = this.mutateNumber(Number(gene.value), 0, 10);
        mutationType = 'PRIORITY_ADJUSTMENT';
        break;
        
      case 'constraint':
        gene.value = !gene.value;
        mutationType = gene.value ? 'CONSTRAINT_ADDED' : 'CONSTRAINT_REMOVED';
        break;
        
      case 'capability':
        gene.value = !gene.value;
        mutationType = gene.value ? 'CAPABILITY_EXPANSION' : 'CAPABILITY_PRUNING';
        break;
        
      case 'threshold':
        gene.value = this.mutateNumber(Number(gene.value), 0, 1);
        mutationType = 'THRESHOLD_TUNING';
        break;
        
      default:
        mutationType = 'IDEOLOGY_SHIFT';
    }
    
    // Also potentially mutate weight
    if (Math.random() < 0.2) {
      gene.weight = this.mutateNumber(gene.weight, 0.1, 2);
      mutationType = 'THRESHOLD_TUNING';
    }
    
    mutated.genes[geneIndex] = gene;
    
    // Record mutation
    const mutation: GeneticMutation = {
      id: createMutationId(),
      timestamp: Date.now(),
      type: mutationType,
      gene: gene.id,
      oldValue: chromosome.genes[geneIndex].value,
      newValue: gene.value,
      fitnessImpact: 0, // Will be updated after evaluation
      accepted: true,
    };
    
    this.mutationHistory.push(mutation);
    
    return mutated;
  }
  
  private mutateString(value: string): string {
    const operations = ['add', 'remove', 'replace', 'swap'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    const words = value.split(' ');
    
    switch (operation) {
      case 'add':
        // Add emphasis words
        const emphasisWords = ['always', 'must', 'critical', 'essential', 'important'];
        const emphasisWord = emphasisWords[Math.floor(Math.random() * emphasisWords.length)];
        const insertPos = Math.floor(Math.random() * words.length);
        words.splice(insertPos, 0, emphasisWord);
        break;
        
      case 'remove':
        // Remove a word
        if (words.length > 3) {
          const removePos = Math.floor(Math.random() * words.length);
          words.splice(removePos, 1);
        }
        break;
        
      case 'replace':
        // Replace with synonym (simplified)
        const synonyms: Record<string, string[]> = {
          'always': ['consistently', 'perpetually', 'invariably'],
          'must': ['should', 'shall', 'needs to'],
          'important': ['crucial', 'vital', 'essential'],
        };
        for (let i = 0; i < words.length; i++) {
          const lowered = words[i].toLowerCase();
          if (synonyms[lowered]) {
            const syns = synonyms[lowered];
            words[i] = syns[Math.floor(Math.random() * syns.length)];
            break;
          }
        }
        break;
        
      case 'swap':
        // Swap two adjacent words
        if (words.length > 1) {
          const swapPos = Math.floor(Math.random() * (words.length - 1));
          [words[swapPos], words[swapPos + 1]] = [words[swapPos + 1], words[swapPos]];
        }
        break;
    }
    
    return words.join(' ');
  }
  
  private mutateNumber(value: number, min: number, max: number): number {
    // Gaussian mutation
    const sigma = (max - min) * 0.1;
    const mutation = this.gaussianRandom() * sigma;
    const newValue = value + mutation;
    return Math.max(min, Math.min(max, newValue));
  }
  
  private gaussianRandom(): number {
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // DIVERSITY & SIMILARITY
  // ───────────────────────────────────────────────────────────────────────────
  
  private calculateDiversity(chromosomes: Chromosome[]): number {
    if (chromosomes.length < 2) return 1;
    
    let totalDiversity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < chromosomes.length; i++) {
      for (let j = i + 1; j < chromosomes.length; j++) {
        totalDiversity += 1 - this.calculateSimilarity(chromosomes[i], chromosomes[j]);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDiversity / comparisons : 0;
  }
  
  private calculateSimilarity(c1: Chromosome, c2: Chromosome): number {
    let matches = 0;
    let total = 0;
    
    for (let i = 0; i < Math.max(c1.genes.length, c2.genes.length); i++) {
      const g1 = c1.genes[i];
      const g2 = c2.genes[i];
      
      if (g1 && g2 && g1.id === g2.id) {
        if (String(g1.value) === String(g2.value)) {
          matches++;
        }
        total++;
      } else {
        total++;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }
  
  private generateId(agentId: AgentId, generation: number): string {
    return `${agentId}-gen${generation}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // AGENT GENERATION
  // ───────────────────────────────────────────────────────────────────────────
  
  generatePatchedAgent(role: ConstellationAgentRole): {
    ideology: AgentIdeology;
    chromosome: Chromosome;
  } | null {
    const population = this.populations.get(role);
    if (!population || population.chromosomes.length === 0) {
      return null;
    }
    
    // Get the best chromosome
    const best = population.chromosomes[0];
    
    // Extract ideology from chromosome
    const coreBeliefs: string[] = [];
    const priorityEntries: Record<string, number> = {};
    const constraints: string[] = [];
    const emergentBehaviors: string[] = [];
    
    for (const gene of best.genes) {
      if (gene.id.startsWith('belief-') && gene.type === 'prompt') {
        coreBeliefs.push(String(gene.value));
      } else if (gene.id.startsWith('priority-') && gene.type === 'priority') {
        const key = gene.id.replace('priority-', '');
        priorityEntries[key] = Number(gene.value);
      } else if (gene.id.startsWith('constraint-') && gene.type === 'constraint' && gene.value) {
        constraints.push(`Constraint ${gene.id} enforced`);
      }
    }
    
    // Get base ideology and merge
    const baseIdeology = AGENT_IDEOLOGIES[role];
    
    const patchedIdeology: AgentIdeology = {
      coreBeliefs: coreBeliefs.length > 0 ? coreBeliefs : baseIdeology.coreBeliefs,
      priorities: Object.keys(priorityEntries).length > 0 ? priorityEntries : baseIdeology.priorities,
      constraints: constraints.length > 0 ? constraints : baseIdeology.constraints,
      emergentBehaviors: baseIdeology.emergentBehaviors,
    };
    
    return {
      ideology: patchedIdeology,
      chromosome: best,
    };
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ───────────────────────────────────────────────────────────────────────────
  
  getPopulation(role: ConstellationAgentRole): Population | null {
    return this.populations.get(role) || null;
  }
  
  getBestChromosome(role: ConstellationAgentRole): Chromosome | null {
    const population = this.populations.get(role);
    return population?.chromosomes[0] || null;
  }
  
  getMutationHistory(role?: ConstellationAgentRole): GeneticMutation[] {
    if (role) {
      // Filter by mutations whose gene prefixes match this role's chromosomes
      const population = this.populations.get(role);
      if (!population) return [];
      
      const chromosomeGeneIds = new Set(
        population.chromosomes.flatMap(c => c.genes.map(g => g.id))
      );
      
      return this.mutationHistory.filter(m => chromosomeGeneIds.has(m.gene));
    }
    return [...this.mutationHistory];
  }
  
  getEvolutionStats(): {
    totalGenerations: number;
    totalMutations: number;
    avgFitness: Map<ConstellationAgentRole, number>;
    bestFitness: Map<ConstellationAgentRole, number>;
  } {
    const avgFitness = new Map<ConstellationAgentRole, number>();
    const bestFitness = new Map<ConstellationAgentRole, number>();
    let totalGenerations = 0;
    
    for (const [role, population] of this.populations) {
      avgFitness.set(role, population.avgFitness);
      bestFitness.set(role, population.bestFitness);
      totalGenerations += population.generation;
    }
    
    return {
      totalGenerations,
      totalMutations: this.mutationHistory.length,
      avgFitness,
      bestFitness,
    };
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // CUSTOM EVALUATORS
  // ───────────────────────────────────────────────────────────────────────────
  
  setFitnessEvaluator(
    role: ConstellationAgentRole,
    evaluator: (chromosome: Chromosome) => number
  ): void {
    this.fitnessEvaluators.set(role, evaluator);
  }
  
  incorporateUserFeedback(
    role: ConstellationAgentRole,
    chromosomeId: string,
    score: number // 0-1
  ): void {
    const population = this.populations.get(role);
    if (!population) return;
    
    const chromosome = population.chromosomes.find(c => c.id === chromosomeId);
    if (!chromosome) return;
    
    // Blend current fitness with user score
    chromosome.fitness = chromosome.fitness * 0.6 + score * 0.4;
    
    // Re-sort population
    population.chromosomes.sort((a, b) => b.fitness - a.fitness);
    population.bestFitness = population.chromosomes[0].fitness;
    population.avgFitness = population.chromosomes.reduce((a, b) => a + b.fitness, 0) / population.chromosomes.length;
  }
}
