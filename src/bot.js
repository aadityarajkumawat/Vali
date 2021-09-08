require('dotenv').config()
const fs = require('fs')
const express = require('express')
const sgMail = require('@sendgrid/mail')

const app = express()
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/../public'))

sgMail.setApiKey(process.env.SEND_GRID_API)

const { Client, Intents } = require('discord.js')

/**
 * { 8475698436534454: {id: 8475698436534454, otp: '235422'} }
 */
const ids = {}

const SUCCESS = 202

/**
 * @param {string} to E-Mail address to which mail should be sent
 * @param {string} content HTML string of content
 * @param {string} from Sender's E-Mail address
 * @returns sent
 */
async function sendMail(to, content, from = 'arkumawat78@gmail.com') {
    let sent = false
    const msg = {
        to,
        from,
        subject: 'Verification for JKLU discord server',
        text: 'Join the best discord server ever',
        html: content,
    }

    try {
        const mail = await sgMail.send(msg, false)
        sent = mail[0].statusCode === SUCCESS
    } catch {
        sent = false
    }

    return sent
}

async function sendDM(userId, message, force = true) {
    const user = await client.users.fetch(userId, {
        force,
    })
    await user.send(message)
}

/**
 * A function which checks if the input email,
 * is a JKLU Email addess or not
 * @param {string} email
 */
function isJKLUEmail(email) {
    let idx = email.indexOf('@')
    return email.substr(idx, email.length) === '@jklu.edu.in'
}

/**
 * @param {Array<any>} container
 */
function dataIterator(container) {
    let idx = -1
    return next

    function next() {
        idx = idx + 1
        return container[idx]
    }
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
        `New user "${member.user.username}" has joined "${member.guild.name}"`,
    )
    let userId = member.user.id
    ids[userId] = { userId, OTP: '' }
    let url = `http://localhost:4000/verify/${userId}`
    sendDM(userId, `Please verify your account at ${url}`)
})

client.on('guildMemberRemove', (member) => {
    console.log(
        `New user "${member.user.username}" has left "${member.guild.name}"`,
    )
})

client.on('guildMemberUpdate', (member) => {
    console.log(`New user "${member.user.username}" has been modified"`)
})

app.get('/', (_, res) => {
    res.render('pages/notfound', {})
})

app.get('/verify/:id/:error?', (req, res) => {
    let userId = req.params.id
    let error = req.params.error
    if (userId in ids) {
        res.render('pages/index', { path: `/auth/${userId}`, warning: '' })
    } else if (error === 'true') {
        res.render('pages/index', {
            path: `/auth/${userId}`,
            warning: 'Enter JKLU E-Mail address only',
        })
    } else {
        res.render('pages/notfound')
    }
})

app.post('/auth/:id', (req, res) => {
    let userId = req.params.id
    let OTP = Math.random().toString().substr(2, 6)
    if (userId in ids) {
        ids[userId].OTP = OTP
    }
    let email = req.body.email
    if (userId in ids && isJKLUEmail(email)) {
        ;(async () => {
            await sendMail(
                email,
                `
                <h1>${OTP}</h1>
                `,
            )
        })()
        res.redirect(`/complete/${userId}`)
    } else {
        res.render('pages/index', {
            path: `/auth/${userId}`,
            warning: 'Enter JKLU E-Mail address only',
        })
    }
})

app.get('/complete/:id', (req, res) => {
    let userId = req.params.id
    if (userId in ids) {
        res.render('pages/otp', { path: `/give-role/${userId}` })
    } else {
        res.render('pages/notfound')
    }
})

app.post('/give-role/:id', (req, res) => {
    let userId = req.params.id
    let inputOTP = ''
    for (let key of Object.keys(req.body)) {
        inputOTP = inputOTP.concat(req.body[key])
    }
    if (userId in ids && inputOTP === ids[userId].OTP) {
        async function assignRole(serverName, role) {
            let guild = client.guilds.cache.find(
                (guild) => guild.name === serverName,
            )
            try {
                let valiPowers = guild.roles.cache.find((r) => r.name === role)
                let user = await guild.members.fetch(userId)
                await user.roles.add(valiPowers)
                sendDM(userId, 'You have been assigned Student role')
            } catch {
                sendDM(userId, 'Oops! An error occured')
            }
        }
        assignRole('uckers server', 'Student')
        delete ids[userId]
        res.render('pages/success')
    } else {
        res.render('pages/notfound')
    }
})

app.listen(4000, () => {
    client.login(process.env.DISCORDJS_BOT_TOKEN)
    console.log('server is running')
})
