import { NextFunction, Request, Response } from "express";
import Address, { IAddress } from "../../models/user/address";
import BaseController from "../helpers/base";
import mongoose from "mongoose";
import User from "../../models/user/user";

class AddressController extends BaseController<IAddress> {
  constructor() {
    super(Address);
  }

  createAddress = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const address = await Address.findById(req.user.id).session(session);

      if (address) {
        req.params.id = req.user.id;
        return await this.updateOne(session)(req, res, next);
      } else {
        req.body._id = req.user.id;
        const newAddress = new Address(req.body);
        await newAddress.save({ session });

        await User.findByIdAndUpdate(
          req.user.id,
          { address: req.user.id },
          { session },
        );

        res.status(201).json({
          status: "success",
          data: newAddress,
        });
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };

  getAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params.id = req.user.id;
      return await this.getOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      req.params.id = req.user.id;

      // Update the user document within the transaction
      await User.findByIdAndUpdate(req.user.id, { address: null }).session(
        session,
      );

      // Delete the address within the transaction
      await this.deleteOne(session)(req, res, next);

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };
}

export default AddressController;
