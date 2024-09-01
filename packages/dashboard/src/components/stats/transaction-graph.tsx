import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import klay from "cytoscape-klay";

import { createRoot } from "react-dom/client";
import { useTheme } from "@/components/layout/theme-provider";

import {
  getGroupingKey,
  getTransactionLabel,
  getTransactionService,
  useTransaction,
} from "@/lib/transaction";

Cytoscape.use(klay);

const GraphNode = ({ data }) => {
  return (
    <div
      className="size-10 rounded-full bg-gray-400 text-xs bg-cover bg-center"
      style={{
        backgroundImage: `url(/images/service-icons/${data.service}.svg)`,
      }}
    >
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

function renderHTMLNodes(options) {
  const cyto = this.cy();
  const cytoContainer = cyto.container();
  const nodeHtmlContainer = document.createElement("div");
  const internalId = "__cytoscape-html__";

  const createNode = (node: any) => {
    const id = node.id();
    const data = node.data();

    const namespace = "__cytoscape-html";
    const internalNodeId = `${namespace}_node-${id}`;
    const position = node.renderedPosition();
    const posX = position.x.toFixed(2);
    const posY = position.y.toFixed(2);

    const newNode = document.createElement("div");
    const existingNode = nodeHtmlContainer.querySelector("#" + internalNodeId);
    const nodeTranslation = `translate(${posX}px, ${posY}px)`;
    const nodeScale = `scale(${cyto.zoom()})`;
    const transform = `translate(-50%, -50%) ${nodeTranslation} ${nodeScale}`;
    createRoot(newNode).render(<GraphNode data={data} />);

    newNode.id = internalNodeId;
    newNode.style.position = "absolute";
    newNode.style.transform = transform;
    newNode.style.zIndex = "2";

    if (existingNode) nodeHtmlContainer.removeChild(existingNode);
    nodeHtmlContainer.appendChild(newNode);

    if (options.hideOriginal) {
      // Hide the original node
      node.style({ "background-opacity": 0 });
    }
  };

  function handleMovement() {
    cyto.nodes().forEach((node) => createNode(node));
  }

  if (!document.getElementById(internalId)) {
    const canvas = cytoContainer.querySelector("canvas");

    nodeHtmlContainer.id = internalId;
    canvas.parentNode.appendChild(nodeHtmlContainer);
    nodeHtmlContainer.style.width = canvas.style.width;
    nodeHtmlContainer.style.height = canvas.style.height;
    nodeHtmlContainer.style.zIndex = "1";

    cyto.on("add", "node", (e: cytoscape.EventObject) => createNode(e.target));
    cyto.on("drag", "node", (e: cytoscape.EventObject) => createNode(e.target));
    cyto.on("pan resize", handleMovement);
  }

  return cyto.nodes();
}

Cytoscape("collection", "renderHTMLNodes", renderHTMLNodes);

const buildTransactionGraph = (transaction) => {
  const nodes = [] as any[];
  const edges = [];
  const roots = [];
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

    nodes.push({
      data: {
        spans: [node.id],
        ...node,
      },
    });
    mappings[node.id] = node.id;

    return node.id;
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
      edges.push({
        data: {
          source: mappings[item.parentId] || item.parentId,
          target: id,
          label: item.spanType,
        },
      });
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
        edges.push({
          data: {
            source: id,
            target: mappings[item.id] || item.id,
            label: "trigger",
          },
        });
        roots.push(trigger.id);
      }
    }
  }

  return [[...nodes, ...edges], roots];
};

const TransactionGraph = ({ id, onNodeClick }) => {
  const {
    data: { spans },
  } = useTransaction(id, { suspense: true });
  const { value: theme } = useTheme();

  const [elements, roots] = buildTransactionGraph(spans);

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={[
        {
          selector: "node",
          style: {
            width: 48,
            height: 48,
            content: "data(label)",
            "text-valign": "bottom",
            "text-margin-y": 13,
            "font-family": "Inter, sans-serif",
            "font-size": "12px",
            color: theme === "dark" ? "#000" : "#fff",
          },
        },
        {
          selector: "edge",
          style: {
            "line-color": theme === "dark" ? "#212936" : "#9da3ae",
          },
        },
      ]}
      layout={{
        name: "klay",
        fit: false,
        nodeDimensionsIncludeLabels: true,
        padding: 30,
        stop: (event: any) => event.cy.center(),
        klay: {
          spacing: 80,
        },
      }}
      style={{ width: "100%", height: "300px" }}
      cy={(cy) => {
        cy.center();
        cy.nodes().renderHTMLNodes({ hideOriginal: true });
        cy.on("click", "node", function (evt) {
          onNodeClick?.(evt.target.data());
        });
      }}
    />
  );
};

export default TransactionGraph;
