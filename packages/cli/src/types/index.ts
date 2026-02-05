/**
 * Core types for AgentTrace CLI
 */

// Permission levels for tools
export type Permission = 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE' | 'OUTPUT' | 'UNKNOWN';

// Risk levels based on permission
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Supported frameworks
export type Framework = 
  | 'mcp'
  | 'mcp-config'
  | 'langraph'
  | 'crewai'
  | 'autogen'
  | 'fastmcp'
  | 'custom'
  | 'unknown';

/**
 * Represents a detected AI tool
 */
export interface Tool {
  /** Tool name/identifier */
  name: string;
  
  /** Framework that defines this tool */
  framework: Framework;
  
  /** Source file path and line number */
  source: string;
  
  /** Line number in source file */
  line: number;
  
  /** Inferred permission level */
  permission: Permission;
  
  /** Risk level based on permission */
  risk: RiskLevel;
  
  /** Tool description from docstring or config */
  description?: string;
  
  /** Parameter schema if available */
  parameters?: Record<string, ParameterSchema>;
  
  /** Version if specified */
  version?: string;
}

/**
 * Parameter schema for tool inputs
 */
export interface ParameterSchema {
  type: string;
  description?: string;
  required?: boolean;
  default?: unknown;
}

/**
 * Represents a detected AI agent
 */
export interface Agent {
  /** Agent name/identifier */
  name: string;
  
  /** Framework that defines this agent */
  framework: Framework;
  
  /** Source file path */
  source: string;
  
  /** Line number in source file */
  line: number;
  
  /** Tools this agent has access to */
  tools: string[];
  
  /** Agent description or role */
  description?: string;
  
  /** Agent configuration */
  config?: Record<string, unknown>;
}

/**
 * MCP Server configuration
 */
export interface McpServer {
  /** Server name */
  name: string;
  
  /** Command to run the server */
  command: string;
  
  /** Command arguments */
  args?: string[];
  
  /** Environment variables */
  env?: Record<string, string>;
  
  /** Source file path */
  source: string;
  
  /** Tools exposed by this server (if known) */
  tools?: string[];
}

/**
 * Summary statistics for the scan
 */
export interface ScanSummary {
  /** Total number of tools found */
  total_tools: number;
  
  /** Total number of agents found */
  total_agents: number;
  
  /** Total number of MCP servers found */
  total_mcp_servers: number;
  
  /** Total files scanned */
  files_scanned: number;
  
  /** Tools grouped by framework */
  by_framework: Record<string, number>;
  
  /** Tools grouped by permission */
  by_permission: Record<Permission, number>;
  
  /** Tools grouped by risk level */
  by_risk: Record<RiskLevel, number>;
}

/**
 * Complete scan manifest output
 */
export interface Manifest {
  /** Manifest schema version */
  version: string;
  
  /** ISO timestamp of scan */
  scanned_at: string;
  
  /** Path that was scanned */
  scanned_path: string;
  
  /** Scan duration in milliseconds */
  scan_duration_ms: number;
  
  /** Summary statistics */
  summary: ScanSummary;
  
  /** Detected tools */
  tools: Tool[];
  
  /** Detected agents */
  agents: Agent[];
  
  /** Detected MCP servers */
  mcp_servers: McpServer[];
}

/**
 * Result from a detector
 */
export interface DetectorResult {
  /** Tools found by this detector */
  tools: Tool[];
  
  /** Agents found by this detector */
  agents: Agent[];
  
  /** MCP servers found by this detector */
  mcpServers: McpServer[];
}

/**
 * Options for the scan command
 */
export interface ScanOptions {
  /** Output file path for JSON manifest */
  output?: string;
  
  /** Filter by framework */
  framework?: string;
  
  /** Filter by risk level */
  risk?: string;
  
  /** Output JSON only (no pretty print) */
  json?: boolean;
  
  /** Disable colored output */
  color?: boolean;
}

/**
 * File info passed to detectors
 */
export interface FileInfo {
  /** Absolute file path */
  path: string;
  
  /** Relative path from scan root */
  relativePath: string;
  
  /** File extension (e.g., '.py', '.ts') */
  extension: string;
  
  /** File content */
  content: string;
}
