import {
  Project,
  SourceFile,
  SyntaxKind,
  Node,
  ClassDeclaration,
  MethodDeclaration,
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  FunctionExpression,
} from "ts-morph";
import { GraphNode, ClassNode, MethodNode, FunctionNode } from "../types";
import { generateId, isNodeModule, isTestFile } from "../utils/helpers";

export class NodeCollector {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Array<{
    source: string;
    target: string;
    type: string;
    label: string;
  }> = [];

  constructor(private project: Project) {}

  collect(): {
    nodes: Map<string, GraphNode>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      label: string;
    }>;
  } {
    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();

      if (isNodeModule(filePath) || isTestFile(filePath)) continue;

      this.collectFromFile(sourceFile);
    }

    return { nodes: this.nodes, edges: this.edges };
  }

  // ─── Classes & Methods ────────────────────────────────────────────

  private collectFromFile(sourceFile: SourceFile): void {
    this.collectClasses(sourceFile);
    this.collectStandaloneFunctions(sourceFile);
    this.collectArrowFunctions(sourceFile);
  }

  private collectClasses(sourceFile: SourceFile): void {
    const classes = sourceFile.getClasses();

    for (const classDecl of classes) {
      try {
        const className = classDecl.getName();
        if (!className) continue;

        const classNode = this.buildClassNode(
          classDecl,
          sourceFile.getFilePath(),
        );
        this.nodes.set(classNode.id, classNode);

        // Collect methods
        for (const method of classDecl.getMethods()) {
          try {
            const methodNode = this.buildMethodNode(
              method,
              className,
              sourceFile.getFilePath(),
            );
            if (!methodNode) continue;

            this.nodes.set(methodNode.id, methodNode);

            // Class contains method
            this.edges.push({
              source: classNode.id,
              target: methodNode.id,
              type: "contains",
              label: "contains",
            });
          } catch {
            // Skip problematic methods
          }
        }
      } catch {
        // Skip problematic classes
      }
    }
  }

  private collectStandaloneFunctions(sourceFile: SourceFile): void {
    const functions = sourceFile.getFunctions();

    for (const func of functions) {
      try {
        const name = func.getName();
        if (!name) continue;

        const node = this.buildFunctionNode(func, sourceFile.getFilePath());
        if (node) this.nodes.set(node.id, node);
      } catch {
        // Skip
      }
    }
  }

  private collectArrowFunctions(sourceFile: SourceFile): void {
    // Find: export const handlerName = async (req, res) => {}
    const varStatements = sourceFile.getVariableStatements();

    for (const varStatement of varStatements) {
      try {
        const isExported = varStatement.isExported();

        for (const declaration of varStatement.getDeclarations()) {
          const initializer = declaration.getInitializer();
          if (!initializer) continue;

          const isArrow = Node.isArrowFunction(initializer);
          const isFuncExpr = Node.isFunctionExpression(initializer);

          if (!isArrow && !isFuncExpr) continue;

          const name = declaration.getName();
          if (!name) continue;

          const node = this.buildArrowFunctionNode(
            declaration,
            initializer as ArrowFunction | FunctionExpression,
            isExported,
            sourceFile.getFilePath(),
          );

          if (node) this.nodes.set(node.id, node);
        }
      } catch {
        // Skip
      }
    }
  }

  // ─── Node Builders ────────────────────────────────────────────────

  private buildClassNode(
    classDecl: ClassDeclaration,
    filePath: string,
  ): ClassNode {
    const className = classDecl.getName()!;
    return {
      id: generateId("class"),
      label: className,
      type: "class",
      filePath,
      lineNumber: classDecl.getStartLineNumber(),
      metadata: {
        className,
        isExported: classDecl.isExported(),
      },
    };
  }

  private buildMethodNode(
    method: MethodDeclaration,
    className: string,
    filePath: string,
  ): MethodNode | null {
    const methodName = method.getName();
    if (!methodName) return null;

    let returnType = "unknown";
    let parameters: string[] = [];

    try {
      returnType = method.getReturnType().getText();
    } catch {
      /* ignore */
    }

    try {
      parameters = method.getParameters().map((p) => {
        try {
          return p.getName();
        } catch {
          return "_";
        }
      });
    } catch {
      /* ignore */
    }

    return {
      id: generateId("method"),
      label: `${className}.${methodName}`,
      type: "method",
      filePath,
      lineNumber: method.getStartLineNumber(),
      metadata: {
        className,
        methodName,
        parameters,
        returnType,
        isAsync: method.isAsync(),
        isPrivate: method.getScope() === "private",
        isStatic: method.isStatic(),
      },
    };
  }

  private buildFunctionNode(
    func: FunctionDeclaration,
    filePath: string,
  ): FunctionNode | null {
    const name = func.getName();
    if (!name) return null;

    let returnType = "unknown";
    let parameters: string[] = [];

    try {
      returnType = func.getReturnType().getText();
    } catch {
      /* ignore */
    }

    try {
      parameters = func.getParameters().map((p) => {
        try {
          return p.getName();
        } catch {
          return "_";
        }
      });
    } catch {
      /* ignore */
    }

    return {
      id: generateId("func"),
      label: name,
      type: "function",
      filePath,
      lineNumber: func.getStartLineNumber(),
      metadata: {
        name,
        parameters,
        returnType,
        isAsync: func.isAsync(),
        isExported: func.isExported(),
        isArrow: false,
      },
    };
  }

  private buildArrowFunctionNode(
    declaration: VariableDeclaration,
    initializer: ArrowFunction | FunctionExpression,
    isExported: boolean,
    filePath: string,
  ): FunctionNode | null {
    const name = declaration.getName();
    if (!name) return null;

    let parameters: string[] = [];

    try {
      parameters = initializer.getParameters().map((p) => {
        try {
          return p.getName();
        } catch {
          return "_";
        }
      });
    } catch {
      /* ignore */
    }

    return {
      id: generateId("func"),
      label: name,
      type: "function",
      filePath,
      lineNumber: declaration.getStartLineNumber(),
      metadata: {
        name,
        parameters,
        returnType: "unknown",
        isAsync: initializer.isAsync(),
        isExported,
        isArrow: Node.isArrowFunction(initializer),
      },
    };
  }

  // ─── Public Getters ───────────────────────────────────────────────

  findNodeByLabel(label: string): GraphNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.label === label) return node;
    }
    return undefined;
  }

  findNodeById(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }
}
