const { SUCCESS } = require('./constants')
const sgMail = require('@sendgrid/mail')
const { client } = require('./client')

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

function initializeMailAPI() {
    sgMail.setApiKey(process.env.SEND_GRID_API)
}

function OTPGenerator() {
    return Math.random().toString().substr(2, 6)
}

function generateEmail(OTP) {
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            img {
                width: 100px;
                margin: 10px;
            }

            .images {
                display: flex;
                align-items: center;
            }

            .seperator {
                height: 100px;
                border-right: 1px solid rgb(208, 208, 208);
                margin: 0 15px;
            }
        </style>
    </head>
    <body>
        <div>
            <h1>Join JKLU's Discord server</h1>
            <p>Here we will put some details about our server</p>
            <div class="images">
                <img src="https://i.ibb.co/qB2g4k0/discord.png" alt="" />
                <span class="seperator"></span>
                <img src="https://i.ibb.co/XsT6m9M/jklu.png" alt="" />
            </div>

            <h2>Please use the OTP below to verify your account</h2>
            <h3>OTP: ${OTP}</h3>
            <br />
            <p>Thanks, for joining our server</p>
        </div>
    </body>
</html>
    `
}

module.exports = {
    dataIterator,
    isJKLUEmail,
    sendDM,
    sendMail,
    initializeMailAPI,
    OTPGenerator,
    generateEmail,
}
