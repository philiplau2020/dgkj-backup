/**
 * DGKJ 支付平台 - 消息队列服务
 * 
 * 支持 RabbitMQ 和内存队列（降级方案）
 */

import { EventEmitter } from 'events';

// ==================== 消息类型 ====================

interface Message<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
  maxRetries?: number;
}

interface QueueOptions {
  name: string;
  durable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface ProducerOptions {
  persistent?: boolean;
  compress?: boolean;
}

// ==================== 内存队列实现（降级方案）====================

class MemoryQueue<T = any> extends EventEmitter {
  private queue: Message<T>[] = [];
  private processing: Set<string> = new Set();
  private consumers: Map<string, (msg: Message<T>) => Promise<void>> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private options: QueueOptions;

  constructor(options: QueueOptions) {
    super();
    this.options = {
      durable: true,
      maxRetries: 3,
      retryDelay: 5000,
      ...options,
    };
    this.startProcessing();
  }

  private startProcessing() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(async () => {
      await this.processQueue();
    }, 1000);
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    const message = this.queue[0];
    if (this.processing.has(message.id)) return;

    const consumer = this.consumers.get(this.options.name);
    if (!consumer) return;

    this.processing.add(message.id);
    
    try {
      await consumer(message);
      this.queue.shift();
      this.emit('consumed', message);
    } catch (error) {
      this.handleError(message, error);
    } finally {
      this.processing.delete(message.id);
    }
  }

  private handleError(message: Message<T>, error: any) {
    const maxRetries = this.options.maxRetries || 3;
    
    if (message.retryCount < maxRetries) {
      message.retryCount++;
      setTimeout(() => {
        this.emit('retry', message);
      }, this.options.retryDelay || 5000);
    } else {
      this.queue.shift();
      this.emit('failed', { message, error });
    }
  }

  async publish(message: Omit<Message<T>, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const fullMessage: Message<T> = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(fullMessage);
    this.emit('published', fullMessage);
  }

  async subscribe(handler: (msg: Message<T>) => Promise<void>): Promise<void> {
    this.consumers.set(this.options.name, handler);
  }

  async ack(messageId: string): Promise<void> {
    this.processing.delete(messageId);
  }

  async nack(messageId: string): Promise<void> {
    const message = this.queue.find(m => m.id === messageId);
    if (message) {
      this.handleError(message, new Error('NACK'));
    }
  }

  async purge(): Promise<number> {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }

  get length(): number {
    return this.queue.length;
  }

  close() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.consumers.clear();
  }
}

// ==================== RabbitMQ 队列实现 ====================

class RabbitMQQueue<T = any> extends EventEmitter {
  private channel: any = null;
  private connection: any = null;
  private options: QueueOptions;
  private isConnected: boolean = false;

  constructor(options: QueueOptions) {
    super();
    this.options = options;
  }

  async connect(url?: string): Promise<void> {
    try {
      const amqp = require('amqplib');
      const connectionUrl = url || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(connectionUrl);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertQueue(this.options.name, {
        durable: this.options.durable !== false,
      });

      this.connection.on('error', (err: Error) => {
        console.error('RabbitMQ 连接错误:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ 连接关闭');
        this.isConnected = false;
      });

      this.isConnected = true;
      console.log('RabbitMQ 连接成功');
    } catch (error) {
      console.error('RabbitMQ 连接失败:', error);
      throw error;
    }
  }

  async publish(message: Omit<Message<T>, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel 未初始化');
    }

    const fullMessage: Message<T> = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.channel.sendToQueue(
      this.options.name,
      Buffer.from(JSON.stringify(fullMessage)),
      { persistent: true }
    );

    this.emit('published', fullMessage);
  }

  async subscribe(handler: (msg: Message<T>) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel 未初始化');
    }

    await this.channel.consume(this.options.name, async (msg: any) => {
      if (!msg) return;

      try {
        const message = JSON.parse(msg.content.toString()) as Message<T>;
        await handler(message);
        this.channel.ack(msg);
        this.emit('consumed', message);
      } catch (error) {
        this.handleError(msg, error);
      }
    });
  }

  private handleError(msg: any, error: any) {
    const content = JSON.parse(msg.content.toString());
    const maxRetries = this.options.maxRetries || 3;

    if (content.retryCount < maxRetries) {
      // 延迟重试
      setTimeout(() => {
        content.retryCount++;
        this.channel.sendToQueue(
          this.options.name,
          Buffer.from(JSON.stringify(content)),
          { persistent: true }
        );
        this.channel.ack(msg);
        this.emit('retry', content);
      }, this.options.retryDelay || 5000);
    } else {
      this.channel.nack(msg, false, false);
      this.emit('failed', { message: content, error });
    }
  }

  async purge(): Promise<number> {
    if (!this.channel) return 0;
    const result = await this.channel.purgeQueue(this.options.name);
    return result.messageCount;
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// ==================== 消息队列管理器 ====================

type QueueType = 'memory' | 'rabbitmq';

class MessageQueueService {
  private queues: Map<string, MemoryQueue | RabbitMQQueue> = new Map();
  private useRabbitMQ: boolean = false;

  /**
   * 初始化消息队列
   */
  async initialize(type: QueueType = 'memory', rabbitmqUrl?: string): Promise<void> {
    this.useRabbitMQ = type === 'rabbitmq';
    
    if (this.useRabbitMQ) {
      console.log('消息队列已初始化为 RabbitMQ 模式');
    } else {
      console.log('消息队列已初始化为内存模式');
    }
  }

  /**
   * 获取或创建队列
   */
  async getQueue<T = any>(name: string, options?: QueueOptions): Promise<MemoryQueue<T> | RabbitMQQueue<T>> {
    const queueName = options?.name || name;

    if (this.queues.has(queueName)) {
      return this.queues.get(queueName) as MemoryQueue<T> | RabbitMQQueue<T>;
    }

    let queue: MemoryQueue<T> | RabbitMQQueue<T>;

    if (this.useRabbitMQ) {
      queue = new RabbitMQQueue<T>({ name: queueName, ...options });
      try {
        await (queue as RabbitMQQueue<T>).connect();
      } catch (error) {
        console.warn('RabbitMQ 连接失败，降级为内存队列');
        queue = new MemoryQueue<T>({ name: queueName, ...options });
      }
    } else {
      queue = new MemoryQueue<T>({ name: queueName, ...options });
    }

    this.queues.set(queueName, queue);
    return queue;
  }

  /**
   * 发送消息
   */
  async publish<T = any>(queueName: string, type: string, data: T, options?: ProducerOptions): Promise<void> {
    const queue = await this.getQueue(queueName);
    await queue.publish({ type, data });
  }

  /**
   * 订阅消息
   */
  async subscribe<T = any>(
    queueName: string, 
    handler: (msg: Message<T>) => Promise<void>
  ): Promise<void> {
    const queue = await this.getQueue(queueName);
    await queue.subscribe(handler);
  }

  /**
   * 关闭所有队列
   */
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
  }
}

// ==================== 预定义队列名称 ====================

export const QueueNames = {
  // 支付相关
  PAY_NOTIFY: 'pay:notify',
  PAY_RESULT: 'pay:result',
  
  // 退款相关
  REFUND_PROCESS: 'refund:process',
  REFUND_NOTIFY: 'refund:notify',
  
  // 短信邮件
  SMS_SEND: 'sms:send',
  EMAIL_SEND: 'email:send',
  
  // 通知
  DINGTALK_NOTIFY: 'dingtalk:notify',
  WECOM_NOTIFY: 'wecom:notify',
  
  // 统计
  STAT_TRADE: 'stat:trade',
  STAT_USER: 'stat:user',
  
  // 结算
  SETTLEMENT_PROCESS: 'settlement:process',
  
  // 日志
  LOG_RECORD: 'log:record',
};

// ==================== 导出 ====================

export const messageQueueService = new MessageQueueService();

export default messageQueueService;
