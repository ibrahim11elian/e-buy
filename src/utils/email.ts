/* eslint-disable no-undef */
import path from "path";
import nodemailer from "nodemailer";
import pug from "pug";
import { htmlToText } from "html-to-text";
import AppError from "./error.js";
import { IUser } from "../models/user/user.js";

class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;
  constructor(user: IUser, url: string) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `E-Buy <${process.env.EMAIL_FROM}>`;
  }

  createNewTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST as string,
      port: process.env.EMAIL_PORT as string,
      auth: {
        user: process.env.EMAIL_USERNAME as string,
        pass: process.env.EMAIL_PASSWORD as string,
      },
    } as nodemailer.TransportOptions);
  }

  send = async (template: string, subject: string) => {
    try {
      // render HTML based on a bug template
      const html = pug.renderFile(
        path.join(process.cwd(), "src", "views", `${template}.pug`),
        {
          firstName: this.firstName,
          url: this.url,
          subject,
        },
      );
      // define the email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText(html),
      };

      //  create transporter
      const transporter = this.createNewTransport();

      // send email
      await transporter.sendMail(mailOptions);
    } catch (error) {
      //   logger.error(`Error sending email to user ${this.to}:`, error);
      throw new AppError("Error Sending email", 500);
    }
  };

  sendWelcome = async () => {
    await this.send("welcome", "welcome to E-Buy family");
  };

  sendVerification = async () => {
    await this.send("verify", "E-Buy Email Verification");
  };

  sendResetPassword = async () => {
    await this.send(
      "passwordReset",
      "E-Buy Account Reset Password (valid for 10 min)",
    );
  };
}

export default Email;
