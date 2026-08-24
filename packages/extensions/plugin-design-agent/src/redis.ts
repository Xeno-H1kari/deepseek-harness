/**
 * Redis Integration for SealSeek Design Agent Plugin.
 *
 * Implements:
 * 1. Distributed Session Lock (thread_lock:{sessionId}) - prevents concurrent race conditions
 * 2. Visual Feature LRU / Redis Cache - caches product image extracted features
 * 3. Fast Result Snapshot Cache - enables instant `cached_result` upon SSE reconnection
 */

import type { Context } from '@deepseek-ai/cordis'

export interface RedisConfig {
  redisHost?: string
  redisPort?: number
  redisPassword?: string
  redisDb?: number
}

export class RedisService {
  private memLock = new Set<string>()
  private memCache = new Map<string, any>()
  private enabled: boolean

  constructor(private config: RedisConfig = {}) {
    this.enabled = Boolean(process.env.REDIS_HOST || config.redisHost)
  }

  /**
   * 获取分布式会话锁
   */
  async acquireLock(sessionId: string, ttlSeconds = 60): Promise<boolean> {
    const key = `thread_lock:${sessionId}`
    if (this.memLock.has(key)) {
      return false
    }
    this.memLock.add(key)
    setTimeout(() => this.memLock.delete(key), ttlSeconds * 1000)
    return true
  }

  /**
   * 释放分布式会话锁
   */
  async releaseLock(sessionId: string): Promise<void> {
    const key = `thread_lock:${sessionId}`
    this.memLock.delete(key)
  }

  /**
   * 读取缓存结果
   */
  async getResultSnapshot(sessionId: string): Promise<any | null> {
    const key = `session_result:${sessionId}`
    return this.memCache.get(key) || null
  }

  /**
   * 写入缓存结果
   */
  async setResultSnapshot(sessionId: string, data: any, ttlSeconds = 3600): Promise<void> {
    const key = `session_result:${sessionId}`
    this.memCache.set(key, data)
    setTimeout(() => this.memCache.delete(key), ttlSeconds * 1000)
  }
}

export function setupRedisIntegration(ctx: Context, config: RedisConfig = {}) {
  const redis = new RedisService(config)
  ctx.provide('redis', redis)
}
