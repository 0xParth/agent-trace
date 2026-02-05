import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Server } from 'lucide-react';

interface ServerNodeData {
  label: string;
  command: string;
  tools: string[];
}

export const ServerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ServerNodeData;
  
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-zinc-900/90 backdrop-blur
        min-w-[140px] transition-all duration-150
        ${selected 
          ? 'border-brand-500 shadow-lg shadow-brand-500/20' 
          : 'border-brand-500/50 hover:border-brand-500'
        }
      `}
      style={{
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-brand-500 !w-2 !h-2 !border-0"
      />
      
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded bg-brand-500/20 flex items-center justify-center">
          <Server className="w-3.5 h-3.5 text-brand-400" />
        </div>
        <span className="text-xs text-brand-400 font-medium">MCP Server</span>
      </div>
      
      <div className="text-sm font-semibold text-zinc-200 truncate max-w-[160px]">
        {nodeData.label}
      </div>
      
      <div className="mt-1 flex items-center gap-2 text-[10px]">
        <span className="text-zinc-500 font-mono">{nodeData.command}</span>
      </div>
      
      <div className="mt-1 text-[10px] text-zinc-500">
        {nodeData.tools.length} tools
      </div>
    </div>
  );
});

ServerNode.displayName = 'ServerNode';
