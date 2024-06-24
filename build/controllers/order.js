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
const stripe_1 = __importDefault(require("stripe"));
const order_1 = __importDefault(require("../models/order"));
const base_1 = __importDefault(require("./helpers/base"));
const cart_1 = __importDefault(require("../models/cart"));
const error_1 = __importDefault(require("../utils/error"));
const mongoose_1 = __importDefault(require("mongoose"));
const email_1 = __importDefault(require("../utils/email"));
const user_1 = __importDefault(require("../models/user/user"));
class OrderController extends base_1.default {
    constructor() {
        super(order_1.default);
        this.checkStockAvailability = (userId) => __awaiter(this, void 0, void 0, function* () {
            const cartList = yield cart_1.default.find({ user: userId }).populate("product");
            if (!cartList || cartList.length === 0) {
                throw new error_1.default("There is no cart list for this user", 404);
            }
            // Check if there's enough stock for each product in the cart
            const isStockAvailable = cartList.every((item) => item.quantity <= item.product.stockQuantity);
            if (!isStockAvailable) {
                throw new error_1.default("There is not enough stock for these products", 400);
            }
            return cartList;
        });
        this.createOrderDocument = (order, session) => __awaiter(this, void 0, void 0, function* () {
            return yield order_1.default.create([order], { session });
        });
        this.createOrder = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const { shippingAddress, paymentMethod, currency } = req.body;
                if (!shippingAddress) {
                    return next(new error_1.default("shippingAddress is required", 400));
                }
                // Remove status and paymentStatus from req.body if they are present
                delete req.body.status;
                delete req.body.paymentStatus;
                const cartList = yield this.checkStockAvailability(req.user.id);
                // Calculate the total amount
                const totalAmount = yield cart_1.default.calcTotalPrice(req.user.id);
                const products = cartList.map((item) => ({
                    product: item.product._id.toString(),
                    quantity: item.quantity,
                }));
                if (paymentMethod === "Credit Card") {
                    const stripe = new stripe_1.default(process.env.STRIPE_KEY);
                    const session = yield stripe.checkout.sessions.create({
                        payment_method_types: ["card"],
                        line_items: cartList.map((item) => ({
                            price_data: {
                                currency: currency || "usd",
                                product_data: {
                                    name: item.product.name,
                                },
                                unit_amount: item.price * 100,
                            },
                            quantity: item.quantity,
                        })),
                        mode: "payment",
                        success_url: `${req.protocol}://${req.get("host")}/success`,
                        cancel_url: `${req.protocol}://${req.get("host")}/cancel`,
                        metadata: {
                            userId: req.user.id,
                            shippingAddress,
                            paymentMethod,
                            currency,
                            products: JSON.stringify(products),
                            totalAmount: totalAmount.toString(),
                        },
                    });
                    res.status(201).json({
                        status: "success",
                        url: session.url,
                    });
                }
                else {
                    const newOrder = {
                        user: req.user.id,
                        totalAmount,
                        orderItems: products,
                        shippingAddress,
                        paymentMethod,
                        currency,
                    };
                    const order = yield this.createOrderDocument(newOrder, session);
                    yield cart_1.default.deleteMany({ user: req.user.id }).session(session);
                    // Commit the transaction if all operations succeed
                    yield session.commitTransaction();
                    session.endSession();
                    return res.status(201).json({
                        status: "success",
                        data: order,
                    });
                }
            }
            catch (error) {
                // Abort transaction and handle error
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
        this.handleStripeWebhook = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const stripe = new stripe_1.default(process.env.STIPE_KEY);
            const signature = req.headers["stripe-signature"];
            let event;
            try {
                event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
            }
            catch (err) {
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
            if (event.type === "checkout.session.completed") {
                const stripeSession = event.data.object;
                const metadata = stripeSession.metadata;
                const { userId, shippingAddress, paymentMethod, currency, products, totalAmount, } = metadata;
                const session = yield mongoose_1.default.startSession();
                session.startTransaction();
                try {
                    yield order_1.default.create([
                        {
                            user: userId,
                            totalAmount: parseFloat(totalAmount),
                            orderItems: JSON.parse(products),
                            shippingAddress,
                            paymentMethod,
                            currency,
                            paymentStatus: true,
                        },
                    ], { session });
                    yield cart_1.default.deleteMany({ user: userId }).session(session);
                    // Commit the transaction if all operations succeed
                    yield session.commitTransaction();
                    session.endSession();
                }
                catch (error) {
                    // Abort transaction and handle error
                    yield session.abortTransaction();
                    session.endSession();
                    next(new error_1.default("Order creation failed after payment", 500));
                }
            }
            res.status(200).json({ received: true });
        });
        this.getUserOrders = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.query.user = req.user.id;
                return yield this.getAll()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.getOrder = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id) {
                    return next(new error_1.default("id is required", 400));
                }
                const order = yield order_1.default.findById(id).populate("orderItems.product");
                if (!order) {
                    return next(new error_1.default("Order not found", 404));
                }
                if ((order === null || order === void 0 ? void 0 : order.user.toString()) !== req.user.id) {
                    return next(new error_1.default("You don't have order with this id", 401));
                }
                res.status(200).json({
                    status: "success",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Admin usage
        this.updateOrderStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const { id } = req.params;
                if (!req.body.status) {
                    return next(new error_1.default("status required", 400));
                }
                const order = yield order_1.default.findById(id)
                    .populate({
                    path: "orderItems.product",
                    select: "name price currency",
                })
                    .session(session);
                if (!order) {
                    return next(new error_1.default("Order not found", 404));
                }
                if (order.status === "Cancelled") {
                    return next(new error_1.default("Order is cancelled you can not change it", 400));
                }
                if (order.status === req.body.status) {
                    return next(new error_1.default(`The order status is already ${req.body.status}`, 400));
                }
                // Update the payment status if the order Delivered and the method is Cash On Delivery
                if (req.body.status === "Delivered") {
                    order.paymentStatus = true;
                }
                if (req.body.status === "Shipped") {
                    order.shippedAt = new Date(Date.now());
                }
                order.status = req.body.status;
                yield order.save({ session });
                const user = yield user_1.default.findById(order.user).session(session);
                const url = `${req.protocol}://${req.get("host")}/api/v1/orders/${order.id}`;
                yield new email_1.default(user, url).sendShipped(order);
                // Commit the transaction if all operations succeed
                yield session.commitTransaction();
                session.endSession();
                res.status(200).json({
                    status: "success",
                    message: "Order has been updated successfully",
                    data: order,
                });
            }
            catch (error) {
                // Abort transaction and handle error
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
        this.cancelOrder = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const { id } = req.params;
                const order = yield order_1.default.findById(id).session(session);
                if (!order) {
                    return next(new error_1.default("Order not found", 404));
                }
                if (order.user.toString() !== req.user.id) {
                    return next(new error_1.default("You don't have order with this id", 401));
                }
                if (order.status === "Cancelled") {
                    return next(new error_1.default("Order is already cancelled", 400));
                }
                if (order.status !== "Pending") {
                    return next(new error_1.default("Only pending orders can be cancelled", 400));
                }
                order.status = "Cancelled";
                yield order.save({ session });
                // Commit the transaction if all operations succeed
                yield session.commitTransaction();
                session.endSession();
                res.status(200).json({
                    status: "success",
                    message: "Order has been canceled",
                });
            }
            catch (error) {
                // Abort transaction and handle error
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
    }
}
exports.default = OrderController;
