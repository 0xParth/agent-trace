import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useManifestStore } from '@/store';
import { cn, getRiskBgColor, getPermissionColor, getPermissionBgColor } from '@/lib/utils';
import { Search, Filter, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import type { Tool, Framework, Permission, RiskLevel } from '@/types/manifest';

const frameworks: Framework[] = ['mcp', 'mcp-config', 'autogen', 'fastmcp', 'langraph', 'crewai', 'custom', 'unknown'];
const permissions: Permission[] = ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'OUTPUT', 'UNKNOWN'];
const risks: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW'];

export function ToolRegistry() {
  const { manifest, filters, setSearch, toggleFramework, togglePermission, toggleRisk, clearFilters, getFilteredTools } = useManifestStore();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'risk', desc: false }]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredTools = getFilteredTools();

  const columns = useMemo<ColumnDef<Tool>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tool Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-200">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'framework',
      header: 'Framework',
      cell: ({ row }) => (
        <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
          {row.original.framework}
        </span>
      ),
    },
    {
      accessorKey: 'permission',
      header: 'Permission',
      cell: ({ row }) => (
        <span className={cn(
          'text-xs px-2 py-1 rounded font-medium',
          getPermissionBgColor(row.original.permission),
          getPermissionColor(row.original.permission)
        )}>
          {row.original.permission}
        </span>
      ),
    },
    {
      accessorKey: 'risk',
      header: 'Risk',
      sortingFn: (a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return order[a.original.risk] - order[b.original.risk];
      },
      cell: ({ row }) => (
        <span className={cn(
          'text-xs px-2 py-1 rounded font-medium border',
          getRiskBgColor(row.original.risk),
          row.original.risk === 'HIGH' ? 'text-red-400' :
          row.original.risk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
        )}>
          {row.original.risk}
        </span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
          <span className="max-w-[200px] truncate">{row.original.source}</span>
          <span className="text-zinc-600">:{row.original.line}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setExpandedRow(expandedRow === row.original.name ? null : row.original.name)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      ),
    },
  ], [expandedRow]);

  const table = useReactTable({
    data: filteredTools,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasActiveFilters = filters.search || filters.frameworks.length > 0 || filters.permissions.length > 0 || filters.risks.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tools by name, description, or source..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          {filters.search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Filter className="w-3 h-3" />
          Filters:
        </span>

        {/* Framework filters */}
        {frameworks.filter(f => manifest?.summary.by_framework[f]).map((framework) => (
          <FilterPill
            key={framework}
            label={framework}
            active={filters.frameworks.includes(framework)}
            onClick={() => toggleFramework(framework)}
          />
        ))}

        <span className="w-px h-4 bg-zinc-800" />

        {/* Permission filters */}
        {permissions.map((permission) => (
          <FilterPill
            key={permission}
            label={permission}
            active={filters.permissions.includes(permission)}
            onClick={() => togglePermission(permission)}
            colorClass={getPermissionColor(permission)}
          />
        ))}

        <span className="w-px h-4 bg-zinc-800" />

        {/* Risk filters */}
        {risks.map((risk) => (
          <FilterPill
            key={risk}
            label={risk}
            active={filters.risks.includes(risk)}
            onClick={() => toggleRisk(risk)}
            colorClass={
              risk === 'HIGH' ? 'text-red-400' :
              risk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
            }
          />
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs text-zinc-500">
        Showing {filteredTools.length} of {manifest?.tools.length || 0} tools
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-900/80 border-b border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:text-zinc-200'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        header.column.getIsSorted() === 'asc' 
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className={cn(
                    'hover:bg-zinc-900/50 transition-colors cursor-pointer',
                    expandedRow === row.original.name && 'bg-zinc-900/50'
                  )}
                  onClick={() => setExpandedRow(expandedRow === row.original.name ? null : row.original.name)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedRow === row.original.name && (
                  <tr className="bg-zinc-900/30">
                    <td colSpan={columns.length} className="px-4 py-4">
                      <ToolDetails tool={row.original} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {filteredTools.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No tools match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  colorClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded text-xs transition-all',
        active
          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
          : cn('bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600', colorClass || 'text-zinc-400')
      )}
    >
      {label}
    </button>
  );
}

function ToolDetails({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-3">
      {tool.description && (
        <div>
          <span className="text-xs text-zinc-500">Description</span>
          <p className="text-sm text-zinc-300 mt-1">{tool.description}</p>
        </div>
      )}
      {tool.parameters && Object.keys(tool.parameters).length > 0 && (
        <div>
          <span className="text-xs text-zinc-500">Parameters</span>
          <div className="mt-1 space-y-1">
            {Object.entries(tool.parameters).map(([name, schema]) => (
              <div key={name} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-brand-400">{name}</span>
                <span className="text-zinc-600">:</span>
                <span className="text-zinc-400">{schema.type}</span>
                {schema.required && (
                  <span className="text-red-400 text-[10px]">required</span>
                )}
                {schema.description && (
                  <span className="text-zinc-500">— {schema.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-zinc-500">
          Source: <span className="font-mono text-zinc-400">{tool.source}:{tool.line}</span>
        </span>
        {tool.version && (
          <span className="text-zinc-500">
            Version: <span className="text-zinc-400">{tool.version}</span>
          </span>
        )}
      </div>
    </div>
  );
}
