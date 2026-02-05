# 🔍 AgentTrace-CLI

> **Socket.dev for AI Agents** — Discover, visualize, and govern AI tools in your codebase.

```
$ agenttrace scan ./my-project

AgentTrace v1.0.0 — Scanning ./my-project

✔ Scanned 972 files in 0.3s

SUMMARY
───────────────────────────────────────────────────────
  Total Tools: 53    Agents: 6    MCP Servers: 0    Files: 972

HIGH RISK TOOLS (3 require review)
───────────────────────────────────────────────────────
  ⚠️  delete_records     DELETE   mcp/database.py:45
  ⚠️  execute_command    EXECUTE  tools/shell.py:12
  ⚠️  drop_table         DELETE   agents/admin.py:89
```

## The Problem

- **Shadow AI:** MCP servers and agentic tools are being added everywhere, with no central visibility
- **Permission Blindness:** We don't know which agents have destructive write access until it's too late  
- **Duplicate Work:** Teams don't know what tools already exist

## The Solution

AgentTrace uses **static analysis** (regex pattern matching) to scan your codebase, extract agent configurations, and display them with risk levels — all without executing any code.

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/0xParth/agent-trace.git
cd agent-trace

# 2. Install and build the CLI
cd packages/cli
npm install
npm run build

# 3. Install and build the Dashboard
cd ../dashboard
npm install
npm run build

# 4. Go back to root
cd ../..
```

## Quick Start

### Scan a Codebase

```bash
# Basic scan (from the agent-trace directory)
node packages/cli/dist/index.js scan /path/to/your/project

# Example: scan current directory
node packages/cli/dist/index.js scan .

# Save results to JSON file
node packages/cli/dist/index.js scan /path/to/project --output agent-manifest.json
```

### Launch the Dashboard

```bash
# Step 1: Generate a manifest first
node packages/cli/dist/index.js scan /path/to/project --output agent-manifest.json

# Step 2: Start the dashboard
node packages/cli/dist/index.js dashboard

# Opens http://localhost:3000 in your browser
```

### CLI Options

```bash
# Filter by framework
node packages/cli/dist/index.js scan . --framework mcp

# Filter by risk level
node packages/cli/dist/index.js scan . --risk high

# JSON-only output (for CI/CD pipelines)
node packages/cli/dist/index.js scan . --json

# Dashboard on custom port
node packages/cli/dist/index.js dashboard --port 8080

# Dashboard with specific manifest file
node packages/cli/dist/index.js dashboard --manifest ./my-manifest.json
```

## What Gets Detected

### Supported Frameworks

| Framework | Language | Patterns |
|-----------|----------|----------|
| **MCP Config** | JSON | `mcp_settings.json`, `.cursor/mcp.json` |
| **Python Tools** | Python | `@tool`, `@mcp.tool()`, FastMCP, tool arrays |
| **TypeScript MCP** | TS/JS | `server.tool()`, `McpServer` |
| **LangGraph** | Python | `graph.add_node()`, `StateGraph` |
| **CrewAI** | Python | `Agent(role=...)`, `Crew(agents=[...])` |
| **AutoGen** | Python | `AssistantAgent`, `UserProxyAgent` |
| **Go Capabilities** | Go | `capabilities.Type`, custom registries |

### Permission Inference

The scanner infers permission levels from tool names and descriptions:

| Keywords | Permission | Risk |
|----------|------------|------|
| `get`, `read`, `fetch`, `list`, `search` | READ | LOW |
| `create`, `add`, `write`, `update`, `set` | WRITE | MEDIUM |
| `delete`, `remove`, `drop`, `destroy` | DELETE | HIGH |
| `execute`, `run`, `eval`, `shell`, `exec` | EXECUTE | HIGH |
| `display`, `show`, `render`, `output` | OUTPUT | LOW |

## Output Format

### JSON Manifest

```json
{
  "version": "1.0.0",
  "scanned_at": "2026-02-05T...",
  "scanned_path": "/path/to/codebase",
  "scan_duration_ms": 1234,
  "summary": {
    "total_tools": 25,
    "total_agents": 3,
    "by_framework": { "mcp": 10, "langraph": 5 },
    "by_permission": { "READ": 15, "WRITE": 8, "DELETE": 2 },
    "by_risk": { "LOW": 15, "MEDIUM": 7, "HIGH": 3 }
  },
  "tools": [...],
  "agents": [...],
  "mcp_servers": [...]
}
```

## Project Structure

```
packages/
├── cli/                        # Command-line scanner
│   └── src/
│       ├── index.ts            # CLI entry point
│       ├── commands/
│       │   ├── scan.ts         # Scan command
│       │   └── dashboard.ts    # Dashboard server
│       ├── scanner/
│       │   ├── walker.ts       # File walker with gitignore
│       │   └── router.ts       # Extension router
│       ├── detectors/
│       │   ├── base.ts         # Detector interface
│       │   ├── mcp-config.ts   # MCP JSON detector
│       │   ├── python.ts       # Python detector
│       │   ├── typescript.ts   # TypeScript detector
│       │   └── go.ts           # Go detector
│       ├── inference/
│       │   └── permissions.ts  # Permission inference
│       └── output/
│           ├── manifest.ts     # JSON output
│           └── console.ts      # Pretty print
└── dashboard/                  # Web UI
    └── src/
        ├── App.tsx             # Main app
        ├── components/
        │   ├── layout/         # Shell, sidebar, header
        │   ├── overview/       # Stats dashboard
        │   ├── registry/       # Tool table
        │   ├── blast-radius/   # Graph visualization
        │   └── matrix/         # Permission grid
        ├── hooks/
        │   ├── useManifest.ts  # Manifest loading
        │   └── useKeyboardShortcuts.ts
        └── store/              # Zustand state
```

## Adding New Detectors

Detectors implement the `Detector` interface:

```typescript
interface Detector {
  name: string;
  extensions: string[];
  detect(file: FileInfo): Promise<DetectorResult>;
}
```

See `src/detectors/python.ts` for a comprehensive example.

## Dashboard Features

| View | Description |
|------|-------------|
| **Overview** | Summary stats, risk distribution, framework breakdown |
| **Tool Registry** | Searchable/filterable table of all detected tools |
| **Blast Radius** | Interactive graph showing agent → tool → server relationships |
| **Capability Matrix** | Permission grid grouped by framework |

## Roadmap

- [x] **Phase 1: Scanner** — Detect tools across Python, TypeScript, Go
- [x] **Phase 2: Dashboard** — Web UI to visualize blast radius
- [ ] **Phase 3: CI/CD** — GitHub Action to block dangerous tools
- [ ] **Phase 4: Governance** — Policy-as-code for tool approval

---

*Built with the belief that powerful AI tools deserve powerful governance.*
