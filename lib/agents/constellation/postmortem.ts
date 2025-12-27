// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - POST-MORTEM ENGINE
// Immediate failure analysis and constellation rewriting
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ConstellationAgentRole,
  AgentId,
  PostMortem,
  TaskResult,
  UserOutcome,
  LedgerEntry,
  LedgerEntryType,
  RootCauseAnalysis,
  ImpactAssessment,
  ConstellationAction,
  FailureRecord,
  createPostMortemId,
  createLedgerEntryId,
} from './types';
import { GeneticEngine } from './genetic';

// ─────────────────────────────────────────────────────────────────────────────
// POST-MORTEM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FailureAnalysis {
  rootCause: RootCauseAnalysis;
  contributingFactors: string[];
  affectedAgents: ConstellationAgentRole[];
  severity: ImpactAssessment['userExperienceImpact'];
  recoverable: boolean;
  estimatedImpact: number; // 0-1
}

export interface ConstellationRewrite {
  id: string;
  postMortemId: string;
  changes: Array<{
    agent: ConstellationAgentRole;
    changeType: 'ideology' | 'priority' | 'constraint' | 'capability' | 'replacement';
    before: string;
    after: string;
    rationale: string;
  }>;
  expectedImprovement: number; // 0-1
  appliedAt: number;
  verified: boolean;
}

export interface LearningInsight {
  pattern: string;
  frequency: number;
  affectedAgents: ConstellationAgentRole[];
  suggestedFix: string;
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-MORTEM ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class PostMortemEngine {
  private postMortems: PostMortem[] = [];
  private rewrites: ConstellationRewrite[] = [];
  private ledger: LedgerEntry[] = [];
  private insights: LearningInsight[] = [];
  private geneticEngine: GeneticEngine;
  
  constructor(geneticEngine: GeneticEngine) {
    this.geneticEngine = geneticEngine;
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // FAILURE DETECTION
  // ───────────────────────────────────────────────────────────────────────────
  
  analyzeFailure(
    taskResult: TaskResult,
    userOutcome?: UserOutcome
  ): FailureAnalysis {
    const rootCause = this.determineRootCause(taskResult);
    const analysis: FailureAnalysis = {
      rootCause,
      contributingFactors: this.identifyContributingFactors(taskResult),
      affectedAgents: this.identifyAffectedAgents(taskResult),
      severity: this.calculateSeverity(taskResult, userOutcome),
      recoverable: this.isRecoverable(taskResult),
      estimatedImpact: this.estimateImpact(taskResult, userOutcome),
    };
    
    return analysis;
  }
  
  private determineRootCause(taskResult: TaskResult): RootCauseAnalysis {
    const primaryCause = this.extractPrimaryCause(taskResult);
    
    return {
      primaryCause,
      contributingFactors: this.extractContributingFactors(taskResult),
      agentsInvolved: [],
      systemicIssues: this.identifySystemicIssues(taskResult),
      externalFactors: this.identifyExternalFactors(taskResult),
    };
  }
  
  private extractPrimaryCause(taskResult: TaskResult): string {
    if (taskResult.error) {
      const errorMsg = taskResult.error.message;
      
      if (errorMsg.includes('timeout')) {
        return 'Operation exceeded time limit - agent may need optimization or task decomposition';
      }
      if (errorMsg.includes('memory')) {
        return 'Memory limit exceeded - reduce complexity or implement streaming';
      }
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        return 'Rate limiting triggered - implement backoff or request batching';
      }
      if (errorMsg.includes('type') || errorMsg.includes('undefined')) {
        return 'Type error or undefined access - improve type safety and null checks';
      }
      if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        return 'Network failure - implement retry logic and offline fallbacks';
      }
      
      return `Unhandled error: ${errorMsg.slice(0, 200)}`;
    }
    
    if (!taskResult.success) {
      return 'Task completed but did not meet success criteria';
    }
    
    return 'No failure detected';
  }
  
  private extractContributingFactors(taskResult: TaskResult): string[] {
    const factors: string[] = [];
    
    if (taskResult.metrics.latencyMs > 5000) {
      factors.push('Extended execution time may indicate inefficient processing');
    }
    
    if (taskResult.metrics.retries > 0) {
      factors.push(`${taskResult.metrics.retries} retry attempts were made`);
    }
    
    if (taskResult.metrics.llmCalls > 10) {
      factors.push('High number of LLM calls may indicate inefficient prompting');
    }
    
    return factors;
  }
  
  private identifySystemicIssues(taskResult: TaskResult): string[] {
    const issues: string[] = [];
    
    if (taskResult.metrics.qualityScore < 50) {
      issues.push('Systemic quality issues detected');
    }
    
    return issues;
  }
  
  private identifyExternalFactors(taskResult: TaskResult): string[] {
    const factors: string[] = [];
    
    if (taskResult.error?.type === 'RATE_LIMIT') {
      factors.push('External API rate limiting');
    }
    
    if (taskResult.error?.type === 'LLM_ERROR') {
      factors.push('LLM provider issues');
    }
    
    return factors;
  }
  
  private identifyContributingFactors(taskResult: TaskResult): string[] {
    const factors: string[] = [];
    
    if (taskResult.metrics.latencyMs > 5000) {
      factors.push('Extended execution time may indicate inefficient processing');
    }
    
    if (taskResult.metrics.retries > 0) {
      factors.push(`${taskResult.metrics.retries} retry attempts were made`);
    }
    
    return factors;
  }
  
  private identifyAffectedAgents(taskResult: TaskResult): ConstellationAgentRole[] {
    return [];
  }
  
  private calculateSeverity(
    taskResult: TaskResult,
    userOutcome?: UserOutcome
  ): ImpactAssessment['userExperienceImpact'] {
    if (userOutcome) {
      if (userOutcome.overallScore < 25) return 'CATASTROPHIC';
      if (userOutcome.overallScore < 50) return 'SEVERE';
      if (userOutcome.overallScore < 75) return 'MODERATE';
      if (userOutcome.overallScore < 90) return 'MINOR';
      return 'NONE';
    }
    
    if (!taskResult.success && taskResult.error) {
      if (taskResult.error.severity === 'CATASTROPHIC') return 'CATASTROPHIC';
      if (taskResult.error.severity === 'CRITICAL') return 'SEVERE';
      return 'MODERATE';
    }
    
    if (!taskResult.success) return 'MODERATE';
    if (taskResult.metrics.qualityScore < 50) return 'MODERATE';
    if (taskResult.metrics.qualityScore < 75) return 'MINOR';
    
    return 'NONE';
  }
  
  private isRecoverable(taskResult: TaskResult): boolean {
    if (taskResult.error?.severity === 'CATASTROPHIC') return false;
    if (taskResult.metrics.retries >= 5) return false;
    return true;
  }
  
  private estimateImpact(
    taskResult: TaskResult,
    userOutcome?: UserOutcome
  ): number {
    let impact = 0;
    
    if (!taskResult.success) impact += 0.4;
    if (taskResult.error) impact += 0.2;
    
    if (userOutcome) {
      impact = impact * 0.5 + (1 - userOutcome.overallScore / 100) * 0.5;
    }
    
    return Math.min(1, impact);
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // POST-MORTEM CREATION
  // ───────────────────────────────────────────────────────────────────────────
  
  createPostMortem(
    requestId: string,
    originalRequest: string,
    taskResult: TaskResult,
    userOutcome?: UserOutcome
  ): PostMortem {
    const analysis = this.analyzeFailure(taskResult, userOutcome);
    
    const impactAssessment: ImpactAssessment = {
      userExperienceImpact: analysis.severity,
      dataLoss: false,
      recoveryTime: taskResult.metrics.latencyMs,
      cascadeRisk: analysis.estimatedImpact,
    };
    
    const immediateActions: ConstellationAction[] = this.generateImmediateActions(analysis);
    const preventiveActions: ConstellationAction[] = this.generatePreventiveActions(analysis);
    
    const postMortem: PostMortem = {
      id: createPostMortemId(),
      requestId,
      timestamp: Date.now(),
      userRequest: originalRequest,
      expectedOutcome: 'Successful task completion with high quality output',
      actualOutcome: taskResult.output || 'No output produced',
      satisfactionScore: userOutcome?.overallScore ?? (taskResult.success ? 70 : 30),
      failureChain: taskResult.error ? [taskResult.error] : [],
      rootCause: analysis.rootCause,
      impactAssessment,
      immediateActions,
      preventiveActions,
      constellationRewritten: false,
      agentsEvolved: [],
      lessonsLearned: this.generateLessonsLearned(analysis),
    };
    
    this.postMortems.push(postMortem);
    
    this.recordToLedger(
      'POST_MORTEM_RECORDED',
      'NEXUS',
      postMortem
    );
    
    this.updateInsights(postMortem);
    
    return postMortem;
  }
  
  private generateImmediateActions(analysis: FailureAnalysis): ConstellationAction[] {
    const actions: ConstellationAction[] = [];
    
    if (analysis.severity === 'CATASTROPHIC' || analysis.severity === 'SEVERE') {
      actions.push({
        type: 'TUNE',
        targetAgentId: 'NEXUS',
        description: 'Adjust task decomposition thresholds',
        executedAt: Date.now(),
        success: true,
      });
    }
    
    return actions;
  }
  
  private generatePreventiveActions(analysis: FailureAnalysis): ConstellationAction[] {
    const actions: ConstellationAction[] = [];
    
    actions.push({
      type: 'TUNE',
      targetAgentId: 'SENTINEL',
      description: 'Increase monitoring sensitivity',
      executedAt: Date.now(),
      success: true,
    });
    
    return actions;
  }
  
  private generateLessonsLearned(analysis: FailureAnalysis): string[] {
    const lessons: string[] = [];
    
    if (analysis.rootCause.primaryCause.includes('timeout')) {
      lessons.push('Consider implementing progressive loading for long-running tasks');
    }
    
    if (analysis.rootCause.primaryCause.includes('memory')) {
      lessons.push('Implement streaming for large data processing');
    }
    
    if (analysis.severity === 'CATASTROPHIC') {
      lessons.push('Add additional fallback tiers for critical operations');
    }
    
    return lessons;
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // CONSTELLATION REWRITING
  // ───────────────────────────────────────────────────────────────────────────
  
  async rewriteConstellation(postMortem: PostMortem): Promise<ConstellationRewrite> {
    const changes: ConstellationRewrite['changes'] = [];
    
    const affectedAgents = postMortem.rootCause.agentsInvolved as ConstellationAgentRole[];
    for (const agent of affectedAgents) {
      this.geneticEngine.evolve(agent);
      
      const patched = this.geneticEngine.generatePatchedAgent(agent);
      if (patched) {
        changes.push({
          agent,
          changeType: 'ideology',
          before: 'Previous ideology configuration',
          after: JSON.stringify(patched.ideology.coreBeliefs),
          rationale: `Genetic evolution based on failure: ${postMortem.rootCause.primaryCause}`,
        });
      }
    }
    
    for (const lesson of postMortem.lessonsLearned) {
      const relevantAgent = this.identifyAgentForFix(lesson);
      if (relevantAgent) {
        changes.push({
          agent: relevantAgent,
          changeType: 'constraint',
          before: 'No constraint',
          after: lesson,
          rationale: `Lesson learned from post-mortem ${postMortem.id}`,
        });
      }
    }
    
    const rewrite: ConstellationRewrite = {
      id: `rewrite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postMortemId: postMortem.id,
      changes,
      expectedImprovement: this.calculateExpectedImprovement(postMortem, changes),
      appliedAt: Date.now(),
      verified: false,
    };
    
    this.rewrites.push(rewrite);
    
    this.recordToLedger(
      'CONSTELLATION_REWRITE',
      'NEXUS',
      rewrite
    );
    
    return rewrite;
  }
  
  private identifyAgentForFix(fix: string): ConstellationAgentRole | null {
    const fixLower = fix.toLowerCase();
    
    if (fixLower.includes('type') || fixLower.includes('typescript')) return 'ARCHITECT';
    if (fixLower.includes('performance') || fixLower.includes('memory') || fixLower.includes('cpu')) return 'SENTINEL';
    if (fixLower.includes('shader') || fixLower.includes('webgl')) return 'SHADER_FORGE';
    if (fixLower.includes('animation') || fixLower.includes('motion')) return 'MOTION_CORE';
    if (fixLower.includes('3d') || fixLower.includes('three') || fixLower.includes('render')) return 'RENDERER';
    if (fixLower.includes('ui') || fixLower.includes('interface') || fixLower.includes('style')) return 'INTERFACE';
    if (fixLower.includes('integration') || fixLower.includes('dependency')) return 'SYNTHESIZER';
    if (fixLower.includes('validation') || fixLower.includes('error')) return 'VALIDATOR';
    
    return null;
  }
  
  private calculateExpectedImprovement(
    postMortem: PostMortem,
    changes: ConstellationRewrite['changes']
  ): number {
    let improvement = 0.1 * changes.length;
    
    if (changes.some(c => c.rationale.includes(postMortem.rootCause.primaryCause))) {
      improvement += 0.2;
    }
    
    if (changes.some(c => c.rationale.includes('Genetic evolution'))) {
      improvement += 0.15;
    }
    
    return Math.min(0.9, improvement);
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // IMMUTABLE LEDGER
  // ───────────────────────────────────────────────────────────────────────────
  
  private recordToLedger(
    type: LedgerEntryType,
    agentId: string,
    payload: unknown
  ): void {
    const previousHash = this.ledger.length > 0 
      ? this.ledger[this.ledger.length - 1].hash 
      : '0'.repeat(64);
    
    const entryData = JSON.stringify({
      type,
      agentId,
      payload,
      previousHash,
    });
    
    const hash = this.computeHash(entryData);
    
    const ledgerEntry: LedgerEntry = {
      id: createLedgerEntryId(),
      timestamp: Date.now(),
      type,
      agentId,
      payload,
      hash,
      previousHash,
      signature: this.computeHash(`${hash}-${agentId}`),
    };
    
    this.ledger.push(ledgerEntry);
  }
  
  private computeHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
  
  verifyLedgerIntegrity(): boolean {
    for (let i = 1; i < this.ledger.length; i++) {
      if (this.ledger[i].previousHash !== this.ledger[i - 1].hash) {
        console.error(`Ledger integrity violation at entry ${i}`);
        return false;
      }
    }
    return true;
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // LEARNING & INSIGHTS
  // ───────────────────────────────────────────────────────────────────────────
  
  private updateInsights(postMortem: PostMortem): void {
    const pattern = this.extractPattern(postMortem.rootCause.primaryCause);
    
    const existingInsight = this.insights.find(i => i.pattern === pattern);
    
    if (existingInsight) {
      existingInsight.frequency++;
      existingInsight.confidence = Math.min(0.95, existingInsight.confidence + 0.05);
      
      for (const agentId of postMortem.rootCause.agentsInvolved) {
        const agent = agentId as ConstellationAgentRole;
        if (!existingInsight.affectedAgents.includes(agent)) {
          existingInsight.affectedAgents.push(agent);
        }
      }
    } else {
      this.insights.push({
        pattern,
        frequency: 1,
        affectedAgents: postMortem.rootCause.agentsInvolved as ConstellationAgentRole[],
        suggestedFix: postMortem.lessonsLearned[0] || 'Review and optimize agent configuration',
        confidence: 0.3,
      });
    }
  }
  
  private extractPattern(rootCause: string): string {
    const patterns = [
      { regex: /timeout/i, pattern: 'TIMEOUT_EXCEEDED' },
      { regex: /memory/i, pattern: 'MEMORY_EXHAUSTION' },
      { regex: /rate.?limit/i, pattern: 'RATE_LIMITING' },
      { regex: /type.?error/i, pattern: 'TYPE_MISMATCH' },
      { regex: /undefined/i, pattern: 'NULL_REFERENCE' },
      { regex: /network|fetch/i, pattern: 'NETWORK_FAILURE' },
    ];
    
    for (const { regex, pattern } of patterns) {
      if (regex.test(rootCause)) {
        return pattern;
      }
    }
    
    return 'UNCLASSIFIED_FAILURE';
  }
  
  getInsights(): LearningInsight[] {
    return [...this.insights].sort((a, b) => b.frequency - a.frequency);
  }
  
  getHighConfidenceInsights(minConfidence: number = 0.7): LearningInsight[] {
    return this.insights.filter(i => i.confidence >= minConfidence);
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ───────────────────────────────────────────────────────────────────────────
  
  getPostMortems(limit?: number): PostMortem[] {
    const pms = [...this.postMortems].reverse();
    return limit ? pms.slice(0, limit) : pms;
  }
  
  getPostMortemsBySeverity(severity: ImpactAssessment['userExperienceImpact']): PostMortem[] {
    return this.postMortems.filter(pm => pm.impactAssessment.userExperienceImpact === severity);
  }
  
  getRewrites(limit?: number): ConstellationRewrite[] {
    const rws = [...this.rewrites].reverse();
    return limit ? rws.slice(0, limit) : rws;
  }
  
  getLedger(): LedgerEntry[] {
    return [...this.ledger];
  }
  
  getMetrics(): {
    totalPostMortems: number;
    totalRewrites: number;
    ledgerEntries: number;
    insightCount: number;
    severityDistribution: Record<ImpactAssessment['userExperienceImpact'], number>;
    avgRewriteImprovement: number;
  } {
    const severityDistribution: Record<ImpactAssessment['userExperienceImpact'], number> = {
      NONE: 0,
      MINOR: 0,
      MODERATE: 0,
      SEVERE: 0,
      CATASTROPHIC: 0,
    };
    
    for (const pm of this.postMortems) {
      severityDistribution[pm.impactAssessment.userExperienceImpact]++;
    }
    
    const avgRewriteImprovement = this.rewrites.length > 0
      ? this.rewrites.reduce((a, b) => a + b.expectedImprovement, 0) / this.rewrites.length
      : 0;
    
    return {
      totalPostMortems: this.postMortems.length,
      totalRewrites: this.rewrites.length,
      ledgerEntries: this.ledger.length,
      insightCount: this.insights.length,
      severityDistribution,
      avgRewriteImprovement,
    };
  }
}
