/**
 * Go Detector
 * 
 * Detects AI tools and capabilities in Go files:
 * - Type declarations (var XType capabilities.Type = "name")
 * - Version declarations (var XVersion capabilities.Version = "1.0.0")
 * - Input/Output struct definitions
 * - Tool registry patterns
 */

import { BaseDetector, createTool } from './base.js';
import { inferPermission, inferRisk } from '../inference/permissions.js';
import type { FileInfo, DetectorResult, Tool, ParameterSchema } from '../types/index.js';

// Regex patterns for Go capability detection
const PATTERNS = {
  // var GetFileType capabilities.Type = "get_file"
  capabilityType: /var\s+(\w+)Type\s+(?:\w+\.)?(?:capabilities\.)?Type\s*=\s*["'`]([^"'`]+)["'`]/g,
  
  // var GetFileVersion capabilities.Version = "1.0.0"
  capabilityVersion: /var\s+(\w+)Version\s+(?:\w+\.)?(?:capabilities\.)?Version\s*=\s*["'`]([^"'`]+)["'`]/g,
  
  // type GetFileInput struct { ... }
  inputStruct: /type\s+(\w+)Input\s+struct\s*\{([^}]*)\}/g,
  
  // type GetFileOutput struct { ... }
  outputStruct: /type\s+(\w+)Output\s+struct\s*\{([^}]*)\}/g,
  
  // Struct field: FieldName type `json:"field_name"`
  structField: /(\w+)\s+(\w+)\s+`json:"([^"]+)"/g,
  
  // Tool registration: register("name", handler)
  toolRegister: /(?:register|Register)(?:Tool|Capability)?\s*\(\s*["'`]([^"'`]+)["'`]/g,
  
  // Function-based tools: func ToolName(ctx context.Context, ...) ...
  toolFunction: /func\s+(\w+(?:Tool|Handler|Capability))\s*\(/g,
  
  // Comment-based description: // Description for the next declaration
  commentDescription: /\/\/\s*(.+?)(?:\n|$)/g,
  
  // capabilities package import
  capabilitiesImport: /import\s*(?:\(\s*)?[^)]*["'].*capabilities["']/g,
};

interface CapabilityInfo {
  name: string;
  prefix: string;
  version?: string;
  inputFields?: Record<string, ParameterSchema>;
  line: number;
}

export class GoDetector extends BaseDetector {
  name = 'go';
  extensions = ['.go'];

  async detect(file: FileInfo): Promise<DetectorResult> {
    const result = this.emptyResult();
    const content = file.content;

    // Check if this file uses capabilities
    const usesCapabilities = PATTERNS.capabilitiesImport.test(content) ||
                             content.includes('capabilities.Type') ||
                             content.includes('capabilities.Capability');

    if (usesCapabilities) {
      // Detect capabilities pattern
      this.detectCapabilities(content, file, result);
    }

    // Detect general tool patterns
    this.detectToolRegistrations(content, file, result);
    this.detectToolFunctions(content, file, result);

    return result;
  }

  private detectCapabilities(content: string, file: FileInfo, result: DetectorResult): void {
    // Collect capability info by prefix
    const capabilities = new Map<string, CapabilityInfo>();

    // Find all capability Type declarations
    const typeRegex = new RegExp(PATTERNS.capabilityType.source, 'g');
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const prefix = match[1];
      const toolName = match[2];
      const line = this.getLineNumber(content, match.index);
      
      capabilities.set(prefix, {
        name: toolName,
        prefix,
        line,
      });
    }

    // Find all capability Version declarations
    const versionRegex = new RegExp(PATTERNS.capabilityVersion.source, 'g');
    
    while ((match = versionRegex.exec(content)) !== null) {
      const prefix = match[1];
      const version = match[2];
      
      const existing = capabilities.get(prefix);
      if (existing) {
        existing.version = version;
      }
    }

    // Find input struct definitions and extract fields
    const inputRegex = new RegExp(PATTERNS.inputStruct.source, 'g');
    
    while ((match = inputRegex.exec(content)) !== null) {
      const prefix = match[1];
      const structBody = match[2];
      
      const existing = capabilities.get(prefix);
      if (existing) {
        existing.inputFields = this.parseStructFields(structBody);
      }
    }

    // Create tools from collected capability info
    for (const [, capInfo] of capabilities) {
      const permission = inferPermission(capInfo.name);
      const risk = inferRisk(permission);
      
      result.tools.push(createTool({
        name: capInfo.name,
        source: `${file.relativePath}:${capInfo.line}`,
        line: capInfo.line,
        framework: 'custom',
        permission,
        risk,
        version: capInfo.version,
        parameters: capInfo.inputFields,
      }));
    }
  }

  private parseStructFields(structBody: string): Record<string, ParameterSchema> {
    const fields: Record<string, ParameterSchema> = {};
    const fieldRegex = new RegExp(PATTERNS.structField.source, 'g');
    let match;
    
    while ((match = fieldRegex.exec(structBody)) !== null) {
      const fieldName = match[1];
      const fieldType = match[2];
      const jsonName = match[3];
      
      fields[jsonName] = {
        type: this.mapGoTypeToJsonType(fieldType),
        description: fieldName,
      };
    }
    
    return fields;
  }

  private mapGoTypeToJsonType(goType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'int': 'integer',
      'int32': 'integer',
      'int64': 'integer',
      'float32': 'number',
      'float64': 'number',
      'bool': 'boolean',
      'interface{}': 'any',
      'map[string]interface{}': 'object',
      '[]string': 'array',
      '[]int': 'array',
    };
    
    return typeMap[goType] || 'string';
  }

  private detectToolRegistrations(content: string, file: FileInfo, result: DetectorResult): void {
    const regex = new RegExp(PATTERNS.toolRegister.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const toolName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // Check if this tool was already detected as a capability
      const alreadyDetected = result.tools.some(t => t.name === toolName);
      if (alreadyDetected) continue;
      
      const permission = inferPermission(toolName);
      const risk = inferRisk(permission);
      
      result.tools.push(createTool({
        name: toolName,
        source: `${file.relativePath}:${line}`,
        line,
        framework: 'custom',
        permission,
        risk,
      }));
    }
  }

  private detectToolFunctions(content: string, file: FileInfo, result: DetectorResult): void {
    const regex = new RegExp(PATTERNS.toolFunction.source, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const funcName = match[1];
      const line = this.getLineNumber(content, match.index);
      
      // Extract a cleaner tool name from function name
      const toolName = funcName
        .replace(/Tool$/, '')
        .replace(/Handler$/, '')
        .replace(/Capability$/, '')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();
      
      // Check if this tool was already detected
      const alreadyDetected = result.tools.some(
        t => t.name === toolName || t.name === funcName
      );
      if (alreadyDetected) continue;
      
      const permission = inferPermission(toolName);
      const risk = inferRisk(permission);
      
      result.tools.push(createTool({
        name: toolName,
        source: `${file.relativePath}:${line}`,
        line,
        framework: 'custom',
        permission,
        risk,
      }));
    }
  }
}
