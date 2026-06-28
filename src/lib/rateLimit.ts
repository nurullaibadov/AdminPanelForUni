interface RateLimitRecord {
  timestamps: number[]
}

const cache = new Map<string, RateLimitRecord>()

// Clean up stale records every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    cache.forEach((record, key) => {
      record.timestamps = record.timestamps.filter(t => now - t < 60000)
      if (record.timestamps.length === 0) {
        cache.delete(key)
      }
    })
  }, 300000)
}

export function rateLimit(
  ip: string,
  limit = 60,
  windowMs = 60000
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now()
  const key = ip
  let record = cache.get(key)
  
  if (!record) {
    record = { timestamps: [] }
    cache.set(key, record)
  }
  
  // Filter out timestamps outside the window
  record.timestamps = record.timestamps.filter(t => now - t < windowMs)
  
  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0] || now
    return {
      success: false,
      limit,
      remaining: 0,
      reset: oldest + windowMs
    }
  }
  
  record.timestamps.push(now)
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: now + windowMs
  }
}
