import express from "express";
import { CustomRequest } from "../types";
import { getPosts } from "../services/posts-service";
import { isUndefined } from "lodash";

const router = express.Router();

router.get("/", async (req: CustomRequest, res) => {
  try {
    if (isUndefined(req.userId)) {
      res.status(400).json({ success: false, message: "user id missing" });
      return;
    }

    const result = await getPosts(req.userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
