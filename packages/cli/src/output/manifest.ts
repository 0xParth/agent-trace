/**
 * JSON Manifest Generator
 * 
 * Generates the agent-manifest.json output file with
 * all detected tools, agents, and summary statistics.
 */

import { writeFile } from 'fs/promises';
import type { 
  Manifest, 
  ScanSummary, 
  Tool, 
  Agent, 
  McpServer,
  Permission,
  RiskLevel,
  DetectorResult,
} from '../types/index.js';

const MANIFEST_VERSION = '1.0.0';

/**
 * Create summary statistics from detection results
 */
export function createSummary(
  result: DetectorResult,
  filesScanned: number
): ScanSummary {
  const { tools, agents, mcpServers } = result;

  // Count by framework
  const byFramework: Record<string, number> = {};
  for (const tool of tools) {
    byFramework[tool.framework] = (byFramework[tool.framework] || 0) + 1;
  }

  // Count by permission
  const byPermission: Record<Permission, number> = {
    'READ': 0,
    'WRITE': 0,
    'DELETE': 0,
    'EXECUTE': 0,
    'OUTPUT': 0,
    'UNKNOWN': 0,
  };
  for (const tool of tools) {
    byPermission[tool.permission]++;
  }

  // Count by risk
  const byRisk: Record<RiskLevel, number> = {
    'LOW': 0,
    'MEDIUM': 0,
    'HIGH': 0,
  };
  for (const tool of tools) {
    byRisk[tool.risk]++;
  }

  return {
    total_tools: tools.length,
    total_agents: agents.length,
    total_mcp_servers: mcpServers.length,
    files_scanned: filesScanned,
    by_framework: byFramework,
    by_permission: byPermission,
    by_risk: byRisk,
  };
}

/**
 * Create a complete manifest from detection results
 */
export function createManifest(
  result: DetectorResult,
  scannedPath: string,
  filesScanned: number,
  durationMs: number
): Manifest {
  // Sort tools by risk level (high first) then by name
  const sortedTools = [...result.tools].sort((a, b) => {
    const riskOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    const riskDiff = riskOrder[a.risk] - riskOrder[b.risk];
    if (riskDiff !== 0) return riskDiff;
    return a.name.localeCompare(b.name);
  });

  // Sort agents by name
  const sortedAgents = [...result.agents].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Sort MCP servers by name
  const sortedServers = [...result.mcpServers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return {
    version: MANIFEST_VERSION,
    scanned_at: new Date().toISOString(),
    scanned_path: scannedPath,
    scan_duration_ms: durationMs,
    summary: createSummary(result, filesScanned),
    tools: sortedTools,
    agents: sortedAgents,
    mcp_servers: sortedServers,
  };
}

/**
 * Write manifest to a JSON file
 */
export async function writeManifest(
  manifest: Manifest,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(manifest, null, 2);
  await writeFile(outputPath, json, 'utf-8');
}

/**
 * Convert manifest to JSON string
 */
export function manifestToJson(manifest: Manifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Filter tools by framework
 */
export function filterByFramework(tools: Tool[], framework: string): Tool[] {
  return tools.filter(t => t.framework === framework);
}

/**
 * Filter tools by risk level
 */
export function filterByRisk(tools: Tool[], risk: RiskLevel): Tool[] {
  return tools.filter(t => t.risk === risk);
}

/**
 * Get high-risk tools
 */
export function getHighRiskTools(tools: Tool[]): Tool[] {
  return tools.filter(t => t.risk === 'HIGH');
}

/**
 * Deduplicate tools by name and source
 */
export function deduplicateTools(tools: Tool[]): Tool[] {
  const seen = new Set<string>();
  const unique: Tool[] = [];
  
  for (const tool of tools) {
    const key = `${tool.name}:${tool.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tool);
    }
  }
  
  return unique;
}

/**
 * Deduplicate agents by name and source
 */
export function deduplicateAgents(agents: Agent[]): Agent[] {
  const seen = new Set<string>();
  const unique: Agent[] = [];
  
  for (const agent of agents) {
    const key = `${agent.name}:${agent.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(agent);
    }
  }
  
  return unique;
}

/**
 * Deduplicate MCP servers by name
 */
export function deduplicateMcpServers(servers: McpServer[]): McpServer[] {
  const seen = new Set<string>();
  const unique: McpServer[] = [];
  
  for (const server of servers) {
    if (!seen.has(server.name)) {
      seen.add(server.name);
      unique.push(server);
    }
  }
  
  return unique;
}
