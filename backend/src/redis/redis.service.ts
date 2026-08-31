import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 3000,
      });
    } else {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => (times > 2 ? null : 1000),
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
      });
    }
    this.client.on('connect', () => console.log('✅ Redis connected'));
    this.client.on('error', () => {
      // silent failover when Redis is not configured
    });
  }

  async onModuleDestroy() {
    try {
      await this.client?.quit();
    } catch {
      // silent
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client?.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client?.setex(key, ttlSeconds, value);
      } else {
        await this.client?.set(key, value);
      }
    } catch {
      // ignore cache write error
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client?.del(key);
    } catch {
      // ignore
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    try {
      const cached = await this.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      // fallback to factory
    }
    const value = await factory();
    await this.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.client?.keys(pattern);
      if (keys && keys.length) await this.client?.del(...keys);
    } catch {
      // ignore
    }
  }
}
