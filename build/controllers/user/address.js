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
const address_1 = __importDefault(require("../../models/user/address"));
const base_1 = __importDefault(require("../helpers/base"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("../../models/user/user"));
class AddressController extends base_1.default {
    constructor() {
        super(address_1.default);
        this.createAddress = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const address = yield address_1.default.findById(req.user.id).session(session);
                if (address) {
                    req.params.id = req.user.id;
                    return yield this.updateOne(session)(req, res, next);
                }
                else {
                    req.body._id = req.user.id;
                    const newAddress = new address_1.default(req.body);
                    yield newAddress.save({ session });
                    yield user_1.default.findByIdAndUpdate(req.user.id, { address: req.user.id }, { session });
                    res.status(201).json({
                        status: "success",
                        data: newAddress,
                    });
                }
                yield session.commitTransaction();
                session.endSession();
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
        this.getAddress = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                req.params.id = req.user.id;
                return yield this.getOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteAddress = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                req.params.id = req.user.id;
                // Update the user document within the transaction
                yield user_1.default.findByIdAndUpdate(req.user.id, { address: null }).session(session);
                // Delete the address within the transaction
                yield this.deleteOne(session)(req, res, next);
                yield session.commitTransaction();
                session.endSession();
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                next(error);
            }
        });
    }
}
exports.default = AddressController;
