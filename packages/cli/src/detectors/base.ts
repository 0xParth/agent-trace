/**
 * Base detector interface and utilities
 */

import type { FileInfo, DetectorResult, Tool, Agent, McpServer } from '../types/index.js';

/**
 * Base interface for all detectors
 */
export interface Detector {
  /** Detector name for logging/debugging */
  name: string;
  
  /** File extensions this detector handles */
  extensions: string[];
  
  /**
   * Detect tools, agents, and MCP servers in a file
   */
  detect(file: FileInfo): Promise<DetectorResult>;
}

/**
 * Abstract base class for detectors with common utilities
 */
export abstract class BaseDetector implements Detector {
  abstract name: string;
  abstract extensions: string[];
  
  abstract detect(file: FileInfo): Promise<DetectorResult>;

  /**
   * Create an empty result
   */
  protected emptyResult(): DetectorResult {
    return {
      tools: [],
      agents: [],
      mcpServers: [],
    };
  }

  /**
   * Find line number for a match in content
   */
  protected getLineNumber(content: string, index: number): number {
    const beforeMatch = content.substring(0, index);
    return (beforeMatch.match(/\n/g) || []).length + 1;
  }

  /**
   * Extract docstring/description from content around an index
   */
  protected extractDescription(content: string, index: number, patterns: RegExp[]): string | undefined {
    // Look backwards from the match for docstrings
    const before = content.substring(Math.max(0, index - 500), index);
    
    for (const pattern of patterns) {
      const match = before.match(pattern);
      if (match) {
        return match[1]?.trim();
      }
    }
    
    return undefined;
  }

  /**
   * Check if a position is inside a comment or string
   */
  protected isInsideCommentOrString(content: string, index: number): boolean {
    const before = content.substring(0, index);
    
    // Simple heuristic: count quotes and check for comment prefixes
    const singleQuotes = (before.match(/'/g) || []).length;
    const doubleQuotes = (before.match(/"/g) || []).length;
    const templateQuotes = (before.match(/`/g) || []).length;
    
    // If odd number of any quote type, likely inside a string
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || templateQuotes % 2 !== 0) {
      return true;
    }
    
    // Check if current line starts with comment
    const lastNewline = before.lastIndexOf('\n');
    const currentLine = before.substring(lastNewline + 1);
    
    if (currentLine.trim().startsWith('//') || 
        currentLine.trim().startsWith('#') ||
        currentLine.trim().startsWith('*')) {
      return true;
    }
    
    return false;
  }
}

/**
 * Helper to create a tool object with defaults
 */
export function createTool(partial: Partial<Tool> & Pick<Tool, 'name' | 'source' | 'line'>): Tool {
  return {
    framework: 'unknown',
    permission: 'UNKNOWN',
    risk: 'MEDIUM',
    ...partial,
  };
}

/**
 * Helper to create an agent object with defaults
 */
export function createAgent(partial: Partial<Agent> & Pick<Agent, 'name' | 'source' | 'line'>): Agent {
  return {
    framework: 'unknown',
    tools: [],
    ...partial,
  };
}

/**
 * Helper to create an MCP server object
 */
export function createMcpServer(partial: Partial<McpServer> & Pick<McpServer, 'name' | 'command' | 'source'>): McpServer {
  return {
    ...partial,
  };
}
