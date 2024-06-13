import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import Order, { IOrder } from "../models/order";
import BaseController from "./base";
import Cart, { ICart } from "../models/cart";
import AppError from "../utils/error";

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
    const isStockAvailable = cartList.every((item) => item.quantity <= item.product.stockQuantity);

    if (!isStockAvailable) {
      throw new AppError("There is not enough stock for these products", 400);
    }

    return cartList;
  };

  createOrderDocument = async (order: Partial<IOrder>) => {
    return await Order.create({
      user: order.user,
      totalAmount: order.totalAmount,
      orderItems: order.orderItems,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
    });
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
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
        const order = await this.createOrderDocument(newOrder);

        await Cart.deleteMany({ user: req.user.id });

        return res.status(201).json({
          status: "success",
          data: order,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
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
      event = stripe.webhooks.constructEvent(req.body, signature as string, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata as unknown as OrderMetadata;

      const { userId, shippingAddress, paymentMethod, currency, products, totalAmount } = metadata;

      try {
        await Order.create({
          user: userId,
          totalAmount: parseFloat(totalAmount),
          orderItems: JSON.parse(products),
          shippingAddress,
          paymentMethod,
          currency,
          paymentStatus: true,
        });

        await Cart.deleteMany({ user: userId });
      } catch (error) {
        next(new AppError("Order creation failed after payment", 500));
      }
    }

    res.status(200).json({ received: true });
  };

  getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query.user = req.user.id;
      await this.getAll(req, res, next);
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
}

export default OrderController;
