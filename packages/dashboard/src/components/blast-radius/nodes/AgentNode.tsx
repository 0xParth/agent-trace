import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';

interface AgentNodeData {
  label: string;
  framework: string;
  tools: string[];
  description?: string;
}

export const AgentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as AgentNodeData;
  
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-zinc-900/90 backdrop-blur
        min-w-[140px] transition-all duration-150
        ${selected 
          ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
          : 'border-purple-500/50 hover:border-purple-500'
        }
      `}
    >
      <Handle
        type="source"
        position={Position.Top}
        className="!bg-purple-500 !w-2 !h-2 !border-0"
      />
      
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-xs text-purple-400 font-medium">Agent</span>
      </div>
      
      <div className="text-sm font-semibold text-zinc-200 truncate max-w-[160px]">
        {nodeData.label}
      </div>
      
      <div className="mt-1 flex items-center gap-2 text-[10px]">
        <span className="text-zinc-500">{nodeData.framework}</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-500">{nodeData.tools.length} tools</span>
      </div>
      
      {nodeData.description && (
        <div className="mt-2 text-[10px] text-zinc-500 truncate max-w-[160px]">
          {nodeData.description}
        </div>
      )}
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
