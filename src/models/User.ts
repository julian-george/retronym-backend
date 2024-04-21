import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  comparePassword: (candidatePassword: string) => Promise<string>;
  twitterCode: string;
  redditCode: string;
  youtubeCode: string;
}

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
  redditCode: {
    type: String,
    required: false,
  },
  youtubeCode: {
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

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
