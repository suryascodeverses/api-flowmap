import express, { Application, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

export interface ServerConfig {
  graphFilePath: string;
  port: number;
  uiDir?: string; // Path to built Next.js static export
}

export function createServer(config: ServerConfig): http.Server {
  const app: Application = express();

  app.use(cors());
  app.use(compression());
  app.use(express.json());

  // ─── API Routes ──────────────────────────────────────────────────

  // GET /api/graph - Returns the current graph JSON
  app.get("/api/graph", (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(config.graphFilePath)) {
        res.status(404).json({
          error: "Graph not found",
          message: 'Run "api-graph generate" first to create the graph output.',
        });
        return;
      }

      const raw = fs.readFileSync(config.graphFilePath, "utf-8");
      const graph = JSON.parse(raw);
      res.json(graph);
    } catch (error) {
      res.status(500).json({
        error: "Failed to read graph",
        message: (error as Error).message,
      });
    }
  });

  // GET /api/health - Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      graphExists: fs.existsSync(config.graphFilePath),
      timestamp: new Date().toISOString(),
    });
  });

  // GET /api/graph/meta - Returns only metadata (fast)
  app.get("/api/graph/meta", (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(config.graphFilePath)) {
        res.status(404).json({ error: "Graph not found" });
        return;
      }

      const raw = fs.readFileSync(config.graphFilePath, "utf-8");
      const graph = JSON.parse(raw);

      res.json({
        metadata: graph.metadata,
        summary: {
          totalNodes: graph.nodes?.length ?? 0,
          totalEdges: graph.edges?.length ?? 0,
          routeCount:
            graph.nodes?.filter((n: any) => n.type === "route").length ?? 0,
          classCount:
            graph.nodes?.filter((n: any) => n.type === "class").length ?? 0,
          functionCount:
            graph.nodes?.filter((n: any) => n.type === "function").length ?? 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ─── UI Static Files ─────────────────────────────────────────────

  // Resolve UI directory - look for built Next.js export
  const uiDir = config.uiDir || resolveUiDir();

  if (uiDir && fs.existsSync(uiDir)) {
    // Serve static Next.js export
    app.use(express.static(uiDir));

    // Catch-all: serve index.html for client-side routing
    app.get("*", (req: Request, res: Response) => {
      // Don't intercept API routes
      if (req.path.startsWith("/api/")) return;
      const indexPath = path.join(uiDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res
          .status(404)
          .send("UI not found. Build the UI first with: pnpm build:ui");
      }
    });
  } else {
    // UI not built yet - serve a minimal status page
    app.get("/", (req: Request, res: Response) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>api-graph server</title>
            <style>
              body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 40px; }
              a { color: #67e8f9; }
              code { background: #1e293b; padding: 4px 8px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>⚡ api-graph server</h1>
            <p>Server is running. Graph API is available:</p>
            <ul>
              <li><a href="/api/graph">/api/graph</a> — Full graph JSON</li>
              <li><a href="/api/graph/meta">/api/graph/meta</a> — Metadata only</li>
              <li><a href="/api/health">/api/health</a> — Health check</li>
            </ul>
            <p>UI is not built yet. Run: <code>pnpm build:ui</code></p>
          </body>
        </html>
      `);
    });
  }

  return http.createServer(app);
}

function resolveUiDir(): string | null {
  // Look for built UI relative to this package
  const candidates = [
    path.resolve(__dirname, "../../ui/out"),
    path.resolve(__dirname, "../../../packages/ui/out"),
    path.resolve(process.cwd(), "packages/ui/out"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}
