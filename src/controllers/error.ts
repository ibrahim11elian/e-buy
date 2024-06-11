/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/error";

/** Global error handling middleware for sending the error in both development and production */
export default function (err: AppError | Error, req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production") {
    sendErrorProd(err, res);
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
