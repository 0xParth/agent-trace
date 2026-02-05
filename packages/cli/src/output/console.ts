/**
 * Console Output Formatter
 * 
 * Pretty prints scan results with colors, risk highlights,
 * and formatted tables.
 */

import chalk from 'chalk';
import type { Manifest, Tool, Agent, McpServer, RiskLevel, Permission } from '../types/index.js';

// Risk level colors
const RISK_COLORS: Record<RiskLevel, typeof chalk> = {
  'HIGH': chalk.red,
  'MEDIUM': chalk.yellow,
  'LOW': chalk.green,
};

// Permission colors
const PERMISSION_COLORS: Record<Permission, typeof chalk> = {
  'READ': chalk.green,
  'WRITE': chalk.yellow,
  'DELETE': chalk.red,
  'EXECUTE': chalk.red,
  'OUTPUT': chalk.cyan,
  'UNKNOWN': chalk.gray,
};

// Risk level icons
const RISK_ICONS: Record<RiskLevel, string> = {
  'HIGH': '⚠️ ',
  'MEDIUM': '• ',
  'LOW': '✓ ',
};

/**
 * Print the scan header
 */
export function printHeader(version: string, path: string): void {
  console.log();
  console.log(chalk.bold.cyan(`AgentTrace v${version}`) + chalk.gray(` — Scanning ${path}`));
  console.log();
}

/**
 * Print scan progress
 */
export function printProgress(filesScanned: number, durationMs: number): void {
  const seconds = (durationMs / 1000).toFixed(1);
  console.log(chalk.gray(`Scanned ${filesScanned} files in ${seconds}s`));
  console.log();
}

/**
 * Print the summary section
 */
export function printSummary(manifest: Manifest): void {
  const { summary } = manifest;
  
  console.log(chalk.bold('SUMMARY'));
  console.log(chalk.gray('─'.repeat(55)));
  
  // Main counts
  console.log(
    `  Total Tools: ${chalk.bold(summary.total_tools)}` +
    `    Agents: ${chalk.bold(summary.total_agents)}` +
    `    MCP Servers: ${chalk.bold(summary.total_mcp_servers)}` +
    `    Files: ${chalk.bold(summary.files_scanned)}`
  );
  console.log();
  
  // By framework and risk side by side
  const frameworks = Object.entries(summary.by_framework)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  const risks = Object.entries(summary.by_risk) as [RiskLevel, number][];
  
  const maxRows = Math.max(frameworks.length, risks.length);
  
  console.log('  ' + chalk.gray('By Framework:') + '        ' + chalk.gray('By Risk:'));
  
  for (let i = 0; i < maxRows; i++) {
    let frameworkStr = '                     ';
    let riskStr = '';
    
    if (i < frameworks.length) {
      const [framework, count] = frameworks[i];
      frameworkStr = `    ${framework}: ${count}`.padEnd(21);
    }
    
    if (i < risks.length) {
      const [risk, count] = risks[i];
      const color = RISK_COLORS[risk];
      riskStr = `    ${color(risk)}: ${count}`;
    }
    
    console.log('  ' + frameworkStr + riskStr);
  }
  
  console.log();
}

/**
 * Print high-risk tools section
 */
export function printHighRiskTools(tools: Tool[]): void {
  const highRisk = tools.filter(t => t.risk === 'HIGH');
  
  if (highRisk.length === 0) {
    console.log(chalk.green.bold('✓ No high-risk tools detected'));
    console.log();
    return;
  }
  
  console.log(chalk.red.bold(`HIGH RISK TOOLS (${highRisk.length} require review)`));
  console.log(chalk.gray('─'.repeat(55)));
  
  for (const tool of highRisk) {
    const icon = RISK_ICONS[tool.risk];
    const permColor = PERMISSION_COLORS[tool.permission];
    
    console.log(
      `  ${icon}${chalk.bold(tool.name.padEnd(20))} ` +
      `${permColor(tool.permission.padEnd(8))} ` +
      `${chalk.gray(tool.source)}`
    );
  }
  
  console.log();
}

/**
 * Print all tools section
 */
export function printAllTools(tools: Tool[], limit?: number): void {
  const displayTools = limit ? tools.slice(0, limit) : tools;
  const remaining = tools.length - displayTools.length;
  
  console.log(chalk.bold(`ALL TOOLS (${tools.length})`));
  console.log(chalk.gray('─'.repeat(55)));
  
  for (const tool of displayTools) {
    const icon = RISK_ICONS[tool.risk];
    const riskColor = RISK_COLORS[tool.risk];
    const permColor = PERMISSION_COLORS[tool.permission];
    
    console.log(
      `  ${riskColor(icon)}${tool.name.padEnd(22)} ` +
      `${permColor(tool.permission.padEnd(8))} ` +
      `${chalk.gray(tool.source)}`
    );
  }
  
  if (remaining > 0) {
    console.log(chalk.gray(`  ... and ${remaining} more tools`));
  }
  
  console.log();
}

/**
 * Print agents section
 */
export function printAgents(agents: Agent[]): void {
  if (agents.length === 0) return;
  
  console.log(chalk.bold(`AGENTS (${agents.length})`));
  console.log(chalk.gray('─'.repeat(55)));
  
  for (const agent of agents) {
    console.log(
      `  ${chalk.cyan('◆')} ${chalk.bold(agent.name.padEnd(22))} ` +
      `${chalk.gray(agent.framework.padEnd(12))} ` +
      `${chalk.gray(agent.source)}`
    );
    
    if (agent.tools.length > 0) {
      console.log(chalk.gray(`    Tools: ${agent.tools.join(', ')}`));
    }
  }
  
  console.log();
}

/**
 * Print MCP servers section
 */
export function printMcpServers(servers: McpServer[]): void {
  if (servers.length === 0) return;
  
  console.log(chalk.bold(`MCP SERVERS (${servers.length})`));
  console.log(chalk.gray('─'.repeat(55)));
  
  for (const server of servers) {
    console.log(
      `  ${chalk.magenta('▸')} ${chalk.bold(server.name.padEnd(22))} ` +
      `${chalk.gray(server.source)}`
    );
    
    if (server.command) {
      console.log(chalk.gray(`    Command: ${server.command}`));
    }
  }
  
  console.log();
}

/**
 * Print output file path
 */
export function printOutputPath(path: string): void {
  console.log(chalk.gray(`Output written to: ${chalk.white(path)}`));
  console.log();
}

/**
 * Print the full scan results
 */
export function printFullResults(manifest: Manifest, outputPath?: string): void {
  printHeader(manifest.version, manifest.scanned_path);
  printProgress(manifest.summary.files_scanned, manifest.scan_duration_ms);
  printSummary(manifest);
  printHighRiskTools(manifest.tools);
  printAllTools(manifest.tools, 20);
  printAgents(manifest.agents);
  printMcpServers(manifest.mcp_servers);
  
  if (outputPath) {
    printOutputPath(outputPath);
  }
}

/**
 * Print a simple JSON-only output
 */
export function printJsonOutput(manifest: Manifest): void {
  console.log(JSON.stringify(manifest, null, 2));
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.error(chalk.red('Error:'), message);
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.warn(chalk.yellow('Warning:'), message);
}
