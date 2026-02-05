/**
 * Scan Command Implementation
 * 
 * Main entry point for the scan command that orchestrates
 * file walking, detection, and output.
 */

import { resolve } from 'path';
import ora from 'ora';
import type { ScanOptions, DetectorResult, RiskLevel } from '../types/index.js';
import { walkDirectory } from '../scanner/walker.js';
import { ExtensionRouter } from '../scanner/router.js';
import { McpConfigDetector } from '../detectors/mcp-config.js';
import { PythonDetector } from '../detectors/python.js';
import { TypeScriptDetector } from '../detectors/typescript.js';
import { GoDetector } from '../detectors/go.js';
import { 
  createManifest, 
  writeManifest, 
  deduplicateTools,
  deduplicateAgents,
  deduplicateMcpServers,
  filterByFramework,
  filterByRisk,
} from '../output/manifest.js';
import { 
  printFullResults, 
  printJsonOutput, 
  printError,
} from '../output/console.js';

/**
 * Initialize all detectors and register them with the router
 */
function createRouter(): ExtensionRouter {
  const router = new ExtensionRouter();
  
  // MCP Config Detector (JSON files)
  const mcpConfigDetector = new McpConfigDetector();
  router.register(mcpConfigDetector, mcpConfigDetector.extensions);
  
  // Python Detector
  const pythonDetector = new PythonDetector();
  router.register(pythonDetector, pythonDetector.extensions);
  
  // TypeScript/JavaScript Detector
  const tsDetector = new TypeScriptDetector();
  router.register(tsDetector, tsDetector.extensions);
  
  // Go Detector
  const goDetector = new GoDetector();
  router.register(goDetector, goDetector.extensions);
  
  return router;
}

/**
 * Main scan command handler
 */
export async function scanCommand(path: string, options: ScanOptions): Promise<void> {
  const startTime = Date.now();
  const absolutePath = resolve(path);
  
  // Start spinner for scanning
  const spinner = options.json ? null : ora('Scanning files...').start();
  
  try {
    // Walk directory and collect files
    const files = await walkDirectory(absolutePath);
    
    if (spinner) {
      spinner.text = `Processing ${files.length} files...`;
    }
    
    // Create router and process files
    const router = createRouter();
    const result = await router.processFiles(files);
    
    // Deduplicate results
    result.tools = deduplicateTools(result.tools);
    result.agents = deduplicateAgents(result.agents);
    result.mcpServers = deduplicateMcpServers(result.mcpServers);
    
    // Apply filters if specified
    if (options.framework) {
      result.tools = filterByFramework(result.tools, options.framework);
    }
    
    if (options.risk) {
      const riskLevel = options.risk.toUpperCase() as RiskLevel;
      result.tools = filterByRisk(result.tools, riskLevel);
    }
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Create manifest
    const manifest = createManifest(result, absolutePath, files.length, duration);
    
    // Stop spinner
    if (spinner) {
      spinner.succeed(`Scanned ${files.length} files in ${(duration / 1000).toFixed(1)}s`);
    }
    
    // Output results
    if (options.json) {
      // JSON-only output
      printJsonOutput(manifest);
    } else {
      // Pretty console output
      printFullResults(manifest, options.output);
    }
    
    // Write to file if specified
    if (options.output) {
      await writeManifest(manifest, options.output);
    }
    
  } catch (error) {
    if (spinner) {
      spinner.fail('Scan failed');
    }
    
    const message = error instanceof Error ? error.message : String(error);
    printError(message);
    process.exit(1);
  }
}
