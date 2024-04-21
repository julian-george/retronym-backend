import express from "express";
import {
  createAccount,
  getTokens,
  getUserFromToken,
  login,
  setToken,
} from "../services/user-service";
import { CustomRequest } from "../types";

const router = express.Router();

router.get("/oauthtokens", async (req: CustomRequest, res) => {
  const result = await getTokens(req.userId ?? "");

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

router.post("/register", async (req: CustomRequest, res) => {
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

router.post("/login", async (req: CustomRequest, res) => {
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

router.post("/settoken", async (req: CustomRequest, res) => {
  const { code, error, stateObject } = req.body;

  const { site, userId, secret } = stateObject;

  if (error) {
    console.error("failed to set oauth token", error);
    res.status(500).send({ success: false, message: error });
  }

  if (secret !== process.env[`${site}_SECRET`]) {
    console.error(`${site} secret in state is not correct`);
    res.status(500).send({ success: false, message: "state does not match" });
  }

  await setToken(site, userId, code); // convert to string
  console.log(`${site} token set to ${req.query.code}`);

  res.status(200).send({ sucess: true });
});

router.post("/login-token", async (req: CustomRequest, res) => {
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
