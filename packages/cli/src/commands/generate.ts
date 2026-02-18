import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import ora from "ora";
import { Analyzer, loadConfig } from "@api-graph/core";

export async function generateCommand(targetDir?: string): Promise<void> {
  const rootDir = targetDir ? path.resolve(targetDir) : process.cwd();

  console.log("");
  console.log(chalk.bold.cyan("⚡ api-graph generate"));
  console.log(chalk.gray(`   Project: ${rootDir}`));
  console.log("");

  // Load config
  const config = loadConfig(rootDir);
  config.rootDir = rootDir;

  const outputFile = path.join(rootDir, config.outputFile || "api-graph.json");

  console.log(chalk.gray(`   Include: ${config.include.join(", ")}`));
  console.log(chalk.gray(`   Output:  ${outputFile}`));
  console.log("");

  const spinner = ora("Analyzing project...").start();

  try {
    const analyzer = new Analyzer(config);
    const result = await analyzer.analyze();

    spinner.stop();

    // Save output
    fs.writeFileSync(
      outputFile,
      JSON.stringify(result.graph, null, 2),
      "utf-8",
    );

    // Print summary
    console.log(chalk.green("✅ Analysis complete!"));
    console.log("");
    console.log(chalk.bold("📊 Summary:"));
    console.log(
      `   ${chalk.green("Routes:").padEnd(20)} ${result.summary.routeCount}`,
    );
    console.log(
      `   ${chalk.blue("Classes:").padEnd(20)} ${result.summary.controllerCount}`,
    );
    console.log(
      `   ${chalk.magenta("Functions:").padEnd(20)} ${result.summary.functionCount}`,
    );
    console.log(
      `   ${chalk.gray("Total nodes:").padEnd(20)} ${result.summary.totalNodes}`,
    );
    console.log(
      `   ${chalk.gray("Total edges:").padEnd(20)} ${result.summary.totalEdges}`,
    );
    console.log(
      `   ${chalk.gray("Files scanned:").padEnd(20)} ${result.summary.fileCount}`,
    );
    console.log("");

    if (result.summary.routeCount === 0) {
      console.log(chalk.yellow("⚠️  No routes detected."));
      console.log(
        chalk.gray("   Make sure your route files are included in config."),
      );
      console.log(
        chalk.gray("   Try: api-graph init to create a config file."),
      );
      console.log("");
    }

    console.log(chalk.gray(`   Saved to: ${outputFile}`));
    console.log("");
    console.log(chalk.bold("Next step:"));
    console.log(chalk.cyan("   api-graph analyze"));
    console.log("");
  } catch (error) {
    spinner.stop();
    console.error(chalk.red("❌ Analysis failed:"));
    console.error(chalk.red((error as Error).message));
    console.error((error as Error).stack);
    process.exit(1);
  }
}
