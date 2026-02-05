import { useEffect } from 'react';
import { useManifestStore } from '@/store';
import type { Manifest } from '@/types/manifest';

/**
 * Hook to load and manage the manifest data.
 * 
 * The manifest can be loaded from:
 * 1. /api/manifest endpoint (when served by CLI)
 * 2. A provided URL or file path
 * 3. Demo data for development
 */
export function useManifest(manifestUrl?: string) {
  const { 
    manifest, 
    isLoading, 
    error, 
    setManifest, 
    setLoading, 
    setError 
  } = useManifestStore();

  useEffect(() => {
    async function loadManifest() {
      setLoading(true);
      
      try {
        // Try loading from the provided URL or default endpoint
        const url = manifestUrl || '/api/manifest';
        const response = await fetch(url);
        
        if (!response.ok) {
          // If API fails, try loading demo data
          if (!manifestUrl) {
            console.log('API not available, loading demo data');
            setManifest(getDemoManifest());
            return;
          }
          throw new Error(`Failed to load manifest: ${response.statusText}`);
        }
        
        const data: Manifest = await response.json();
        setManifest(data);
      } catch (err) {
        // In development, use demo data
        if (import.meta.env.DEV) {
          console.log('Using demo manifest data');
          setManifest(getDemoManifest());
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load manifest');
        }
      }
    }

    if (!manifest) {
      loadManifest();
    }
  }, [manifest, manifestUrl, setManifest, setLoading, setError]);

  return { manifest, isLoading, error };
}

/**
 * Demo manifest for development and testing
 */
function getDemoManifest(): Manifest {
  return {
    version: '1.0.0',
    scanned_at: new Date().toISOString(),
    scanned_path: '/demo/project',
    scan_duration_ms: 1234,
    summary: {
      total_tools: 12,
      total_agents: 3,
      total_mcp_servers: 2,
      files_scanned: 156,
      by_framework: {
        'mcp': 4,
        'mcp-config': 3,
        'autogen': 2,
        'fastmcp': 2,
        'custom': 1,
      },
      by_permission: {
        'READ': 5,
        'WRITE': 3,
        'DELETE': 2,
        'EXECUTE': 1,
        'OUTPUT': 1,
        'UNKNOWN': 0,
      },
      by_risk: {
        'LOW': 6,
        'MEDIUM': 3,
        'HIGH': 3,
      },
    },
    tools: [
      {
        name: 'query_database',
        framework: 'mcp',
        source: 'tools/database.py',
        line: 42,
        permission: 'READ',
        risk: 'LOW',
        description: 'Execute SELECT queries against the database',
        parameters: {
          query: { type: 'string', description: 'SQL query to execute', required: true },
        },
      },
      {
        name: 'insert_record',
        framework: 'mcp',
        source: 'tools/database.py',
        line: 67,
        permission: 'WRITE',
        risk: 'MEDIUM',
        description: 'Insert new records into the database',
        parameters: {
          table: { type: 'string', required: true },
          data: { type: 'object', required: true },
        },
      },
      {
        name: 'delete_records',
        framework: 'mcp',
        source: 'tools/database.py',
        line: 89,
        permission: 'DELETE',
        risk: 'HIGH',
        description: 'Bulk delete operation for database records',
        parameters: {
          table: { type: 'string', required: true },
          where: { type: 'object', required: true },
        },
      },
      {
        name: 'execute_shell',
        framework: 'mcp-config',
        source: 'mcp_settings.json',
        line: 15,
        permission: 'EXECUTE',
        risk: 'HIGH',
        description: 'Execute shell commands on the system',
      },
      {
        name: 'search_knowledge_base',
        framework: 'autogen',
        source: 'agents/support.py',
        line: 23,
        permission: 'READ',
        risk: 'LOW',
        description: 'Search help articles and documentation',
      },
      {
        name: 'get_user_profile',
        framework: 'autogen',
        source: 'agents/support.py',
        line: 45,
        permission: 'READ',
        risk: 'LOW',
        description: 'Fetch user profile data',
      },
      {
        name: 'create_ticket',
        framework: 'fastmcp',
        source: 'tools/zendesk.py',
        line: 12,
        permission: 'WRITE',
        risk: 'MEDIUM',
        description: 'Create a new support ticket',
      },
      {
        name: 'send_email',
        framework: 'fastmcp',
        source: 'tools/email.py',
        line: 8,
        permission: 'OUTPUT',
        risk: 'LOW',
        description: 'Send email notifications',
      },
      {
        name: 'list_files',
        framework: 'mcp-config',
        source: '.cursor/mcp.json',
        line: 5,
        permission: 'READ',
        risk: 'LOW',
        description: 'List files in a directory',
      },
      {
        name: 'write_file',
        framework: 'mcp-config',
        source: '.cursor/mcp.json',
        line: 12,
        permission: 'WRITE',
        risk: 'MEDIUM',
        description: 'Write content to a file',
      },
      {
        name: 'drop_table',
        framework: 'mcp',
        source: 'tools/admin.py',
        line: 156,
        permission: 'DELETE',
        risk: 'HIGH',
        description: '⚠️ DANGEROUS: Drop a database table',
      },
      {
        name: 'render_chart',
        framework: 'custom',
        source: 'viz/charts.py',
        line: 34,
        permission: 'OUTPUT',
        risk: 'LOW',
        description: 'Render data visualization charts',
      },
    ],
    agents: [
      {
        name: 'customer-support-bot',
        framework: 'autogen',
        source: 'agents/support.py',
        line: 10,
        tools: ['search_knowledge_base', 'get_user_profile', 'create_ticket'],
        description: 'Handles customer support inquiries',
      },
      {
        name: 'data-analyst',
        framework: 'autogen',
        source: 'agents/analyst.py',
        line: 5,
        tools: ['query_database', 'render_chart'],
        description: 'Analyzes data and creates visualizations',
      },
      {
        name: 'admin-bot',
        framework: 'custom',
        source: 'agents/admin.py',
        line: 1,
        tools: ['delete_records', 'drop_table', 'execute_shell'],
        description: '⚠️ Administrative operations agent',
      },
    ],
    mcp_servers: [
      {
        name: 'database-tools',
        command: 'python',
        args: ['-m', 'mcp_server', '--tools', 'database'],
        source: 'mcp_settings.json',
        tools: ['query_database', 'insert_record', 'delete_records'],
      },
      {
        name: 'filesystem',
        command: 'npx',
        args: ['@anthropic/mcp-filesystem'],
        source: '.cursor/mcp.json',
        tools: ['list_files', 'write_file'],
      },
    ],
  };
}
