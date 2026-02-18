# api-graph

> Visualize your Express.js API flow — routes, controllers, services, repositories — as an interactive graph.

## Monorepo Structure

```
api-graph/
├── packages/
│   ├── core/       # Analysis engine (ts-morph)
│   ├── cli/        # CLI tool (api-graph command)
│   ├── server/     # Express server (serves UI + graph API)
│   └── ui/         # Next.js 14 visualization UI
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build All Packages

```bash
pnpm build
```

### 3. Link CLI Globally (Development)

```bash
cd packages/cli
pnpm link --global
```

## Usage

### In any Express project:

```bash
# Initialize config (optional)
api-graph init

# Analyze your project → generates api-graph.json
api-graph generate

# Start visualization server
api-graph analyze
# → Open http://localhost:4000
```

## CLI Commands

| Command                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| `api-graph init [dir]`     | Create `api-graph.config.json` in project   |
| `api-graph generate [dir]` | Analyze project and output `api-graph.json` |
| `api-graph analyze [dir]`  | Start visualization server                  |

## Config File (`api-graph.config.json`)

```json
{
  "name": "my-project",
  "include": ["src/**/*.ts", "src/**/*.js"],
  "exclude": ["node_modules/**", "dist/**", "**/*.spec.ts", "**/*.test.ts"],
  "outputFile": "api-graph.json"
}
```

If no config file is found, the analyzer uses smart defaults:

- Scans `src/**/*.ts` and `src/**/*.js`
- Falls back to `**/*.ts` and `**/*.js` if no `src/` directory

## Supported Patterns (Express v1)

### OOP Style

```typescript
class UserController {
  async getUsers(req, res) { ... }
}
router.get('/users', userController.getUsers.bind(userController));
```

### Functional Style

```typescript
const getUsers = async (req, res) => { ... }
router.get('/users', getUsers);
```

### Hybrid / Inline

```typescript
router.post("/users", validateBody, async (req, res) => {
  await userService.createUser(req.body);
});
```

### Middleware Chains

```typescript
router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  userController.deleteUser,
);
```

## Development

### Run UI in dev mode

```bash
# Terminal 1: Start analysis server
cd packages/server && pnpm dev

# Terminal 2: Start Next.js dev server
cd packages/ui && pnpm dev
```

### Build for production

```bash
pnpm build
```

## Packages

- **`@api-graph/core`** — Analysis engine. Can be used programmatically.
- **`@api-graph/cli`** — The `api-graph` CLI tool.
- **`@api-graph/server`** — Express server serving the graph API and static UI.
- **`@api-graph/ui`** — Next.js visualization frontend.

## Roadmap

- [ ] TSOA decorator support
- [ ] NestJS support
- [ ] Fastify support
- [ ] Project switching from UI
- [ ] Route search & filtering
- [ ] Export to PNG / SVG
- [ ] VS Code extension
- [ ] Runtime tracing overlay
