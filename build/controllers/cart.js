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
const cart_1 = __importDefault(require("../models/cart"));
const product_1 = __importDefault(require("../models/product/product"));
const error_1 = __importDefault(require("../utils/error"));
const base_1 = __importDefault(require("./helpers/base"));
class CartController extends base_1.default {
    constructor() {
        super(cart_1.default);
        this.addOrUpdateCartItem = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { product, quantity } = req.body;
                const userId = req.user.id;
                if (!product || !quantity) {
                    return next(new error_1.default("You need to add the product id and the quantity", 400));
                }
                if (parseInt(quantity) <= 0) {
                    return next(new error_1.default("Positive quantity number required", 400));
                }
                const productDoc = yield product_1.default.findById(product);
                if (!productDoc) {
                    return next(new error_1.default("There is no product with that id", 400));
                }
                req.body.price = productDoc.price;
                if (quantity > productDoc.stockQuantity) {
                    return next(new error_1.default("Not enough stock", 400));
                }
                const cartItem = yield cart_1.default.findOne({ product, user: userId });
                if (cartItem) {
                    // update the quantity if the item is already in the cart
                    cartItem.quantity += parseInt(quantity);
                    // check the updated quantity with the product stock
                    if (cartItem.quantity > productDoc.stockQuantity) {
                        return next(new error_1.default("Not enough stock", 400));
                    }
                    // Update the cart item using the updateOne method from the base class
                    req.params.id = cartItem._id.toString();
                    req.body.quantity = cartItem.quantity;
                    return yield this.updateOne()(req, res, next);
                }
                else {
                    // Use the createOne method from the base class to add a new item
                    req.body.user = userId;
                    return yield this.createOne()(req, res, next);
                }
            }
            catch (error) {
                next(error);
            }
        });
        this.updateCartItem = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { quantity, product, user } = req.body;
                if (!quantity || parseInt(quantity) < 0) {
                    return next(new error_1.default("Positive quantity number required", 400));
                }
                if (product || user) {
                    delete req.body.user;
                    delete req.body.product;
                    delete req.body.price;
                }
                if (parseInt(quantity) === 0) {
                    return yield this.deleteOne()(req, res, next);
                }
                return yield this.updateOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.checkCartOwner = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const cart = yield cart_1.default.findById(req.params.id);
                if (!cart) {
                    return next(new error_1.default("Cart not found", 404));
                }
                cart.user.toString() === req.user.id.toString()
                    ? next()
                    : next(new error_1.default("You don't have cart with this id", 403));
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteCartItem = this.deleteOne;
        this.getCartList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.query.user = req.user;
                const totalPrice = yield cart_1.default.calcTotalPrice(req.user.id);
                return this.getAll({ totalPrice })(req, res, next); // immediately invoking the function returned by getAll
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = CartController;
