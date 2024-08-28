import Joi from "joi";
import { middleware, auth } from "@includable/serverless-middleware";

import User from "../../../lib/entities/User";

const dependencies = () => ({
  User,
});

const schema = Joi.object().unknown(true);

export const app = async ({ body }, { User, currentUser }) => {
  // Validate input
  const data = await schema.validateAsync(body);

  // Update db entry
  let res;
  try {
    // Note the $set: ... in here!
    res = await User.update(
      {
        id: currentUser.id,
        preferences: { $set: data },
      },
      {
        returnValues: "all_new",
      }
    );
  } catch (e) {
    // Means the user doesn't yet exist
    res = await User.update(
      {
        id: currentUser.id,
        preferences: { ...data },
      },
      {
        returnValues: "all_new",
      }
    );
  }

  // Output updated version
  return res.Attributes.preferences;
};

export const handler = middleware(app, [auth]).register(dependencies);
