import mongoose, { Document, Model, Schema } from "mongoose";

export interface IToken extends Document {
  user: Schema.Types.ObjectId;
  refreshToken: string;
}

const tokensSchema: Schema<IToken> = new Schema<IToken>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "UserId is required"],
  },
  refreshToken: {
    type: String,
    required: [true, "Refresh token is required"],
  },
});

const RefreshToken: Model<IToken> = mongoose.model<IToken>(
  "Token",
  tokensSchema,
);

export default RefreshToken;
