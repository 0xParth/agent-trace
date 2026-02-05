import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolNodeData {
  label: string;
  permission: string;
  risk: string;
  framework: string;
  description?: string;
}

export const ToolNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ToolNodeData;
  
  const riskColors = {
    HIGH: {
      border: 'border-red-500/50 hover:border-red-500',
      borderSelected: 'border-red-500 shadow-lg shadow-red-500/20',
      bg: 'bg-red-500/20',
      text: 'text-red-400',
    },
    MEDIUM: {
      border: 'border-yellow-500/50 hover:border-yellow-500',
      borderSelected: 'border-yellow-500 shadow-lg shadow-yellow-500/20',
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
    },
    LOW: {
      border: 'border-green-500/50 hover:border-green-500',
      borderSelected: 'border-green-500 shadow-lg shadow-green-500/20',
      bg: 'bg-green-500/20',
      text: 'text-green-400',
    },
  };

  const colors = riskColors[nodeData.risk as keyof typeof riskColors] || riskColors.LOW;

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-xl border-2 bg-zinc-900/90 backdrop-blur',
        'min-w-[120px] transition-all duration-150',
        selected ? colors.borderSelected : colors.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn('!w-2 !h-2 !border-0', colors.bg.replace('/20', ''))}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn('!w-2 !h-2 !border-0', colors.bg.replace('/20', ''))}
      />
      
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('w-5 h-5 rounded flex items-center justify-center', colors.bg)}>
          <Wrench className={cn('w-3 h-3', colors.text)} />
        </div>
        <span className={cn('text-[10px] font-medium', colors.text)}>
          {nodeData.permission}
        </span>
      </div>
      
      <div className="text-xs font-semibold text-zinc-200 truncate max-w-[140px]">
        {nodeData.label}
      </div>
      
      <div className="mt-1 text-[10px] text-zinc-500">
        {nodeData.framework}
      </div>
    </div>
  );
});

ToolNode.displayName = 'ToolNode';
