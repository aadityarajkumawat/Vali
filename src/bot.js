require('dotenv').config()
const fs = require('fs')
const express = require('express')
const sgMail = require('@sendgrid/mail')

const app = express()

sgMail.setApiKey(process.env.SEND_GRID_API)

const { Client, Intents } = require('discord.js')

const ids = {}

async function sendMail(to, content) {
    let sent = false
    const msg = {
        to,
        from: 'arkumawat78@gmail.com',
        subject: 'Verification for JKLU discord server',
        text: 'Join the best discord server ever',
        html: content,
    }

    try {
        const mail = await sgMail.send(msg, false)
        sent = mail[0].statusCode === 202
    } catch (error) {
        console.log(error.message)
    }

    return sent
}

async function sendDM(userId, message, force = true) {
    const user = await client.users.fetch(userId, {
        force,
    })
    await user.send(message)
}

let client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        'GUILD_PRESENCES',
        'GUILD_MEMBERS',
        'GUILDS',
        'GUILD_INTEGRATIONS',
    ],
})

client.on('ready', function () {
    console.log(`${client.user.username} is now active`)
})

client.on('guildMemberAdd', (member) => {
    console.log(
        `New User "${member.user.username}" has joined "${member.guild.name}"`,
    )
    console.log(member.user.email)
})

client.on('guildMemberRemove', (member) => {
    console.log(
        `New User "${member.user.username}" has left "${member.guild.name}"`,
    )
})

client.on('guildMemberUpdate', (member) => {
    console.log(
        `New User "${member.user.username}" has again "${member.guild.name}"`,
    )
})

client.on('messageCreate', function (message) {
    console.log(`[${message.author.tag}]: ${message.content}`)
    let msg = message.content

    if (message.content === 'delete') {
        ;(async () => {
            let fetched = await message.channel.awaitMessages({ max: 5 })
            console.log('fetched', fetched)
        })()
    } else if (msg === 'mailme') {
        const msg = {
            to: 'aaditya01work@gmail.com',
            from: 'arkumawat78@gmail.com',
            subject: 'Verification for JKLU discord server',
            text: 'and easy to do anywhere, even with Node.js',
            html: fs.readFileSync('./src/mail.html', { encoding: 'utf-8' }),
        }

        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error, error.message)
            })
    } else if (msg.includes('<spem:')) {
        let idx = message.content.indexOf('<')
        let num = message.content.substr(idx + 6, message.content.length - 1)
        num = parseInt(num)
        let dataStream = []
        for (let i = 0; i < num; i++) {
            dataStream.push(message.reply(message.content.substr(0, idx)))
        }
        ;async () => {
            await Promise.all(dataStream)
        }
    } else if (message.content.toLowerCase() === 'hi') {
        message.reply('Hi, how are you?')
        console.log(message.author.id)
    } else if (message.content === 'iamcharsi') {
        message.reply('Once a charsi, always charsi')
    } else if (msg === 'message_me') {
        sendDM(message.author.id, 'Hope, you are having a good day!')
    }
    // !!add adityakumawat@jkluedu.in
    // 884443569056800870
    let args = msg.split(' ')
    if (args[0] === 'addme') {
        async function runner() {
            try {
                let valiPowers = message.guild.roles.cache.find(
                    (r) => r.name === 'Auth',
                )
                let member = message.mentions.members.first()
                let role = message.mentions.roles.first()

                let res = await message.member.roles.add(valiPowers)
                console.log(res)
            } catch (error) {
                console.log(error.message)
            }
        }

        runner()
    }
    if (args[0] === '!!add') {
        async function runner() {
            let email = args[1]
            let idx = email.indexOf('@')
            let isJKLUEmail = email.substr(idx, email.length) === '@jklu.edu.in'
            isJKLUEmail = true
            let sent = false

            if (isJKLUEmail) {
                sent = sendMail(
                    email,
                    fs.readFileSync('./src/mail.html', { encoding: 'utf-8' }),
                )

                if (sent) {
                    await message.reply(
                        'Verification Email has been sent please check your inbox and verify your account',
                    )
                    let userId = message.author.id
                    await sendDM(
                        userId,
                        'Please check your JKLU E-Mail inbox and junk for a verification an email',
                    )
                }
            } else {
                await message.reply('Please enter your JKLU Email only')
            }
        }
        runner().catch((e) => console.log(e.message))
    }
})

client.on('interactionCreate', function (interaction) {
    console.log(interaction)
})

app.get('/', (req, res) => {
    res.send('hello')
})

app.get('/auth/:id', (req, res) => {
    let id = req.params.id
    ids[id] = id
    async function runner() {
        let guild = client.guilds.cache.find(
            (guild) => guild.name === 'uckers server',
        )
        let userId = '803954223641264148'
        try {
            let valiPowers = guild.roles.cache.find((r) => r.name === 'Auth')
            let user = await guild.members.fetch(userId)
            await user.roles.add(valiPowers)
            sendDM(userId, 'You have been assigned Auth role')
        } catch (error) {
            console.log(error.message)
        }
    }

    runner()

    res.send(`<h1>${id}</h1>`)
})

app.listen(4000, () => {
    client.login(process.env.DISCORDJS_BOT_TOKEN)
    console.log('server is running')
})
