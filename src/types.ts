import { Request } from "express";

export type CustomRequest = Request & { userId?: string };

export enum Sites {
  twitter = "TWITTER",
  reddit = "REDDIT",
  youtube = "YOUTUBE",
}
