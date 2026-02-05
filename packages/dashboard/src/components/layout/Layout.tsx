import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { useManifest } from '@/hooks/useManifest';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isLoading, error } = useManifest();
  const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-zinc-400 text-sm">Loading manifest...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-red-500/30 bg-red-500/10 max-w-md animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-red-400">Failed to Load Manifest</h2>
          <p className="text-zinc-400 text-sm text-center">{error}</p>
          <p className="text-zinc-500 text-xs text-center">
            Make sure you've run <code className="kbd">agenttrace scan</code> first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showHelp && (
        <KeyboardShortcutsModal
          shortcuts={shortcuts}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}
