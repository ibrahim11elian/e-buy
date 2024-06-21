import { Request, Response, NextFunction } from "express";
import Profile, { IProfile } from "../models/user/profile";
import BaseController from "./base";

class ProfileController extends BaseController<IProfile> {
  constructor() {
    super(Profile);
  }

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params.id = req.user.id;
      return await this.updateOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params.id = req.user.id;
      return await this.getOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default ProfileController;
