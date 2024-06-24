"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../../controllers/helpers/authentication"));
const address_1 = __importDefault(require("../../controllers/user/address"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const address = new address_1.default();
router
    .route("/")
    .all(auth.protect)
    .post(address.createAddress)
    .get(address.getAddress)
    .delete(address.deleteAddress);
exports.default = router;
