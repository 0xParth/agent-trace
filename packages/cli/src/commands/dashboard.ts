/**
 * Dashboard command - Serves the AgentTrace web dashboard
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DashboardOptions {
  port: string;
  manifest: string;
  open?: boolean;
}

export async function dashboardCommand(options: DashboardOptions) {
  const port = parseInt(options.port, 10);
  const manifestPath = resolve(process.cwd(), options.manifest);

  // Check if manifest exists
  if (!existsSync(manifestPath)) {
    console.error(chalk.red(`\n✗ Manifest file not found: ${manifestPath}`));
    console.error(chalk.yellow('\nRun "agenttrace scan --output agent-manifest.json" first to generate a manifest.\n'));
    process.exit(1);
  }

  // Find the dashboard build directory
  // When installed as a package, it will be in ../dashboard/dist relative to the CLI
  // During development, we need to check multiple locations
  const possiblePaths = [
    join(__dirname, '../../dashboard/dist'),           // From dist/commands/
    join(__dirname, '../../../dashboard/dist'),        // From node_modules
    join(process.cwd(), 'packages/dashboard/dist'),    // From monorepo root
    join(process.cwd(), 'node_modules/@agenttrace/dashboard/dist'), // Installed package
  ];

  let dashboardPath: string | null = null;
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      dashboardPath = p;
      break;
    }
  }

  if (!dashboardPath) {
    console.error(chalk.red('\n✗ Dashboard build not found.'));
    console.error(chalk.yellow('\nPlease build the dashboard first:'));
    console.error(chalk.cyan('  cd packages/dashboard && npm run build\n'));
    process.exit(1);
  }

  // Create Express app
  const app = express();

  // API endpoint for manifest
  app.get('/api/manifest', (_req, res) => {
    try {
      const manifest = readFileSync(manifestPath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(manifest);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read manifest' });
    }
  });

  // Serve static files from dashboard build
  app.use(express.static(dashboardPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(join(dashboardPath!, 'index.html'));
  });

  // Start server
  app.listen(port, async () => {
    const url = `http://localhost:${port}`;
    
    console.log();
    console.log(chalk.cyan.bold('  ⚡ AgentTrace Dashboard'));
    console.log();
    console.log(`  ${chalk.green('➜')}  ${chalk.bold('Local:')}   ${chalk.cyan(url)}`);
    console.log(`  ${chalk.gray('➜')}  ${chalk.bold('Manifest:')} ${chalk.gray(manifestPath)}`);
    console.log();
    console.log(chalk.gray('  Press Ctrl+C to stop'));
    console.log();

    // Optionally open browser
    if (options.open !== false) {
      try {
        const open = (await import('open')).default;
        await open(url);
      } catch {
        // Silently fail if can't open browser
      }
    }
  });
}
