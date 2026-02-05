import { create } from 'zustand';
import type { Manifest, Tool, Agent, McpServer, Permission, RiskLevel, Framework } from '@/types/manifest';

interface FilterState {
  search: string;
  frameworks: Framework[];
  permissions: Permission[];
  risks: RiskLevel[];
}

interface ManifestStore {
  // State
  manifest: Manifest | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  selectedTool: Tool | null;
  selectedAgent: Agent | null;
  theme: 'dark' | 'light';

  // Actions
  setManifest: (manifest: Manifest) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (search: string) => void;
  toggleFramework: (framework: Framework) => void;
  togglePermission: (permission: Permission) => void;
  toggleRisk: (risk: RiskLevel) => void;
  clearFilters: () => void;
  setSelectedTool: (tool: Tool | null) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  toggleTheme: () => void;

  // Computed (via selectors)
  getFilteredTools: () => Tool[];
  getFilteredAgents: () => Agent[];
  getMcpServers: () => McpServer[];
}

const initialFilters: FilterState = {
  search: '',
  frameworks: [],
  permissions: [],
  risks: [],
};

export const useManifestStore = create<ManifestStore>((set, get) => ({
  // Initial state
  manifest: null,
  isLoading: false,
  error: null,
  filters: initialFilters,
  selectedTool: null,
  selectedAgent: null,
  theme: 'dark',

  // Actions
  setManifest: (manifest) => set({ manifest, error: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  
  setSearch: (search) => set((state) => ({
    filters: { ...state.filters, search }
  })),

  toggleFramework: (framework) => set((state) => {
    const frameworks = state.filters.frameworks.includes(framework)
      ? state.filters.frameworks.filter(f => f !== framework)
      : [...state.filters.frameworks, framework];
    return { filters: { ...state.filters, frameworks } };
  }),

  togglePermission: (permission) => set((state) => {
    const permissions = state.filters.permissions.includes(permission)
      ? state.filters.permissions.filter(p => p !== permission)
      : [...state.filters.permissions, permission];
    return { filters: { ...state.filters, permissions } };
  }),

  toggleRisk: (risk) => set((state) => {
    const risks = state.filters.risks.includes(risk)
      ? state.filters.risks.filter(r => r !== risk)
      : [...state.filters.risks, risk];
    return { filters: { ...state.filters, risks } };
  }),

  clearFilters: () => set({ filters: initialFilters }),

  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    return { theme: newTheme };
  }),

  // Selectors
  getFilteredTools: () => {
    const { manifest, filters } = get();
    if (!manifest) return [];

    return manifest.tools.filter(tool => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = tool.name.toLowerCase().includes(search);
        const matchesDescription = tool.description?.toLowerCase().includes(search);
        const matchesSource = tool.source.toLowerCase().includes(search);
        if (!matchesName && !matchesDescription && !matchesSource) {
          return false;
        }
      }

      // Framework filter
      if (filters.frameworks.length > 0 && !filters.frameworks.includes(tool.framework)) {
        return false;
      }

      // Permission filter
      if (filters.permissions.length > 0 && !filters.permissions.includes(tool.permission)) {
        return false;
      }

      // Risk filter
      if (filters.risks.length > 0 && !filters.risks.includes(tool.risk)) {
        return false;
      }

      return true;
    });
  },

  getFilteredAgents: () => {
    const { manifest, filters } = get();
    if (!manifest) return [];

    return manifest.agents.filter(agent => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(search);
        const matchesDescription = agent.description?.toLowerCase().includes(search);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Framework filter
      if (filters.frameworks.length > 0 && !filters.frameworks.includes(agent.framework)) {
        return false;
      }

      return true;
    });
  },

  getMcpServers: () => {
    const { manifest } = get();
    return manifest?.mcp_servers ?? [];
  },
}));
