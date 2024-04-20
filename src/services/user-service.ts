import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

import User, { IUser } from "../models/User";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY_TIME = "1 day";

function createUserToken(user: IUser) {
  if (!JWT_SECRET) throw new Error("JWT secret must be defined");
  return jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY_TIME,
  });
}

type ReturnableUserData = {
  username: string;
};

export async function login(username: string, password: string) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return { success: false, message: "Invalid credentials" };
    }

    const token = createUserToken(user);
    return { success: true, token, data: { username } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createAccount(username: string, password: string) {
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return { success: false, message: "Username already exists" };
    }

    const newUser = new User({ username, password });
    await newUser.save();
    const token = createUserToken(newUser);
    return { success: true, token, data: { username } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getUserFromToken(token: string) {
  if (!JWT_SECRET) throw new Error("JWT secret must be defined");
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded) {
      return { success: false, message: "Invalid token" };
    }

    // // Fetch the user from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    return { success: true, data: { username: user.username } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
