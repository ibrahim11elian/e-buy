"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = __importDefault(require("../../utils/error"));
const api_features_1 = require("../../utils/api-features");
class BaseController {
    constructor(model) {
        this.deleteOne = (session) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { id } = req.params;
                    const document = yield this.model
                        .findByIdAndDelete(id)
                        .session(session || null);
                    if (!document) {
                        return next(new error_1.default("Document not found!", 404));
                    }
                    res.status(204).json({
                        status: "success",
                        message: "Document deleted successfully",
                    });
                }
                catch (error) {
                    next(error);
                }
            });
        };
        this.updateOne = (session) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { id } = req.params;
                    const document = yield this.model
                        .findByIdAndUpdate(id, req.body, {
                        new: true,
                        runValidators: true,
                    })
                        .session(session || null);
                    if (!document) {
                        return next(new error_1.default("Document not found!", 404));
                    }
                    res.status(200).json({
                        status: "success",
                        data: document,
                    });
                }
                catch (error) {
                    next(error);
                }
            });
        };
        this.createOne = (fieldsToExclude, session) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const newDocument = yield this.model.create([req.body], { session });
                    const transformedData = newDocument[0].toObject();
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
                }
                catch (error) {
                    next(error);
                }
            });
        };
        this.getOne = (populateOptions, session) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { id } = req.params;
                    let query = this.model.findById(id).session(session || null);
                    if (populateOptions)
                        query = query.populate(populateOptions);
                    const document = yield query;
                    if (!document) {
                        return next(new error_1.default("Document not found!", 404));
                    }
                    res.status(200).json({
                        status: "success",
                        data: document,
                    });
                }
                catch (error) {
                    next(error);
                }
            });
        };
        this.getAll = (additionalData, session, enableSearch = false) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const features = new api_features_1.APIFeatures(this.model.find(), req.query)
                        .filter(enableSearch)
                        .sort()
                        .limitFields()
                        .paginate();
                    const documents = yield features.query.session(session || null);
                    res.status(200).json(Object.assign({ status: "success", results: documents.length, data: documents }, additionalData));
                }
                catch (error) {
                    next(error);
                }
            });
        };
        this.model = model;
    }
}
exports.default = BaseController;
