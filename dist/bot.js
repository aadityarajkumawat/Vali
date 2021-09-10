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
const types_1 = require("./types");
const app = (0, express_1.default)();
app.set('view engine', 'ejs');
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(__dirname + '/../public'));
(0, helpers_1.initializeMailAPI)();
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
        console.log(`New user "${member.user.username}" has joined "${member.guild.name}"`);
        let userId = member.user.id;
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
        let userInDB = (await redisClient_1.redis.exists(userId));
        let userExists = userInDB === types_1.BinaryStatus.Success;
        if (userExists) {
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