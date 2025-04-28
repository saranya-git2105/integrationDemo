import ELK from "elkjs/lib/elk.bundled.js";
import { MarkerType } from "reactflow";
import { getNextAvailableHandle } from "./handleUtils";
const NODE_WIDTH = 150;
const NODE_HEIGHT = 60;

export function layoutTopDownCustom(nodes, edges) {
  const visited = new Set();
  const positioned = new Map();
  const levels = new Map();
  const childrenMap = new Map();
  const parentCount = {};
  // Build children map from edges
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source).push(edge.target);
    parentCount[edge.target] = (parentCount[edge.target] || 0) + 1;
  });

  const spacingY = 180;
  const spacingX = 220;
  let currentX = 0;

  function dfs(nodeId, level = 0) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    if (!levels.has(level)) levels.set(level, []);
    levels.get(level).push(nodeId);

    const children = childrenMap.get(nodeId) || [];
    children.forEach(childId => dfs(childId, level + 1));
  }

  // Start layout from the Start node
  const startNode = nodes.find(n => n.data.nodeShape === "Start") || nodes[0];
  dfs(startNode.id);

  // Assign positions
  levels.forEach((nodeIds, level) => {
    const offset = Math.floor(nodeIds.length / 2);
    nodeIds.forEach((id, i) => {
      const node = nodes.find(n => n.id === id);
      if (node) {
        let xShift = i - offset;

        // Special handling: Push HR Step left for clarity
        if (node.data.label?.toLowerCase().includes("hr")) {
          xShift -= 1;
        }

        node.position = {
          x: xShift * spacingX,
          y: level * spacingY
        };
        positioned.set(id, node.position);
      }
    });
  });

  return nodes;
}

// Smart handle picker from angle
const handleMap = ['top', 'right', 'bottom', 'left'];

export function pickHandleRoundRobin(nodeId, connectionCountMap) {
  const count = connectionCountMap[nodeId] || 0;
  const handle = handleMap[count % handleMap.length];
  connectionCountMap[nodeId] = count + 1;
  return handle;
}


// Generate styled edges with cycling handle assignment
export function generate_styled_edges(steps, stepCodeToIdMap, allNodes) {
  const nodeMap = Object.fromEntries(allNodes.map((node) => [node.id, node]));
  const edges = [];
  const handleTracker = {}; // shared handle usage map

  for (const step of steps) {
    const sourceId = stepCodeToIdMap[step.StepCode];
    const sourceNode = nodeMap[sourceId];

    for (const action of step.AnchorActions || []) {
      const targetId = stepCodeToIdMap[action.NextStep];
      const targetNode = nodeMap[targetId];
      if (!sourceNode || !targetNode) continue;

      const dx = (targetNode.position.x + 75) - (sourceNode.position.x + 75);
      const dy = (targetNode.position.y + 25) - (sourceNode.position.y + 25);

      const sourceAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const targetAngle = Math.atan2(-dy, -dx) * (180 / Math.PI);

      const fallbackSourceHandle = `${sourceNode.data?.nodeShape}-${getNextAvailableHandle(sourceId, 'source', sourceAngle, handleTracker)}-source`;
      const fallbackTargetHandle = `${targetNode.data?.nodeShape}-${getNextAvailableHandle(targetId, 'target', targetAngle, handleTracker)}-target`;

      const sourceHandle = action.FromHandleId || fallbackSourceHandle;
      const targetHandle = action.ToHandleId || fallbackTargetHandle;
      // Determine stroke color based on ActionName
      let strokeColor = "#333"; // default
      const name = (action.ActionName || "").toLowerCase();
      if (name.includes("approve")) strokeColor = "green";
      else if (name.includes("reject")) strokeColor = "red";
      else if (name.includes("review")) strokeColor = "orange";
      else if (name.includes("save")) strokeColor = "blue";
      else if (name.includes("send back")) strokeColor = "purple";
      edges.push({
        id: `${sourceId}-${targetId}-${action.ActionCode}`,
        source: sourceId,
        target: targetId,
        sourceHandle,
        targetHandle,
        type: 'customSmooth',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { strokeWidth: 2, stroke: '#555' },
        label: action.ActionName || '',
        data: {
          label: action.ActionName || '',
          shortPurposeForForward: action.ShortPurposeForForward || '',
          purposeForForward: action.PurposeForForward || '',
          sourceHandle,
          targetHandle,
        },
      });
    }
  }

  return edges;
}