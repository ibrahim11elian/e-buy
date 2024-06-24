"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const error_1 = __importDefault(require("./error"));
class Uploader {
    constructor() {
        this.multerStorage = multer_1.default.memoryStorage();
        this.multerFilter = (req, file, cb) => {
            if (file.mimetype.startsWith("image")) {
                cb(null, true);
            }
            else {
                cb(new error_1.default("Please upload only images", 400), false);
            }
        };
        this.upload = (0, multer_1.default)({
            storage: this.multerStorage,
            limits: {
                fileSize: 1024 * 1024 * 5, // 5MB
            },
            fileFilter: this.multerFilter,
        });
    }
}
exports.default = Uploader;
