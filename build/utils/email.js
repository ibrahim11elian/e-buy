"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-undef */
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const pug_1 = __importDefault(require("pug"));
const html_to_text_1 = require("html-to-text");
const error_js_1 = __importDefault(require("./error.js"));
const logger_js_1 = __importDefault(require("./logger.js"));
class Email {
    constructor(user, url) {
        this.send = (template, subject, data) => __awaiter(this, void 0, void 0, function* () {
            try {
                // render HTML based on a bug template
                const html = pug_1.default.renderFile(path_1.default.join(process.cwd(), "src", "views", `${template}.pug`), {
                    firstName: this.firstName,
                    url: this.url,
                    subject,
                    orderItems: data === null || data === void 0 ? void 0 : data.orderItems,
                });
                // define the email options
                const mailOptions = {
                    from: this.from,
                    to: this.to,
                    subject,
                    html,
                    text: (0, html_to_text_1.htmlToText)(html),
                };
                //  create transporter
                const transporter = this.createNewTransport();
                // send email
                yield transporter.sendMail(mailOptions);
            }
            catch (error) {
                logger_js_1.default.error(`Error sending email to user ${this.to}:`, error);
                throw new error_js_1.default("Error Sending email", 500);
            }
        });
        this.sendWelcome = () => __awaiter(this, void 0, void 0, function* () {
            yield this.send("welcome", "welcome to E-Buy family");
        });
        this.sendVerification = () => __awaiter(this, void 0, void 0, function* () {
            yield this.send("verify", "E-Buy Email Verification");
        });
        this.sendResetPassword = () => __awaiter(this, void 0, void 0, function* () {
            yield this.send("passwordReset", "E-Buy Account Reset Password (valid for 10 min)");
        });
        this.sendShipped = (order) => __awaiter(this, void 0, void 0, function* () {
            yield this.send("orderShipped", "Order Status Update", order);
        });
        this.to = user.email;
        this.firstName = user.firstName;
        this.url = url;
        this.from = `E-Buy <${process.env.EMAIL_FROM}>`;
    }
    createNewTransport() {
        if (process.env.NODE_ENV === "production") {
            return nodemailer_1.default.createTransport({
                service: "SendGrid",
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }
        return nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
}
exports.default = Email;
