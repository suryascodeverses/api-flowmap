import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";

const DEFAULT_CONFIG = {
  name: "",
  include: ["src/**/*.ts", "src/**/*.js"],
  exclude: [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.spec.js",
    "**/*.test.js",
  ],
  outputFile: "api-graph.json",
};

export async function initCommand(targetDir?: string): Promise<void> {
  const rootDir = targetDir ? path.resolve(targetDir) : process.cwd();
  const configPath = path.join(rootDir, "api-graph.config.json");

  console.log("");
  console.log(chalk.bold.cyan("⚡ api-graph init"));
  console.log(chalk.gray(`   Directory: ${rootDir}`));
  console.log("");

  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow("⚠️  api-graph.config.json already exists."));
    console.log(chalk.gray("   Delete it first if you want to re-initialize."));
    console.log("");
    return;
  }

  // Try to detect project name from package.json
  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      DEFAULT_CONFIG.name = pkg.name || path.basename(rootDir);
    } catch {
      /* ignore */
    }
  } else {
    DEFAULT_CONFIG.name = path.basename(rootDir);
  }

  // Detect if project has a src/ directory
  const hasSrc = fs.existsSync(path.join(rootDir, "src"));
  if (!hasSrc) {
    DEFAULT_CONFIG.include = ["**/*.ts", "**/*.js"];
  }

  fs.writeFileSync(
    configPath,
    JSON.stringify(DEFAULT_CONFIG, null, 2),
    "utf-8",
  );

  console.log(chalk.green("✅ Created api-graph.config.json"));
  console.log("");
  console.log(chalk.bold("📝 Config:"));
  console.log(chalk.gray(JSON.stringify(DEFAULT_CONFIG, null, 2)));
  console.log("");
  console.log(chalk.bold("Next steps:"));
  console.log(
    chalk.cyan("   api-graph generate   ") +
      chalk.gray("→ analyze your project"),
  );
  console.log(
    chalk.cyan("   api-graph analyze    ") + chalk.gray("→ open visualization"),
  );
  console.log("");
}
