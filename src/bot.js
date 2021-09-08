require('dotenv').config()
const express = require('express')
const {
    isJKLUEmail,
    sendDM,
    sendMail,
    initializeMailAPI,
    OTPGenerator,
    generateEmail,
} = require('./helpers')
const { client } = require('./client')

const app = express()

// ==================
//    Middlewares
// ==================
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/../public'))

// Starting APIs
initializeMailAPI()

/**
 * { '8475698436534454': {id: 8475698436534454, otp: '235422'} }
 */
const ids = {}

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
    ;(async () => {
        await sendDM(userId, `Please verify your account at ${url}`)
    })()
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
    let OTP = OTPGenerator()
    if (userId in ids) {
        ids[userId].OTP = OTP
    } else {
        res.render('pages/notfound')
        return
    }
    let email = req.body.email
    if (userId in ids && isJKLUEmail(email)) {
        ;(async () => {
            let _ = await sendMail(email, generateEmail(OTP))
            res.redirect(`/complete/${userId}`)
        })()
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
                await sendDM(userId, 'You have been assigned Student role')
            } catch {
                await sendDM(userId, 'Oops! An error occured')
            }
        }
        assignRole('uckers server', 'Student')
        delete ids[userId]
        res.render('pages/success')
    } else {
        res.render('pages/notfound')
    }
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    ;(async () => {
        client.login(process.env.DISCORDJS_BOT_TOKEN)
    })()
    console.log('server is running')
})
