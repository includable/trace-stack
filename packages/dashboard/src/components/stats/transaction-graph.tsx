import Dagre from "@dagrejs/dagre";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Position,
  ReactFlowProvider,
  Handle,
} from "@xyflow/react";

import {
  getGroupingKey,
  getTransactionLabel,
  getTransactionService,
  useTransaction,
} from "@/lib/transaction";

const GraphNode = ({ data, isConnectable }) => {
  return (
    <div
      className="size-10 rounded-full bg-gray-400 text-xs bg-cover bg-center"
      style={{
        backgroundImage: `url(/images/service-icons/${data.service}.svg)`,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
      {data.spans.length > 1 ? (
        <div className="bg-primary text-white p-1 min-w-6 min-h-6 text-center rounded-full absolute -top-2 -right-2">
          {data.spans.length}
        </div>
      ) : null}
      <div className="absolute top-full pointer-events-none -left-12 -right-12 mt-2 text-foreground truncate text-center text-xs">
        {data.label}
      </div>
    </div>
  );
};

const buildTransactionGraph = (transaction) => {
  const nodes = [] as any[];
  const edges = [] as any[];
  const mappings = {} as Record<string, string>;

  const addNode = (node) => {
    const existingGroup =
      node.groupingKey &&
      nodes.find((n) => n.data.groupingKey === node.groupingKey);

    if (existingGroup) {
      existingGroup.data.spans.push(node.id);
      mappings[node.id] = existingGroup.data.id;
      return existingGroup.data.id;
    }

    if (!nodes.find((n) => n.id === node.id)) {
      nodes.push({
        id: node.id,
        position: { x: 0, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        connectable: false,
        deletable: false,
        data: {
          spans: [node.id],
          ...node,
        },
      });
    }
    mappings[node.id] = node.id;

    return node.id;
  };

  const addEdge = (edge) => {
    const id = `${edge.source}-${edge.target}`;
    if (!edges.find((e) => e.id === id)) {
      edges.push({
        id,
        source: edge.source,
        target: edge.target,
        deletable: false,
        selectable: false,
      });
    }
  };

  for (const item of transaction) {
    if (
      item.id?.endsWith("_started") ||
      item.spanType === "enrichment" ||
      item.type === "log"
    )
      continue;

    const id = addNode({
      id: item.id,
      label: getTransactionLabel(item),
      transaction: item,
      service: getTransactionService(item),
      groupingKey: getGroupingKey(item),
    });

    if (item.parentId) {
      const source = mappings[item.parentId] || item.parentId;
      addEdge({ source, target: id });
    }

    if (item.info.trigger) {
      for (const trigger of item.info.trigger) {
        const id = addNode({
          id: trigger.id,
          label: trigger.triggeredBy || "trigger",
          groupingKey: trigger.triggeredBy,
          service: trigger.triggeredBy || item.service || item.spanType,
          transaction: item,
        });
        const target = mappings[item.id] || item.id;
        addEdge({ source: id, target });
      }
    }
  }

  return { initialNodes: nodes, initialEdges: edges };
};

const getLayoutElements = (nodes, edges, options) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: options.direction, ranksep: 64, nodesep: 120 });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: (node.measured?.width ?? 0) + 32,
      height: (node.measured?.height ?? 0) + 32,
    }),
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const TransactionGraph = ({ id, onNodeClick }) => {
  const { fitView } = useReactFlow();
  const { data } = useTransaction(id, { suspense: true });

  const { initialNodes, initialEdges } = buildTransactionGraph(data?.spans);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layouted, setLayouted] = useState(0);

  const onLayout = useCallback(() => {
    if (layouted > 2) return;
    const layout = getLayoutElements(nodes, edges, { direction: "LR" });

    setNodes([...layout.nodes]);
    setEdges([...layout.edges]);

    window.requestAnimationFrame(() =>
      fitView({
        minZoom: 0.75,
        maxZoom: 1.25,
      }),
    );
    setLayouted((l) => l + 1);
  }, [nodes, edges]);

  useEffect(() => {
    onLayout();
  }, [layouted, nodes, edges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onViewportChange={(viewport) => console.log(viewport)}
      onNodeClick={onNodeClick}
      nodeTypes={{ default: GraphNode }}
    >
      <Background />
    </ReactFlow>
  );
};

const TransactionGraphWrapper = ({ id, onNodeClick }) => {
  return (
    <ReactFlowProvider>
      <TransactionGraph id={id} onNodeClick={onNodeClick} />
    </ReactFlowProvider>
  );
};

export default TransactionGraphWrapper;
