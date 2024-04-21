import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { isNull } from "lodash";

import User, { IUser } from "../models/User";
import { Sites } from "../types";

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
    return { success: true, token, data: { id: user._id, username } };
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
    return { success: true, token, data: { id: newUser._id, username } };
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

    return { success: true, data: { id: user._id, username: user.username } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getAccessCodes(userId: string) {
  try {
    const user = await User.findById(userId);
    if (isNull(user)) {
      return { success: false, message: "no user found with this id." };
    }

    return {
      success: true,
      data: {
        twitter: !!user.twitterCode,
        reddit: !!user.redditCode,
        youtube: !!user.youtubeCode,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * save oauth codes to the user's document in the database.
 * fetch and use this every time you search for posts etc
 */
export async function setAccessCode(site: Sites, userId: string, code: string) {
  const user = await User.findById(userId);
  if (isNull(user)) {
    return { success: false, message: "no user found with this id." };
  }

  // i tried this but it doesn't work:
  // user[`${site.toLowerCase()}Code` as keyof IUser] = code;
  // so i used a switch for time reasons
  switch (site) {
    case Sites.twitter:
      user.twitterCode = code;
    case Sites.reddit:
      user.redditCode = code;
    case Sites.youtube:
      user.youtubeCode = code;
  }

  // save code in user document
  await user.save();

  return { success: true };
}
