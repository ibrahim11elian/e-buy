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
/* eslint-disable no-unused-vars */
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../../models/user/user"));
const error_1 = __importDefault(require("../../utils/error"));
const email_1 = __importDefault(require("../../utils/email"));
const mongoose_1 = __importDefault(require("mongoose"));
const tokens_1 = __importDefault(require("../../models/user/tokens"));
class Authentication {
    constructor() {
        this.signup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const newUser = req.body;
                const existingUser = yield user_1.default.findOne({ email: newUser.email }).session(session);
                if (existingUser) {
                    return next(new error_1.default("This user is already exist!", 400));
                }
                const createdUser = yield user_1.default.create([
                    {
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        username: newUser.username,
                        email: newUser.email,
                        password: newUser.password,
                    },
                ], { session });
                const verificationToken = createdUser[0].createEmailVerificationToken();
                yield createdUser[0].save({ session });
                // send email verification
                const url = `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token=${verificationToken}`;
                yield new email_1.default(createdUser[0], url).sendVerification();
                yield session.commitTransaction();
                yield session.endSession();
                res.status(200).json({
                    status: "success",
                    message: "User created successfully, please check ypu email to validate your account.",
                });
            }
            catch (error) {
                yield session.abortTransaction();
                yield session.endSession();
                next(error);
            }
        });
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { user } = req;
            // Generate JWT
            const accessToken = this.generateToken({ id: user._id }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
            const refreshToken = this.generateToken({ id: user._id }, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);
            yield tokens_1.default.create({
                refreshToken,
                user: user._id,
            });
            this.sendTokenCookie(accessToken, req, res);
            res.status(200).json({
                status: "success",
                message: "Logged in successfully",
                accessToken,
                refreshToken,
            });
        });
        this.logout = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return next(new error_1.default("Refresh token is missing", 400));
                }
                yield this.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
                yield tokens_1.default.findOneAndDelete({ refreshToken });
                res.clearCookie("jwt");
                res.status(204).json({
                    status: "success",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.logoutAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return next(new error_1.default("Refresh token required", 400));
                }
                // Verify refresh token
                const { id } = yield this.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
                // Delete all refresh tokens corresponded to this user
                yield tokens_1.default.deleteMany({ user: id });
                res.clearCookie("jwt");
                res.status(204).json({
                    status: "success",
                    message: "Logged out successfully from all devices.",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.validateLoginAttempt = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                // Check if email and password are provided
                if (!email || !password) {
                    return next(new error_1.default("Missing information: you must provide both email and password.", 400));
                }
                // Retrieve the user by email, ensure the user is active, and select the required fields
                const user = yield user_1.default.findOne({ email }).select([
                    "+password",
                    "+loginAttempts",
                    "+loginExpires",
                    "+lastLoginAttempt",
                    "+isVerified",
                ]);
                // Check if the user exists
                if (!user) {
                    return next(new error_1.default("Invalid email or password!", 401));
                }
                if (!user.isVerified) {
                    return next(new error_1.default("You account is not verified yet, please check your email for verification link.", 401));
                }
                // Check login attempt limits
                if (!user.checkLogin()) {
                    yield user.save(); // Save the state in case login attempt count or lockout has been updated
                    const minutesRemaining = ((user.loginExpires - Date.now()) /
                        1000 /
                        60).toFixed();
                    return next(new error_1.default(`You have reached the maximum login attempts, please try again in ${minutesRemaining} Minutes.`, 401));
                }
                // Save the user state after updating login attempts
                yield user.save();
                // Compare the provided password with the stored password
                if (!(yield user.comparePassword(password))) {
                    return next(new error_1.default("Invalid email or password!", 401));
                }
                req.user = user;
                next();
            }
            catch (error) {
                next(error); // Pass any errors to the error handling middleware
            }
        });
        this.sendTokenCookie = (token, req, res) => {
            const cookieExpiresIn = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10);
            res.cookie("jwt", token, {
                // Set the cookie to expire in the specified time
                expires: new Date(Date.now() + cookieExpiresIn * 60 * 1000),
                // Send it in secure connection only (https)
                //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",
                // This will make it inaccessible from the browser
                httpOnly: true,
            });
        };
        // Refresh Token middleware
        this.refreshToken = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return next(new error_1.default("refresh token is required.", 401));
                }
                const token = yield tokens_1.default.findOne({ refreshToken });
                if (!token) {
                    return next(new error_1.default("refresh token is invalid.", 401));
                }
                // Verify the refresh token
                yield this.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
                const accessToken = this.generateToken({ id: token.user }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
                // Create a new refresh token
                const newRefreshToken = this.generateToken({ id: token.user }, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);
                // Update the refresh token in the database
                token.refreshToken = newRefreshToken;
                yield token.save();
                // Send the new access token and refresh token
                this.sendTokenCookie(accessToken, req, res);
                res.status(200).json({
                    status: "success",
                    accessToken,
                    refreshToken: newRefreshToken,
                });
            }
            catch (error) {
                next(error);
            }
        });
        // middleware to check if the user is authenticated
        this.protect = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let token;
                // get the token from request header
                if (req.headers.authorization &&
                    req.headers.authorization.startsWith("Bearer")) {
                    token = req.headers.authorization.split(" ")[1];
                }
                else if (req.cookies.jwt) {
                    token = req.cookies.jwt;
                }
                if (!token) {
                    return next(new error_1.default("You are not logged in! Please log in to get access.", 401));
                }
                // check if the user exists
                const { id, iat } = yield this.verifyToken(token, process.env.JWT_SECRET);
                const user = yield user_1.default.findById(id).select("+isVerified");
                if (!user) {
                    return next(new error_1.default("The user belonging to this token does no longer exist.", 401));
                }
                if (!user.isVerified) {
                    return next(new error_1.default("You account is not verified, please check your email for verification link.", 401));
                }
                // check if the user changed the password and the token is issued after user changing it
                if (user.checkChangedPassword(iat)) {
                    return next(new error_1.default("User changed the password, login again to get a new token.", 401));
                }
                req.user = user;
                next();
            }
            catch (error) {
                next(error);
            }
        });
        this.updatePassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { password, newPassword } = req.body;
                // check for passwords
                if (!password || !newPassword)
                    return next(new error_1.default("Missing information you have to provide password and newPassword", 400));
                // this one we get from the protect middleware
                const { _id } = req.user;
                const user = yield user_1.default.findById(_id).select("+password");
                // Check if user exists
                if (!user) {
                    return next(new error_1.default("User not found", 404));
                }
                // check if the password is correct
                if (!(yield user.comparePassword(password))) {
                    return next(new error_1.default("password is wrong!", 401));
                }
                user.password = newPassword;
                // do not forget that we have a middleware that take care of hashing the password for us
                yield (user === null || user === void 0 ? void 0 : user.save());
                const accessToken = this.generateToken({ id: user === null || user === void 0 ? void 0 : user._id }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
                this.sendTokenCookie(accessToken, req, res);
                res.status(200).json({
                    status: "success",
                    message: "Password updated successfully",
                    accessToken,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.forgotPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return next(new error_1.default("Missing information you have to provide email", 400));
            }
            const user = yield user_1.default.findOne({ email });
            if (!user) {
                return next(new error_1.default("User not found", 404));
            }
            if (user.passwordResetToken &&
                user.passwordResetExpires &&
                user.passwordResetExpires.getTime() > Date.now()) {
                return next(new error_1.default("Password reset token is already sent", 400));
            }
            try {
                // generate random reset token
                const resetToken = user.createPasswordResetToken();
                yield user.save({ validateBeforeSave: false });
                const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
                yield new email_1.default(user, resetURL).sendResetPassword();
                res.status(200).json({
                    status: "success",
                    message: "Token was sent successfully to your email.",
                });
            }
            catch (error) {
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                yield user.save({ validateBeforeSave: false });
                return next(new error_1.default("There was an error sending the email, try again later.", 500));
            }
        });
        this.resetPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = req.params;
                if (!token) {
                    return next(new error_1.default("Missing information you have to provide token", 400));
                }
                const hashedToken = crypto_1.default
                    .createHash("sha256")
                    .update(token)
                    .digest("hex");
                const user = yield user_1.default.findOne({
                    passwordResetToken: hashedToken,
                    passwordResetExpires: { $gt: Date.now() },
                });
                // check if the user is exist and the token has not expired
                //  then set the new password
                if (!user) {
                    return next(new error_1.default("The token is expired or invalid", 400));
                }
                user.password = req.body.password;
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                yield user.save();
                // send jwt token to the user
                const accessToken = this.generateToken({ id: user === null || user === void 0 ? void 0 : user._id }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
                this.sendTokenCookie(accessToken, req, res);
                res.status(200).json({
                    status: "success",
                    message: "the password was reset successfully",
                    accessToken,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.verifyEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const confirmToken = req.query.token;
                if (!confirmToken) {
                    return next(new error_1.default("token is missing", 400));
                }
                const hashedToken = crypto_1.default
                    .createHash("sha256")
                    .update(confirmToken)
                    .digest("hex");
                const user = yield user_1.default.findOne({
                    emailVerificationToken: hashedToken,
                    emailVerificationExpires: { $gt: Date.now() },
                }).select("+isVerified");
                if (!user) {
                    return next(new error_1.default("Email verification token is invalid or has expired.", 400));
                }
                user.isVerified = true;
                user.emailVerificationToken = undefined;
                user.emailVerificationExpires = undefined;
                yield user.save();
                const url = `${req.protocol}://${req.get("host")}/me`;
                yield new email_1.default(user, url).sendWelcome();
                res.status(201).json({
                    status: "success",
                    message: "Email has been successfully verified, You can login now",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.resendVerificationEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                const user = yield user_1.default.findOne({ email }).select([
                    "+isVerified",
                    "+emailVerificationExpires",
                    "+emailVerificationToken",
                ]);
                if (!user) {
                    return next(new error_1.default("User not found.", 400));
                }
                if (user.isVerified) {
                    return next(new error_1.default("Email is already verified.", 400));
                }
                if (user.emailVerificationExpires &&
                    user.emailVerificationExpires.getTime() > Date.now()) {
                    return next(new error_1.default("Email verification token is still valid.", 400));
                }
                // Clear previous token and expiration date
                user.emailVerificationToken = undefined;
                user.emailVerificationExpires = undefined;
                yield user.save({ validateBeforeSave: false });
                const verificationToken = user.createEmailVerificationToken();
                yield user.save({ validateBeforeSave: false });
                const url = `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token=${verificationToken}`;
                yield new email_1.default(user, url).sendVerification();
                res.status(200).json({
                    status: "success",
                    message: "New verification email sent.",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    generateToken(data, secret, expiresIn) {
        // Ensure expiresIn is correctly interpreted as a string or number
        const expiresInValue = isNaN(expiresIn)
            ? expiresIn
            : parseInt(expiresIn, 10);
        return jsonwebtoken_1.default.sign(data, secret, {
            expiresIn: expiresInValue,
        });
    }
    verifyToken(token, secret) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(decoded);
                    }
                });
            });
        });
    }
    restrictTo(...role) {
        return (req, res, next) => {
            if (!role.includes(req.user.role)) {
                return next(new error_1.default("You do not have permission to perform this action", 403));
            }
            next();
        };
    }
}
exports.default = Authentication;
