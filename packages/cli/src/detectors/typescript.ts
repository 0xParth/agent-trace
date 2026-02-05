/**
 * TypeScript/JavaScript Detector
 * 
 * Detects MCP tools and servers in TypeScript/JavaScript files:
 * - server.tool() calls
 * - McpServer class instantiation
 * - Tool definitions with Zod schemas
 * - LangChain.js tools
 */

import { BaseDetector, createTool, createMcpServer } from './base.js';
import { inferPermission, inferRisk } from '../inference/permissions.js';
import type { FileInfo, DetectorResult, Tool, Framework } from '../types/index.js';

// Regex patterns for TypeScript/JavaScript tool detection
const PATTERNS = {
  // server.tool("name", schema, handler)
  serverTool: /\.tool\s*\(\s*["'`]([^"'`]+)["'`]/g,
  
  // new McpServer({ ... }) or McpServer.create({ ... })
  mcpServerClass: /(?:new\s+)?McpServer(?:\.create)?\s*\(\s*\{([^}]*)\}/g,
  
  // Server name extraction from McpServer config
  mcpServerName: /name\s*:\s*["'`]([^"'`]+)["'`]/,
  
  // Zod schema for tools: z.object({ ... })
  zodSchema: /z\.object\s*\(\s*\{([^}]*)\}\s*\)/g,
  
  // Tool description in schema or config
  toolDescription: /description\s*:\s*["'`]([^"'`]+)["'`]/g,
  
  // LangChain.js DynamicTool or StructuredTool
  langchainTool: /(?:DynamicTool|StructuredTool|Tool)\s*\(\s*\{[^}]*name\s*:\s*["'`]([^"'`]+)["'`]/g,
  
  // tool() function from @langchain/core/tools
  langchainToolFunc: /tool\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[^}]*\}\s*,\s*\{[^}]*name\s*:\s*["'`]([^"'`]+)["'`]/g,
  
  // Export const tool definitions
  exportToolConst: /export\s+(?:const|let|var)\s+(\w+Tool)\s*=/g,
  
  // MCP SDK imports
  mcpImport: /from\s+["']@modelcontextprotocol\/sdk["']|from\s+["']mcp["']/g,
  
  // LangChain imports
  langchainImport: /from\s+["']@langchain\/[^"']+["']|from\s+["']langchain[^"']*["']/g,
  
  // createTool or defineTool patterns
  createTool: /(?:createTool|defineTool|makeTool)\s*\(\s*\{[^}]*name\s*:\s*["'`]([^"'`]+)["'`]/g,
  
  // Function with tool-like JSDoc
  jsdocTool: /\/\*\*[^*]*@tool[^*]*\*\/\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
};

export class TypeScriptDetector extends BaseDetector {
  name = 'typescript';
  extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

  private detectedFramework: Framework = 'unknown';

  async detect(file: FileInfo): Promise<DetectorResult> {
    const result = this.emptyResult();
    const content = file.content;

    // Detect framework from imports
    this.detectedFramework = this.detectFramework(content);
    
    // Detect server.tool() calls
    this.detectServerTools(content, file, result);
    
    // Detect McpServer instances
    this.detectMcpServers(content, file, result);
    
    // Detect LangChain.js tools
    this.detectLangChainTools(content, file, result);
    
    // Detect createTool patterns
    this.detectCreateToolPatterns(content, file, result);
    
    // Detect JSDoc @tool annotations
    this.detectJsDocTools(content, file, result);

    return result;
  }

  private detectFramework(content: string): Framework {
    if (PATTERNS.mcpImport.test(content)) return 'mcp';
    if (PATTERNS.langchainImport.test(content)) return 'custom';
    return 'unknown';
  }

  private detectServerTools(content: string, file: FileInfo, result: DetectorResult): void {
    const regex = new RegExp(PATTERNS.serverTool.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // Try to extract description from nearby content
      const nearbyContent = content.substring(match.index, match.index + 500);
      const descMatch = nearbyContent.match(PATTERNS.toolDescription);
      const description = descMatch ? descMatch[1] : undefined;
      
      result.tools.push(this.createToolFromName(toolName, file, line, 'mcp', description));
    }
  }

  private detectMcpServers(content: string, file: FileInfo, result: DetectorResult): void {
    const regex = new RegExp(PATTERNS.mcpServerClass.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const configContent = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // Extract server name
      const nameMatch = configContent.match(PATTERNS.mcpServerName);
      const serverName = nameMatch ? nameMatch[1] : `mcp-server-${line}`;
      
      result.mcpServers.push(createMcpServer({
        name: serverName,
        command: 'typescript',
        source: `${file.relativePath}:${line}`,
      }));
    }
  }

  private detectLangChainTools(content: string, file: FileInfo, result: DetectorResult): void {
    // DynamicTool, StructuredTool patterns
    const toolClassRegex = new RegExp(PATTERNS.langchainTool.source, 'g');
    let match;
    
    while ((match = toolClassRegex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, 'custom'));
    }

    // tool() function pattern
    const toolFuncRegex = new RegExp(PATTERNS.langchainToolFunc.source, 'g');
    
    while ((match = toolFuncRegex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, 'custom'));
    }
  }

  private detectCreateToolPatterns(content: string, file: FileInfo, result: DetectorResult): void {
    const regex = new RegExp(PATTERNS.createTool.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, this.detectedFramework));
    }
  }

  private detectJsDocTools(content: string, file: FileInfo, result: DetectorResult): void {
    const regex = new RegExp(PATTERNS.jsdocTool.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, this.detectedFramework));
    }
  }

  private createToolFromName(
    name: string, 
    file: FileInfo, 
    line: number, 
    framework: Framework,
    description?: string
  ): Tool {
    const permission = inferPermission(name, description);
    const risk = inferRisk(permission);
    
    return createTool({
      name,
      source: `${file.relativePath}:${line}`,
      line,
      framework,
      permission,
      risk,
      description,
    });
  }
}
