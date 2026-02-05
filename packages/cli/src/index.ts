#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { dashboardCommand } from './commands/dashboard.js';

const program = new Command();

program
  .name('agenttrace')
  .description('Socket.dev for AI Agents — Discover, visualize, and govern AI tools in your codebase')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan a directory for AI agents and MCP tools')
  .argument('[path]', 'Path to scan', '.')
  .option('-o, --output <file>', 'Output JSON manifest to file')
  .option('-f, --framework <framework>', 'Filter by framework (mcp, langraph, crewai)')
  .option('-r, --risk <level>', 'Filter by risk level (low, medium, high)')
  .option('--json', 'Output results as JSON only')
  .option('--no-color', 'Disable colored output')
  .action(scanCommand);

program
  .command('dashboard')
  .description('Launch the AgentTrace web dashboard')
  .option('-p, --port <number>', 'Port to serve dashboard on', '3000')
  .option('-m, --manifest <path>', 'Path to manifest JSON file', 'agent-manifest.json')
  .option('--no-open', 'Do not automatically open browser')
  .action(dashboardCommand);

program.parse();
