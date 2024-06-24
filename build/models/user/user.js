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
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const profile_1 = __importDefault(require("./profile"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, "Please provide a username"],
    },
    firstName: {
        type: String,
        required: [true, "User First Name is required"],
    },
    lastName: {
        type: String,
        required: [true, "User Last Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        validate: [validator_1.default.isEmail, "Email is not valid!"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: 8,
        select: false,
    },
    phone: {
        type: String,
        validate: [validator_1.default.isMobilePhone, "Phone number is not valid"],
    },
    profile: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Profile",
    },
    address: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Address",
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    changedPasswordTime: {
        type: Date,
        select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    loginAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
    loginExpires: {
        type: Date,
        select: false,
    },
    lastLoginAttempt: {
        type: Date,
        select: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
        select: false,
    },
    emailVerificationToken: {
        type: String,
        select: false,
    },
    emailVerificationExpires: {
        type: Date,
        select: false,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
});
userSchema.index({ createdAt: -1 });
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        if (!user.isNew)
            return next();
        const session = user.$session(); // Get the current session
        if (!session)
            return next(new Error("Transaction session not found"));
        try {
            // Create profile with the same _id as user document
            yield profile_1.default.create([{ _id: user._id }], { session });
            // Set the profile field in the user document with the same user id so we can populate it later
            this.profile = user._id;
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// Middleware to hash password before saving
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        try {
            const saltRounds = parseInt(process.env.HASH_SALT, 10) || 10;
            this.password = yield bcryptjs_1.default.hash(this.password, saltRounds);
            next();
        }
        catch (err) {
            next(err);
        }
    });
});
// Middleware to update changedPasswordTime before saving
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew)
        return next();
    this.changedPasswordTime = new Date(Date.now() - 1000);
    next();
});
// Method to compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(candidatePassword, this.password);
    });
};
// Method to check if the password was changed after the token was issued
userSchema.methods.checkChangedPassword = function (JWTtime) {
    if (this.changedPasswordTime) {
        const changedTimeInSeconds = Math.floor(this.changedPasswordTime.getTime() / 1000);
        return JWTtime < changedTimeInSeconds;
    }
    return false;
};
// Method to create a password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto_1.default
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
};
// Method to create an email verification token
userSchema.methods.createEmailVerificationToken = function () {
    const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
    this.emailVerificationToken = crypto_1.default
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return verificationToken;
};
// Method to check login attempts and lockout
userSchema.methods.checkLogin = function () {
    const now = Date.now();
    if (this.lastLoginAttempt &&
        now - this.lastLoginAttempt.getTime() <= 60 * 1000) {
        if (this.loginAttempts < 10) {
            this.loginAttempts += 1;
            this.lastLoginAttempt = new Date(now);
            return true;
        }
        else {
            this.loginExpires = new Date(now + 60 * 60 * 1000);
            return false;
        }
    }
    else {
        if (this.loginExpires && this.loginExpires > now) {
            return false;
        }
        this.loginExpires = undefined;
        this.loginAttempts = 1;
        this.lastLoginAttempt = new Date(now);
        return true;
    }
};
// Create and export the User model
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
