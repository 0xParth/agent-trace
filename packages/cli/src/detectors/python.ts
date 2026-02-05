/**
 * Python Detector
 * 
 * Detects AI tools and agents in Python files:
 * - @tool decorator (LangChain)
 * - @mcp.tool() decorator
 * - FastMCP tools
 * - Function arrays (TOOLS = [func1, func2])
 * - Tool dictionaries (TOOLS = {"name": Tool(...)})
 * - LangGraph nodes and graphs
 * - CrewAI agents
 * - AutoGen agents
 */

import { BaseDetector, createTool, createAgent } from './base.js';
import { inferPermission, inferRisk } from '../inference/permissions.js';
import type { FileInfo, DetectorResult, Tool, Agent, Framework } from '../types/index.js';

// Regex patterns for Python tool detection
const PATTERNS = {
  // @tool decorator (LangChain style)
  toolDecorator: /@tool(?:\s*\([^)]*\))?\s*(?:async\s+)?def\s+(\w+)\s*\(/g,
  
  // @mcp.tool() decorator
  mcpToolDecorator: /@(?:\w+\.)?(?:mcp\.)?tool\s*\([^)]*\)\s*(?:async\s+)?def\s+(\w+)\s*\(/g,
  
  // FastMCP: mcp = FastMCP(...); @mcp.tool()
  fastMcpInstance: /(\w+)\s*=\s*FastMCP\s*\(/g,
  fastMcpTool: /@(\w+)\.tool\s*\([^)]*\)\s*(?:async\s+)?def\s+(\w+)\s*\(/g,
  
  // Function arrays: TOOLS = [func1, func2] or LOCAL_TOOLS = [...]
  toolArray: /(?:TOOLS|LOCAL_TOOLS|AVAILABLE_TOOLS|tools|local_tools)\s*=\s*\[([\s\S]*?)\]/gi,
  
  // Tool dictionaries: TOOLS = {"name": Tool(...)}
  toolDict: /(?:TOOLS|CAPABILITIES|tools|capabilities)\s*=\s*\{([\s\S]*?)\}/gi,
  
  // Tool class instantiation: Tool(name="...", ...)
  toolClass: /Tool\s*\(\s*name\s*=\s*["']([^"']+)["']/g,
  
  // ToolCapability class
  toolCapability: /ToolCapability\s*\(\s*name\s*=\s*["']([^"']+)["']/g,
  
  // LangGraph: graph.add_node("name", func)
  langGraphNode: /\.add_node\s*\(\s*["']([^"']+)["']/g,
  
  // LangGraph: StateGraph or MessageGraph
  langGraphClass: /(?:StateGraph|MessageGraph|Graph)\s*\(/g,
  
  // CrewAI: Agent(role="...", tools=[...])
  crewAiAgent: /Agent\s*\([^)]*role\s*=\s*["']([^"']+)["'][^)]*\)/g,
  
  // CrewAI: Crew(agents=[...])
  crewAiCrew: /Crew\s*\([^)]*agents\s*=\s*\[([^\]]*)\]/g,
  
  // AutoGen: AssistantAgent or UserProxyAgent
  autoGenAgent: /(?:AssistantAgent|UserProxyAgent|ConversableAgent)\s*\([^)]*name\s*=\s*["']([^"']+)["']/g,
  
  // Function definition with docstring (for extracting descriptions)
  funcWithDocstring: /(?:async\s+)?def\s+(\w+)\s*\([^)]*\)[^:]*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/g,
  
  // Import detection for framework identification
  langchainImport: /from\s+langchain[.\w]*\s+import|import\s+langchain/g,
  langGraphImport: /from\s+langgraph[.\w]*\s+import|import\s+langgraph/g,
  crewAiImport: /from\s+crewai[.\w]*\s+import|import\s+crewai/g,
  autoGenImport: /from\s+autogen[.\w]*\s+import|import\s+autogen/g,
  mcpImport: /from\s+mcp[.\w]*\s+import|import\s+mcp|from\s+fastmcp\s+import/g,
};

export class PythonDetector extends BaseDetector {
  name = 'python';
  extensions = ['.py'];

  private docstrings: Map<string, string> = new Map();
  private detectedFramework: Framework = 'unknown';

  async detect(file: FileInfo): Promise<DetectorResult> {
    const result = this.emptyResult();
    const content = file.content;

    // Detect framework from imports
    this.detectedFramework = this.detectFramework(content);
    
    // Extract docstrings for description lookup
    this.extractDocstrings(content);

    // Detect @tool decorators
    this.detectToolDecorators(content, file, result);
    
    // Detect FastMCP tools
    this.detectFastMcpTools(content, file, result);
    
    // Detect tool arrays and dictionaries
    this.detectToolCollections(content, file, result);
    
    // Detect LangGraph nodes
    this.detectLangGraphNodes(content, file, result);
    
    // Detect CrewAI agents
    this.detectCrewAiAgents(content, file, result);
    
    // Detect AutoGen agents
    this.detectAutoGenAgents(content, file, result);

    return result;
  }

  private detectFramework(content: string): Framework {
    if (PATTERNS.mcpImport.test(content)) return 'mcp';
    if (PATTERNS.langGraphImport.test(content)) return 'langraph';
    if (PATTERNS.crewAiImport.test(content)) return 'crewai';
    if (PATTERNS.autoGenImport.test(content)) return 'autogen';
    if (PATTERNS.langchainImport.test(content)) return 'custom';
    return 'unknown';
  }

  private extractDocstrings(content: string): void {
    this.docstrings.clear();
    const regex = new RegExp(PATTERNS.funcWithDocstring.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const funcName = match[1];
      const docstring = (match[2] || match[3] || '').trim();
      if (docstring) {
        // Get first line of docstring as description
        const firstLine = docstring.split('\n')[0].trim();
        this.docstrings.set(funcName, firstLine);
      }
    }
  }

  private detectToolDecorators(content: string, file: FileInfo, result: DetectorResult): void {
    // @tool decorator
    const toolRegex = new RegExp(PATTERNS.toolDecorator.source, 'g');
    let match;
    
    while ((match = toolRegex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, 'custom'));
    }

    // @mcp.tool() decorator
    const mcpToolRegex = new RegExp(PATTERNS.mcpToolDecorator.source, 'g');
    
    while ((match = mcpToolRegex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, 'mcp'));
    }
  }

  private detectFastMcpTools(content: string, file: FileInfo, result: DetectorResult): void {
    // Find FastMCP instances
    const instanceRegex = new RegExp(PATTERNS.fastMcpInstance.source, 'g');
    const instances: string[] = [];
    let match;
    
    while ((match = instanceRegex.exec(content)) !== null) {
      instances.push(match[1]);
    }

    // Find tools decorated with @instance.tool()
    for (const instance of instances) {
      const toolPattern = new RegExp(`@${instance}\\.tool\\s*\\([^)]*\\)\\s*(?:async\\s+)?def\\s+(\\w+)\\s*\\(`, 'g');
      
      while ((match = toolPattern.exec(content)) !== null) {
        const toolName = match[1];
        const line = this.getLineNumber(content, match.index);
        
        result.tools.push(this.createToolFromName(toolName, file, line, 'fastmcp'));
      }
    }
  }

  private detectToolCollections(content: string, file: FileInfo, result: DetectorResult): void {
    // Tool arrays: TOOLS = [func1, func2]
    const arrayRegex = new RegExp(PATTERNS.toolArray.source, 'gi');
    let match;
    
    while ((match = arrayRegex.exec(content)) !== null) {
      const arrayContent = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // Extract function names from the array
      const funcNames = arrayContent.match(/\b([a-z_][a-z0-9_]*)\b(?!\s*[=(])/gi) || [];
      
      for (const funcName of funcNames) {
        // Skip common non-function tokens
        if (['True', 'False', 'None', 'and', 'or', 'not', 'if', 'else'].includes(funcName)) {
          continue;
        }
        
        result.tools.push(this.createToolFromName(funcName, file, line, this.detectedFramework));
      }
    }

    // Tool dictionaries and ToolCapability
    const toolCapRegex = new RegExp(PATTERNS.toolCapability.source, 'g');
    
    while ((match = toolCapRegex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, this.detectedFramework));
    }

    // Tool class instantiation
    const toolClassRegex = new RegExp(PATTERNS.toolClass.source, 'g');
    
    while ((match = toolClassRegex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.tools.push(this.createToolFromName(toolName, file, line, this.detectedFramework));
    }
  }

  private detectLangGraphNodes(content: string, file: FileInfo, result: DetectorResult): void {
    // Check for LangGraph usage
    if (!PATTERNS.langGraphClass.test(content)) {
      return;
    }

    const nodeRegex = new RegExp(PATTERNS.langGraphNode.source, 'g');
    let match;
    
    while ((match = nodeRegex.exec(content)) !== null) {
      const nodeName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // LangGraph nodes are more like agents/components than tools
      result.agents.push(createAgent({
        name: nodeName,
        source: `${file.relativePath}:${line}`,
        line,
        framework: 'langraph',
        description: `LangGraph node`,
      }));
    }
  }

  private detectCrewAiAgents(content: string, file: FileInfo, result: DetectorResult): void {
    const agentRegex = new RegExp(PATTERNS.crewAiAgent.source, 'g');
    let match;
    
    while ((match = agentRegex.exec(content)) !== null) {
      const roleName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // Extract tools from the agent definition
      const agentBlock = content.substring(match.index, match.index + 500);
      const toolsMatch = agentBlock.match(/tools\s*=\s*\[([^\]]*)\]/);
      const tools = toolsMatch 
        ? toolsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean)
        : [];
      
      result.agents.push(createAgent({
        name: roleName,
        source: `${file.relativePath}:${line}`,
        line,
        framework: 'crewai',
        tools,
        description: `CrewAI agent with role: ${roleName}`,
      }));
    }
  }

  private detectAutoGenAgents(content: string, file: FileInfo, result: DetectorResult): void {
    const agentRegex = new RegExp(PATTERNS.autoGenAgent.source, 'g');
    let match;
    
    while ((match = agentRegex.exec(content)) !== null) {
      const agentName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      result.agents.push(createAgent({
        name: agentName,
        source: `${file.relativePath}:${line}`,
        line,
        framework: 'autogen',
        description: `AutoGen agent`,
      }));
    }
  }

  private createToolFromName(name: string, file: FileInfo, line: number, framework: Framework): Tool {
    const description = this.docstrings.get(name);
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
