require('dotenv').config()
import express from 'express'
import { client } from './client'
import { __prod__ } from './constants'
import {
    generateEmail,
    initializeMailAPI,
    isJKLUEmail,
    OTPGenerator,
    sendDM,
    sendMail,
} from './helpers'

const app = express()

// ==================
//    Middlewares
// ==================
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/../public'))

// Starting APIs
initializeMailAPI()

// const ids = {
//     '847392118116188231': {
//         id: '847392118116188231',
//         name: 'Aditya',
//         otp: '454542',
//     },
// }

interface User {
    userId: string
    name: string
    OTP: string
}

let ids: Record<string, User> = {}

client.on('ready', function () {
    if (client.user) {
        console.log(`${client.user.username} is now active`)
    } else {
        console.log('Client is not ready at the moment')
    }
})

client.on('guildMemberAdd', (member) => {
    console.log(
        `New user "${member.user.username}" has joined "${member.guild.name}"`,
    )
    let userId = member.user.id
    ids[userId] = { userId, OTP: 'xxxxxx', name: '<empty>' }
    let url = __prod__
        ? `https://radiant-ocean-74401.herokuapp.com/verify/${userId}`
        : `http://localhost:4000/verify/${userId}`
    ;(async () => {
        await sendDM(userId, `Please verify your account at ${url}`)
    })()
})

app.get('/', (_, res) => {
    res.render('pages/notfound', {})
})

app.get('/:anything', (_, res) => {
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
    let name = req.body.name
    let OTP = OTPGenerator()
    if (userId in ids) {
        ids[userId].OTP = OTP
        ids[userId].name = name
    } else {
        res.render('pages/notfound')
        return
    }
    let email = req.body.email
    if (userId in ids && isJKLUEmail(email) && name !== '') {
        ;(async () => {
            let sent = await sendMail(email, generateEmail(OTP))
            if (!sent) return
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
        async function assignRole(serverName: string, roleName: string) {
            let guild = client.guilds.cache.find(
                (guild) => guild.name === serverName,
            )
            if (!guild) return
            try {
                let role = guild.roles.cache.find((r) => r.name === roleName)
                if (!role) return
                let user = await guild.members.fetch(userId)
                await user.roles.add(role)
                await user.setNickname(ids[userId].name)
                await sendDM(userId, 'You have been assigned Student role')
            } catch (error) {
                await sendDM(userId, 'Oops! An error occured')
            }
        }
        assignRole('uckers server', 'Student').then(() => {
            delete ids[userId]
        })
        res.render('pages/success')
    } else {
        res.render('pages/notfound')
    }
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    client.login(process.env.DISCORDJS_BOT_TOKEN).then(() => {
        console.log('Client logged in')
    })
    console.log('server is running')
})
