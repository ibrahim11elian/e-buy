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
const mongoose_1 = __importDefault(require("mongoose"));
const product_1 = __importDefault(require("./product/product"));
const orderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "UserId is required"],
    },
    orderItems: [
        {
            product: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Product",
                required: [true, "ProductId is required"],
            },
            quantity: {
                type: Number,
                required: [true, "Quantity is required"],
                min: [1, "Quantity must be grater the zero"],
            },
        },
    ],
    shippingAddress: {
        type: String,
        required: [true, "Shipping Address is required"],
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ["Credit Card", "Cash On Delivery"],
            message: "Invalid Payment Method",
        },
        required: [true, "Payment Method is required"],
        default: "Credit Card",
    },
    totalAmount: {
        type: Number,
        required: [true, "Total Amount is required"],
    },
    status: {
        type: String,
        trim: true,
        enum: {
            values: ["Pending", "Shipped", "Delivered", "Cancelled"],
            message: "Invalid Status",
        },
        required: [true, "Status is required"],
        default: "Pending",
    },
    currency: {
        type: String,
        enum: {
            values: ["USD", "EUR", "EGP"],
            message: "Invalid Currency",
        },
        default: "USD",
        required: [true, "Currency is required"],
    },
    paymentStatus: {
        type: Boolean,
        default: false,
    },
    shippedAt: Date,
}, {
    timestamps: true,
});
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
// adjust stock when order status changes to 'Cancelled' or 'Pending'
orderSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // we can not use this.isNew because mongoose set it false by default
        // because it treat it as incomplete transaction so it's not yet finished so it's not get saved to the DB
        // we can use this.isModified('status')
        if (this.isModified("status")) {
            const originalOrder = yield Order.findById(this._id).lean();
            if (originalOrder &&
                originalOrder.status !== "Cancelled" &&
                this.status === "Cancelled") {
                // If the status changes from anything to 'canceled', increase the stock
                yield adjustStock(originalOrder.orderItems, true);
            }
        }
        else if (this.status === "Pending") {
            // If the status changes from anything to 'pending', decrease the stock
            yield adjustStock(this.orderItems, false);
        }
        next();
    });
});
const adjustStock = (orderItems, increment) => __awaiter(void 0, void 0, void 0, function* () {
    const adjustment = increment ? 1 : -1;
    const updateStockPromises = orderItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        yield product_1.default.findByIdAndUpdate(item.product, { $inc: { stockQuantity: adjustment * item.quantity } }, { new: true, useFindAndModify: false });
    }));
    yield Promise.all(updateStockPromises);
});
const Order = mongoose_1.default.model("Order", orderSchema);
exports.default = Order;
