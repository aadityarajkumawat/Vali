"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const client_1 = require("./client");
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
const redisClient_1 = require("./redisClient");
const app = (0, express_1.default)();
app.set('view engine', 'ejs');
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(__dirname + '/../public'));
let indexPageParams = {
    path: '',
    warning: '',
};
client_1.client.on('ready', function () {
    if (client_1.client.user) {
        console.log(`${client_1.client.user.username} is now active`);
    }
    else {
        console.log('Client is not ready at the moment');
    }
});
client_1.client.on('guildMemberAdd', (member) => {
    ;
    (async () => {
        let userId = member.user.id;
        userId = (0, helpers_1.encodeUserId)(userId);
        let user = (0, helpers_1.initializeUser)(userId);
        let isSet = await redisClient_1.redis.set(userId, JSON.stringify(user));
        if (!isSet) {
            await (0, helpers_1.sendDM)(userId, 'An error occured while generating verfication link');
            return;
        }
        let url = constants_1.__prod__
            ? `https://radiant-ocean-74401.herokuapp.com/verify/${userId}`
            : `http://localhost:4000/verify/${userId}`;
        await (0, helpers_1.sendDM)(userId, `Please verify your account at ${url}`);
    })();
});
app.get('/', (_, res) => {
    res.render('pages/notfound', {});
});
app.get('/:anything', (_, res) => {
    res.render('pages/notfound', {});
});
app.get('/verify/:userId/:error?', (req, res) => {
    ;
    (async () => {
        let { userId, error } = req.params;
        let redirectTo = `/auth/${userId}`;
        let { found: userExists } = await (0, helpers_1.findUser)(userId);
        if (userExists && !error) {
            res.render('pages/index', Object.assign(Object.assign({}, indexPageParams), { path: redirectTo }));
        }
        else if (error === 'true') {
            res.render('pages/index', {
                path: redirectTo,
                warning: 'Enter JKLU E-Mail address only',
            });
        }
        else {
            res.render('pages/notfound');
        }
    })();
});
app.post('/auth/:userId', (req, res) => {
    ;
    (async () => {
        let { email, name } = req.body;
        let userId = req.params.userId;
        let redirectTo = `/auth/${userId}`;
        let userAlreadyExists = false;
        let userKeys = await redisClient_1.redis.keys('disuser:*');
        for (let id of userKeys) {
            let userJSON = await redisClient_1.redis.get(id);
            if (!userJSON)
                break;
            let user = JSON.parse(userJSON);
            if (user.email === email)
                userAlreadyExists = true;
        }
        if (userAlreadyExists) {
            res.render('pages/index', {
                path: redirectTo,
                warning: 'User with this E-Mail already exists',
            });
        }
        let OTP = (0, helpers_1.OTPGenerator)();
        let { found: blankUserExists } = await (0, helpers_1.findUser)(userId);
        if (blankUserExists && (0, helpers_1.isJKLUEmail)(email) && name !== '') {
            let userJSON = await redisClient_1.redis.get(userId);
            if (!userJSON) {
                res.render('pages/notfound');
                return;
            }
            let user = JSON.parse(userJSON);
            let newUserJSON = Object.assign(Object.assign({}, user), { OTP, email, name });
            let setUserStatus = await redisClient_1.redis.set(user.userId, JSON.stringify(newUserJSON));
            if (!setUserStatus) {
                res.render('pages/notfound');
                return;
            }
            let sent = await (0, helpers_1.sendMail)(email, (0, helpers_1.generateEmail)(OTP));
            if (!sent)
                return;
            res.redirect(`/complete/${userId}`);
        }
        else {
            res.render('pages/notfound');
        }
    })();
});
app.get('/complete/:id', (req, res) => {
    ;
    (async () => {
        let userId = req.params.id;
        let { found: userExists } = await (0, helpers_1.findUser)(userId);
        if (userExists) {
            res.render('pages/otp', { path: `/give-role/${userId}` });
        }
        else {
            res.render('pages/notfound');
        }
    })();
});
app.post('/give-role/:id', (req, res) => {
    ;
    (async () => {
        let userId = req.params.id;
        let { found: userExists, user } = await (0, helpers_1.findUser)(userId);
        let inputOTP = (0, helpers_1.buildOTPString)(req.body);
        if (userExists && inputOTP === user.OTP) {
            await (0, helpers_1.assignRole)(user, 'uckers server', 'Student');
            res.render('pages/success');
        }
        else {
            res.render('pages/notfound');
        }
    })();
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    client_1.client.login(process.env.DISCORDJS_BOT_TOKEN).then(() => {
        console.log('Client logged in');
    });
    console.log('server is running');
});
//# sourceMappingURL=bot.js.map