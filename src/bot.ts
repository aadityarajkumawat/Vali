require('dotenv').config()
import express from 'express'
import { client } from './client'
import { __prod__ } from './constants'
import {
    assignRole,
    buildOTPString,
    doesUserAlreadyExists,
    encodeUserId,
    findUser,
    generateEmail,
    initializeUser,
    isJKLUEmail,
    OTPGenerator,
    sendDM,
    sendMail,
} from './helpers'
import { redis } from './redisClient'
import { User } from './types'

const app = express()

// ==================
//    Middlewares
// ==================
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/../public'))

let indexPageParams = {
    path: '',
    warning: '',
}

client.on('ready', function () {
    if (client.user) {
        console.log(`${client.user.username} is now active`)
    } else {
        console.log('Client is not ready at the moment')
    }
})

// runs the function as soon as a new member
// enters the server.
client.on('guildMemberAdd', function (member) {
    ;(async function () {
        let userId = member.user.id
        userId = encodeUserId(userId)

        // creating a new user in database
        let user = initializeUser(userId)
        let isSet = await redis.set(userId, JSON.stringify(user))
        if (!isSet) {
            await sendDM(
                userId,
                'An error occured while generating verfication link',
            )
            return
        }

        // send the verfication link through a DM from bot
        let url = __prod__
            ? `https://radiant-ocean-74401.herokuapp.com/verify/${userId}`
            : `http://localhost:4000/verify/${userId}`
        await sendDM(userId, `Please verify your account at ${url}`)
    })()
})

app.get('/', function (_, res) {
    res.render('pages/notfound', {})
})

app.get('/:anything', function (_, res) {
    res.render('pages/notfound', {})
})

// the first page that open up, asking for email and name
// of user.
app.get('/verify/:userId/:error?', function (req, res) {
    ;(async function () {
        let { userId, error } = req.params
        let redirectTo = `/auth/${userId}`

        let { found: userExists } = await findUser(userId)

        if (userExists && !error) {
            res.render('pages/index', {
                ...indexPageParams,
                path: redirectTo,
            })
        } else if (error === 'true') {
            res.render('pages/index', {
                path: redirectTo,
                warning: 'Enter JKLU E-Mail address only',
            })
        } else {
            res.render('pages/notfound')
        }
    })()
})

// processing entered email and name, and validating user info
app.post('/auth/:userId', function (req, res) {
    ;(async function () {
        let { email, name } = req.body
        let userId = req.params.userId
        let redirectTo = `/auth/${userId}`

        // check if the user with the entred email already exists
        let userAlreadyExists = await doesUserAlreadyExists(email)
        if (userAlreadyExists) {
            res.render('pages/index', {
                path: redirectTo,
                warning: 'User with this E-Mail already exists',
            })
        }

        //If the user is being added for the first time
        let OTP = OTPGenerator()
        let { found: blankUserExists } = await findUser(userId)

        if (blankUserExists && isJKLUEmail(email) && name !== '') {
            // get the blank user object
            let userJSON = await redis.get(userId)
            if (!userJSON) {
                res.render('pages/notfound')
                return
            }
            let user = JSON.parse(userJSON) as User

            // add data to it
            let newUserJSON: User = { ...user, OTP, email, name }
            let setUserStatus = await redis.set(
                user.userId,
                JSON.stringify(newUserJSON),
            )
            if (!setUserStatus) {
                res.render('pages/notfound')
                return
            }

            // send an email with the OTP
            let sent = await sendMail(email, generateEmail(OTP))
            if (!sent) return
            res.redirect(`/complete/${userId}`)
        } else {
            res.render('pages/notfound')
        }
    })()
})

app.get('/complete/:id', function (req, res) {
    ;(async function () {
        let userId = req.params.id

        let { found: userExists } = await findUser(userId)

        if (userExists) {
            res.render('pages/otp', { path: `/give-role/${userId}` })
        } else {
            res.render('pages/notfound')
        }
    })()
})

app.post('/give-role/:id', function (req, res) {
    ;(async function () {
        let userId = req.params.id

        let { found: userExists, user } = await findUser(userId)

        let inputOTP = buildOTPString(req.body)

        // if the user is found and OTP matches, then we assign him/ her
        // their respective role, set their nickname and send them DM,
        // about the updated changes.
        if (userExists && inputOTP === (user as User).OTP) {
            await assignRole(user as User, 'uckers server', 'Student')
            res.render('pages/success')
        } else {
            res.render('pages/notfound')
        }
    })()
})

const PORT = process.env.PORT || 4000

app.listen(PORT, function () {
    ;(async function () {
        client.login(process.env.DISCORDJS_BOT_TOKEN)
        console.log('server is running')
    })()
})
