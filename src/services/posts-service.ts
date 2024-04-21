import { getAccessCodes } from "./user-service";

export async function getPosts(userId: string) {
  try {
    const codes = await getAccessCodes(userId);

    // get posts from twitter using tokens
    const posts = {};

    return { success: true, posts };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
