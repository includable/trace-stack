#!/usr/bin/env node

import chalk from "chalk";
import boxen from "boxen";
import crypto from "crypto";
import inquirer from "inquirer";
import degit from "degit";
import child_process from "child_process";
import { mkdir, writeFile } from "fs/promises";

import {
  ApiGatewayV2Client,
  GetApisCommand,
} from "@aws-sdk/client-apigatewayv2";

// TODO: use previous token if it exists
const tracerToken = crypto.randomBytes(16).toString("hex");

const exec = (command, options = {}) => {
  const child = child_process.exec(command, {
    ...options,
    env: { ...process.env, ...(options.env || {}) },
  });

  child.stdout.on("data", function (data) {
    console.log(data?.trim());
  });
  child.stderr.on("data", function (data) {
    console.error(data?.trim());
  });

  return new Promise((resolve, reject) => {
    child.addListener("error", reject);
    child.addListener("exit", resolve);
  });
};

const getApiEndpoint = async () => {
  const apiGatewayV2Client = new ApiGatewayV2Client();

  const getApisCommand = new GetApisCommand({
    MaxResults: "1000",
  });
  const { Items } = await apiGatewayV2Client.send(getApisCommand);
  const item = Items.find((item) => item.Name === "dev-trace-stack");

  if (!item) {
    throw new Error(`API Gateway dev-trace-stack not found`);
  }

  return item.ApiEndpoint?.replace("https://", "");
};

// Intro text
console.log(
  boxen(
    `${chalk.blue(chalk.bold("TraceStack"))}\n` +
      `You're about to deploy TraceStack, a self-hosted serverless tracing tool. ` +
      `We'll ask you some questions, and then run the deployment for you, using your existing AWS credentials.`,
    { padding: 1, borderStyle: "round" },
  ) + "\n",
);

// Get our data
const questions = [
  {
    type: "input",
    name: "RETENTION_DAYS",
    message: "How many days do you want to retain data for?",
    default: 30,
    validate: (value) => {
      const valid = !Number.isNaN(Number.parseFloat(value));
      return valid || "Please enter a number";
    },
    filter: Number,
  },
  {
    type: "input",
    name: "CUSTOM_DOMAIN",
    message: "Do you want to use a custom domain (optional)?",
    validate: (value) => {
      const valid = !value || !!value.match(/^[a-z0-9-.]+$/);
      return valid || "Please enter a valid domain";
    },
  },
];
const answers = await inquirer.prompt(questions);

// Clone repo
console.log(chalk.blue("\nCloning TraceStack repo..."));
const cloner = degit("includable/trace-stack", {
  cache: false,
  verbose: true,
  force: true,
});
await mkdir("/tmp/trace-stack", { recursive: true });
await cloner.clone("/tmp/trace-stack");

// Install yarn dependencies
console.log(chalk.blue("Installing dependencies..."));
await exec("yarn install", { cwd: "/tmp/trace-stack" });

// Write config files
console.log(chalk.blue("Writing tracer config file..."));
await writeFile(
  "/tmp/trace-stack/packages/lambda-layer/config.json",
  JSON.stringify({ token: tracerToken }),
);

console.log(chalk.blue("Writing .env file..."));
await writeFile(
  "/tmp/trace-stack/packages/api/.env",
  `RETENTION_DAYS=${answers.RETENTION_DAYS}\n` +
    `CUSTOM_DOMAIN=${answers.CUSTOM_DOMAIN}\n` +
    `TRACER_TOKEN=${tracerToken}\n` +
    `HAS_CUSTOM_DOMAIN=${answers.CUSTOM_DOMAIN ? "true" : "false"}\n`,
);

// Deploy
console.log(chalk.blue("Deploying..."));
await exec("yarn deploy", { cwd: "/tmp/trace-stack" });

// Run auto-trace
const endpoint = await getApiEndpoint();
await fetch(`https://${endpoint}/api/auto-trace`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: tracerToken }),
});

// Create user
console.log(chalk.blue("Creating user..."));
// TODO: create user account in DDB

// Done
const domain = answers.CUSTOM_DOMAIN || endpoint;
console.log(
  "\n\n" +
    boxen(
      `${chalk.green("Done!")} You can now access your TraceStack instance at \n${chalk.underline(chalk.bold(`https://${domain}`))}`,
      { padding: 1, borderStyle: "round" },
    ),
);
