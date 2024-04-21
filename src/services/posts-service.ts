import axios from "axios";
import { getAccessTokens } from "./user-service";
import User from "../models/User";
import { isNull, isUndefined } from "lodash";

const POSTS_PER_REQUEST = 1;

export async function getPosts(userId: string) {
  try {
    const user = await User.findById(userId);

    if (isNull(user)) {
      throw new Error("could not find user with this id");
    }

    const codes = await getAccessTokens(userId);

    const posts = { twitterPosts: null, redditPosts: null, youtubePosts: null };

    // get id, otherwise use one from user
    if (isUndefined(user.twitterId)) {
      const twitterId = (
        await axios.get<{ data: { id: string } }>(
          "https://api.twitter.com/2/users/me?user.fields=id",
          { headers: { Authorization: `Bearer ${user.twitterToken}` } }
        )
      ).data.data.id;
      user.twitterId = twitterId;
      await user.save();
    }

    const twitterPosts = (
      await axios.get(
        "https://api.twitter.com/2/users/" +
          user.twitterId +
          "/timelines/reverse_chronological?tweet.fields=text&expansions=author_id&max_results=" +
          POSTS_PER_REQUEST.toString(),
        { headers: { Authorization: `Bearer ${user.twitterToken}` } }
      )
    ).data;
    posts.twitterPosts = twitterPosts;

    // const redditPosts = (await axios.get("https://api.reddit.com/best")).data;
    // posts.redditPosts = redditPosts;

    // const youtubePosts = (
    //   await axios.get("https://www.googleapis.com/youtube/v3/search")
    // ).data;
    // posts.youtubePosts = youtubePosts;

    return { success: true, posts };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
