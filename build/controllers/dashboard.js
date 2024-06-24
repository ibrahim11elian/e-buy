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
const order_1 = __importDefault(require("../models/order"));
class Dashboard {
    constructor() {
        this.getSales = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const salesData = yield order_1.default.aggregate([
                    {
                        $match: {
                            paymentStatus: true,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            numOrders: {
                                $sum: 1,
                            },
                            totalRevenue: {
                                $sum: "$totalAmount",
                            },
                            avgOrderValue: {
                                $avg: "$totalAmount",
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                        },
                    },
                ]);
                if (salesData.length === 0) {
                    return res.status(404).json({ error: "No sales data found" });
                }
                // Extract metrics from aggregation result
                const { totalRevenue, avgOrderValue, numOrders } = salesData[0];
                // Prepare response
                const salesOverview = {
                    totalRevenue,
                    avgOrderValue,
                    numOrders,
                };
                res.status(200).json({
                    status: "success",
                    data: salesOverview,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getTopProductSales = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const topProducts = yield order_1.default.aggregate([
                    {
                        $unwind: "$orderItems",
                    },
                    {
                        $lookup: {
                            from: "products", // The collection name for Product
                            localField: "orderItems.product",
                            foreignField: "_id",
                            as: "productInfo",
                        },
                    },
                    {
                        $unwind: "$productInfo",
                    },
                    {
                        $group: {
                            _id: "$productInfo.name",
                            totalQuantitySold: { $sum: "$orderItems.quantity" },
                            totalRevenue: {
                                $sum: {
                                    $multiply: ["$orderItems.quantity", "$productInfo.price"],
                                },
                            },
                        },
                    },
                    {
                        $sort: { totalQuantitySold: -1 },
                    },
                    { $limit: parseInt(req.query.limit) || 10 },
                    { $addFields: { product: "$_id" } },
                    { $project: { _id: 0 } },
                ]);
                const dailySales = yield order_1.default.aggregate([
                    {
                        $unwind: "$orderItems",
                    },
                    {
                        $addFields: {
                            yearMonthDay: {
                                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                            },
                        },
                    },
                    {
                        $group: {
                            _id: "$yearMonthDay",
                            dailySales: { $sum: "$orderItems.quantity" },
                        },
                    },
                    { $addFields: { day: "$_id" } },
                    { $project: { _id: 0 } },
                ]);
                res.status(200).json({
                    status: "success",
                    data: { dailySales, topProducts },
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getUserRegistrationsData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield order_1.default.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: new Date(new Date().setDate(new Date().getDate() -
                                    (parseInt(req.query.days) || 30))),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            newUsers: { $sum: 1 },
                        },
                    },
                    { $project: { _id: 0 } },
                ]);
                res.status(200).json({
                    status: "success",
                    data: data[0],
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getOrdersStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderStatus = yield order_1.default.aggregate([
                    {
                        $group: {
                            _id: "$status",
                            numOrders: { $sum: 1 },
                        },
                    },
                    { $addFields: { status: "$_id" } },
                    { $project: { _id: 0 } },
                ]);
                const orderFulfillmentEfficiency = yield order_1.default.aggregate([
                    {
                        $project: {
                            orderProcessingTime: { $subtract: ["$shippedAt", "$createdAt"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            averageProcessingTime: { $avg: "$orderProcessingTime" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            averageProcessingTimeInHours: {
                                $divide: ["$averageProcessingTime", 1000 * 60 * 60],
                            },
                        },
                    },
                ]);
                res.status(200).json({
                    status: "success",
                    data: { orderStatus, orderFulfillmentEfficiency },
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getRevenueMetrics = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const categoryRevenue = yield order_1.default.aggregate([
                    {
                        $unwind: "$orderItems",
                    },
                    {
                        $lookup: {
                            from: "products", // The collection name for Product
                            localField: "orderItems.product",
                            foreignField: "_id",
                            as: "productDetails",
                        },
                    },
                    {
                        $unwind: "$productDetails",
                    },
                    {
                        $group: {
                            _id: "$productDetails.category",
                            totalRevenue: {
                                $sum: {
                                    $multiply: ["$orderItems.quantity", "$productDetails.price"],
                                },
                            },
                        },
                    },
                    {
                        $sort: { totalRevenue: -1 },
                    },
                    { $addFields: { category: "$_id" } },
                    { $project: { _id: 0 } },
                ]);
                const monthlySales = yield order_1.default.aggregate([
                    {
                        $addFields: {
                            yearMonth: {
                                $dateToString: { format: "%Y-%m", date: "$createdAt" },
                            },
                        },
                    },
                    {
                        $group: {
                            _id: "$yearMonth",
                            monthlyRevenue: { $sum: "$totalAmount" },
                        },
                    },
                    { $sort: { _id: 1 } },
                    { $addFields: { month: "$_id" } },
                    { $project: { _id: 0 } },
                ]);
                res.status(200).json({
                    status: "success",
                    data: { categoryRevenue, monthlySales },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = Dashboard;
