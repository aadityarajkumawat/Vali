"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmail = exports.assignRole = exports.buildOTPString = exports.findUser = exports.decodeUserId = exports.encodeUserId = exports.initializeUser = exports.OTPGenerator = exports.dataIterator = exports.callAll = exports.asyncCallAll = exports.isJKLUEmail = exports.sendDM = exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("./client");
const redisClient_1 = require("./redisClient");
let transporter = nodemailer_1.default.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SENDERS_EMAIL,
        pass: process.env.SENDERS_EMAIL_PASSWORD,
    },
});
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
        const mail = await transporter.sendMail(msg);
        if (mail.accepted.includes(to)) {
            sent = true;
        }
    }
    catch (_a) {
        sent = false;
    }
    return sent;
}
exports.sendMail = sendMail;
async function sendDM(userId, message, force = true) {
    if (userId.includes('disuser:')) {
        userId = decodeUserId(userId);
    }
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
async function asyncCallAll(...fns) {
    for (let fn of fns) {
        await fn();
    }
}
exports.asyncCallAll = asyncCallAll;
function callAll(...fns) {
    fns.forEach((fn) => fn());
}
exports.callAll = callAll;
function dataIterator(container) {
    let idx = -1;
    return next;
    function next() {
        idx = idx + 1;
        return container[idx];
    }
}
exports.dataIterator = dataIterator;
function OTPGenerator() {
    return Math.random().toString().substr(2, 6);
}
exports.OTPGenerator = OTPGenerator;
function initializeUser(userId) {
    let user = {
        userId,
        name: '<empty>',
        OTP: 'xxxxxx',
        email: '<empty>@blank.com',
    };
    return user;
}
exports.initializeUser = initializeUser;
function encodeUserId(userId) {
    return `disuser:${userId}`;
}
exports.encodeUserId = encodeUserId;
function decodeUserId(userId) {
    return userId.substr(8, userId.length);
}
exports.decodeUserId = decodeUserId;
async function findUser(userId) {
    let userJSON = await redisClient_1.redis.get(userId);
    if (!userJSON)
        return { error: 'User not found', found: false, user: null };
    let user = JSON.parse(userJSON);
    return { error: null, found: true, user };
}
exports.findUser = findUser;
function buildOTPString(body) {
    let inputOTP = '';
    for (let key of Object.keys(body)) {
        inputOTP = inputOTP.concat(body[key]);
    }
    return inputOTP;
}
exports.buildOTPString = buildOTPString;
async function assignRole(user, serverName, roleName) {
    let guild = client_1.client.guilds.cache.find((guild) => guild.name === serverName);
    if (!guild)
        return;
    let userId = decodeUserId(user.userId);
    try {
        let role = guild.roles.cache.find((r) => r.name === roleName);
        if (!role)
            return;
        let member = await guild.members.fetch(userId);
        await asyncCallAll(addRole, setNickame, sendDMAsync);
        async function addRole() {
            await member.roles.add(role);
        }
        async function setNickame() {
            await member.setNickname(user.name);
        }
        async function sendDMAsync() {
            await sendDM(userId, `You have been assigned ${roleName} role`);
        }
    }
    catch (error) {
        await sendDM(userId, 'Oops! An error occured');
    }
}
exports.assignRole = assignRole;
function generateEmail(OTP) {
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>JKLU's Discord Server</title>
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