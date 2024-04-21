import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { CustomRequest } from "../types";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  if (!JWT_SECRET) throw new Error("JWT Secret must be set!");
  // Get the token from the request header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extracting from format: "Bearer <TOKEN>"

  if (token == null) {
    return res.sendStatus(401); // If there is no token, unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || typeof decoded == "string" || !decoded?.id) {
      return res.sendStatus(403); // If the token is not valid, forbidden
    }
    const userId = decoded.id;

    if (userId) req.userId = userId;
    next(); // Move to the next middleware function or route handler
  });
}

export default authenticateToken;
