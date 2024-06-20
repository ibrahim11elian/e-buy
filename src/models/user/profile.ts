import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProfile extends Document {
  bio?: string;
  photo?: string;
}

const profileSchema: Schema<IProfile> = new mongoose.Schema<IProfile>(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: false,
    },
    bio: {
      type: String,
    },
    photo: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Profile: Model<IProfile> = mongoose.model<IProfile>(
  "Profile",
  profileSchema,
);

export default Profile;
