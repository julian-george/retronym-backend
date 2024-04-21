import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  comparePassword: (candidatePassword: string) => Promise<string>;
  getPublicData: () => IPublicUser;
  twitterCode: string;
  twitterToken: string;
  twitterRefreshToken: string;
  redditCode: string;
  redditToken: string;
  redditRefreshToken: string;
  youtubeCode: string;
  youtubeToken: string;
  preferences: IPreferences;
  youtubeRefreshToken: string;
}

export interface IPreferences {
  maxScrollingTime: number;
  searchTerms: string[];
}

export interface IPublicUser {
  _id: string;
  username: string;
  preferences: IPreferences;
}

const defaultPreferences: IPreferences = {
  maxScrollingTime: 30,
  searchTerms: [],
};

const preferenceSchema = new mongoose.Schema<IPreferences>({
  maxScrollingTime: Number,
  searchTerms: [String],
});

// Schema definition for the User.
const UserSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Removes whitespace from both ends of a string.
    minlength: 3,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  twitterCode: {
    type: String,
    required: false,
  },
  twitterToken: {
    type: String,
    required: false,
  },
  twitterRefreshToken: {
    type: String,
    required: false,
  },
  redditCode: {
    type: String,
    required: false,
  },
  redditToken: {
    type: String,
    required: false,
  },
  redditRefreshToken: {
    type: String,
    required: false,
  },
  youtubeCode: {
    type: String,
    required: false,
  },
  youtubeToken: {
    type: String,
    required: false,
  },
  preferences: {
    type: preferenceSchema,
    required: true,
    default: defaultPreferences,
  },
  youtubeRefreshToken: {
    type: String,
    required: false,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getPublicData = function (): IPublicUser {
  return {
    _id: this._id,
    username: this.username,
    preferences: this.preferences,
  };
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
