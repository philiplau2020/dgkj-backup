/**
 * DGKJ 支付平台 - 熔断器实现
 * 
 * 防止通道商户故障影响整体支付系统
 * 采用三态熔断器模式: CLOSED -> HALF_OPEN -> OPEN
 */

export enum CircuitState {
  /** 关闭状态 - 正常通行，失败计数 */
  CLOSED = 1,
  /** 半开状态 - 允许部分请求通过探测恢复 */
  HALF_OPEN = 2,
  /** 打开状态 - 完全拒绝请求 */
  OPEN = 3,
}

export enum CircuitAction {
  ALLOW = 'allow',
  REJECT = 'reject',
  CIRCUIT_OPENED = 'circuit_opened',
  CIRCUIT_CLOSED = 'circuit_closed',
}

export interface CircuitConfig {
  /** 失败阈值，达到此值则打开熔断器 */
  failureThreshold: number;
  /** 半开状态下成功阈值，达到此值则关闭熔断器 */
  successThreshold: number;
  /** 熔断超时时间(ms)，超时后进入半开状态 */
  timeout: number;
  /** 半开状态最大并发请求数 */
  halfOpenMaxCalls: number;
  /** 滑动窗口大小(ms)，用于计算失败率 */
  windowSize: number;
  /** 失败率阈值，超过此值则打开熔断器 */
  failureRateThreshold: number;
}

export interface CircuitMetrics {
  /** 失败次数 */
  failures: number;
  /** 成功次数 */
  successes: number;
  /** 最后失败时间 */
  lastFailureTime: number;
  /** 最后成功时间 */
  lastSuccessTime: number;
  /** 当前状态 */
  state: CircuitState;
  /** 半开状态当前调用数 */
  halfOpenCalls: number;
  /** 熔断打开时间 */
  circuitOpenedAt: number;
  /** 滑动窗口中的失败记录 */
  failureWindow: number[];
  /** 滑动窗口中的成功记录 */
  successWindow: number[];
  /** 连续失败次数 */
  consecutiveFails: number;
}

export interface CircuitEvent {
  type: 'OPEN' | 'CLOSE' | 'HALF_OPEN' | 'REJECT' | 'ALLOW';
  mchNo: string;
  timestamp: number;
  reason?: string;
  metrics?: Partial<CircuitMetrics>;
}

type CircuitEventHandler = (event: CircuitEvent) => void;

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  halfOpenMaxCalls: 3,
  windowSize: 60000,
  failureRateThreshold: 0.5,
};

export class CircuitBreaker {
  private metrics = new Map<string, CircuitMetrics>();
  private config: CircuitConfig;
  private eventHandlers: CircuitEventHandler[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CircuitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * 订阅熔断器事件
   */
  onEvent(handler: CircuitEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * 检查是否可以执行请求
   */
  canExecute(mchNo: string): { allowed: boolean; reason?: string; state?: CircuitState } {
    const metrics = this.getMetrics(mchNo);
    const now = Date.now();

    switch (metrics.state) {
      case CircuitState.CLOSED:
        return { allowed: true, state: CircuitState.CLOSED };

      case CircuitState.OPEN:
        // 检查超时是否到期
        if (now - metrics.circuitOpenedAt >= this.config.timeout) {
          this.transitionTo(mchNo, CircuitState.HALF_OPEN);
          return this.canExecute(mchNo);
        }
        return {
          allowed: false,
          reason: `熔断器已打开，请在 ${Math.ceil((this.config.timeout - (now - metrics.circuitOpenedAt)) / 1000)} 秒后重试`,
          state: CircuitState.OPEN,
        };

      case CircuitState.HALF_OPEN:
        // 限制并发调用数
        if (metrics.halfOpenCalls >= this.config.halfOpenMaxCalls) {
          return {
            allowed: false,
            reason: '半开状态并发受限，请稍后重试',
            state: CircuitState.HALF_OPEN,
          };
        }
        metrics.halfOpenCalls++;
        return { allowed: true, state: CircuitState.HALF_OPEN };

      default:
        return { allowed: false, reason: '未知状态', state: metrics.state };
    }
  }

  /**
   * 记录成功
   */
  recordSuccess(mchNo: string): CircuitAction {
    const metrics = this.getMetrics(mchNo);
    const now = Date.now();
    metrics.successes++;
    metrics.lastSuccessTime = now;
    metrics.consecutiveFails = 0;

    // 记录到滑动窗口
    metrics.successWindow.push(now);

    if (metrics.state === CircuitState.HALF_OPEN) {
      if (metrics.successes >= this.config.successThreshold) {
        this.transitionTo(mchNo, CircuitState.CLOSED);
        return CircuitAction.CIRCUIT_CLOSED;
      }
    }

    return CircuitAction.ALLOW;
  }

  /**
   * 记录失败
   */
  recordFailure(mchNo: string, errorType?: string): CircuitAction {
    const metrics = this.getMetrics(mchNo);
    const now = Date.now();
    metrics.failures++;
    metrics.lastFailureTime = now;
    metrics.consecutiveFails++;

    // 记录到滑动窗口
    metrics.failureWindow.push(now);

    let action = CircuitAction.ALLOW;

    if (metrics.state === CircuitState.CLOSED) {
      // 检查是否达到失败阈值
      if (metrics.consecutiveFails >= this.config.failureThreshold) {
        this.transitionTo(mchNo, CircuitState.OPEN);
        return CircuitAction.CIRCUIT_OPENED;
      }

      // 检查滑动窗口内的失败率
      const windowFailures = this.getWindowFailures(mchNo);
      if (windowFailures > 0 && this.calculateFailureRate(mchNo) > this.config.failureRateThreshold) {
        this.transitionTo(mchNo, CircuitState.OPEN);
        return CircuitAction.CIRCUIT_OPENED;
      }
    } else if (metrics.state === CircuitState.HALF_OPEN) {
      // 半开状态下，任何失败都立即回到 OPEN
      this.transitionTo(mchNo, CircuitState.OPEN);
      return CircuitAction.CIRCUIT_OPENED;
    }

    return action;
  }

  /**
   * 获取熔断器状态
   */
  getState(mchNo: string): CircuitState {
    const metrics = this.getMetrics(mchNo);
    if (metrics.state === CircuitState.OPEN) {
      // 检查超时
      if (Date.now() - metrics.circuitOpenedAt >= this.config.timeout) {
        this.transitionTo(mchNo, CircuitState.HALF_OPEN);
      }
    }
    return this.getMetrics(mchNo).state;
  }

  /**
   * 获取详细指标
   */
  getMetrics(mchNo: string): CircuitMetrics {
    if (!this.metrics.has(mchNo)) {
      this.metrics.set(mchNo, {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        state: CircuitState.CLOSED,
        halfOpenCalls: 0,
        circuitOpenedAt: 0,
        failureWindow: [],
        successWindow: [],
        consecutiveFails: 0,
      });
    }
    return this.metrics.get(mchNo)!;
  }

  /**
   * 获取健康状态摘要
   */
  getHealthSummary(mchNo: string): {
    state: CircuitState;
    successRate: number;
    consecutiveFails: number;
    isHealthy: boolean;
    canRecover: boolean;
  } {
    const metrics = this.getMetrics(mchNo);
    const total = metrics.successes + metrics.failures;
    const successRate = total > 0 ? metrics.successes / total : 1;

    return {
      state: metrics.state,
      successRate,
      consecutiveFails: metrics.consecutiveFails,
      isHealthy: metrics.state === CircuitState.CLOSED && successRate >= 0.95,
      canRecover: metrics.state === CircuitState.OPEN && Date.now() - metrics.circuitOpenedAt >= this.config.timeout,
    };
  }

  /**
   * 手动重置熔断器
   */
  reset(mchNo: string): void {
    this.transitionTo(mchNo, CircuitState.CLOSED);
  }

  /**
   * 手动强制打开熔断器
   */
  forceOpen(mchNo: string, reason?: string): void {
    this.transitionTo(mchNo, CircuitState.OPEN, reason);
  }

  /**
   * 获取所有熔断器状态摘要
   */
  getAllStates(): Array<{ mchNo: string; state: CircuitState; health: ReturnType<CircuitBreaker['getHealthSummary']> }> {
    return Array.from(this.metrics.entries()).map(([mchNo, _]) => ({
      mchNo,
      state: this.getState(mchNo),
      health: this.getHealthSummary(mchNo),
    }));
  }

  /**
   * 销毁清理
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private transitionTo(mchNo: string, state: CircuitState, reason?: string): void {
    const metrics = this.getMetrics(mchNo);
    const prevState = metrics.state;
    metrics.state = state;

    if (state === CircuitState.HALF_OPEN) {
      metrics.halfOpenCalls = 0;
    } else if (state === CircuitState.CLOSED) {
      metrics.failures = 0;
      metrics.successes = 0;
      metrics.consecutiveFails = 0;
      metrics.failureWindow = [];
      metrics.successWindow = [];
    } else if (state === CircuitState.OPEN) {
      metrics.circuitOpenedAt = Date.now();
    }

    // 发送事件
    const event: CircuitEvent = {
      type: state === CircuitState.CLOSED ? 'CLOSE' : state === CircuitState.HALF_OPEN ? 'HALF_OPEN' : 'OPEN',
      mchNo,
      timestamp: Date.now(),
      reason,
      metrics: {
        failures: metrics.failures,
        successes: metrics.successes,
        consecutiveFails: metrics.consecutiveFails,
        state: metrics.state,
      },
    };

    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[CircuitBreaker] Event handler error:', e);
      }
    });

    console.log(`[CircuitBreaker] ${mchNo}: ${CircuitState[prevState]} -> ${CircuitState[state]}${reason ? ` (${reason})` : ''}`);
  }

  private getWindowFailures(mchNo: string): number {
    const metrics = this.getMetrics(mchNo);
    const now = Date.now();
    const windowStart = now - this.config.windowSize;

    return metrics.failureWindow.filter(t => t > windowStart).length;
  }

  private calculateFailureRate(mchNo: string): number {
    const metrics = this.getMetrics(mchNo);
    const now = Date.now();
    const windowStart = now - this.config.windowSize;

    const recentFailures = metrics.failureWindow.filter(t => t > windowStart).length;
    const recentSuccesses = metrics.successWindow.filter(t => t > windowStart).length;
    const total = recentFailures + recentSuccesses;

    return total > 0 ? recentFailures / total : 0;
  }

  private startCleanup(): void {
    // 每分钟清理一次过期记录
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const threshold = this.config.windowSize * 2;

      this.metrics.forEach((metrics, mchNo) => {
        metrics.failureWindow = metrics.failureWindow.filter(t => now - t < threshold);
        metrics.successWindow = metrics.successWindow.filter(t => now - t < threshold);

        // 清理长期无活动的记录
        if (metrics.lastSuccessTime === 0 && metrics.lastFailureTime === 0) {
          return; // 新创建的，不清理
        }

        const lastActivity = Math.max(metrics.lastSuccessTime, metrics.lastFailureTime);
        if (now - lastActivity > 24 * 60 * 60 * 1000) {
          // 24小时无活动，重置
          this.transitionTo(mchNo, CircuitState.CLOSED);
        }
      });
    }, 60000);
  }
}

// 单例模式，全局共享
export const circuitBreaker = new CircuitBreaker();
