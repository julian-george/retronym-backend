import express from "express";
import {
  createAccount,
  getUserFromToken,
  login,
} from "../services/user-service";
import { CustomRequest } from "../types";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }
  const result = await createAccount(username, password);
  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }
  const result = await login(username, password);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(401).json(result);
  }
});

router.post("/login-token", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }
  const result = await getUserFromToken(token);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(401).json(result);
  }
});

export default router;
