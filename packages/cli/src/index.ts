#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { generateCommand } from "./commands/generate";
import { analyzeCommand } from "./commands/analyze";
import { initCommand } from "./commands/init";

const program = new Command();

console.log("");
console.log(
  chalk.bold.cyan("  api-graph") + chalk.gray(" — Express API Flow Analyzer"),
);
console.log("");

program
  .name("api-graph")
  .description("Analyze and visualize Express.js API flow graphs")
  .version("1.0.0");

program
  .command("init [dir]")
  .description(
    "Initialize api-graph config in current (or specified) directory",
  )
  .action(async (dir?: string) => {
    await initCommand(dir);
  });

program
  .command("generate [dir]")
  .description("Analyze project and generate api-graph.json output")
  .action(async (dir?: string) => {
    await generateCommand(dir);
  });

program
  .command("analyze [dir]")
  .description("Start visualization server for generated output")
  .action(async (dir?: string) => {
    await analyzeCommand(dir);
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
