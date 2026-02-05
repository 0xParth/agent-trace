import { useLocation } from 'react-router-dom';
import { useManifestStore } from '@/store';
import { formatDate, formatDuration } from '@/lib/utils';
import { 
  Sun, 
  Moon, 
  Clock, 
  FolderOpen,
  RefreshCw,
} from 'lucide-react';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Overview', description: 'Summary of your agent ecosystem' },
  '/tools': { title: 'Tool Registry', description: 'Search and explore all detected tools' },
  '/blast-radius': { title: 'Blast Radius', description: 'Visualize agent-tool-server relationships' },
  '/matrix': { title: 'Capability Matrix', description: 'Permission grid across frameworks' },
};

export function Header() {
  const location = useLocation();
  const { manifest, theme, toggleTheme } = useManifestStore();
  const page = pageTitles[location.pathname] || pageTitles['/'];

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/30">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">{page.title}</h1>
        <p className="text-xs text-zinc-500">{page.description}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Scan info */}
        {manifest && (
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="max-w-[200px] truncate">{manifest.scanned_path}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(manifest.scanned_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-green-500">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{formatDuration(manifest.scan_duration_ms)}</span>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-zinc-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>
    </header>
  );
}
