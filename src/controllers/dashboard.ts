import { NextFunction, Request, Response } from "express";
import Order from "../models/order";

class Dashboard {
  getSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sales = await Order.aggregate([
        {
          $match: {
            status: "Delivered",
          },
        },
        {
          $group: {
            _id: null,
            completedOrders: {
              $sum: 1,
            },
            totalSales: {
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

      res.status(200).json({
        status: "success",
        data: sales,
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
      const data = await Order.aggregate([
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

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getDailySales = async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        data: dailySales,
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

  getOrdersStatusData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await Order.aggregate([
        {
          $group: {
            _id: "$status",
            numOrders: { $sum: 1 },
          },
        },
        { $addFields: { status: "$_id" } },
        { $project: { _id: 0 } },
      ]);

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderFulfillmentEfficiency = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await Order.aggregate([
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
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getTopCategorySales = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await Order.aggregate([
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

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getMonthlySales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dailySales = await Order.aggregate([
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
        data: dailySales,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default Dashboard;
