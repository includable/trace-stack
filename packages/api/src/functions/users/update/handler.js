import { middleware, auth } from "@includable/serverless-middleware";
import Joi from "joi";

import User from "../../../lib/entities/User";
import { createUser, updateUserAttributes } from "../../../lib/userManagement";

const dependencies = () => ({
  User,
  createUser,
});

const schema = Joi.object({
  displayName: Joi.string().min(3).max(60),
  name: Joi.string().min(3).max(120),
  email: Joi.string().email(),
  bio: Joi.string().max(500),
  avatar: Joi.string().uri({ scheme: ["https"] }),
});

export const app = async ({ userId, body }, { User, currentUser }) => {
  const id = userId || currentUser.id;
  if (id !== currentUser.id) {
    throw new Error("No permission to edit other users.");
  }

  // Validate input
  const input = await schema.validateAsync(body);

  // Update cognito
  const cognitoAllowedAttributesMap = {
    email: "email",
    name: "name",
    displayName: "nickname",
    avatar: "picture",
  };
  const cognitoAttributes = {};
  Object.entries(cognitoAllowedAttributesMap).forEach(
    ([attribute, cognitoName]) => {
      if (
        attribute in input &&
        input[attribute] &&
        input[attribute] !== currentUser[cognitoName]
      ) {
        cognitoAttributes[cognitoName] = input[attribute];
      }
    }
  );
  if (Object.keys(cognitoAttributes).length) {
    await updateUserAttributes(id, cognitoAttributes);
  }

  // Update db entry
  const { Attributes } = await User.update(
    { ...input, id },
    { returnValues: "all_new" }
  );

  // Output updated version
  return Attributes;
};

export const handler = middleware(app, [auth]).register(dependencies);
