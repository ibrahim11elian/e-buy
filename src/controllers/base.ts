import { NextFunction, Request, Response } from "express";
import { Document, Model, PopulateOptions } from "mongoose";
import AppError from "../utils/error";
import { APIFeatures } from "../utils/api-features";

class BaseController<T extends Document> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  deleteOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const document = await this.model.findByIdAndDelete(id);

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

  updateOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const document = await this.model.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

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

  createOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newDocument = await this.model.create(req.body);

      res.status(201).json({
        status: "success",
        data: newDocument,
      });
    } catch (error) {
      next(error);
    }
  };

  getOne = (populateOptions?: PopulateOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        let query = this.model.findById(id);

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

  getAll = async (req: Request, res: Response, next: NextFunction, additionalData?: Record<string, any>) => {
    try {
      const features = new APIFeatures(this.model.find(), req.query).filter().sort().limitFields().paginate();

      const documents = await features.query;
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
}

export default BaseController;
