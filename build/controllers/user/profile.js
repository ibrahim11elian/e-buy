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
const profile_1 = __importDefault(require("../../models/user/profile"));
const base_1 = __importDefault(require("../helpers/base"));
const cloudinary_controller_1 = __importDefault(require("../../utils/cloudinary-controller"));
const sharp_1 = __importDefault(require("sharp"));
const uploader_1 = __importDefault(require("../../utils/uploader"));
class ProfileController extends base_1.default {
    constructor() {
        super(profile_1.default);
        this.updateProfile = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.params.id = req.user.id;
                return yield this.updateOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.getProfile = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.params.id = req.user.id;
                return yield this.getOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.uploadUserPhoto = new uploader_1.default().upload.single("image");
        this.resizeUserPhoto = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.file)
                return next();
            try {
                req.file.filename = `user-${req.user.id}`;
                const resizedBuffer = yield (0, sharp_1.default)(req.file.buffer)
                    .resize(500, 500, {
                    fit: "cover",
                    position: "center",
                })
                    .toFormat("jpeg")
                    .jpeg({ quality: 90 })
                    .toBuffer();
                req.file.buffer = resizedBuffer;
                next();
            }
            catch (error) {
                next(error);
            }
        });
        this.handleUploadUserImage = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.file) {
                return next();
            }
            try {
                const { secure_url } = (yield (0, cloudinary_controller_1.default)(req.file, "e-buy/users"));
                req.body.photo = secure_url;
                next();
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = ProfileController;
