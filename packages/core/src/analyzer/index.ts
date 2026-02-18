import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";
import {
  ApiGraph,
  ApiGraphConfig,
  AnalysisResult,
  GraphEdge,
  DEFAULT_CONFIG,
} from "../types";
import { NodeCollector } from "./node-collector";
import { RouteDetector } from "./route-detector";
import { CallDetector } from "./call-detector";
import { resetIdCounter } from "../utils/helpers";

export class Analyzer {
  private project: Project;

  constructor(private config: ApiGraphConfig) {
    this.project = new Project({
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
    });
  }

  async analyze(): Promise<AnalysisResult> {
    resetIdCounter();
    const startTime = Date.now();

    console.log("🔍 Loading source files...");
    this.loadSourceFiles();

    const sourceFiles = this.project.getSourceFiles();
    console.log(`   Found ${sourceFiles.length} files to analyze`);

    // Step 1: Collect all nodes (classes, methods, functions)
    console.log("📦 Collecting nodes...");
    const collector = new NodeCollector(this.project);
    const { nodes: nodeMap, edges: containsEdges } = collector.collect();
    console.log(`   Found ${nodeMap.size} nodes`);

    // Step 2: Detect routes
    console.log("🛣️  Detecting routes...");
    const routeDetector = new RouteDetector(this.project, nodeMap);
    const { routes, edges: routeEdges } = routeDetector.detect();
    console.log(`   Found ${routes.length} routes`);

    // Step 3: Detect method calls
    console.log("🔗 Detecting call relationships...");
    const callDetector = new CallDetector(this.project, nodeMap);
    const callEdges = callDetector.detect();
    console.log(`   Found ${callEdges.length} call relationships`);

    // Step 4: Build final graph
    const allNodes = [...Array.from(nodeMap.values()), ...routes];

    const containsEdgesFormatted: GraphEdge[] = containsEdges.map((e) => ({
      id: `edge_${e.source}_${e.target}`,
      source: e.source,
      target: e.target,
      type: e.type as any,
      label: e.label,
    }));

    const allEdges: GraphEdge[] = [
      ...containsEdgesFormatted,
      ...routeEdges,
      ...callEdges,
    ];

    // Deduplicate edges
    const uniqueEdges = this.deduplicateEdges(allEdges);

    const graph: ApiGraph = {
      nodes: allNodes,
      edges: uniqueEdges,
      metadata: {
        projectName: this.config.name || path.basename(this.config.rootDir),
        projectPath: this.config.rootDir,
        analyzedAt: new Date().toISOString(),
        fileCount: sourceFiles.length,
        framework: "express",
        version: "1.0.0",
      },
    };

    const summary = this.buildSummary(graph);

    console.log(`✅ Analysis complete in ${Date.now() - startTime}ms`);

    return { graph, summary };
  }

  private loadSourceFiles(): void {
    const {
      include = DEFAULT_CONFIG.include!,
      exclude = DEFAULT_CONFIG.exclude!,
    } = this.config;

    for (const pattern of include) {
      const fullPattern = path.isAbsolute(pattern)
        ? pattern
        : path.join(this.config.rootDir, pattern);

      try {
        const added = this.project.addSourceFilesAtPaths(fullPattern);

        // Remove excluded files
        for (const sourceFile of added) {
          const filePath = sourceFile.getFilePath();
          const shouldExclude = (exclude || []).some((excPattern) => {
            return this.matchesPattern(filePath, excPattern);
          });

          if (shouldExclude) {
            this.project.removeSourceFile(sourceFile);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not load pattern: ${fullPattern}`);
      }
    }
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching for common cases
    const normalized = filePath.replace(/\\/g, "/");

    if (pattern.includes("node_modules"))
      return normalized.includes("node_modules");
    if (pattern.includes("dist")) return normalized.includes("/dist/");
    if (pattern.includes("build")) return normalized.includes("/build/");
    if (pattern.includes("*.spec.")) return normalized.includes(".spec.");
    if (pattern.includes("*.test.")) return normalized.includes(".test.");

    return false;
  }

  private deduplicateEdges(edges: GraphEdge[]): GraphEdge[] {
    const seen = new Set<string>();
    return edges.filter((edge) => {
      const key = `${edge.source}:${edge.target}:${edge.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private buildSummary(graph: ApiGraph) {
    return {
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      routeCount: graph.nodes.filter((n) => n.type === "route").length,
      controllerCount: graph.nodes.filter((n) => n.type === "class").length,
      middlewareCount: graph.nodes.filter((n) => n.type === "middleware")
        .length,
      functionCount: graph.nodes.filter((n) => n.type === "function").length,
      fileCount: graph.metadata.fileCount,
    };
  }
}

// ─── Config Loader ────────────────────────────────────────────────────────────

export function loadConfig(rootDir: string): ApiGraphConfig {
  const configPath = path.join(rootDir, "api-graph.config.json");

  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      const userConfig = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        rootDir,
        ...userConfig,
      } as ApiGraphConfig;
    } catch {
      console.warn("⚠️  Could not parse api-graph.config.json, using defaults");
    }
  }

  // Default: detect src or current directory
  const hasSrc = fs.existsSync(path.join(rootDir, "src"));

  return {
    ...(DEFAULT_CONFIG as ApiGraphConfig),
    rootDir,
    include: hasSrc ? ["src/**/*.ts", "src/**/*.js"] : ["**/*.ts", "**/*.js"],
  };
}
