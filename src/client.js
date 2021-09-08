const { Client } = require('discord.js')
const { intents } = require('./constants')

let client = new Client({ intents })

module.exports = { client }
