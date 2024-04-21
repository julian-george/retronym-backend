import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  comparePassword: (candidatePassword: string) => Promise<string>;
  getPublicData: () => IPublicUser;
  twitterToken: string;
  redditToken: string;
  youtubeToken: string;
  preferences: IPreferences;
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
  twitterToken: {
    type: String,
    required: false,
  },
  redditToken: {
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
