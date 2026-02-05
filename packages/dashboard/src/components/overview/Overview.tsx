import { useManifestStore } from '@/store';
import { cn, getRiskBgColor, getPermissionColor } from '@/lib/utils';
import { 
  Wrench, 
  Bot, 
  Server, 
  FileSearch,
  AlertTriangle,
  Shield,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import type { Permission, RiskLevel } from '@/types/manifest';

export function Overview() {
  const { manifest } = useManifestStore();

  if (!manifest) return null;

  const { summary } = manifest;
  const highRiskTools = manifest.tools.filter(t => t.risk === 'HIGH');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Wrench}
          label="Tools"
          value={summary.total_tools}
          color="text-brand-400"
          bgColor="bg-brand-500/10"
        />
        <StatCard
          icon={Bot}
          label="Agents"
          value={summary.total_agents}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          icon={Server}
          label="MCP Servers"
          value={summary.total_mcp_servers}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
        />
        <StatCard
          icon={FileSearch}
          label="Files Scanned"
          value={summary.files_scanned}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* Risk and Permissions Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Distribution
          </h2>
          <div className="space-y-3">
            {(['HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map((risk) => (
              <RiskBar
                key={risk}
                risk={risk}
                count={summary.by_risk[risk] || 0}
                total={summary.total_tools}
              />
            ))}
          </div>
        </div>

        {/* Permission Distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permission Types
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(['READ', 'WRITE', 'DELETE', 'EXECUTE', 'OUTPUT', 'UNKNOWN'] as Permission[]).map((perm) => (
              <PermissionCard
                key={perm}
                permission={perm}
                count={summary.by_permission[perm] || 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* High Risk Tools Alert */}
      {highRiskTools.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            High Risk Tools ({highRiskTools.length})
          </h2>
          <div className="grid gap-2">
            {highRiskTools.slice(0, 5).map((tool) => (
              <div
                key={`${tool.name}-${tool.source}`}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    getRiskBgColor(tool.risk),
                    'text-red-400'
                  )}>
                    {tool.permission[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{tool.name}</p>
                    <p className="text-xs text-zinc-500">{tool.source}:{tool.line}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    getPermissionColor(tool.permission)
                  )}>
                    {tool.permission}
                  </span>
                  <span className="text-xs text-zinc-500">{tool.framework}</span>
                </div>
              </div>
            ))}
            {highRiskTools.length > 5 && (
              <p className="text-xs text-zinc-500 text-center mt-2">
                +{highRiskTools.length - 5} more high risk tools
              </p>
            )}
          </div>
        </div>
      )}

      {/* Framework Distribution */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Framework Distribution
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.by_framework).map(([framework, count]) => (
            <div
              key={framework}
              className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700"
            >
              <span className="text-xs text-zinc-400">{framework}</span>
              <span className="ml-2 text-sm font-semibold text-zinc-200">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function RiskBar({
  risk,
  count,
  total,
}: {
  risk: RiskLevel;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colors: Record<RiskLevel, { bg: string; bar: string; text: string }> = {
    HIGH: { bg: 'bg-red-500/10', bar: 'bg-red-500', text: 'text-red-400' },
    MEDIUM: { bg: 'bg-yellow-500/10', bar: 'bg-yellow-500', text: 'text-yellow-400' },
    LOW: { bg: 'bg-green-500/10', bar: 'bg-green-500', text: 'text-green-400' },
  };

  return (
    <div className="flex items-center gap-3">
      <span className={cn('text-xs w-16 font-medium', colors[risk].text)}>{risk}</span>
      <div className={cn('flex-1 h-2 rounded-full', colors[risk].bg)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[risk].bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 w-8 text-right">{count}</span>
    </div>
  );
}

function PermissionCard({
  permission,
  count,
}: {
  permission: Permission;
  count: number;
}) {
  const icons: Record<Permission, string> = {
    READ: '📖',
    WRITE: '✏️',
    DELETE: '🗑️',
    EXECUTE: '⚡',
    OUTPUT: '📤',
    UNKNOWN: '❓',
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/30 border border-zinc-800">
      <span className="text-sm">{icons[permission]}</span>
      <span className={cn('text-xs flex-1', getPermissionColor(permission))}>{permission}</span>
      <span className="text-sm font-semibold text-zinc-300">{count}</span>
    </div>
  );
}
