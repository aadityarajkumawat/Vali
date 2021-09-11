"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = nodemailer_1.default.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: 'discord-admin@jklu.edu.in',
        pass: '894yt984h5tgTYDR5ht89#&fbf%$^#$UYV45t89e5gt89g5vt98',
    },
});
console.log(transporter);
(async () => {
    let info = await transporter.sendMail({
        from: 'discord-admin@jklu.edu.in',
        to: 'adityakumawat@jklu.edu.in',
        subject: 'Hello ✔',
        text: 'Hello world?',
        html: '<b>Hello world?</b>',
    });
    console.log(info);
})();
//# sourceMappingURL=test.js.map