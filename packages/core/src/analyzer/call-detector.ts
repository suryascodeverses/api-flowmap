import {
  Project,
  SourceFile,
  SyntaxKind,
  Node,
  ClassDeclaration,
} from "ts-morph";
import { GraphNode, GraphEdge } from "../types";
import { generateEdgeId, isNodeModule, isTestFile } from "../utils/helpers";

export class CallDetector {
  private edges: GraphEdge[] = [];

  constructor(
    private project: Project,
    private allNodes: Map<string, GraphNode>,
  ) {}

  detect(): GraphEdge[] {
    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      if (isNodeModule(filePath) || isTestFile(filePath)) continue;

      try {
        this.detectCallsInFile(sourceFile);
      } catch {
        /* skip */
      }
    }

    return this.edges;
  }

  private detectCallsInFile(sourceFile: SourceFile): void {
    // Detect calls inside class methods
    for (const classDecl of sourceFile.getClasses()) {
      try {
        const className = classDecl.getName();
        if (!className) continue;

        for (const method of classDecl.getMethods()) {
          try {
            const methodName = method.getName();
            const callerLabel = `${className}.${methodName}`;
            const callerNode = this.findNodeByLabel(callerLabel);
            if (!callerNode) continue;

            const callExprs = method.getDescendantsOfKind(
              SyntaxKind.CallExpression,
            );
            for (const callExpr of callExprs) {
              try {
                this.resolveCall(callerNode, callExpr, classDecl);
              } catch {
                /* skip */
              }
            }
          } catch {
            /* skip */
          }
        }
      } catch {
        /* skip */
      }
    }

    // Detect calls inside standalone functions
    for (const func of sourceFile.getFunctions()) {
      try {
        const name = func.getName();
        if (!name) continue;
        const callerNode = this.findNodeByLabel(name);
        if (!callerNode) continue;

        const callExprs = func.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const callExpr of callExprs) {
          try {
            this.resolveCall(callerNode, callExpr, null);
          } catch {
            /* skip */
          }
        }
      } catch {
        /* skip */
      }
    }
  }

  private resolveCall(
    callerNode: GraphNode,
    callExpr: any,
    classContext: ClassDeclaration | null,
  ): void {
    const expression = callExpr.getExpression();
    let calleeLabel: string | null = null;

    // Pattern 1: this.method()
    if (
      Node.isPropertyAccessExpression(expression) &&
      Node.isThisExpression(expression.getExpression())
    ) {
      const methodName = expression.getName();
      const className = classContext?.getName();
      if (className) {
        calleeLabel = `${className}.${methodName}`;
      }
    }

    // Pattern 2: instance.method()
    else if (Node.isPropertyAccessExpression(expression)) {
      const obj = expression.getExpression();
      const methodName = expression.getName();

      if (Node.isIdentifier(obj)) {
        const objName = obj.getText();
        calleeLabel = this.resolveInstanceMethodLabel(objName, methodName);
      }
    }

    // Pattern 3: directFunctionCall()
    else if (Node.isIdentifier(expression)) {
      const name = expression.getText();
      const found = this.findNodeByLabel(name);
      if (found) calleeLabel = found.label;
    }

    if (!calleeLabel) return;

    const calleeNode = this.findNodeByLabel(calleeLabel);
    if (!calleeNode) return;

    // Avoid self-references
    if (calleeNode.id === callerNode.id) return;

    const edgeId = generateEdgeId(callerNode.id, calleeNode.id, "calls");

    // Avoid duplicate edges
    if (this.edges.some((e) => e.id === edgeId)) return;

    this.edges.push({
      id: edgeId,
      source: callerNode.id,
      target: calleeNode.id,
      type: "calls",
      label: "calls",
    });
  }

  private resolveInstanceMethodLabel(
    instanceName: string,
    methodName: string,
  ): string | null {
    // Try to find a class whose name matches the instance name convention
    for (const node of this.allNodes.values()) {
      if (node.type === "class") {
        const className = (node as any).metadata.className as string;
        const instanceVariant =
          className.charAt(0).toLowerCase() + className.slice(1);

        if (
          instanceVariant === instanceName ||
          className.toLowerCase() === instanceName.toLowerCase()
        ) {
          const methodLabel = `${className}.${methodName}`;
          if (this.findNodeByLabel(methodLabel)) {
            return methodLabel;
          }
        }
      }
    }

    // Also try direct: if there's a node with this exact label
    const direct = `${instanceName}.${methodName}`;
    if (this.findNodeByLabel(direct)) return direct;

    return null;
  }

  private findNodeByLabel(label: string): GraphNode | undefined {
    for (const node of this.allNodes.values()) {
      if (node.label === label) return node;
    }
    return undefined;
  }
}
