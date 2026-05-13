/**
 * DGKJ 支付平台 - 平滑加权轮转算法
 * 
 * 实现平滑加权轮转 (Smooth Weighted Round Robin)
 * 相比普通加权轮转，能更均匀地分配流量
 */

export interface WeightedItem {
  /** 标识符 (如 mchNo) */
  id: string;
  /** 权重值 */
  weight: number;
  /** 当前累积权重 */
  currentWeight?: number;
}

export class SmoothWeightedRoundRobin<T extends WeightedItem> {
  private counters = new Map<string, number>();
  private totalWeight = 0;
  private items: Map<string, T> = new Map();

  constructor(
    private options: {
      /** 最小权重值，默认 1 */
      minWeight?: number;
      /** 权重精度，默认 2 位小数 */
      precision?: number;
    } = {}
  ) {
    this.options = {
      minWeight: 1,
      precision: 2,
      ...options,
    };
  }

  /**
   * 初始化或更新候选项
   */
  setItems(items: T[]): void {
    this.totalWeight = 0;
    this.items.clear();

    for (const item of items) {
      const weight = Math.max(item.weight ?? 0, this.options.minWeight!);
      this.items.set(item.id, item);

      // 初始化计数器（首次设置为权重值的一半，避免启动时集中）
      if (!this.counters.has(item.id)) {
        this.counters.set(item.id, weight / 2);
      }

      this.totalWeight += weight;
    }

    // 清理已移除的候选项
    for (const id of this.counters.keys()) {
      if (!this.items.has(id)) {
        this.counters.delete(id);
      }
    }
  }

  /**
   * 添加候选项
   */
  addItem(item: T): void {
    const weight = Math.max(item.weight ?? 0, this.options.minWeight!);
    this.items.set(item.id, item);
    this.totalWeight += weight;

    if (!this.counters.has(item.id)) {
      this.counters.set(item.id, weight / 2);
    }
  }

  /**
   * 移除候选项
   */
  removeItem(id: string): void {
    const item = this.items.get(id);
    if (item) {
      this.totalWeight -= Math.max(item.weight ?? 0, this.options.minWeight!);
      this.items.delete(id);
      this.counters.delete(id);
    }
  }

  /**
   * 更新候选项权重
   */
  updateWeight(id: string, weight: number): void {
    const item = this.items.get(id);
    if (!item) return;

    const oldWeight = Math.max(item.weight ?? 0, this.options.minWeight!);
    const newWeight = Math.max(weight, this.options.minWeight!);

    item.weight = newWeight;
    this.totalWeight = this.totalWeight - oldWeight + newWeight;

    // 保持计数器与新权重的比例
    const counter = this.counters.get(id) ?? 0;
    this.counters.set(id, counter * (newWeight / oldWeight));
  }

  /**
   * 获取下一个候选项（不执行）
   */
  peek(): T | null {
    if (this.items.size === 0) {
      return null;
    }

    // 找到当前权重最高的候选项
    let maxItem: T | null = null;
    let maxWeight = -Infinity;

    for (const item of this.items.values()) {
      const currentWeight = this.counters.get(item.id) ?? 0;
      if (currentWeight > maxWeight) {
        maxWeight = currentWeight;
        maxItem = item;
      }
    }

    return maxItem;
  }

  /**
   * 选择下一个候选项并更新计数器
   */
  select(): T | null {
    const item = this.peek();
    if (!item) {
      return null;
    }

    const currentWeight = this.counters.get(item.id) ?? 0;
    const newWeight = this.round(currentWeight + item.weight);

    // 所有候选项的当前权重减去总权重
    for (const [id, weight] of this.counters) {
      this.counters.set(id, this.round(weight - this.totalWeight + item.weight));
    }

    // 选中的候选项加回其权重
    this.counters.set(item.id, newWeight);

    return item;
  }

  /**
   * 批量选择（用于预热或测试）
   */
  selectBatch(count: number): T[] {
    const results: T[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.select();
      if (item) {
        results.push(item);
      }
    }
    return results;
  }

  /**
   * 获取候选项的选择统计
   */
  getStats(): Array<{
    id: string;
    weight: number;
    currentWeight: number;
    expectedRatio: number;
  }> {
    const stats: Array<{
      id: string;
      weight: number;
      currentWeight: number;
      expectedRatio: number;
    }> = [];

    for (const item of this.items.values()) {
      const currentWeight = this.counters.get(item.id) ?? 0;
      stats.push({
        id: item.id,
        weight: item.weight,
        currentWeight: this.round(currentWeight),
        expectedRatio: this.totalWeight > 0 ? (item.weight / this.totalWeight) * 100 : 0,
      });
    }

    return stats.sort((a, b) => b.currentWeight - a.currentWeight);
  }

  /**
   * 重置计数器
   */
  reset(): void {
    for (const [id, _] of this.counters) {
      const item = this.items.get(id);
      if (item) {
        this.counters.set(id, item.weight / 2);
      }
    }
  }

  /**
   * 获取总权重
   */
  getTotalWeight(): number {
    return this.totalWeight;
  }

  /**
   * 获取候选项数量
   */
  getSize(): number {
    return this.items.size;
  }

  /**
   * 检查候选项是否存在
   */
  has(id: string): boolean {
    return this.items.has(id);
  }

  /**
   * 获取候选项
   */
  get(id: string): T | undefined {
    return this.items.get(id);
  }

  /**
   * 获取所有候选项
   */
  getAll(): T[] {
    return Array.from(this.items.values());
  }

  /**
   * 四舍五入到指定精度
   */
  private round(value: number): number {
    const factor = Math.pow(10, this.options.precision!);
    return Math.round(value * factor) / factor;
  }
}

// ==================== 轮转池管理器 ====================

export interface PoolItem extends WeightedItem {
  /** 通道编码 */
  channelCode: string;
  /** 商户号 */
  mchNo: string;
  /** 商户名称 */
  mchName?: string;
  /** 当前状态 1-正常 2-熔断 3-维护 */
  status?: number;
  /** 日限额 */
  dailyLimit?: number;
  /** 当日已用 */
  dailyUsed?: number;
  /** 单笔最小限额 */
  singleMinAmount?: number;
  /** 单笔最大限额 */
  singleMaxAmount?: number;
  /** 支持的支付方式 */
  payWays?: string[];
  /** 排除的 BIN */
  excludeBins?: string[];
  /** 优先级 */
  priority?: number;
}

export class PoolManager {
  private pool = new SmoothWeightedRoundRobin<PoolItem>({ minWeight: 1, precision: 4 });

  /**
   * 初始化轮转池
   */
  setPool(items: PoolItem[]): void {
    this.pool.setItems(items);
  }

  /**
   * 添加商户到池
   */
  addToPool(item: PoolItem): void {
    this.pool.addItem(item);
  }

  /**
   * 从池中移除商户
   */
  removeFromPool(mchNo: string): void {
    this.pool.removeItem(mchNo);
  }

  /**
   * 更新商户权重
   */
  updateWeight(mchNo: string, weight: number): void {
    this.pool.updateWeight(mchNo, weight);
  }

  /**
   * 获取下一个商户
   */
  select(): PoolItem | null {
    return this.pool.select();
  }

  /**
   * 预览下一个商户（不更新计数器）
   */
  peek(): PoolItem | null {
    return this.pool.peek();
  }

  /**
   * 获取池统计
   */
  getStats() {
    return this.pool.getStats();
  }

  /**
   * 获取总权重
   */
  getTotalWeight(): number {
    return this.pool.getTotalWeight();
  }

  /**
   * 获取池大小
   */
  getPoolSize(): number {
    return this.pool.getSize();
  }

  /**
   * 检查商户是否在池中
   */
  hasMch(mchNo: string): boolean {
    return this.pool.has(mchNo);
  }

  /**
   * 获取商户信息
   */
  getMch(mchNo: string): PoolItem | undefined {
    return this.pool.get(mchNo);
  }

  /**
   * 获取所有商户
   */
  getAllMchs(): PoolItem[] {
    return this.pool.getAll();
  }

  /**
   * 重置池
   */
  reset(): void {
    this.pool.reset();
  }
}

// 全局轮转池管理器
export const poolManager = new PoolManager();
