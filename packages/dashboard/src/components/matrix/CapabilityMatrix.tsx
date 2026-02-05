import { useMemo, useState } from 'react';
import { useManifestStore } from '@/store';
import { cn, groupBy } from '@/lib/utils';
import { Check, X, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import type { Permission, Tool } from '@/types/manifest';

const PERMISSIONS: Permission[] = ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'OUTPUT'];

type GroupBy = 'framework' | 'source';

export function CapabilityMatrix() {
  const { manifest } = useManifestStore();
  const [groupByField, setGroupByField] = useState<GroupBy>('framework');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedData = useMemo(() => {
    if (!manifest) return {};

    if (groupByField === 'framework') {
      return groupBy(manifest.tools, 'framework');
    } else {
      // Group by source directory
      return manifest.tools.reduce((acc, tool) => {
        const dir = tool.source.split('/').slice(0, -1).join('/') || 'root';
        if (!acc[dir]) acc[dir] = [];
        acc[dir].push(tool);
        return acc;
      }, {} as Record<string, Tool[]>);
    }
  }, [manifest, groupByField]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(Object.keys(groupedData)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  if (!manifest) return null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Group by:</span>
          <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setGroupByField('framework')}
              className={cn(
                'px-3 py-1.5 text-xs transition-colors',
                groupByField === 'framework'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-zinc-400 hover:bg-zinc-800'
              )}
            >
              Framework
            </button>
            <button
              onClick={() => setGroupByField('source')}
              className={cn(
                'px-3 py-1.5 text-xs transition-colors',
                groupByField === 'source'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-zinc-400 hover:bg-zinc-800'
              )}
            >
              Source Path
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-64">
                {groupByField === 'framework' ? 'Framework / Tool' : 'Path / Tool'}
              </th>
              {PERMISSIONS.map((perm) => (
                <th
                  key={perm}
                  className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider w-24"
                >
                  <PermissionHeader permission={perm} />
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider w-20">
                Risk
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {Object.entries(groupedData).map(([group, tools]) => (
              <GroupRows
                key={group}
                group={group}
                tools={tools}
                isExpanded={expandedGroups.has(group)}
                onToggle={() => toggleGroup(group)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-green-400" />
          </div>
          <span>Has Permission</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
          </div>
          <span>Potentially Dangerous</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
            <X className="w-3 h-3 text-zinc-600" />
          </div>
          <span>No Permission</span>
        </div>
      </div>
    </div>
  );
}

function PermissionHeader({ permission }: { permission: Permission }) {
  const colors: Record<Permission, string> = {
    READ: 'text-blue-400',
    WRITE: 'text-amber-400',
    DELETE: 'text-red-400',
    EXECUTE: 'text-purple-400',
    OUTPUT: 'text-cyan-400',
    UNKNOWN: 'text-zinc-400',
  };

  const icons: Record<Permission, string> = {
    READ: '📖',
    WRITE: '✏️',
    DELETE: '🗑️',
    EXECUTE: '⚡',
    OUTPUT: '📤',
    UNKNOWN: '❓',
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm">{icons[permission]}</span>
      <span className={colors[permission]}>{permission}</span>
    </div>
  );
}

function GroupRows({
  group,
  tools,
  isExpanded,
  onToggle,
}: {
  group: string;
  tools: Tool[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Calculate group-level permissions
  const groupPermissions = useMemo(() => {
    const perms: Record<Permission, { has: boolean; dangerous: boolean }> = {
      READ: { has: false, dangerous: false },
      WRITE: { has: false, dangerous: false },
      DELETE: { has: false, dangerous: false },
      EXECUTE: { has: false, dangerous: false },
      OUTPUT: { has: false, dangerous: false },
      UNKNOWN: { has: false, dangerous: false },
    };

    tools.forEach((tool) => {
      perms[tool.permission].has = true;
      if (tool.risk === 'HIGH') {
        perms[tool.permission].dangerous = true;
      }
    });

    return perms;
  }, [tools]);

  // Calculate group risk level
  const groupRisk = useMemo(() => {
    const hasHigh = tools.some(t => t.risk === 'HIGH');
    const hasMedium = tools.some(t => t.risk === 'MEDIUM');
    if (hasHigh) return 'HIGH';
    if (hasMedium) return 'MEDIUM';
    return 'LOW';
  }, [tools]);

  return (
    <>
      {/* Group Header Row */}
      <tr
        onClick={onToggle}
        className="bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            )}
            <span className="font-medium text-zinc-200">{group}</span>
            <span className="text-xs text-zinc-500">({tools.length} tools)</span>
          </div>
        </td>
        {PERMISSIONS.map((perm) => (
          <td key={perm} className="px-4 py-3 text-center">
            <PermissionCell
              hasPermission={groupPermissions[perm].has}
              isDangerous={groupPermissions[perm].dangerous}
            />
          </td>
        ))}
        <td className="px-4 py-3 text-center">
          <RiskBadge risk={groupRisk} />
        </td>
      </tr>

      {/* Individual Tool Rows */}
      {isExpanded && tools.map((tool) => (
        <tr
          key={`${tool.name}-${tool.source}`}
          className="hover:bg-zinc-900/30 transition-colors"
        >
          <td className="px-4 py-2 pl-10">
            <div>
              <span className="text-sm text-zinc-300">{tool.name}</span>
              <div className="text-[10px] text-zinc-600 font-mono">
                {tool.source}:{tool.line}
              </div>
            </div>
          </td>
          {PERMISSIONS.map((perm) => (
            <td key={perm} className="px-4 py-2 text-center">
              <PermissionCell
                hasPermission={tool.permission === perm}
                isDangerous={tool.permission === perm && tool.risk === 'HIGH'}
              />
            </td>
          ))}
          <td className="px-4 py-2 text-center">
            <RiskBadge risk={tool.risk} />
          </td>
        </tr>
      ))}
    </>
  );
}

function PermissionCell({
  hasPermission,
  isDangerous,
}: {
  hasPermission: boolean;
  isDangerous: boolean;
}) {
  if (!hasPermission) {
    return (
      <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-800/50">
        <X className="w-3 h-3 text-zinc-600" />
      </div>
    );
  }

  if (isDangerous) {
    return (
      <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-500/20 border border-yellow-500/30">
        <AlertTriangle className="w-3 h-3 text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 border border-green-500/30">
      <Check className="w-3 h-3 text-green-400" />
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <span className={cn(
      'inline-block px-2 py-0.5 rounded text-[10px] font-medium border',
      styles[risk] || styles.LOW
    )}>
      {risk}
    </span>
  );
}
