"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = __importDefault(require("../../utils/error"));
/** Global error handling middleware for sending the error in both development and production */
function default_1(err, req, res, next) {
    if (process.env.NODE_ENV === "production") {
        // Create a new error object, preserving the prototype chain
        // this is used as spread operator as well as Object.assign did not work for prototype chain
        let error = Object.create(Object.getPrototypeOf(err), Object.getOwnPropertyDescriptors(err));
        if (error.name === "CastError")
            error = handleCastError(error);
        if (error.name === "ValidationError")
            error = handleValidationError(error);
        // this error is specific to mongo not to mongoose so i need to extract the code of duplicate error from the massage
        if (error.message.match(/E11000/g))
            error = handleDuplicateFieldsDB(error);
        if (error.name === "JsonWebTokenError")
            error = handleJWTError();
        if (error.name === "TokenExpiredError")
            error = handleTokenExpiredError();
        sendErrorProd(error, res);
    }
    else {
        sendErrorDev(err, res);
    }
}
exports.default = default_1;
function sendErrorProd(err, res) {
    // In production, only send the error message and status code
    let statusCode = 500;
    let status = "error";
    if (err instanceof error_1.default) {
        statusCode = err.statusCode;
        status = err.status;
        return res.status(statusCode).json({
            status,
            error: err.message,
        });
    }
    else {
        return res.status(statusCode).json({
            status,
            error: "Something went wrong",
        });
    }
}
function sendErrorDev(err, res) {
    // In development, send the entire error object
    let statusCode = 500;
    if (err instanceof error_1.default) {
        statusCode = err.statusCode;
    }
    return res.status(statusCode).json({
        code: statusCode,
        error: err.message,
        stack: err.stack,
    });
}
function handleCastError(error) {
    const message = `Invalid ${error.path}: ${error.value}`;
    return new error_1.default(message, 400);
}
function handleValidationError(error) {
    return new error_1.default(error.message, 400);
}
function handleDuplicateFieldsDB(err) {
    // Extract the duplicate keys and values from the error message
    const matches = err.message.match(/dup key: {([^}]+)}/);
    if (!matches) {
        return new error_1.default("Duplicate field value(s). Please use another value(s)!", 400);
    }
    const fields = matches[1].split(",").map((field) => field.trim());
    // Construct a dynamic error message
    const fieldMessages = fields.map((field) => {
        const [key, value] = field.split(":").map((part) => part.trim());
        return `${key}: ${value}`;
    });
    const message = `Duplicate field value(s): ${fieldMessages.join(", ")}. Please use another value(s)!`;
    return new error_1.default(message, 400);
}
function handleJWTError() {
    return new error_1.default("Invalid token.", 401);
}
function handleTokenExpiredError() {
    return new error_1.default("Token has expired.", 401);
}
