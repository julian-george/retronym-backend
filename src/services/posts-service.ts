import { getTokens } from "./user-service";

export async function getPosts(userId: string) {
  try {
    const tokens = await getTokens(userId);

    // get posts from twitter using twitter token
    const posts = {};

    return { success: true, posts };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
