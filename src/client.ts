const { Client } = require('discord.js')
const { intents } = require('./constants')

export let client = new Client({ intents })
