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
const base_1 = __importDefault(require("../helpers/base"));
const mongoose_1 = __importDefault(require("mongoose"));
const favorites_1 = __importDefault(require("../../models/user/favorites"));
const error_1 = __importDefault(require("../../utils/error"));
class FavoritesController extends base_1.default {
    constructor() {
        super(favorites_1.default);
        this.addFavorite = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { product } = req.body;
            if (!product) {
                return next(new error_1.default("Product id is required", 400));
            }
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                let favorite = yield favorites_1.default.findOne({
                    _id: req.user.id,
                }).session(session);
                if (!favorite) {
                    // If no favorite document exists, create a new one
                    favorite = yield favorites_1.default.create([
                        {
                            _id: req.user.id,
                            products: [product],
                        },
                    ], { session });
                    favorite = favorite[0];
                }
                else {
                    // Check if the product already exists in the products array
                    if (!favorite.products.includes(product)) {
                        favorite.products.push(product);
                        yield favorite.save({ session });
                    }
                }
                res.status(201).json({
                    status: "success",
                    data: favorite,
                });
                yield session.commitTransaction();
                session.endSession();
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
        this.getFavorites = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.params.id = req.user.id;
                return yield this.getOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteFavorite = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const favorites = yield favorites_1.default.findById(req.user.id).session(session);
                if (!favorites) {
                    return next(new error_1.default("Favorites not found", 404));
                }
                favorites.products = favorites.products.filter((product) => product.toString() !== req.params.productId);
                yield favorites.save({ session });
                res.status(204).json({
                    status: "success",
                    message: "Favorite deleted successfully",
                });
                yield session.commitTransaction();
                session.endSession();
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
        this.deleteAllFavorites = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.params.id = req.user.id;
                return yield this.deleteOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = FavoritesController;
