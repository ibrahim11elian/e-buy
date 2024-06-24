/* eslint-disable no-unused-vars */
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/user/user";
import AppError from "../../utils/error";
import Email from "../../utils/email";
import mongoose from "mongoose";
import RefreshToken from "../../models/user/tokens";
import { promisify } from "util";
interface JwtPayload {
  id: string;
  iat: number;
}

class Authentication {
  constructor() {}

  signup = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newUser = req.body;
      const existingUser = await User.findOne({ email: newUser.email }).session(
        session,
      );

      if (existingUser) {
        return next(new AppError("This user is already exist!", 400));
      }

      const createdUser = await User.create(
        [
          {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
          },
        ],
        { session },
      );

      const verificationToken = createdUser[0].createEmailVerificationToken();

      await createdUser[0].save({ session });

      // send email verification
      const url = `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token=${verificationToken}`;

      await new Email(createdUser[0], url).sendVerification();

      await session.commitTransaction();
      await session.endSession();
      res.status(200).json({
        status: "success",
        message:
          "User created successfully, please check ypu email to validate your account.",
      });
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      next(error);
    }
  };

  login = async (req: Request, res: Response) => {
    const { user } = req;

    // Generate JWT
    const accessToken = this.generateToken(
      { id: user._id },
      process.env.JWT_SECRET as string,
      process.env.JWT_EXPIRES_IN as string,
    );
    const refreshToken = this.generateToken(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET as string,
      process.env.JWT_REFRESH_EXPIRES_IN as string,
    );

    await RefreshToken.create({
      refreshToken,
      user: user._id,
    });

    this.sendTokenCookie(accessToken, req, res);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      accessToken,
      refreshToken,
    });
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return next(new AppError("Refresh token is missing", 400));
      }

      await this.verifyToken(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      );

      await RefreshToken.findOneAndDelete({ refreshToken });

      res.clearCookie("jwt");

      res.status(204).json({
        status: "success",
      });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(new AppError("Refresh token required", 400));
      }

      // Verify refresh token
      const { id } = await this.verifyToken(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      );

      // Delete all refresh tokens corresponded to this user
      await RefreshToken.deleteMany({ user: id });

      res.clearCookie("jwt");

      res.status(204).json({
        status: "success",
        message: "Logged out successfully from all devices.",
      });
    } catch (error) {
      next(error);
    }
  };

  validateLoginAttempt = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = req.body;

      // Check if email and password are provided
      if (!email || !password) {
        return next(
          new AppError(
            "Missing information: you must provide both email and password.",
            400,
          ),
        );
      }

      // Retrieve the user by email, ensure the user is active, and select the required fields
      const user = await User.findOne({ email }).select([
        "+password",
        "+loginAttempts",
        "+loginExpires",
        "+lastLoginAttempt",
        "+isVerified",
      ]);

      // Check if the user exists
      if (!user) {
        return next(new AppError("Invalid email or password!", 401));
      }

      if (!user.isVerified) {
        return next(
          new AppError(
            "You account is not verified yet, please check your email for verification link.",
            401,
          ),
        );
      }

      // Check login attempt limits
      if (!user.checkLogin()) {
        await user.save(); // Save the state in case login attempt count or lockout has been updated
        const minutesRemaining = (
          ((user.loginExpires as unknown as number) - Date.now()) /
          1000 /
          60
        ).toFixed();

        return next(
          new AppError(
            `You have reached the maximum login attempts, please try again in ${minutesRemaining} Minutes.`,
            401,
          ),
        );
      }

      // Save the user state after updating login attempts
      await user.save();

      // Compare the provided password with the stored password
      if (!(await user.comparePassword(password))) {
        return next(new AppError("Invalid email or password!", 401));
      }

      req.user = user;

      next();
    } catch (error) {
      next(error); // Pass any errors to the error handling middleware
    }
  };

  generateToken(data: any, secret: string, expiresIn: string) {
    // Ensure expiresIn is correctly interpreted as a string or number
    const expiresInValue = isNaN(expiresIn as unknown as number)
      ? expiresIn
      : parseInt(expiresIn, 10);

    return jwt.sign(data, secret, {
      expiresIn: expiresInValue,
    });
  }

  async verifyToken(token: string, secret: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as JwtPayload);
        }
      });
    });
  }

  sendTokenCookie = (token: string, req: Request, res: Response) => {
    const cookieExpiresIn = parseInt(
      process.env.JWT_COOKIE_EXPIRES_IN as string,
      10,
    );

    res.cookie("jwt", token, {
      // Set the cookie to expire in the specified time
      expires: new Date(Date.now() + cookieExpiresIn * 60 * 1000),
      // Send it in secure connection only (https)
      //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",
      // This will make it inaccessible from the browser
      httpOnly: true,
    });
  };

  // Refresh Token middleware
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return next(new AppError("refresh token is required.", 401));
      }

      const token = await RefreshToken.findOne({ refreshToken });
      if (!token) {
        return next(new AppError("refresh token is invalid.", 401));
      }

      // Verify the refresh token
      await this.verifyToken(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      );

      const accessToken = this.generateToken(
        { id: token.user },
        process.env.JWT_SECRET as string,
        process.env.JWT_EXPIRES_IN as string,
      );

      // Create a new refresh token
      const newRefreshToken = this.generateToken(
        { id: token.user },
        process.env.JWT_REFRESH_SECRET as string,
        process.env.JWT_REFRESH_EXPIRES_IN as string,
      );

      // Update the refresh token in the database
      token.refreshToken = newRefreshToken;
      await token.save();

      // Send the new access token and refresh token
      this.sendTokenCookie(accessToken, req, res);
      res.status(200).json({
        status: "success",
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(error);
    }
  };

  // middleware to check if the user is authenticated
  protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token;

      // get the token from request header
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
      }

      if (!token) {
        return next(
          new AppError(
            "You are not logged in! Please log in to get access.",
            401,
          ),
        );
      }

      // check if the user exists
      const { id, iat } = await this.verifyToken(
        token,
        process.env.JWT_SECRET as string,
      );
      const user = await User.findById(id).select("+isVerified");
      if (!user) {
        return next(
          new AppError(
            "The user belonging to this token does no longer exist.",
            401,
          ),
        );
      }

      if (!user.isVerified) {
        return next(
          new AppError(
            "You account is not verified, please check your email for verification link.",
            401,
          ),
        );
      }

      // check if the user changed the password and the token is issued after user changing it
      if (user.checkChangedPassword(iat)) {
        return next(
          new AppError(
            "User changed the password, login again to get a new token.",
            401,
          ),
        );
      }

      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password, newPassword } = req.body;

      // check for passwords
      if (!password || !newPassword)
        return next(
          new AppError(
            "Missing information you have to provide password and newPassword",
            400,
          ),
        );

      // this one we get from the protect middleware
      const { _id } = req.user;
      const user = await User.findById(_id).select("+password");

      // Check if user exists
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // check if the password is correct
      if (!(await user.comparePassword(password))) {
        return next(new AppError("password is wrong!", 401));
      }

      user.password = newPassword;

      // do not forget that we have a middleware that take care of hashing the password for us
      await user?.save();

      const accessToken = this.generateToken(
        { id: user?._id },
        process.env.JWT_SECRET as string,
        process.env.JWT_EXPIRES_IN as string,
      );

      this.sendTokenCookie(accessToken, req, res);

      res.status(200).json({
        status: "success",
        message: "Password updated successfully",
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      return next(
        new AppError("Missing information you have to provide email", 400),
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (
      user.passwordResetToken &&
      user.passwordResetExpires &&
      user.passwordResetExpires.getTime() > Date.now()
    ) {
      return next(new AppError("Password reset token is already sent", 400));
    }
    try {
      // generate random reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

      await new Email(user, resetURL).sendResetPassword();

      res.status(200).json({
        status: "success",
        message: "Token was sent successfully to your email.",
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          "There was an error sending the email, try again later.",
          500,
        ),
      );
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      if (!token) {
        return next(
          new AppError("Missing information you have to provide token", 400),
        );
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      // check if the user is exist and the token has not expired
      //  then set the new password
      if (!user) {
        return next(new AppError("The token is expired or invalid", 400));
      }

      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      // send jwt token to the user
      const accessToken = this.generateToken(
        { id: user?._id },
        process.env.JWT_SECRET as string,
        process.env.JWT_EXPIRES_IN as string,
      );

      this.sendTokenCookie(accessToken, req, res);

      res.status(200).json({
        status: "success",
        message: "the password was reset successfully",
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  restrictTo(...role: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!role.includes(req.user.role)) {
        return next(
          new AppError(
            "You do not have permission to perform this action",
            403,
          ),
        );
      }

      next();
    };
  }

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const confirmToken = req.query.token;

      if (!confirmToken) {
        return next(new AppError("token is missing", 400));
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(confirmToken as string)
        .digest("hex");

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
      }).select("+isVerified");

      if (!user) {
        return next(
          new AppError(
            "Email verification token is invalid or has expired.",
            400,
          ),
        );
      }

      user.isVerified = true;
      user.emailVerificationToken = undefined as unknown as string;
      user.emailVerificationExpires = undefined as unknown as Date;
      await user.save();

      const url = `${req.protocol}://${req.get("host")}/me`;
      await new Email(user, url).sendWelcome();

      res.status(201).json({
        status: "success",
        message: "Email has been successfully verified, You can login now",
      });
    } catch (error) {
      next(error);
    }
  };

  resendVerificationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email }).select([
        "+isVerified",
        "+emailVerificationExpires",
        "+emailVerificationToken",
      ]);

      if (!user) {
        return next(new AppError("User not found.", 400));
      }

      if (user.isVerified) {
        return next(new AppError("Email is already verified.", 400));
      }

      if (
        user.emailVerificationExpires &&
        user.emailVerificationExpires.getTime() > Date.now()
      ) {
        return next(
          new AppError("Email verification token is still valid.", 400),
        );
      }

      // Clear previous token and expiration date
      user.emailVerificationToken = undefined as unknown as string;
      user.emailVerificationExpires = undefined as unknown as Date;
      await user.save({ validateBeforeSave: false });

      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const url = `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token=${verificationToken}`;
      await new Email(user, url).sendVerification();

      res.status(200).json({
        status: "success",
        message: "New verification email sent.",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default Authentication;
