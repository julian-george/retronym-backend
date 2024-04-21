import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { isNull, isUndefined } from "lodash";

import User, { IUser, IPreferences } from "../models/User";
import { Sites } from "../types";
import axios from "axios";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY_TIME = "1 day";

function createUserToken(user: IUser) {
  if (!JWT_SECRET) throw new Error("JWT secret must be defined");
  return jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY_TIME,
  });
}

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
    return { success: true, token, data: user.getPublicData() };
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
    return { success: true, token, data: newUser.getPublicData() };
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

    return { success: true, data: user.getPublicData() };
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

export async function getAccessTokens(userId: string) {
  try {
    const user = await User.findById(userId);
    if (isNull(user)) {
      return { success: false, message: "no user found with this id." };
    }

    return {
      success: true,
      data: {
        twitter: user.twitterToken,
        reddit: user.redditToken,
        youtube: user.youtubeToken,
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

export async function updatePreferences(
  userId: string,
  newPreferences: Partial<IPreferences>
) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "no user found with this id." };
    }
    const { maxScrollingTime, searchTerms } = newPreferences;
    if (maxScrollingTime) user.preferences.maxScrollingTime = maxScrollingTime;
    if (searchTerms) user.preferences.searchTerms = searchTerms;
    await user.save();
    return { success: true, data: user.getPublicData() };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
export async function setAccessCode(site: Sites, userId: string, code: string) {
  try {
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
        break;
      case Sites.reddit:
        user.redditCode = code;
        break;
      case Sites.youtube:
        user.youtubeCode = code;
        break;
    }

    // save code in user document
    await user.save();

    await obtainAccessTokens(userId);

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/** use the access codes to obtain temporary access tokens */
export async function obtainAccessTokens(userId: string) {
  const user = await User.findById(userId);
  if (isNull(user)) throw new Error("could not find user");

  // for each token that is undefined but has a code,
  // get a token from the service

  if (!isUndefined(user.twitterCode) && isUndefined(user.twitterToken)) {
    // create params object
    const params = new URLSearchParams();
    params.append("client_id", process.env.TWITTER_CLIENT_ID ?? "");

    if (isUndefined(user.twitterRefreshToken)) {
      params.append("grant_type", "authorization_code");
      params.append("code_verifier", "challenge");
      params.append("code", user.twitterCode);
      const { accessToken, refreshToken } = await axios.post<
        typeof params,
        { accessToken: string; refreshToken: string }
      >("https://api.twitter.com/2/oauth2/token", params);

      user.twitterToken = accessToken;
      user.twitterRefreshToken = refreshToken;
    } else {
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", user.twitterRefreshToken);
      const { accessToken } = await axios.post<
        typeof params,
        { accessToken: string }
      >("https://api.twitter.com/2/oauth2/token", params);

      user.twitterToken = accessToken;
    }

    await user.save();
  }

  if (!isUndefined(user.redditCode) && isUndefined(user.redditToken)) {
    if (isUndefined(user.redditRefreshToken)) {
      const { access_token } = await axios.post<
        { grant_type: string; refresh_token: string },
        { access_token: string }
      >(
        "https://www.reddit.com/api/v1/access_token",
        {
          grant_type: "authorization_code",
          refresh_token: user.redditRefreshToken,
        },
        {
          auth: {
            username: process.env.REDDIT_CLIENT_ID ?? "",
            password: process.env.REDDIT_CLIENT_SECRET ?? "",
          },
        }
      );

      user.redditToken = access_token;
    } else {
      const { access_token, refresh_token } = await axios.post<
        { grant_type: string; code: string; redirect_uri: string },
        { access_token: string; refresh_token: string }
      >(
        "https://www.reddit.com/api/v1/access_token",
        {
          grant_type: "authorization_code",
          code: user.redditCode,
          redirect_uri: process.env.APP_REDIRECT,
        },
        {
          auth: {
            username: process.env.REDDIT_CLIENT_ID ?? "",
            password: process.env.REDDIT_CLIENT_SECRET ?? "",
          },
        }
      );

      user.redditToken = access_token;
      user.redditRefreshToken = refresh_token;
    }

    await user.save();
  }

  if (!isUndefined(user.youtubeCode) && isUndefined(user.youtubeToken)) {
    // create params object
    const params = new URLSearchParams();
    params.append("client_id", process.env.YOUTUBE_CLIENT_ID ?? "");
    params.append("client_secret", process.env.YOUTUBE_CLIENT_SECRET ?? "");
    params.append("grant_type", "authorization_code");
    if (isUndefined(user.youtubeRefreshToken)) {
      params.append("code", user.youtubeCode);
      params.append("redirect_uri ", process.env.APP_REDIRECT ?? "");

      const { access_token, refresh_token } = await axios.post<
        typeof params,
        { access_token: string; refresh_token: string }
      >("https://oauth2.googleapis.com/token", params);

      user.youtubeToken = access_token;
      user.youtubeRefreshToken = refresh_token;
    } else {
      params.append("refresh_token", user.youtubeRefreshToken);
      const { access_token } = await axios.post<
        typeof params,
        { access_token: string }
      >("https://oauth2.googleapis.com/token", params);

      user.youtubeToken = access_token;
    }

    await user.save();
  }
}
