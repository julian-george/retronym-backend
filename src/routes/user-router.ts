import express from "express";
import { getTokens, setToken } from "../services/user-service";
import { CustomRequest } from "../types";

const router = express.Router();
router.get("/oauthtokens", async (req: CustomRequest, res) => {
  console.log(req.userId);
  const result = await getTokens(req.userId ?? "");
  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

router.post("/settoken", async (req: CustomRequest, res) => {
  const { code, error, stateObject } = req.body;
  const [redirect, site, userId, secret] = stateObject;
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

  res.status(200).send({ sucess: true, redirect: redirect });
});

export default router;
