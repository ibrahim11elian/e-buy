"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const addressSchema = new mongoose_1.default.Schema({
    _id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        auto: false,
    },
    addressLine: {
        type: String,
        required: [true, "Address is required"],
    },
    city: {
        type: String,
        required: [true, "State is required"],
    },
    postalCode: {
        type: String,
        required: [true, "Postal Code is required"],
    },
    country: {
        type: String,
        required: [true, "Country is required"],
    },
}, {
    timestamps: true,
});
const Address = mongoose_1.default.model("Address", addressSchema);
exports.default = Address;
