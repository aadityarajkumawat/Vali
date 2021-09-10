import Redis, { RedisOptions } from 'ioredis'

// add production configs later
const config: RedisOptions = {}

export const redis = new Redis(config)
