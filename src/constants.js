const { Intents } = require('discord.js')

const SUCCESS = 202
const intents = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    'GUILD_PRESENCES',
    'GUILD_MEMBERS',
    'GUILDS',
    'GUILD_INTEGRATIONS',
]

module.exports = { SUCCESS, intents }