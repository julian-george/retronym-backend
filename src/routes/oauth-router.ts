import express from "express";
import dotenv from "dotenv";
import { setTwitterToken } from "../services/user-service";
import { CustomRequest } from "../types";

dotenv.config();

const router = express.Router();

/**
 * twitter will call this route with the access token in query.code
 * after user authenticates in the app.
 * we save this token in the database associated with the user
 * and fetch and use it every time a posts request is made
 */
router.post("/twitter", async (req: CustomRequest, res) => {
  console.log("received request from twitter:");
  console.log(req);

  const [state, userId] = `${req.query.state}`.split("-");
  if (state !== process.env.TWITTER_STATE) {
    console.error("twitter state is not correct (?)");
    res.status(200).send(); // i don't know what twitter does with this response
  }

  await setTwitterToken(userId, `${req.query.code}`); // convert to string
  console.log(`token set to ${req.query.code}`);

  res.status(200).send();
});

export default router;
