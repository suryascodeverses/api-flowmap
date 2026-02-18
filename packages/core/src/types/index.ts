// ─────────────────────────────────────────────
// Node Types
// ─────────────────────────────────────────────

export type NodeType =
  | "route"
  | "controller"
  | "middleware"
  | "function"
  | "class"
  | "method";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD"
  | "ALL";

export interface BaseNode {
  id: string;
  label: string;
  type: NodeType;
  filePath: string;
  lineNumber: number;
}

export interface RouteNode extends BaseNode {
  type: "route";
  metadata: {
    httpMethod: HttpMethod;
    routePath: string;
    fullPath: string; // Combined with router prefix
    middleware: string[]; // List of middleware names applied
  };
}

export interface ControllerNode extends BaseNode {
  type: "controller";
  metadata: {
    className: string;
    methods: string[];
  };
}

export interface MiddlewareNode extends BaseNode {
  type: "middleware";
  metadata: {
    name: string;
    isNamed: boolean; // Named function vs anonymous
  };
}

export interface FunctionNode extends BaseNode {
  type: "function";
  metadata: {
    name: string;
    parameters: string[];
    returnType: string;
    isAsync: boolean;
    isExported: boolean;
    isArrow: boolean;
  };
}

export interface ClassNode extends BaseNode {
  type: "class";
  metadata: {
    className: string;
    isExported: boolean;
  };
}

export interface MethodNode extends BaseNode {
  type: "method";
  metadata: {
    className: string;
    methodName: string;
    parameters: string[];
    returnType: string;
    isAsync: boolean;
    isPrivate: boolean;
    isStatic: boolean;
  };
}

export type GraphNode =
  | RouteNode
  | ControllerNode
  | MiddlewareNode
  | FunctionNode
  | ClassNode
  | MethodNode;

// ─────────────────────────────────────────────
// Edge Types
// ─────────────────────────────────────────────

export type EdgeType =
  | "routes-to"
  | "calls"
  | "contains"
  | "middleware"
  | "uses";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}

// ─────────────────────────────────────────────
// Graph
// ─────────────────────────────────────────────

export interface GraphMetadata {
  projectName: string;
  projectPath: string;
  analyzedAt: string;
  fileCount: number;
  framework: "express";
  version: string;
}

export interface ApiGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface AnalysisSummary {
  totalNodes: number;
  totalEdges: number;
  routeCount: number;
  controllerCount: number;
  middlewareCount: number;
  functionCount: number;
  fileCount: number;
}

export interface AnalysisResult {
  graph: ApiGraph;
  summary: AnalysisSummary;
}

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

export interface ApiGraphConfig {
  name?: string;
  include: string[]; // Glob patterns to include
  exclude?: string[]; // Glob patterns to exclude
  rootDir: string; // Project root
  outputFile?: string; // Default: api-graph.json
}

export const DEFAULT_CONFIG: Partial<ApiGraphConfig> = {
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
