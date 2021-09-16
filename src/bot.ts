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
import pino from 'pino'

const app = express()
const logger = pino({ prettifier: true, prettyPrint: { colorize: true } })

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
        logger.info(`${client.user.username} is now active`)
    } else {
        logger.error('Client is not ready at the moment')
    }
})

// runs the function as soon as a new member
// enters the server.
client.on('guildMemberAdd', function (member) {
    ;(async function () {
        try {
            let userId = member.user.id
            userId = encodeUserId(userId)

            // creating a new user in database
            let user = initializeUser(userId)
            let isSet = await redis.set(userId, JSON.stringify(user))
            logger.info('Initialized a new user')
            if (!isSet) {
                await sendDM(
                    userId,
                    'An error occured while generating verfication link',
                )
                logger.error('Not able to set initial user value in redis')
                return
            }

            // send the verfication link through a DM from bot
            let url = __prod__
                ? `https://radiant-ocean-74401.herokuapp.com/verify/${userId}`
                : `http://localhost:4000/verify/${userId}`
            await sendDM(userId, `Please verify your account at ${url}`)
            logger.info('sent DM to user')
        } catch (error) {
            logger.error(error.message)
        }
    })()
})

client.on('guildMemberRemove', (member) => {
    ;(async () => {
        let userLeft = member.user
        let userId = null

        if (userLeft) {
            userId = userLeft.id
            await redis.del(encodeUserId(userId))
            logger.info(`Removed ${userLeft.username} from server`)
            return
        }

        logger.error('Not able to get user from discord')
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

        let { found: userExists, user } = await findUser(userId)

        // in case the user is already verified, take him to success page
        if ((user as User).verified) {
            res.render('pages/success')
            logger.info('User is already verified')
            return
        }

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
        try {
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
                return
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
        } catch (error) {
            logger.error(error.message)
        }
    })()
})

app.get('/complete/:id', function (req, res) {
    ;(async function () {
        try {
            let userId = req.params.id

            let { found: userExists, user } = await findUser(userId)

            if ((user as User).verified) {
                res.render('pages/success')
                return
            }

            if (userExists) {
                res.render('pages/otp', { path: `/give-role/${userId}` })
            } else {
                res.render('pages/notfound')
            }
        } catch (error) {
            logger.error(error.message)
        }
    })()
})

app.post('/give-role/:id', function (req, res) {
    ;(async function () {
        try {
            let userId = req.params.id

            let { found: userExists, user } = await findUser(userId)

            if ((user as User).verified) {
                res.render('pages/success')
                return
            }

            let inputOTP = buildOTPString(req.body)

            // if the user is found and OTP matches, then we assign him/ her
            // their respective role, set their nickname and send them DM,
            // about the updated changes.
            if (userExists && inputOTP === (user as User).OTP) {
                await assignRole(user as User, 'Holy Grail', 'Student')

                // once the user is assigned his/ her role, save his status
                user = { ...user, verified: true } as User
                await redis.set(userId, JSON.stringify(user))
                res.render('pages/success')
            } else {
                res.render('pages/notfound')
            }
        } catch (error) {
            logger.error(error.message)
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
