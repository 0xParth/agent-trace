import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useManifestStore } from '@/store';
import { AgentNode } from './nodes/AgentNode';
import { ToolNode } from './nodes/ToolNode';
import { ServerNode } from './nodes/ServerNode';

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  server: ServerNode,
};

export function BlastRadius() {
  const { manifest } = useManifestStore();

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!manifest) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Layout configuration
    const serverY = 100;
    const toolY = 300;
    const agentY = 500;
    const spacing = 200;

    // Create server nodes
    manifest.mcp_servers.forEach((server, index) => {
      nodes.push({
        id: `server-${server.name}`,
        type: 'server',
        position: { x: index * spacing + 100, y: serverY },
        data: { 
          label: server.name,
          command: server.command,
          tools: server.tools || [],
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    // Create tool nodes
    const toolsByServer = new Map<string, typeof manifest.tools>();
    const orphanTools: typeof manifest.tools = [];

    manifest.tools.forEach((tool) => {
      // Try to find which server this tool belongs to
      const server = manifest.mcp_servers.find(s => 
        s.tools?.includes(tool.name) || s.source === tool.source
      );
      
      if (server) {
        if (!toolsByServer.has(server.name)) {
          toolsByServer.set(server.name, []);
        }
        toolsByServer.get(server.name)!.push(tool);
      } else {
        orphanTools.push(tool);
      }
    });

    let toolIndex = 0;
    
    // Place tools under their servers
    toolsByServer.forEach((tools, serverName) => {
      const serverNode = nodes.find(n => n.id === `server-${serverName}`);
      if (!serverNode) return;

      tools.forEach((tool, i) => {
        const xOffset = (i - (tools.length - 1) / 2) * 150;
        nodes.push({
          id: `tool-${tool.name}`,
          type: 'tool',
          position: { x: serverNode.position.x + xOffset, y: toolY },
          data: {
            label: tool.name,
            permission: tool.permission,
            risk: tool.risk,
            framework: tool.framework,
            description: tool.description,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        // Edge from server to tool
        edges.push({
          id: `edge-${serverName}-${tool.name}`,
          source: `server-${serverName}`,
          target: `tool-${tool.name}`,
          type: 'smoothstep',
          style: { stroke: '#525252' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#525252' },
        });

        toolIndex++;
      });
    });

    // Place orphan tools
    orphanTools.forEach((tool, i) => {
      nodes.push({
        id: `tool-${tool.name}`,
        type: 'tool',
        position: { x: (toolIndex + i) * spacing + 100, y: toolY },
        data: {
          label: tool.name,
          permission: tool.permission,
          risk: tool.risk,
          framework: tool.framework,
          description: tool.description,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    // Create agent nodes
    manifest.agents.forEach((agent, index) => {
      nodes.push({
        id: `agent-${agent.name}`,
        type: 'agent',
        position: { x: index * spacing + 150, y: agentY },
        data: {
          label: agent.name,
          framework: agent.framework,
          tools: agent.tools,
          description: agent.description,
        },
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      });

      // Create edges from agents to tools
      agent.tools.forEach((toolName) => {
        const toolNode = nodes.find(n => n.id === `tool-${toolName}`);
        if (toolNode) {
          // Find the tool to get its risk level for edge color
          const tool = manifest.tools.find(t => t.name === toolName);
          const edgeColor = tool?.risk === 'HIGH' ? '#ef4444' :
                           tool?.risk === 'MEDIUM' ? '#eab308' : '#22c55e';
          
          edges.push({
            id: `edge-${agent.name}-${toolName}`,
            source: `agent-${agent.name}`,
            target: `tool-${toolName}`,
            type: 'smoothstep',
            style: { stroke: edgeColor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
            animated: tool?.risk === 'HIGH',
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [manifest]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  if (!manifest) return null;

  return (
    <div className="h-[calc(100vh-180px)] rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#27272a" gap={20} size={1} />
        <Controls className="!bg-zinc-900 !border-zinc-800 !rounded-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'agent') return '#8b5cf6';
            if (node.type === 'server') return '#0ea5e9';
            // Tool nodes
            const risk = node.data?.risk as string;
            if (risk === 'HIGH') return '#ef4444';
            if (risk === 'MEDIUM') return '#eab308';
            return '#22c55e';
          }}
          className="!bg-zinc-900/80 !border-zinc-800"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-zinc-400">Agents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-500" />
            <span className="text-zinc-400">MCP Servers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-zinc-400">Low Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-zinc-400">Medium Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-zinc-400">High Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
