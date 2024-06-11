/* eslint-disable no-undef */
import crypto from "crypto";
import mongoose, { CallbackError } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
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
  },
);

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

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.changedPasswordTime = (Date.now() - 1000) as unknown as Date;
  next();
});

userSchema.methods.comparePassword = async function (pass: string, storedPass: string) {
  return await bcrypt.compare(pass, storedPass);
};

userSchema.methods.checkChangedPassword = function (JWTtime: number) {
  if (this.changedPasswordTime) {
    // change the changedPasswordTime from milliseconds to be in seconds as the JWT timeStamp is in seconds
    const changedTimeInSeconds = parseInt((this.changedPasswordTime.getTime() / 1000) as unknown as string, 10);

    return JWTtime < changedTimeInSeconds;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

userSchema.methods.checkLogin = function () {
  // Get the current timestamp
  const now = Date.now();

  // Check if the last login attempt was within the last minute
  if (this.lastLoginAttempt && now - this.lastLoginAttempt <= 60 * 1000) {
    // If login attempts are less than 10, increment attempts and allow login
    if (this.loginAttempts < 10) {
      this.loginAttempts += 1;
      this.lastLoginAttempt = now;
      return true;
    } else {
      // If login attempts exceed 10, set a lockout period of 1 hour and deny login
      this.loginExpires = now + 60 * 60 * 1000;
      return false;
    }
  } else {
    // If last login attempt was more than a minute ago, check if a lockout period is set
    if (this.loginExpires) {
      // If the lockout period has not expired, deny login
      if (this.loginExpires > now) {
        return false;
      } else {
        // If the lockout period has expired, clear the lockout
        this.loginExpires = undefined;
      }
    }
    // Reset login attempts and set the last login attempt time
    this.loginAttempts = 1;
    this.lastLoginAttempt = now;
    return true; // Allow login
  }
};

const User = mongoose.model("User", userSchema);

export default User;
