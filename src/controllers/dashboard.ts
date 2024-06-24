import { NextFunction, Request, Response } from "express";
import Order from "../models/order";

class Dashboard {
  getSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salesData = await Order.aggregate([
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
    } catch (error) {
      next(error);
    }
  };

  getTopProductSales = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const topProducts = await Order.aggregate([
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
        { $limit: parseInt(req.query.limit as string) || 10 },
        { $addFields: { product: "$_id" } },
        { $project: { _id: 0 } },
      ]);

      const dailySales = await Order.aggregate([
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
    } catch (error) {
      next(error);
    }
  };

  getUserRegistrationsData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().setDate(
                  new Date().getDate() -
                    (parseInt(req.query.days as string) || 30),
                ),
              ),
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
    } catch (error) {
      next(error);
    }
  };

  getOrdersStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderStatus = await Order.aggregate([
        {
          $group: {
            _id: "$status",
            numOrders: { $sum: 1 },
          },
        },
        { $addFields: { status: "$_id" } },
        { $project: { _id: 0 } },
      ]);

      const orderFulfillmentEfficiency = await Order.aggregate([
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
    } catch (error) {
      next(error);
    }
  };

  getRevenueMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const categoryRevenue = await Order.aggregate([
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

      const monthlySales = await Order.aggregate([
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
    } catch (error) {
      next(error);
    }
  };
}

export default Dashboard;
