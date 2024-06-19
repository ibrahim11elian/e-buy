/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/user/user";
import BaseController from "./base";
import AppError from "../utils/error";

class UserController extends BaseController<IUser> {
  constructor() {
    super(User);
  }

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    req.params.id = req.user.id;
    return this.getOne();
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.password) {
        return next(
          new AppError(
            "This route is not for password update. Please use /updatePassword",
            400,
          ),
        );
      }

      const { email, username, firstName, lastName, phone } = req.body;

      const { id } = req.user;
      const user = await User.findByIdAndUpdate(
        id,
        { email, username, firstName, lastName, phone },
        {
          new: true,
          runValidators: true,
        },
      );

      res.status(200).json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  deleteMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.user;

      await User.findByIdAndUpdate(id, { active: false });
      res.status(204).json({ status: "success", data: null });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = this.getAll();
  getUserByID = this.getOne();
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // delete the password so the admin can not update it
      delete req.body.password;

      return await this.updateOne(req, res, next);
    } catch (error) {
      next(error);
    }
  };
  deleteUser = this.deleteOne;
}

export default UserController;
