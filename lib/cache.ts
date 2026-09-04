/**
 * Redis Cache Layer
 * 
 * Provides Redis-based caching for frequently accessed data.
 * Falls back to in-memory Map if Redis is not available.
 */

import Redis from 'ioredis'

// Global Redis client singleton to persist across Next.js re-evaluations
const globalForRedis = globalThis as unknown as {
  redisClient: Redis | null
  redisInitAttempted: boolean
}

const memoryCache = new Map<string, { data: any; expiry: number }>()

// Initialize Redis connection
export function getRedisClient(): Redis | null {
  if (globalForRedis.redisClient) {
    return globalForRedis.redisClient
  }

  try {
    const redisUrl = process.env.REDIS_URL
    const redisPassword = process.env.REDIS_PASSWORD

    if (!redisUrl || !redisPassword) {
      if (!globalForRedis.redisInitAttempted) {
        console.warn('[Redis] No credentials found in environment, using in-memory cache fallback')
        globalForRedis.redisInitAttempted = true
      }
      return null
    }

    const [host, portStr = ''] = redisUrl.split(':')
    const port = parseInt(portStr, 10) || 6379

    const client = new Redis({
      host,
      port,
      password: redisPassword,
      retryStrategy: (times) => Math.min(times * 100, 2000),
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      enableOfflineQueue: true,
    })

    client.on('connect', () => {
      console.log('✅ [Redis] Connected successfully')
    })

    client.on('error', (err) => {
      console.error('❌ [Redis] Connection error:', err.message)
    })

    client.on('ready', () => {
      console.log('🚀 [Redis] Ready to accept commands')
    })

    globalForRedis.redisClient = client
    globalForRedis.redisInitAttempted = true
    return client
  } catch (error) {
    console.error('[Redis] Initialization error:', error)
    return null
  }
}

// Cache configuration
const CACHE_TTL = {
  PRODUCTS: 5 * 60, // 5 minutes
  PRODUCT_DETAIL: 10 * 60, // 10 minutes
  CATEGORIES: 15 * 60, // 15 minutes
  SEARCH_RESULTS: 3 * 60, // 3 minutes
} as const

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient()

    if (client) {
      try {
        const cached = await Promise.race([
          client.get(key),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ])

        if (cached && typeof cached === 'string') {
          console.log(`✅ [Redis Cache] HIT: ${key}`)
          return JSON.parse(cached) as T
        }

        console.log(`❌ [Redis Cache] MISS: ${key}`)
        return null
      } catch (err) {
        console.warn(`⚠️ [Redis Cache] Get failed, falling back to memory:`, err instanceof Error ? err.message : err)
      }
    }

    // Fallback to in-memory cache
    const cached = memoryCache.get(key)
    if (cached) {
      if (Date.now() < cached.expiry) {
        console.log(`✅ [Memory Cache] HIT: ${key}`)
        return cached.data as T
      }
      memoryCache.delete(key)
      console.log(`⏰ [Memory Cache] EXPIRED: ${key}`)
    }

    console.log(`❌ [Memory Cache] MISS: ${key}`)
    return null
  } catch (error) {
    console.error('[Cache] Get error:', error)
    return null
  }
}

/**
 * Set data in cache
 */
export async function setCache(
  key: string,
  data: any,
  ttlSeconds: number = CACHE_TTL.PRODUCTS
): Promise<void> {
  try {
    const client = getRedisClient()
    const serialized = JSON.stringify(data)

    if (client) {
      try {
        await Promise.race([
          client.setex(key, ttlSeconds, serialized),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ])
        console.log(`💾 [Redis Cache] SET: ${key} (TTL: ${ttlSeconds}s)`)
        return
      } catch (err) {
        console.warn(`⚠️ [Redis Cache] Set failed, saving to memory:`, err instanceof Error ? err.message : err)
      }
    }

    // Fallback to in-memory cache
    const expiry = Date.now() + ttlSeconds * 1000
    memoryCache.set(key, { data, expiry })
    console.log(`💾 [Memory Cache] SET: ${key} (TTL: ${ttlSeconds}s)`)
  } catch (error) {
    console.error('[Cache] Set error:', error)
    try {
      const expiry = Date.now() + ttlSeconds * 1000
      memoryCache.set(key, { data, expiry })
    } catch {}
  }
}

/**
 * Delete data from cache
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const client = getRedisClient()

    if (client) {
      try {
        await client.del(key)
        console.log(`🗑️ [Redis Cache] DELETE: ${key}`)
      } catch (err) {
        console.warn(`⚠️ [Redis Cache] Delete failed:`, err instanceof Error ? err.message : err)
      }
    }

    memoryCache.delete(key)
    console.log(`🗑️ [Memory Cache] DELETE: ${key}`)
  } catch (error) {
    console.error('[Cache] Delete error:', error)
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient()

    if (client) {
      try {
        const keys: string[] = []
        let cursor = '0'

        do {
          const [newCursor, foundKeys] = await client.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
          )
          cursor = newCursor
          keys.push(...foundKeys)
        } while (cursor !== '0')

        if (keys.length > 0) {
          await client.del(...keys)
          console.log(`🗑️ [Redis Cache] DELETE PATTERN: ${pattern} (${keys.length} keys)`)
        }
      } catch (err) {
        console.warn(`⚠️ [Redis Cache] Delete pattern failed:`, err instanceof Error ? err.message : err)
      }
    }

    // Memory cache deletion
    const regex = new RegExp(pattern.replace('*', '.*'))
    const keysToDelete: string[] = []
    
    memoryCache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => memoryCache.delete(key))
    console.log(`🗑️ [Memory Cache] DELETE PATTERN: ${pattern} (${keysToDelete.length} keys)`)
  } catch (error) {
    console.error('[Cache] Delete pattern error:', error)
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  try {
    const client = getRedisClient()

    if (client) {
      try {
        await client.flushdb()
        console.log('🧹 [Redis Cache] CLEARED ALL')
      } catch (err) {
        console.warn(`⚠️ [Redis Cache] Flush failed:`, err instanceof Error ? err.message : err)
      }
    }

    memoryCache.clear()
    console.log('🧹 [Memory Cache] CLEARED ALL')
  } catch (error) {
    console.error('[Cache] Clear error:', error)
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats() {
  try {
    const client = getRedisClient()

    if (client) {
      try {
        const [info, dbSize, memory] = await Promise.all([
          client.info('stats').catch(() => ''),
          client.dbsize().catch(() => 0),
          client.info('memory').catch(() => ''),
        ])

        return {
          type: 'redis',
          size: dbSize,
          info,
          memory,
          connected: client.status === 'ready' || client.status === 'connect',
        }
      } catch (err) {
        console.warn(`⚠️ [Redis Cache] Stats failed:`, err instanceof Error ? err.message : err)
      }
    }

    return {
      type: 'memory',
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
      connected: false,
    }
  } catch (error) {
    console.error('[Cache] Stats error:', error)
    return {
      type: 'memory',
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient()
    
    if (!client) {
      console.log('❌ [Redis] Client not initialized')
      return false
    }

    const pong = await Promise.race([
      client.ping(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ])
    console.log('✅ [Redis] Connection test successful:', pong)
    return pong === 'PONG'
  } catch (error) {
    console.error('❌ [Redis] Connection test failed:', error)
    return false
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (globalForRedis.redisClient) {
    await globalForRedis.redisClient.quit()
    globalForRedis.redisClient = null
    console.log('👋 [Redis] Connection closed')
  }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  products: (params: Record<string, any>) => {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    return `v2:products:${query || 'all'}`
  },
  product: (id: string) => `v2:product:${id}`,
  categories: () => 'v2:categories:all',
  searchResults: (query: string, filters: string) => 
    `v2:search:${query}:${filters}`,
}

export { CACHE_TTL }
