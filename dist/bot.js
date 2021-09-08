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
const app = (0, express_1.default)();
app.set('view engine', 'ejs');
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(__dirname + '/../public'));
(0, helpers_1.initializeMailAPI)();
let ids = {};
client_1.client.on('ready', function () {
    if (client_1.client.user) {
        console.log(`${client_1.client.user.username} is now active`);
    }
    else {
        console.log('Client is not ready at the moment');
    }
});
client_1.client.on('guildMemberAdd', (member) => {
    console.log(`New user "${member.user.username}" has joined "${member.guild.name}"`);
    let userId = member.user.id;
    ids[userId] = { userId, OTP: 'xxxxxx', name: '<empty>' };
    let url = constants_1.__prod__
        ? `https://radiant-ocean-74401.herokuapp.com/verify/${userId}`
        : `http://localhost:4000/verify/${userId}`;
    (async () => {
        await (0, helpers_1.sendDM)(userId, `Please verify your account at ${url}`);
    })();
});
app.get('/', (_, res) => {
    res.render('pages/notfound', {});
});
app.get('/:anything', (_, res) => {
    res.render('pages/notfound', {});
});
app.get('/verify/:id/:error?', (req, res) => {
    let userId = req.params.id;
    let error = req.params.error;
    if (userId in ids) {
        res.render('pages/index', { path: `/auth/${userId}`, warning: '' });
    }
    else if (error === 'true') {
        res.render('pages/index', {
            path: `/auth/${userId}`,
            warning: 'Enter JKLU E-Mail address only',
        });
    }
    else {
        res.render('pages/notfound');
    }
});
app.post('/auth/:id', (req, res) => {
    let userId = req.params.id;
    let name = req.body.name;
    let OTP = (0, helpers_1.OTPGenerator)();
    if (userId in ids) {
        ids[userId].OTP = OTP;
        ids[userId].name = name;
    }
    else {
        res.render('pages/notfound');
        return;
    }
    let email = req.body.email;
    if (userId in ids && (0, helpers_1.isJKLUEmail)(email) && name !== '') {
        ;
        (async () => {
            let sent = await (0, helpers_1.sendMail)(email, (0, helpers_1.generateEmail)(OTP));
            if (!sent)
                return;
            res.redirect(`/complete/${userId}`);
        })();
    }
    else {
        res.render('pages/index', {
            path: `/auth/${userId}`,
            warning: 'Enter JKLU E-Mail address only',
        });
    }
});
app.get('/complete/:id', (req, res) => {
    let userId = req.params.id;
    if (userId in ids) {
        res.render('pages/otp', { path: `/give-role/${userId}` });
    }
    else {
        res.render('pages/notfound');
    }
});
app.post('/give-role/:id', (req, res) => {
    let userId = req.params.id;
    let inputOTP = '';
    for (let key of Object.keys(req.body)) {
        inputOTP = inputOTP.concat(req.body[key]);
    }
    if (userId in ids && inputOTP === ids[userId].OTP) {
        async function assignRole(serverName, roleName) {
            let guild = client_1.client.guilds.cache.find((guild) => guild.name === serverName);
            if (!guild)
                return;
            try {
                let role = guild.roles.cache.find((r) => r.name === roleName);
                if (!role)
                    return;
                let user = await guild.members.fetch(userId);
                await user.roles.add(role);
                await user.setNickname(ids[userId].name);
                await (0, helpers_1.sendDM)(userId, 'You have been assigned Student role');
            }
            catch (error) {
                await (0, helpers_1.sendDM)(userId, 'Oops! An error occured');
            }
        }
        assignRole('uckers server', 'Student').then(() => {
            delete ids[userId];
        });
        res.render('pages/success');
    }
    else {
        res.render('pages/notfound');
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    client_1.client.login(process.env.DISCORDJS_BOT_TOKEN).then(() => {
        console.log('Client logged in');
    });
    console.log('server is running');
});
//# sourceMappingURL=bot.js.map