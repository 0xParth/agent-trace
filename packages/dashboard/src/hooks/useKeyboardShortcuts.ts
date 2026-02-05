import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useManifestStore } from '@/store';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearch, clearFilters } = useManifestStore();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: ShortcutConfig[] = [
    // Navigation
    { key: '1', description: 'Go to Overview', action: () => navigate('/') },
    { key: '2', description: 'Go to Tool Registry', action: () => navigate('/tools') },
    { key: '3', description: 'Go to Blast Radius', action: () => navigate('/blast-radius') },
    { key: '4', description: 'Go to Capability Matrix', action: () => navigate('/matrix') },
    
    // Search
    { key: '/', description: 'Focus search', action: () => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }},
    
    // Filters
    { key: 'Escape', description: 'Clear search/filters', action: () => {
      setSearch('');
      clearFilters();
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) activeElement.blur();
    }},
    
    // Help
    { key: '?', shift: true, description: 'Show keyboard shortcuts', action: () => setShowHelp(prev => !prev) },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    // Allow Escape even in inputs
    if (isInput && event.key !== 'Escape') {
      return;
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      if (s.key.toLowerCase() !== event.key.toLowerCase()) return false;
      if (s.ctrl && !event.ctrlKey && !event.metaKey) return false;
      if (s.shift && !event.shiftKey) return false;
      return true;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [navigate, setSearch, clearFilters, location.pathname]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp, shortcuts };
}
