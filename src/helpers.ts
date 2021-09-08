import { SUCCESS } from './constants'
import sgMail from '@sendgrid/mail'
import { client } from './client'

export async function sendMail(
    to: string,
    content: string,
    from = 'arkumawat78@gmail.com',
) {
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

export async function sendDM(userId: string, message: string, force = true) {
    const user = await client.users.fetch(userId, {
        force,
    })
    await user.send(message)
}

export function isJKLUEmail(email: string) {
    let idx = email.indexOf('@')
    return email.substr(idx, email.length) === '@jklu.edu.in'
}

export function dataIterator(container: string) {
    let idx = -1
    return next

    function next() {
        idx = idx + 1
        return container[idx]
    }
}

export function initializeMailAPI() {
    sgMail.setApiKey(process.env.SEND_GRID_API as string)
}

export function OTPGenerator(): string {
    return Math.random().toString().substr(2, 6)
}

export function generateEmail(OTP: string) {
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
