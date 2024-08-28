import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import User from "./entities/User";

const cognito = new CognitoIdentityProvider();
const { USER_POOL_ID: UserPoolId } = process.env;

export const createUser = async (userId) => {
  const user = await cognito.adminGetUser({
    UserPoolId,
    Username: userId,
  });
  if (!user.Enabled) {
    throw new Error("Unknown user.");
  }
  const name = user.UserAttributes?.find(({ Name }) => Name === "name");
  const { Attributes } = await User.update(
    {
      id: user.Username,
      created: new Date(user.UserCreateDate || 0).toISOString(),
      modified: new Date(user.UserLastModifiedDate || 0).toISOString(),
      email: user.UserAttributes?.find(({ Name }) => Name === "email")?.Value,
      name: name && name.Value,
    },
    {
      returnValues: "ALL_NEW",
    },
  );

  return Attributes;
};

export const updateUserAttributes = async (userId, attributes) =>
  cognito.adminUpdateUserAttributes({
    UserPoolId,
    Username: userId,
    UserAttributes: [
      {
        Name: "email_verified",
        Value: "true",
      },
      ...Object.entries(attributes).map(([Name, Value]) => ({ Name, Value })),
    ],
  });
