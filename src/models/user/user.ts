/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import crypto from "crypto";
import mongoose, { Document, CallbackError, Model, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

// Define IUser interface extending Document
export interface IUser extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: "user" | "admin";
  profile?: string;
  address?: string;
  active: boolean;
  loginAttempts?: number;
  isVerified: boolean;
  loginExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  changedPasswordTime: Date;
  lastLoginAttempt: Date;
  emailVerificationToken: string;
  emailVerificationExpires: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  checkChangedPassword: (JWTTime: number) => boolean;
  generatePasswordReset: () => string;
  checkLogin: () => boolean;
}

export interface IUserModel extends Model<IUser> {}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
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
      validate: [validator.isEmail, "Email is not valid!"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: 8,
      select: false,
    },
    phone: {
      type: String,
      validate: [validator.isMobilePhone, "Phone number is not valid"],
    },
    profile: {
      type: mongoose.Types.ObjectId,
      ref: "Profile",
    },
    address: {
      type: mongoose.Types.ObjectId,
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = parseInt(process.env.HASH_SALT as string, 10) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err as CallbackError);
  }
});

// Middleware to update changedPasswordTime before saving
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.changedPasswordTime = new Date(Date.now() - 1000);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if the password was changed after the token was issued
userSchema.methods.checkChangedPassword = function (JWTtime: number): boolean {
  if (this.changedPasswordTime) {
    const changedTimeInSeconds = Math.floor(
      this.changedPasswordTime.getTime() / 1000,
    );
    return JWTtime < changedTimeInSeconds;
  }
  return false;
};

// Method to create a password reset token
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

// Method to create an email verification token
userSchema.methods.createEmailVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return verificationToken;
};

// Method to check login attempts and lockout
userSchema.methods.checkLogin = function (): boolean {
  const now = Date.now();

  if (
    this.lastLoginAttempt &&
    now - this.lastLoginAttempt.getTime() <= 60 * 1000
  ) {
    if (this.loginAttempts < 10) {
      this.loginAttempts += 1;
      this.lastLoginAttempt = new Date(now);
      return true;
    } else {
      this.loginExpires = new Date(now + 60 * 60 * 1000);
      return false;
    }
  } else {
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
const User: IUserModel = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
