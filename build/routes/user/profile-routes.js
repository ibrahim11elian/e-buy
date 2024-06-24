"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../../controllers/helpers/authentication"));
const profile_1 = __importDefault(require("../../controllers/user/profile"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const profile = new profile_1.default();
router.route("/").all(auth.protect).get(profile.getProfile).patch(profile.uploadUserPhoto, profile.resizeUserPhoto, profile.handleUploadUserImage, // upload to cloudinary
profile.updateProfile);
exports.default = router;
