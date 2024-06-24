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
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const uploadImage = (file, folder) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new Error("No file provided");
    }
    return new Promise((resolve, reject) => {
        const readableStream = new stream_1.Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "auto", // Use "auto" to automatically detect the type
            public_id: file.filename, // Use filename as public_id
        }, (error, result) => {
            if (error) {
                reject(`Image upload failed: ${error}`);
            }
            else {
                resolve(result);
            }
        });
        readableStream.pipe(uploadStream);
    });
});
exports.default = uploadImage;
