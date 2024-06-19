import sanitizeHtml from "sanitize-html";
import { Request, Response, NextFunction } from "express";

function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
}

function sanitize(obj: Record<string, any>) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeHtml(obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = sanitize(obj[key]);
    }
  }
  return obj;
}

export default sanitizeInput;
