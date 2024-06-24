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
const user_1 = __importDefault(require("../../models/user/user"));
const base_1 = __importDefault(require("../helpers/base"));
const error_1 = __importDefault(require("../../utils/error"));
class UserController extends base_1.default {
    constructor() {
        super(user_1.default);
        this.getMe = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            req.params.id = req.user.id;
            return yield this.getOne({ path: "profile address" })(req, res, next);
        });
        this.updateMe = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.body.password) {
                    return next(new error_1.default("This route is not for password update. Please use /updatePassword", 400));
                }
                const { email, username, firstName, lastName, phone } = req.body;
                const { id } = req.user;
                const user = yield user_1.default.findByIdAndUpdate(id, { email, username, firstName, lastName, phone }, {
                    new: true,
                    runValidators: true,
                });
                res.status(200).json({ status: "success", data: user });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteMe = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.user;
                yield user_1.default.findByIdAndUpdate(id, { active: false });
                res.status(204).json({ status: "success", data: null });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllUsers = this.getAll();
        this.getUserByID = this.getOne();
        this.updateUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // delete the password so the admin can not update it
                delete req.body.password;
                return yield this.updateOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteUser = this.deleteOne();
    }
}
exports.default = UserController;
