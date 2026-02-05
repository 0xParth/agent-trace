import { X } from 'lucide-react';

interface Shortcut {
  key: string;
  shift?: boolean;
  ctrl?: boolean;
  description: string;
}

interface KeyboardShortcutsModalProps {
  shortcuts: Shortcut[];
  onClose: () => void;
}

export function KeyboardShortcutsModal({ shortcuts, onClose }: KeyboardShortcutsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="px-6 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Navigation</h3>
            {shortcuts.filter(s => ['1', '2', '3', '4'].includes(s.key)).map((shortcut) => (
              <ShortcutRow key={shortcut.key} shortcut={shortcut} />
            ))}
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Actions</h3>
            {shortcuts.filter(s => !['1', '2', '3', '4'].includes(s.key)).map((shortcut) => (
              <ShortcutRow key={shortcut.key} shortcut={shortcut} />
            ))}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Table Navigation</h3>
            <ShortcutRow shortcut={{ key: 'j', description: 'Move down in list' }} />
            <ShortcutRow shortcut={{ key: 'k', description: 'Move up in list' }} />
            <ShortcutRow shortcut={{ key: 'Enter', description: 'Expand selected row' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            Press <span className="kbd">Esc</span> or <span className="kbd">?</span> to close
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-zinc-300">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.ctrl && <span className="kbd">⌘</span>}
        {shortcut.shift && <span className="kbd">⇧</span>}
        <span className="kbd">{shortcut.key}</span>
      </div>
    </div>
  );
}
