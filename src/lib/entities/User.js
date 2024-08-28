import { Entity } from "dynamodb-toolbox";
import { table } from "../database";

const User = new Entity({
  name: "User",
  table,
  timestamps: true,
  created: "createdAt",
  modified: "updatedAt",
  typeAlias: "type",
  attributes: {
    id: {
      partitionKey: true,
      prefix: "user#",
    },
    sk: {
      hidden: true,
      sortKey: true,
      default: "user",
    },
    preferences: {
      type: "map",
      default: {},
    },
    name: {
      type: "string",
      default: (data) => data.displayName || null,
    },
    displayName: {
      type: "string",
      default: (data) => data.name || null,
    },
    email: {
      type: "string",
      required: true,
    },
    emailValidated: {
      type: "boolean",
    },
    bio: {
      type: "string",
    },
    avatar: {
      type: "string",
    },
  },
});

export default User;
