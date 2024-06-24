import multer, { FileFilterCallback, Multer } from "multer";
import { Request, Express } from "express";
import AppError from "./error";

class Uploader {
  public upload: Multer;

  constructor() {
    this.upload = multer({
      storage: this.multerStorage,
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      fileFilter: this.multerFilter,
    });
  }

  multerStorage = multer.memoryStorage();

  multerFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ): void => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(
        new AppError("Please upload only images", 400) as unknown as null,
        false,
      );
    }
  };
}

export default Uploader;
