/**
 * MCP Configuration File Detector
 * 
 * Detects MCP servers and tools from JSON configuration files:
 * - mcp_settings.json
 * - mcp.json
 * - .cursor/mcp.json
 * - claude_desktop_config.json
 */

import { BaseDetector, createMcpServer } from './base.js';
import type { FileInfo, DetectorResult, McpServer } from '../types/index.js';

// File names that typically contain MCP configuration
const MCP_CONFIG_FILES = [
  'mcp_settings.json',
  'mcp.json',
  'claude_desktop_config.json',
];

// Path patterns that indicate MCP config
const MCP_PATH_PATTERNS = [
  /\.cursor[/\\]mcp\.json$/,
  /mcp[_-]?settings\.json$/i,
  /mcp[_-]?config\.json$/i,
];

interface McpConfigContent {
  mcpServers?: Record<string, McpServerConfig>;
  servers?: Record<string, McpServerConfig>;
}

interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transport?: string;
}

export class McpConfigDetector extends BaseDetector {
  name = 'mcp-config';
  extensions = ['.json'];

  async detect(file: FileInfo): Promise<DetectorResult> {
    const result = this.emptyResult();
    
    // Check if this is an MCP config file
    if (!this.isMcpConfigFile(file)) {
      return result;
    }

    try {
      const config = JSON.parse(file.content) as McpConfigContent;
      
      // Extract MCP servers from various config formats
      const servers = config.mcpServers || config.servers || {};
      
      for (const [serverName, serverConfig] of Object.entries(servers)) {
        if (!serverConfig || typeof serverConfig !== 'object') {
          continue;
        }

        const mcpServer = this.parseServerConfig(serverName, serverConfig, file);
        if (mcpServer) {
          result.mcpServers.push(mcpServer);
        }
      }
    } catch {
      // Invalid JSON or unexpected format, skip
    }

    return result;
  }

  private isMcpConfigFile(file: FileInfo): boolean {
    // Check by filename
    const filename = file.relativePath.split(/[/\\]/).pop() || '';
    if (MCP_CONFIG_FILES.includes(filename)) {
      return true;
    }

    // Check by path pattern
    for (const pattern of MCP_PATH_PATTERNS) {
      if (pattern.test(file.relativePath)) {
        return true;
      }
    }

    // Check if content looks like MCP config
    if (file.content.includes('mcpServers') || 
        (file.content.includes('"servers"') && file.content.includes('"command"'))) {
      return true;
    }

    return false;
  }

  private parseServerConfig(
    name: string, 
    config: McpServerConfig, 
    file: FileInfo
  ): McpServer | null {
    // Handle stdio-based servers
    if (config.command) {
      return createMcpServer({
        name,
        command: config.command,
        args: config.args,
        env: config.env,
        source: file.relativePath,
      });
    }

    // Handle HTTP/SSE-based servers
    if (config.url) {
      return createMcpServer({
        name,
        command: config.url,
        source: file.relativePath,
      });
    }

    return null;
  }
}
