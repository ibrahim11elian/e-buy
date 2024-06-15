/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user/user";
import AppError from "../utils/error";
import Email from "../utils/email";
import mongoose from "mongoose";

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

      await new Email(
        createdUser[0],
        `${req.protocol}://${req.hostname}/api/v1/me`,
      ).sendWelcome();

      // the password not removed because this is not the final shape of this endpoint

      await session.commitTransaction();
      await session.endSession();
      res.status(200).json({
        status: "success",
        message: "User created successfully!",
        data: createdUser,
      });
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      next(error);
    }
  };

  login = async (req: Request, res: Response) => {
    const { user } = req;

    const token = this.generateToken({ id: user?._id });

    this.sendTokenCookie(token, req, res);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      accessToken: token,
    });
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie("jwt");

    res.status(200).json({
      status: "success",
    });
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

  generateToken(data: any) {
    const expiresIn = process.env.JWT_EXPIRES_IN as string;

    // Ensure expiresIn is correctly interpreted as a string or number
    const expiresInValue = isNaN(expiresIn as unknown as number)
      ? expiresIn
      : parseInt(expiresIn, 10);

    return jwt.sign(data, process.env.JWT_SECRET as string, {
      expiresIn: expiresInValue,
    });
  }

  verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  }

  sendTokenCookie = (token: string, req: Request, res: Response) => {
    const cookieExpiresIn = parseInt(
      process.env.JWT_COOKIE_EXPIRES_IN as string,
      10,
    );

    res.cookie("jwt", token, {
      // Set the cookie to expire in the specified time
      expires: new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000),
      // Send it in secure connection only (https)
      //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",
      // This will make it inaccessible from the browser
      httpOnly: true,
    });
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
      const { id, iat } = this.verifyToken(token);
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
            "You account is not verified, please check your email for verification link. ",
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

      const token = this.generateToken({ id: user._id });

      this.sendTokenCookie(token, req, res);

      res.status(200).json({
        status: "success",
        message: "Password updated successfully",
        token,
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
}

export default Authentication;
