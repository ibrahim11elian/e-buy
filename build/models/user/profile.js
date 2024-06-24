"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const profileSchema = new mongoose_1.default.Schema({
    _id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        auto: false,
    },
    bio: {
        type: String,
    },
    photo: {
        type: String,
    },
}, {
    timestamps: true,
});
const Profile = mongoose_1.default.model("Profile", profileSchema);
exports.default = Profile;
