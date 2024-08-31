import { middleware, auth } from "@includable/serverless-middleware";

import User from "../../../lib/entities/User";
import { createUser } from "../../../lib/userManagement";

const dependencies = () => ({
  User,
  createUser,
});

export const app = async ({ userId }, { User, currentUser }) => {
  let { Item: result } = await User.get({ id: userId || currentUser.id });
  if (!result && (!userId || userId === currentUser.id)) {
    // Create profile for user if it doesn't exist
    // using data from Cognito
    result = await createUser(currentUser.id);
  }

  if (!result) {
    throw new Error("User not found.");
  }

  const publicWhitelist = ["id", "displayName", "name", "avatar", "bio"];
  if (result.id === currentUser.id) {
    return result;
  }

  return Object.fromEntries(
    Object.entries(result).filter(([key]) => publicWhitelist.includes(key))
  );
};

export const handler = middleware(app, [auth]).register(dependencies);
