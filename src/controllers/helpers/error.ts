/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/error";
import { MongooseError } from "mongoose";

/** Global error handling middleware for sending the error in both development and production */
export default function (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.NODE_ENV === "production") {
    // Create a new error object, preserving the prototype chain
    // this is used as spread operator as well as Object.assign did not work for prototype chain
    let error: AppError | MongooseError | Error = Object.create(
      Object.getPrototypeOf(err),
      Object.getOwnPropertyDescriptors(err),
    );

    if (error.name === "CastError") error = handleCastError(error);
    if (error.name === "ValidationError") error = handleValidationError(error);
    // this error is specific to mongo not to mongoose so i need to extract the code of duplicate error from the massage
    if (error.message.match(/E11000/g)) error = handleDuplicateFieldsDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleTokenExpiredError();

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, res);
  }
}

function sendErrorProd(err: AppError | Error, res: Response) {
  // In production, only send the error message and status code
  let statusCode = 500;
  let status = "error";
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    return res.status(statusCode).json({
      status,
      error: err.message,
    });
  } else {
    return res.status(statusCode).json({
      status,
      error: "Something went wrong",
    });
  }
}

function sendErrorDev(err: AppError | Error, res: Response) {
  // In development, send the entire error object
  let statusCode: number = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  }
  return res.status(statusCode).json({
    code: statusCode,
    error: err.message,
    stack: err.stack,
  });
}

function handleCastError(error: any): AppError {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
}

function handleValidationError(error: any): AppError {
  return new AppError(error.message, 400);
}

function handleDuplicateFieldsDB(err: any): AppError {
  // Extract the duplicate keys and values from the error message
  const matches = err.message.match(/dup key: {([^}]+)}/);
  if (!matches) {
    return new AppError(
      "Duplicate field value(s). Please use another value(s)!",
      400,
    );
  }
  const fields = matches[1].split(",").map((field: string) => field.trim());

  // Construct a dynamic error message
  const fieldMessages = fields.map((field: string) => {
    const [key, value] = field.split(":").map((part) => part.trim());
    return `${key}: ${value}`;
  });

  const message = `Duplicate field value(s): ${fieldMessages.join(", ")}. Please use another value(s)!`;
  return new AppError(message, 400);
}

function handleJWTError(): AppError {
  return new AppError("Invalid token.", 401);
}

function handleTokenExpiredError(): AppError {
  return new AppError("Token has expired.", 401);
}
