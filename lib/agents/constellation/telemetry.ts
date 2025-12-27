// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - TELEMETRY SYSTEM
// Real-time health monitoring with 50ms intervals
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ConstellationAgentRole,
  AgentTelemetry,
  AgentState,
  FallbackTier,
  calculateHealthScore,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TelemetrySnapshot {
  timestamp: number;
  agents: Map<ConstellationAgentRole, AgentTelemetry>;
  constellation: {
    overallHealth: number;
    activeAgents: number;
    failedAgents: number;
    avgLatency: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
  };
}

export interface TelemetryAlert {
  severity: 'warning' | 'critical' | 'fatal';
  agent: ConstellationAgentRole;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export interface TelemetryConfig {
  interval: number;
  historySize: number;
  thresholds: {
    latency: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
    cpuUsage: { warning: number; critical: number };
    memoryUsage: { warning: number; critical: number };
    healthScore: { warning: number; critical: number };
  };
}

const DEFAULT_CONFIG: TelemetryConfig = {
  interval: 50, // 50ms as specified
  historySize: 1000, // ~50 seconds of history
  thresholds: {
    latency: { warning: 500, critical: 1000 },
    errorRate: { warning: 0.01, critical: 0.05 },
    cpuUsage: { warning: 70, critical: 90 },
    memoryUsage: { warning: 70, critical: 90 },
    healthScore: { warning: 70, critical: 50 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY COLLECTOR
// ─────────────────────────────────────────────────────────────────────────────

export class TelemetryCollector {
  private config: TelemetryConfig;
  private history: TelemetrySnapshot[] = [];
  private alerts: TelemetryAlert[] = [];
  private agentMetrics: Map<ConstellationAgentRole, AgentTelemetry> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(snapshot: TelemetrySnapshot) => void> = new Set();
  private alertListeners: Set<(alert: TelemetryAlert) => void> = new Set();
  
  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────────────────────
  
  start(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.collect();
    }, this.config.interval);
    
    console.log(`Telemetry started with ${this.config.interval}ms interval`);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // DATA COLLECTION
  // ───────────────────────────────────────────────────────────────────────────
  
  updateAgentTelemetry(
    role: ConstellationAgentRole,
    agentId: string,
    metricsUpdate: Partial<AgentTelemetry['metrics']>,
    state?: AgentState,
    tier?: FallbackTier
  ): void {
    const existing = this.agentMetrics.get(role);
    
    const metrics: AgentTelemetry['metrics'] = {
      latencyMs: metricsUpdate.latencyMs ?? existing?.metrics.latencyMs ?? 0,
      errorRate: metricsUpdate.errorRate ?? existing?.metrics.errorRate ?? 0,
      entropy: metricsUpdate.entropy ?? existing?.metrics.entropy ?? 0,
      memoryUsageMb: metricsUpdate.memoryUsageMb ?? existing?.metrics.memoryUsageMb ?? 0,
      cpuUsagePercent: metricsUpdate.cpuUsagePercent ?? existing?.metrics.cpuUsagePercent ?? 0,
      taskQueueDepth: metricsUpdate.taskQueueDepth ?? existing?.metrics.taskQueueDepth ?? 0,
      successRate: metricsUpdate.successRate ?? existing?.metrics.successRate ?? 1,
      avgResponseQuality: metricsUpdate.avgResponseQuality ?? existing?.metrics.avgResponseQuality ?? 100,
    };
    
    const healthScore = calculateHealthScore(metrics);
    
    const telemetry: AgentTelemetry = {
      agentId,
      role,
      timestamp: Date.now(),
      metrics,
      state: state ?? existing?.state ?? 'ACTIVE',
      healthScore,
      tier: tier ?? existing?.tier ?? 'PRIMARY',
    };
    
    this.agentMetrics.set(role, telemetry);
    this.checkAlerts(role, telemetry);
  }
  
  recordOperation(
    role: ConstellationAgentRole,
    agentId: string,
    success: boolean,
    latencyMs: number
  ): void {
    const existing = this.agentMetrics.get(role);
    const existingMetrics = existing?.metrics;
    
    // Calculate new success rate using exponential moving average
    const alpha = 0.1;
    const currentSuccessRate = existingMetrics?.successRate ?? 1;
    const newSuccessRate = currentSuccessRate * (1 - alpha) + (success ? 1 : 0) * alpha;
    
    // Calculate new error rate
    const newErrorRate = 1 - newSuccessRate;
    
    // Exponential moving average for latency
    const avgLatency = existingMetrics?.latencyMs
      ? existingMetrics.latencyMs * (1 - alpha) + latencyMs * alpha
      : latencyMs;
    
    this.updateAgentTelemetry(role, agentId, {
      latencyMs: avgLatency,
      successRate: newSuccessRate,
      errorRate: newErrorRate,
    });
  }
  
  private collect(): void {
    const snapshot: TelemetrySnapshot = {
      timestamp: Date.now(),
      agents: new Map(this.agentMetrics),
      constellation: this.calculateConstellationMetrics(),
    };
    
    this.history.push(snapshot);
    
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }
    
    this.listeners.forEach(listener => listener(snapshot));
  }
  
  private calculateConstellationMetrics(): TelemetrySnapshot['constellation'] {
    const agents = Array.from(this.agentMetrics.values());
    
    if (agents.length === 0) {
      return {
        overallHealth: 100,
        activeAgents: 0,
        failedAgents: 0,
        avgLatency: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      };
    }
    
    const healthScores = agents.map(a => a.healthScore);
    const failedAgents = agents.filter(a => a.healthScore < 50).length;
    
    return {
      overallHealth: healthScores.reduce((a, b) => a + b, 0) / healthScores.length,
      activeAgents: agents.length,
      failedAgents,
      avgLatency: agents.reduce((a, b) => a + b.metrics.latencyMs, 0) / agents.length,
      avgCpuUsage: agents.reduce((a, b) => a + b.metrics.cpuUsagePercent, 0) / agents.length,
      avgMemoryUsage: agents.reduce((a, b) => a + b.metrics.memoryUsageMb, 0) / agents.length,
    };
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // ALERTING
  // ───────────────────────────────────────────────────────────────────────────
  
  private checkAlerts(role: ConstellationAgentRole, telemetry: AgentTelemetry): void {
    const { thresholds } = this.config;
    const metrics = telemetry.metrics;
    
    // Latency check
    if (metrics.latencyMs > thresholds.latency.critical) {
      this.raiseAlert({
        severity: 'critical',
        agent: role,
        metric: 'latency',
        value: metrics.latencyMs,
        threshold: thresholds.latency.critical,
        message: `${role} latency is critically high: ${metrics.latencyMs}ms`,
        timestamp: Date.now(),
      });
    } else if (metrics.latencyMs > thresholds.latency.warning) {
      this.raiseAlert({
        severity: 'warning',
        agent: role,
        metric: 'latency',
        value: metrics.latencyMs,
        threshold: thresholds.latency.warning,
        message: `${role} latency is elevated: ${metrics.latencyMs}ms`,
        timestamp: Date.now(),
      });
    }
    
    // Error rate check
    if (metrics.errorRate > thresholds.errorRate.critical) {
      this.raiseAlert({
        severity: 'critical',
        agent: role,
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: thresholds.errorRate.critical,
        message: `${role} error rate is critically high: ${(metrics.errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
      });
    } else if (metrics.errorRate > thresholds.errorRate.warning) {
      this.raiseAlert({
        severity: 'warning',
        agent: role,
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: thresholds.errorRate.warning,
        message: `${role} error rate is elevated: ${(metrics.errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
      });
    }
    
    // Health score check
    if (telemetry.healthScore < thresholds.healthScore.critical) {
      this.raiseAlert({
        severity: 'critical',
        agent: role,
        metric: 'healthScore',
        value: telemetry.healthScore,
        threshold: thresholds.healthScore.critical,
        message: `${role} health score is critically low: ${telemetry.healthScore.toFixed(1)}`,
        timestamp: Date.now(),
      });
    } else if (telemetry.healthScore < thresholds.healthScore.warning) {
      this.raiseAlert({
        severity: 'warning',
        agent: role,
        metric: 'healthScore',
        value: telemetry.healthScore,
        threshold: thresholds.healthScore.warning,
        message: `${role} health score is low: ${telemetry.healthScore.toFixed(1)}`,
        timestamp: Date.now(),
      });
    }
    
    // CPU usage check
    if (metrics.cpuUsagePercent > thresholds.cpuUsage.critical) {
      this.raiseAlert({
        severity: 'critical',
        agent: role,
        metric: 'cpuUsage',
        value: metrics.cpuUsagePercent,
        threshold: thresholds.cpuUsage.critical,
        message: `${role} CPU usage is critically high: ${metrics.cpuUsagePercent.toFixed(1)}%`,
        timestamp: Date.now(),
      });
    }
    
    // Memory usage check
    if (metrics.memoryUsageMb > thresholds.memoryUsage.critical) {
      this.raiseAlert({
        severity: 'critical',
        agent: role,
        metric: 'memoryUsage',
        value: metrics.memoryUsageMb,
        threshold: thresholds.memoryUsage.critical,
        message: `${role} memory usage is critically high: ${metrics.memoryUsageMb.toFixed(1)}MB`,
        timestamp: Date.now(),
      });
    }
  }
  
  private raiseAlert(alert: TelemetryAlert): void {
    this.alerts.push(alert);
    
    if (this.alerts.length > 500) {
      this.alerts.shift();
    }
    
    this.alertListeners.forEach(listener => listener(alert));
    
    const logFn = alert.severity === 'fatal' || alert.severity === 'critical'
      ? console.error
      : console.warn;
    logFn(`[TELEMETRY:${alert.severity.toUpperCase()}] ${alert.message}`);
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ───────────────────────────────────────────────────────────────────────────
  
  getLatestSnapshot(): TelemetrySnapshot | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }
  
  getAgentTelemetry(role: ConstellationAgentRole): AgentTelemetry | null {
    return this.agentMetrics.get(role) || null;
  }
  
  getHistory(count?: number): TelemetrySnapshot[] {
    if (count) {
      return this.history.slice(-count);
    }
    return [...this.history];
  }
  
  getRecentAlerts(count: number = 50): TelemetryAlert[] {
    return this.alerts.slice(-count);
  }
  
  getAlertsByAgent(role: ConstellationAgentRole): TelemetryAlert[] {
    return this.alerts.filter(a => a.agent === role);
  }
  
  getCriticalAlerts(): TelemetryAlert[] {
    return this.alerts.filter(a => a.severity === 'critical' || a.severity === 'fatal');
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ───────────────────────────────────────────────────────────────────────────
  
  calculateDynamicSigmaThreshold(
    role: ConstellationAgentRole,
    metricKey: keyof AgentTelemetry['metrics'],
    sigmaMultiplier: number = 2
  ): number {
    const values: number[] = [];
    
    for (const snapshot of this.history) {
      const telemetry = snapshot.agents.get(role);
      if (telemetry) {
        values.push(telemetry.metrics[metricKey]);
      }
    }
    
    if (values.length < 10) {
      // Not enough data, use default
      return metricKey === 'latencyMs' ? 500 : 0.5;
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean + (stdDev * sigmaMultiplier);
  }
  
  getAgentTrend(
    role: ConstellationAgentRole,
    metricKey: keyof AgentTelemetry['metrics'] | 'healthScore',
    windowSize: number = 50
  ): 'improving' | 'stable' | 'degrading' {
    const recentHistory = this.history.slice(-windowSize);
    if (recentHistory.length < 10) return 'stable';
    
    const values = recentHistory
      .map(s => {
        const telemetry = s.agents.get(role);
        if (!telemetry) return undefined;
        if (metricKey === 'healthScore') return telemetry.healthScore;
        return telemetry.metrics[metricKey];
      })
      .filter((v): v is number => v !== undefined);
    
    if (values.length < 10) return 'stable';
    
    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const threshold = 0.01;
    
    // For metrics where lower is better
    const lowerIsBetter = ['latencyMs', 'errorRate', 'entropy', 'memoryUsageMb', 'cpuUsagePercent', 'taskQueueDepth'];
    
    if (lowerIsBetter.includes(metricKey)) {
      if (slope < -threshold) return 'improving';
      if (slope > threshold) return 'degrading';
    } else {
      // healthScore, successRate, avgResponseQuality - higher is better
      if (slope > threshold) return 'improving';
      if (slope < -threshold) return 'degrading';
    }
    
    return 'stable';
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ───────────────────────────────────────────────────────────────────────────
  
  subscribe(listener: (snapshot: TelemetrySnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  subscribeToAlerts(listener: (alert: TelemetryAlert) => void): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // EXPORT
  // ───────────────────────────────────────────────────────────────────────────
  
  exportMetrics(): {
    timestamp: number;
    agents: Record<string, AgentTelemetry | null>;
    constellation: TelemetrySnapshot['constellation'];
    alerts: TelemetryAlert[];
  } {
    const latest = this.getLatestSnapshot();
    const agentRecord: Record<string, AgentTelemetry | null> = {};
    
    const roles: ConstellationAgentRole[] = [
      'NEXUS', 'ARCHITECT', 'RENDERER', 'SHADER_FORGE', 'MOTION_CORE',
      'INTERFACE', 'PERCEPTION', 'SENTINEL', 'SYNTHESIZER', 'VALIDATOR'
    ];
    
    for (const role of roles) {
      agentRecord[role] = this.agentMetrics.get(role) || null;
    }
    
    return {
      timestamp: Date.now(),
      agents: agentRecord,
      constellation: latest?.constellation ?? {
        overallHealth: 100,
        activeAgents: 0,
        failedAgents: 0,
        avgLatency: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      },
      alerts: this.getRecentAlerts(100),
    };
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // ANOMALY DETECTION
  // ───────────────────────────────────────────────────────────────────────────
  
  detectAnomalies(): Array<{
    agent: ConstellationAgentRole;
    metric: string;
    value: number;
    expectedRange: { min: number; max: number };
    deviation: number;
  }> {
    const anomalies: Array<{
      agent: ConstellationAgentRole;
      metric: string;
      value: number;
      expectedRange: { min: number; max: number };
      deviation: number;
    }> = [];
    
    const metricKeys: (keyof AgentTelemetry['metrics'])[] = [
      'latencyMs', 'errorRate', 'entropy', 'cpuUsagePercent', 'memoryUsageMb'
    ];
    
    for (const [role, telemetry] of this.agentMetrics) {
      for (const metricKey of metricKeys) {
        const threshold = this.calculateDynamicSigmaThreshold(role, metricKey, 3);
        const value = telemetry.metrics[metricKey];
        
        // Get historical values for this metric
        const values: number[] = [];
        for (const snapshot of this.history.slice(-100)) {
          const t = snapshot.agents.get(role);
          if (t) values.push(t.metrics[metricKey]);
        }
        
        if (values.length < 10) continue;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
        );
        
        const min = mean - 3 * stdDev;
        const max = mean + 3 * stdDev;
        
        if (value > max || value < min) {
          anomalies.push({
            agent: role,
            metric: metricKey,
            value,
            expectedRange: { min: Math.max(0, min), max },
            deviation: Math.abs(value - mean) / (stdDev || 1),
          });
        }
      }
    }
    
    return anomalies;
  }
  
  // ───────────────────────────────────────────────────────────────────────────
  // HEALTH PREDICTIONS
  // ───────────────────────────────────────────────────────────────────────────
  
  predictHealthDecline(
    role: ConstellationAgentRole,
    horizonMs: number = 5000
  ): { willDecline: boolean; predictedHealth: number; confidence: number } {
    const trend = this.getAgentTrend(role, 'healthScore', 100);
    const current = this.agentMetrics.get(role)?.healthScore ?? 100;
    
    if (trend === 'stable') {
      return { willDecline: false, predictedHealth: current, confidence: 0.8 };
    }
    
    // Get recent health scores for linear extrapolation
    const recentScores: { time: number; health: number }[] = [];
    for (const snapshot of this.history.slice(-50)) {
      const telemetry = snapshot.agents.get(role);
      if (telemetry) {
        recentScores.push({ time: snapshot.timestamp, health: telemetry.healthScore });
      }
    }
    
    if (recentScores.length < 5) {
      return { willDecline: trend === 'degrading', predictedHealth: current, confidence: 0.3 };
    }
    
    // Linear extrapolation
    const n = recentScores.length;
    const sumX = recentScores.reduce((a, b) => a + b.time, 0);
    const sumY = recentScores.reduce((a, b) => a + b.health, 0);
    const sumXY = recentScores.reduce((a, b) => a + b.time * b.health, 0);
    const sumX2 = recentScores.reduce((a, b) => a + b.time * b.time, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const futureTime = Date.now() + horizonMs;
    const predictedHealth = slope * futureTime + intercept;
    
    // Confidence based on R² and data quality
    const yMean = sumY / n;
    const ssTotal = recentScores.reduce((a, b) => a + Math.pow(b.health - yMean, 2), 0);
    const ssResidual = recentScores.reduce((a, b) => {
      const predicted = slope * b.time + intercept;
      return a + Math.pow(b.health - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / (ssTotal || 1));
    
    return {
      willDecline: predictedHealth < current && slope < 0,
      predictedHealth: Math.max(0, Math.min(100, predictedHealth)),
      confidence: Math.max(0, Math.min(1, rSquared)),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let _telemetryInstance: TelemetryCollector | null = null;

export function getTelemetryCollector(config?: Partial<TelemetryConfig>): TelemetryCollector {
  if (!_telemetryInstance) {
    _telemetryInstance = new TelemetryCollector(config);
  }
  return _telemetryInstance;
}

export function resetTelemetryCollector(): void {
  if (_telemetryInstance) {
    _telemetryInstance.stop();
    _telemetryInstance = null;
  }
}
