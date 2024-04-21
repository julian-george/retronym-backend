import express from "express";
import {
  getAccessCodes,
  setAccessCode,
  updatePreferences,
} from "../services/user-service";
import { CustomRequest } from "../types";

const router = express.Router();

router.patch("/preferences", async (req: CustomRequest, res) => {
  if (!req.userId) {
    res.status(403).end();
    return;
  }
  const userId = req.userId;
  const preferences = req.body;
  const result = await updatePreferences(userId, preferences);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

router.get("/oauthcodes", async (req: CustomRequest, res) => {
  const result = await getAccessCodes(req.userId ?? "");
  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

router.post("/setcode", async (req: CustomRequest, res) => {
  if (!req.userId) {
    res.status(403).end();
    return;
  }
  const { code, error, site, secret } = req.body;
  const userId = req.userId;

  if (error) {
    console.error("failed to set oauth code", error);
    res.status(500).send({ success: false, message: error });
  }

  if (secret !== process.env[`${site}_SECRET`]) {
    console.error(`${site} secret in state is not correct`);
    res.status(500).send({ success: false, message: "state does not match" });
  }
  await setAccessCode(site, userId, code); // convert to string
  res.status(200).send({ success: true });
});

export default router;
