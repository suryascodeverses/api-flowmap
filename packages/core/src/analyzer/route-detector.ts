import {
  Project,
  SourceFile,
  SyntaxKind,
  Node,
  CallExpression,
} from "ts-morph";
import { GraphNode, GraphEdge, RouteNode, HttpMethod } from "../types";
import {
  generateId,
  generateEdgeId,
  sanitizeText,
  combinePaths,
} from "../utils/helpers";
import { isNodeModule, isTestFile } from "../utils/helpers";

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "all",
]);

interface RouterContext {
  variableName: string; // e.g. "router", "app", "userRouter"
  basePath: string; // e.g. "/api/users"
}

export class RouteDetector {
  private routerContexts: Map<string, RouterContext> = new Map();
  private detectedRoutes: RouteNode[] = [];
  private edges: GraphEdge[] = [];

  constructor(
    private project: Project,
    private allNodes: Map<string, GraphNode>,
  ) {}

  detect(): { routes: RouteNode[]; edges: GraphEdge[] } {
    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      if (isNodeModule(filePath) || isTestFile(filePath)) continue;

      try {
        // Step 1: Understand router/app variable declarations in this file
        this.scanRouterDeclarations(sourceFile);

        // Step 2: Detect route registrations
        this.detectRoutes(sourceFile);
      } catch {
        // Skip problematic files
      }
    }

    return { routes: this.detectedRoutes, edges: this.edges };
  }

  // ─── Router Context Detection ─────────────────────────────────────

  private scanRouterDeclarations(sourceFile: SourceFile): void {
    const varDeclarations = sourceFile.getDescendantsOfKind(
      SyntaxKind.VariableDeclaration,
    );

    for (const decl of varDeclarations) {
      try {
        const name = decl.getName();
        const initializer = decl.getInitializer();
        if (!initializer) continue;

        const initText = initializer.getText();

        // Detect: const router = express.Router()
        // Detect: const app = express()
        if (
          initText.includes("express.Router()") ||
          initText.includes("Router()") ||
          initText.includes("express()")
        ) {
          this.routerContexts.set(name, {
            variableName: name,
            basePath: "",
          });
        }
      } catch {
        /* skip */
      }
    }
  }

  // ─── Route Detection ──────────────────────────────────────────────

  private detectRoutes(sourceFile: SourceFile): void {
    const callExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression,
    );

    for (const callExpr of callExpressions) {
      try {
        const expression = callExpr.getExpression();
        if (!Node.isPropertyAccessExpression(expression)) continue;

        const methodName = expression.getName().toLowerCase();
        if (!HTTP_METHODS.has(methodName)) continue;

        const args = callExpr.getArguments();
        if (args.length < 2) continue;

        const routePath = sanitizeText(args[0].getText());

        // Skip if path looks like a variable (not a literal string)
        if (
          !routePath.startsWith("/") &&
          !routePath.startsWith("'") &&
          !routePath.startsWith('"')
        ) {
          // Could be a variable path - still capture it but mark as dynamic
          if (!routePath.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) continue;
        }

        const cleanPath = routePath.replace(/['"]/g, "");

        // Build route node
        const routeNode = this.buildRouteNode(
          callExpr,
          methodName.toUpperCase() as HttpMethod,
          cleanPath,
          sourceFile.getFilePath(),
        );

        this.detectedRoutes.push(routeNode);

        // Detect middleware and handler from remaining args
        this.resolveHandlers(routeNode, args.slice(1), sourceFile);
      } catch {
        /* skip */
      }
    }
  }

  private buildRouteNode(
    callExpr: CallExpression,
    httpMethod: HttpMethod,
    routePath: string,
    filePath: string,
  ): RouteNode {
    return {
      id: generateId("route"),
      label: `${httpMethod} ${routePath}`,
      type: "route",
      filePath,
      lineNumber: callExpr.getStartLineNumber(),
      metadata: {
        httpMethod,
        routePath,
        fullPath: routePath,
        middleware: [],
      },
    };
  }

  // ─── Handler Resolution ───────────────────────────────────────────

  private resolveHandlers(
    routeNode: RouteNode,
    handlerArgs: Node[],
    sourceFile: SourceFile,
  ): void {
    for (let i = 0; i < handlerArgs.length; i++) {
      const arg = handlerArgs[i];
      const isLast = i === handlerArgs.length - 1;
      const isMiddleware = !isLast;

      try {
        const resolved = this.resolveHandler(arg, sourceFile);
        if (!resolved) continue;

        if (isMiddleware) {
          // It's a middleware - add to route metadata
          routeNode.metadata.middleware.push(resolved.label);

          // Create middleware edge
          this.edges.push({
            id: generateEdgeId(routeNode.id, resolved.id, "middleware"),
            source: routeNode.id,
            target: resolved.id,
            type: "middleware",
            label: "middleware",
          });
        } else {
          // It's the main handler
          this.edges.push({
            id: generateEdgeId(routeNode.id, resolved.id, "routes-to"),
            source: routeNode.id,
            target: resolved.id,
            type: "routes-to",
            label: "handles",
          });
        }
      } catch {
        /* skip */
      }
    }
  }

  private resolveHandler(arg: Node, sourceFile: SourceFile): GraphNode | null {
    // Pattern 1: Arrow function inline → (req, res) => { ... }
    if (Node.isArrowFunction(arg) || Node.isFunctionExpression(arg)) {
      return this.resolveInlineFunction(arg, sourceFile);
    }

    // Pattern 2: Direct identifier → handlerFunction
    if (Node.isIdentifier(arg)) {
      return this.resolveIdentifier(arg.getText());
    }

    // Pattern 3: Property access → controller.method OR controller.method.bind(controller)
    if (Node.isPropertyAccessExpression(arg)) {
      const objText = arg.getExpression().getText();
      const methodName = arg.getName();
      return this.resolvePropertyAccess(objText, methodName);
    }

    // Pattern 4: Call expression → controller.method.bind(controller)
    if (Node.isCallExpression(arg)) {
      const expr = arg.getExpression();
      if (Node.isPropertyAccessExpression(expr)) {
        const innerExpr = expr.getExpression();
        // .bind() case
        if (
          expr.getName() === "bind" &&
          Node.isPropertyAccessExpression(innerExpr)
        ) {
          const objText = innerExpr.getExpression().getText();
          const methodName = innerExpr.getName();
          return this.resolvePropertyAccess(objText, methodName);
        }
      }
    }

    return null;
  }

  // ─── Resolve Patterns ─────────────────────────────────────────────

  private resolveInlineFunction(
    fn: Node,
    sourceFile: SourceFile,
  ): GraphNode | null {
    // Look for calls inside the arrow function body
    const callExprs = fn.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpr of callExprs) {
      try {
        const expr = callExpr.getExpression();

        // this.method() pattern
        if (Node.isPropertyAccessExpression(expr)) {
          const obj = expr.getExpression();
          const methodName = expr.getName();

          if (Node.isThisExpression(obj)) {
            const classDecl = callExpr.getFirstAncestorByKind(
              SyntaxKind.ClassDeclaration,
            );
            if (classDecl?.getName()) {
              const label = `${classDecl.getName()}.${methodName}`;
              const found = this.findNodeByLabel(label);
              if (found) return found;
            }
          }

          // instanceVariable.method() pattern
          if (Node.isIdentifier(obj)) {
            const objText = obj.getText();
            const result = this.resolvePropertyAccess(objText, methodName);
            if (result) return result;
          }
        }

        // Direct function call: handlerFn(req, res)
        if (Node.isIdentifier(expr)) {
          const result = this.resolveIdentifier(expr.getText());
          if (result) return result;
        }
      } catch {
        /* skip */
      }
    }

    return null;
  }

  private resolveIdentifier(name: string): GraphNode | null {
    // Look for function/method with this name
    for (const node of this.allNodes.values()) {
      if (
        (node.type === "function" || node.type === "method") &&
        node.label === name
      ) {
        return node;
      }
    }
    return null;
  }

  private resolvePropertyAccess(
    objName: string,
    methodName: string,
  ): GraphNode | null {
    // Try className.methodName
    const label = `${this.resolveClassName(objName)}.${methodName}`;
    return this.findNodeByLabel(label);
  }

  private resolveClassName(instanceName: string): string {
    // Try to resolve instance name to class name
    // e.g. "userController" → "UserController"
    // First try exact match capitalized
    const capitalized =
      instanceName.charAt(0).toUpperCase() + instanceName.slice(1);

    for (const node of this.allNodes.values()) {
      if (node.type === "class") {
        const className = (node as any).metadata.className as string;
        // Match by convention: userController → UserController
        if (
          className === capitalized ||
          className === instanceName ||
          className.toLowerCase() === instanceName.toLowerCase() ||
          className.toLowerCase().replace("controller", "") ===
            instanceName.toLowerCase().replace("controller", "")
        ) {
          return className;
        }
      }
    }

    return capitalized;
  }

  private findNodeByLabel(label: string): GraphNode | null {
    for (const node of this.allNodes.values()) {
      if (node.label === label) return node;
    }
    return null;
  }
}
