import { middleware, auth } from "@includable/serverless-middleware";

import User from "../../../lib/entities/User";

const dependencies = () => ({
  User,
});

export const app = async (event, { User, currentUser }) => {
  let { Item: result } = await User.get({ id: currentUser.id });

  return (result && result.preferences) || {};
};

export const handler = middleware(app, [auth]).register(dependencies);
