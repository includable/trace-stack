#!/usr/bin/env node

import chalk from "chalk";
import boxen from "boxen";
import crypto from "crypto";
import inquirer from "inquirer";
import { readFile } from "fs/promises";

import deploy from "./deploy.js";

let previousConfig = {};
try {
  const tmpPath = "/tmp/trace-stack";
  const json = await readFile(
    `${tmpPath}/packages/lambda-layer/config.json`,
    "utf8",
  );
  previousConfig = JSON.parse(json);
} catch (e) {}

// TODO: use previous token if it exists
const tracerToken =
  previousConfig.token || `t_${crypto.randomBytes(16).toString("hex")}`;

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
    default: previousConfig.retentionDays || 30,
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
    default: previousConfig.customDomain || "",
    validate: (value) => {
      const valid = !value || !!value.match(/^[a-z0-9-.]+$/);
      return valid || "Please enter a valid domain";
    },
  },
];
const answers = await inquirer.prompt(questions);

const { endpoint } = await deploy({
  ...answers,
  tracerToken,
});

// Done
const domain = answers.CUSTOM_DOMAIN || endpoint;
console.log(
  "\n\n" +
    boxen(
      `${chalk.green("Done!")} You can now access your TraceStack instance at \n${chalk.underline(chalk.bold(`https://${domain}`))}`,
      { padding: 1, borderStyle: "round" },
    ),
);
