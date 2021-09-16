import Redis, { RedisOptions } from 'ioredis'
import { __prod__ } from './constants'

// add production configs later
const config: RedisOptions = {
    host: 'localhost',
    port: 6379,
}

export const redis = new Redis(config)
