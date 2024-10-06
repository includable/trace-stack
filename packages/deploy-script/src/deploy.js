import chalk from "chalk";
import degit from "degit";
import child_process from "child_process";
import { mkdir, writeFile } from "fs/promises";

import {
  ApiGatewayV2Client,
  GetApisCommand,
} from "@aws-sdk/client-apigatewayv2";
import { checkHasUsers, createAdminUser } from "./users.js";

const exec = (command, options = {}) => {
  const child = child_process.exec(command, {
    ...options,
    env: { ...process.env, ...(options.env || {}) },
  });

  child.stdout?.on("data", function (data) {
    console.log(data?.trim());
  });
  child.stderr?.on("data", function (data) {
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
  const item = Items?.find((item) => item.Name === "dev-trace-stack");

  if (!item) {
    throw new Error(`API Gateway dev-trace-stack not found`);
  }

  return item.ApiEndpoint?.replace("https://", "");
};

const tmpPath = "/tmp/trace-stack";

const deploy = async (answers) => {
  // Clone repo
  console.log(chalk.blue("\nCloning TraceStack repo..."));
  const cloner = degit("includable/trace-stack", {
    cache: false,
    verbose: true,
    force: true,
  });
  await mkdir(tmpPath, { recursive: true });
  await cloner.clone(tmpPath);

  // Install yarn dependencies
  console.log(chalk.blue("Installing dependencies..."));
  await exec("yarn install", { cwd: tmpPath });

  // Write config files
  console.log(chalk.blue("Writing tracer config file..."));
  await writeFile(
    `${tmpPath}/packages/lambda-layer/config.json`,
    JSON.stringify({
      token: answers.tracerToken,
      retentionDays: answers.RETENTION_DAYS,
      customDomain: answers.CUSTOM_DOMAIN,
    }),
  );

  console.log(chalk.blue("Writing .env file..."));
  await writeFile(
    `${tmpPath}/packages/api/.env`,
    `RETENTION_DAYS=${answers.RETENTION_DAYS}\n` +
      `CUSTOM_DOMAIN=${answers.CUSTOM_DOMAIN}\n` +
      `TRACER_TOKEN=${answers.tracerToken}\n` +
      `HAS_CUSTOM_DOMAIN=${answers.CUSTOM_DOMAIN ? "true" : "false"}\n`,
  );

  // Deploy
  console.log(chalk.blue("Deploying..."));
  await exec("yarn deploy", { cwd: tmpPath });

  // Create user
  let adminPassword;
  if (await checkHasUsers()) {
    console.log(chalk.blue("User already exists"));
  } else {
    console.log(chalk.blue("Creating user..."));
    adminPassword = await createAdminUser();
  }

  // Run auto-trace
  console.log(chalk.blue("Auto tracing lambdas..."));
  const endpoint = await getApiEndpoint();
  try {
    await fetch(`https://${endpoint}/api/auto-trace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: answers.tracerToken }),
    });
  } catch (e) {}

  return { endpoint, adminPassword };
};

export default deploy;
