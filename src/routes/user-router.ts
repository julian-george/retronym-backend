import express from "express";
import { createAccount, login, setToken } from "../services/user-service";
import { CustomRequest } from "../types";

const router = express.Router();

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
  const { site, state, code, error } = req.body;

  const [secret, userId] = state.split("-");

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

  res.status(200).send();
});

export default router;
