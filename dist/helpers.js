"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmail = exports.initializeUser = exports.OTPGenerator = exports.initializeMailAPI = exports.dataIterator = exports.isJKLUEmail = exports.sendDM = exports.sendMail = void 0;
const constants_1 = require("./constants");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const client_1 = require("./client");
async function sendMail(to, content, from = process.env.SENDERS_EMAIL) {
    let sent = false;
    const msg = {
        to,
        from,
        subject: 'Verification for JKLU discord server',
        text: 'Join the best discord server ever',
        html: content,
    };
    try {
        const mail = await mail_1.default.send(msg, false);
        sent = mail[0].statusCode === constants_1.SUCCESS;
    }
    catch (_a) {
        sent = false;
    }
    return sent;
}
exports.sendMail = sendMail;
async function sendDM(userId, message, force = true) {
    const user = await client_1.client.users.fetch(userId, {
        force,
    });
    await user.send(message);
}
exports.sendDM = sendDM;
function isJKLUEmail(email) {
    let idx = email.indexOf('@');
    return email.substr(idx, email.length) === '@jklu.edu.in';
}
exports.isJKLUEmail = isJKLUEmail;
function dataIterator(container) {
    let idx = -1;
    return next;
    function next() {
        idx = idx + 1;
        return container[idx];
    }
}
exports.dataIterator = dataIterator;
function initializeMailAPI() {
    mail_1.default.setApiKey(process.env.SEND_GRID_API);
}
exports.initializeMailAPI = initializeMailAPI;
function OTPGenerator() {
    return Math.random().toString().substr(2, 6);
}
exports.OTPGenerator = OTPGenerator;
function initializeUser(userId) {
    let user = {
        userId,
        name: '<empty>',
        OTP: 'xxxxxx',
    };
    return user;
}
exports.initializeUser = initializeUser;
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
    `;
}
exports.generateEmail = generateEmail;
//# sourceMappingURL=helpers.js.map