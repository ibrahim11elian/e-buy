import { Request, Response, NextFunction } from "express";
import Profile, { IProfile } from "../../models/user/profile";
import BaseController from "../helpers/base";
import uploadImage from "../../utils/cloudinary-controller";
import sharp from "sharp";
import Uploader from "../../utils/uploader";
import { UploadApiResponse } from "cloudinary";

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

  uploadUserPhoto = new Uploader().upload.single("image");

  resizeUserPhoto = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    try {
      req.file.filename = `user-${req.user.id}`;

      const resizedBuffer = await sharp(req.file.buffer)
        .resize(500, 500, {
          fit: "cover",
          position: "center",
        })
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toBuffer();

      req.file.buffer = resizedBuffer;

      next();
    } catch (error) {
      next(error);
    }
  };

  handleUploadUserImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.file) {
      return next();
    }
    try {
      const { secure_url } = (await uploadImage(
        req.file,
        "e-buy/users",
      )) as UploadApiResponse;
      req.body.photo = secure_url;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default ProfileController;
