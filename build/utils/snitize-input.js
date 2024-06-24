"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function sanitizeInput(req, res, next) {
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
function sanitize(obj) {
    for (const key in obj) {
        if (typeof obj[key] === "string") {
            obj[key] = (0, sanitize_html_1.default)(obj[key]);
        }
        else if (typeof obj[key] === "object" && obj[key] !== null) {
            obj[key] = sanitize(obj[key]);
        }
    }
    return obj;
}
exports.default = sanitizeInput;
