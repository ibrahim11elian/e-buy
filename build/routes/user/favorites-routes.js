"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = __importDefault(require("../../controllers/helpers/authentication"));
const favorites_1 = __importDefault(require("../../controllers/user/favorites"));
const router = (0, express_1.Router)({
    mergeParams: true,
});
const auth = new authentication_1.default();
const favorite = new favorites_1.default();
router.use(auth.protect);
router
    .route("/")
    .post(favorite.addFavorite)
    .get(favorite.getFavorites)
    .delete(favorite.deleteAllFavorites);
router.delete("/:productId", favorite.deleteFavorite);
exports.default = router;
