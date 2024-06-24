import { NextFunction, Request, Response } from "express";
import mongoose, { Document, Model, PopulateOptions } from "mongoose";
import AppError from "../../utils/error";
import { APIFeatures } from "../../utils/api-features";

class BaseController<T extends Document> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  deleteOne = (session?: mongoose.ClientSession) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const document = await this.model
          .findByIdAndDelete(id)
          .session(session || null);

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
  };

  updateOne = (session?: mongoose.ClientSession) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const document = await this.model
          .findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
          })
          .session(session || null);

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

  createOne = (
    fieldsToExclude?: string[],
    session?: mongoose.ClientSession,
  ) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const newDocument = await this.model.create([req.body], { session });

        const transformedData = newDocument[0].toObject() as Record<
          string,
          any
        >;
        if (fieldsToExclude && fieldsToExclude.length) {
          // Transform the document before sending as response
          fieldsToExclude.forEach((field) => {
            delete transformedData[field];
          });
        }

        res.status(201).json({
          status: "success",
          data: transformedData,
        });
      } catch (error) {
        next(error);
      }
    };
  };

  getOne = (
    populateOptions?: PopulateOptions,
    session?: mongoose.ClientSession,
  ) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        let query = this.model.findById(id).session(session || null);

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

  getAll = (
    additionalData?: Record<string, any>,
    session?: mongoose.ClientSession,
  ) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const features = new APIFeatures(this.model.find(), req.query)
          .filter()
          .sort()
          .limitFields()
          .paginate();

        const documents = await features.query.session(session || null);
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
