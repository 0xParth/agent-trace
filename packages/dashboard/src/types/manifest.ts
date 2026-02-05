/**
 * Types matching the CLI's manifest output
 * These should mirror the types in packages/cli/src/types/index.ts
 */

export type Permission = 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE' | 'OUTPUT' | 'UNKNOWN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type Framework = 
  | 'mcp'
  | 'mcp-config'
  | 'langraph'
  | 'crewai'
  | 'autogen'
  | 'fastmcp'
  | 'custom'
  | 'unknown';

export interface ParameterSchema {
  type: string;
  description?: string;
  required?: boolean;
  default?: unknown;
}

export interface Tool {
  name: string;
  framework: Framework;
  source: string;
  line: number;
  permission: Permission;
  risk: RiskLevel;
  description?: string;
  parameters?: Record<string, ParameterSchema>;
  version?: string;
}

export interface Agent {
  name: string;
  framework: Framework;
  source: string;
  line: number;
  tools: string[];
  description?: string;
  config?: Record<string, unknown>;
}

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  source: string;
  tools?: string[];
}

export interface ScanSummary {
  total_tools: number;
  total_agents: number;
  total_mcp_servers: number;
  files_scanned: number;
  by_framework: Record<string, number>;
  by_permission: Record<Permission, number>;
  by_risk: Record<RiskLevel, number>;
}

export interface Manifest {
  version: string;
  scanned_at: string;
  scanned_path: string;
  scan_duration_ms: number;
  summary: ScanSummary;
  tools: Tool[];
  agents: Agent[];
  mcp_servers: McpServer[];
}
