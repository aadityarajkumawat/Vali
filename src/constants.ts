// const { Intents } = require('discord.js')
import { Intents } from 'discord.js'

export const SUCCESS = 202
export const intents = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    'GUILD_PRESENCES',
    'GUILD_MEMBERS',
    'GUILDS',
    'GUILD_INTEGRATIONS',
]
export const __prod__ = process.env.NODE_ENV === 'production'
