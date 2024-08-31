#!/usr/bin/env node

import chalk from "chalk";
import boxen from "boxen";
import inquirer from "inquirer";
import degit from "degit";
import child_process from "child_process";
import { mkdir, writeFile } from "fs/promises";

const exec = (command, options = {}) => {
  const child = child_process.exec(command, options);
  child.stdout.on("data", function (data) {
    console.log(data.trim());
  });
  child.stderr.on("data", function (data) {
    console.error(data);
  });

  return new Promise((resolve, reject) => {
    child.addListener("error", reject);
    child.addListener("exit", resolve);
  });
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
];
const answers = await inquirer.prompt(questions);

// Clone repo
console.log(chalk.blue("Cloning TraceStack repo..."));
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

// Write .env file
console.log(chalk.blue("Writing .env file..."));
await writeFile(
  "/tmp/trace-stack/packages/api/.env",
  `RETENTION_DAYS=${answers.RETENTION_DAYS}\n`,
);

// Deploy
console.log(chalk.blue("Deploying..."));
await exec("yarn deploy", { cwd: "/tmp/trace-stack" });
