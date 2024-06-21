import { NextFunction, Request, Response } from "express";
import mongoose, { Document, Model, PopulateOptions } from "mongoose";
import AppError from "../utils/error";
import { APIFeatures } from "../utils/api-features";

class BaseController<T extends Document> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  deleteOne = async (
    req: Request,
    res: Response,
    next: NextFunction,
    session?: mongoose.ClientSession,
  ) => {
    try {
      const { id } = req.params;
      const document = await this.model
        .findByIdAndDelete(id)
        .session(session as mongoose.ClientSession);

      if (!document) {
        return next(new AppError("Document not found!", 404));
      }

      res.status(204).json({
        status: "success",
        message: "Document deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  updateOne = async (
    req: Request,
    res: Response,
    next: NextFunction,
    session?: mongoose.ClientSession,
  ) => {
    try {
      const { id } = req.params;
      const document = await this.model
        .findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        })
        .session(session as mongoose.ClientSession);

      if (!document) {
        return next(new AppError("Document not found!", 404));
      }

      res.status(200).json({
        status: "success",
        data: document,
      });
    } catch (error) {
      next(error);
    }
  };

  createOne = async (
    req: Request,
    res: Response,
    next: NextFunction,
    session?: mongoose.ClientSession,
  ) => {
    try {
      const newDocument = await this.model.create([req.body], { session });

      res.status(201).json({
        status: "success",
        data: newDocument[0],
      });
    } catch (error) {
      next(error);
    }
  };

  getOne = (populateOptions?: PopulateOptions) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
      session?: mongoose.ClientSession,
    ) => {
      try {
        const { id } = req.params;

        let query = this.model
          .findById(id)
          .session(session as mongoose.ClientSession);

        if (populateOptions) query = query.populate(populateOptions);

        const document = await query;

        if (!document) {
          return next(new AppError("Document not found!", 404));
        }

        res.status(200).json({
          status: "success",
          data: document,
        });
      } catch (error) {
        next(error);
      }
    };
  };

  getAll = (additionalData?: Record<string, any>) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
      session?: mongoose.ClientSession,
    ) => {
      try {
        const features = new APIFeatures(this.model.find(), req.query)
          .filter()
          .sort()
          .limitFields()
          .paginate();

        const documents = await features.query.session(
          session as mongoose.ClientSession,
        );
        res.status(200).json({
          status: "success",
          results: documents.length,
          data: documents,
          ...additionalData,
        });
      } catch (error) {
        next(error);
      }
    };
  };
}

export default BaseController;
