import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import Order, { IOrder } from "../models/order";
import BaseController from "./helpers/base";
import Cart, { ICart } from "../models/cart";
import AppError from "../utils/error";
import mongoose, { ClientSession } from "mongoose";
import Email from "../utils/email";
import User, { IUser } from "../models/user/user";

class OrderController extends BaseController<IOrder> {
  constructor() {
    super(Order);
  }

  checkStockAvailability = async (userId: string): Promise<ICart[]> => {
    const cartList = await Cart.find({ user: userId }).populate("product");

    if (!cartList || cartList.length === 0) {
      throw new AppError("There is no cart list for this user", 404);
    }
    // Check if there's enough stock for each product in the cart
    const isStockAvailable = cartList.every(
      (item) => item.quantity <= item.product.stockQuantity,
    );

    if (!isStockAvailable) {
      throw new AppError("There is not enough stock for these products", 400);
    }

    return cartList;
  };

  createOrderDocument = async (
    order: Partial<IOrder>,
    session: ClientSession,
  ) => {
    return await Order.create([order], { session });
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { shippingAddress, paymentMethod, currency } = req.body;

      if (!shippingAddress) {
        return next(new AppError("shippingAddress is required", 400));
      }

      // Remove status and paymentStatus from req.body if they are present
      delete req.body.status;
      delete req.body.paymentStatus;

      const cartList = await this.checkStockAvailability(req.user.id);

      // Calculate the total amount
      const totalAmount = await Cart.calcTotalPrice(req.user.id);

      const products = cartList.map((item) => ({
        product: item.product._id.toString(),
        quantity: item.quantity,
      }));

      if (paymentMethod === "Credit Card") {
        const stripe = new Stripe(process.env.STRIPE_KEY as string);
        const session = await stripe.checkout.sessions.create({
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
      } else {
        const newOrder: Partial<IOrder> = {
          user: req.user.id,
          totalAmount,
          orderItems: products as IOrder["orderItems"],
          shippingAddress,
          paymentMethod,
          currency,
        };
        const order = await this.createOrderDocument(newOrder, session);

        await Cart.deleteMany({ user: req.user.id }).session(session);

        // Commit the transaction if all operations succeed
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
          status: "success",
          data: order,
        });
      }
    } catch (error) {
      // Abort transaction and handle error
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };

  handleStripeWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    interface OrderMetadata {
      userId: string;
      shippingAddress: string;
      paymentMethod: string;
      currency: string;
      products: string;
      totalAmount: string;
    }
    const stripe = new Stripe(process.env.STIPE_KEY as string);
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature as string,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const stripeSession = event.data.object as Stripe.Checkout.Session;
      const metadata = stripeSession.metadata as unknown as OrderMetadata;

      const {
        userId,
        shippingAddress,
        paymentMethod,
        currency,
        products,
        totalAmount,
      } = metadata;

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Order.create(
          [
            {
              user: userId,
              totalAmount: parseFloat(totalAmount),
              orderItems: JSON.parse(products),
              shippingAddress,
              paymentMethod,
              currency,
              paymentStatus: true,
            },
          ],
          { session },
        );

        await Cart.deleteMany({ user: userId }).session(session);

        // Commit the transaction if all operations succeed
        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        // Abort transaction and handle error
        await session.abortTransaction();
        session.endSession();
        next(new AppError("Order creation failed after payment", 500));
      }
    }

    res.status(200).json({ received: true });
  };

  getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query.user = req.user.id;
      return await this.getAll()(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  getOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new AppError("id is required", 400));
      }
      const order = await Order.findById(id).populate("orderItems.product");

      if (!order) {
        return next(new AppError("Order not found", 404));
      }

      if (order?.user.toString() !== req.user.id) {
        return next(new AppError("You don't have order with this id", 401));
      }

      res.status(200).json({
        status: "success",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin usage
  updateOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;

      if (!req.body.status) {
        return next(new AppError("status required", 400));
      }

      const order = await Order.findById(id)
        .populate({
          path: "orderItems.product",
          select: "name price currency",
        })
        .session(session);

      if (!order) {
        return next(new AppError("Order not found", 404));
      }

      if (order.status === "Cancelled") {
        return next(
          new AppError("Order is cancelled you can not change it", 400),
        );
      }

      if (order.status === req.body.status) {
        return next(
          new AppError(`The order status is already ${req.body.status}`, 400),
        );
      }

      // Update the payment status if the order Delivered and the method is Cash On Delivery
      if (req.body.status === "Delivered") {
        order.paymentStatus = true;
      }

      if (req.body.status === "Shipped") {
        order.shippedAt = new Date(Date.now());
      }

      order.status = req.body.status;
      await order.save({ session });

      const user = await User.findById(order.user).session(session);

      const url = `${req.protocol}://${req.get("host")}/api/v1/orders/${order.id}`;
      await new Email(user as IUser, url).sendShipped(order);
      // Commit the transaction if all operations succeed
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        status: "success",
        message: "Order has been updated successfully",
        data: order,
      });
    } catch (error) {
      // Abort transaction and handle error
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;

      const order = await Order.findById(id).session(session);

      if (!order) {
        return next(new AppError("Order not found", 404));
      }

      if (order.user.toString() !== req.user.id) {
        return next(new AppError("You don't have order with this id", 401));
      }

      if (order.status === "Cancelled") {
        return next(new AppError("Order is already cancelled", 400));
      }

      if (order.status !== "Pending") {
        return next(new AppError("Only pending orders can be cancelled", 400));
      }

      order.status = "Cancelled";
      await order.save({ session });

      // Commit the transaction if all operations succeed
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        status: "success",
        message: "Order has been canceled",
      });
    } catch (error) {
      // Abort transaction and handle error
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };
}

export default OrderController;
