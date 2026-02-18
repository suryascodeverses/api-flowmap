import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import { createServer } from "@api-graph/server";

export async function analyzeCommand(targetDir?: string): Promise<void> {
  const rootDir = targetDir ? path.resolve(targetDir) : process.cwd();

  const outputFile = path.join(rootDir, "api-graph.json");

  console.log("");
  console.log(chalk.bold.cyan("⚡ api-graph analyze"));
  console.log(chalk.gray(`   Project: ${rootDir}`));
  console.log("");

  // Check if output file exists
  if (!fs.existsSync(outputFile)) {
    console.log(chalk.yellow("⚠️  No api-graph.json found."));
    console.log(chalk.gray("   Run this first:"));
    console.log(chalk.cyan("   api-graph generate"));
    console.log("");
    process.exit(1);
  }

  const PORT = parseInt(process.env.PORT || "4000", 10);

  try {
    const server = createServer({
      graphFilePath: outputFile,
      port: PORT,
    });

    server.listen(PORT, () => {
      console.log(chalk.green("✅ Server started!"));
      console.log("");
      console.log(chalk.bold("📊 API Graph Viewer:"));
      console.log(`   ${chalk.cyan.underline(`http://localhost:${PORT}`)}`);
      console.log("");
      console.log(chalk.gray("   Press Ctrl+C to stop"));
      console.log("");
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("");
      console.log(chalk.gray("Shutting down..."));
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error(chalk.red("❌ Failed to start server:"));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
